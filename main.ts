import { App, ButtonComponent, Editor, MarkdownView, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import CalendarHeatmap, { CalendarHeatmapOptions } from './calendar-heatmap/index.js';
import { hasTodayEntry, insertTodayEntry, parseEntries } from './utils';
import { computeDailyOverview, renderDailyOverview, updateDailyOverview } from './daily-overview';
import { createTranslator, isLanguageSetting, LanguageSetting, LocaleCode, LocaleKey, resolveLocale, Translator } from './locales';
import { BlobOptions } from 'buffer';

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	private heatmaps: CalendarHeatmap[] = [];
	private overviewBlocks: HTMLElement[] = [];
	private locale: LocaleCode = 'en';
	private translator: Translator = createTranslator('en');

	public t(key: LocaleKey, vars?: Record<string, string | number>): string {
		return this.translator(key, vars);
	}

	private getSystemLocale(): string | undefined {
		const raw = (this.app.vault as any)?.getConfig?.('locale');
		return typeof raw === 'string' ? raw : undefined;
	}

	public refreshLocale(): void {
		const resolved = resolveLocale(this.settings.language, this.getSystemLocale());
		this.locale = resolved;
		this.translator = createTranslator(resolved);
		this.updateOverviews();
	}

	public async updateLanguage(language: LanguageSetting): Promise<void> {
		this.settings.language = language;
		await this.saveSettings();
		this.refreshLocale();
	}

	// Get the active Markdown view or notify the user
	private getActiveMarkdownView(): MarkdownView | null {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) {
			new Notice(this.t('notice.noActiveMarkdownView'));
			return null;
		}
		return view;
	}

	// Read the current note content safely
	private getActiveContent(): string {
		const view = this.getActiveMarkdownView();
		return view ? (view.editor.getValue() || '') : '';
	}

	private isTodayCheckedIn(): boolean {
		const view = this.getActiveMarkdownView();
		if (!view) return false;

		const content = view.editor.getValue() || '';
		return hasTodayEntry(content);
	}

	// Safely insert today's entry with a value (prevents duplicates)
	private insertEntry(value: number): boolean {
		const view = this.getActiveMarkdownView();
		if (!view) return false;

		if (view.getMode() !== 'source') {
			new Notice(this.t('notice.onlyCheckInInEditMode'));
			return false;
		}

		const content = view.editor.getValue() || '';
		if (hasTodayEntry(content)) {
			new Notice(this.t('notice.alreadyCheckedIn'));
			return false;
		}

		const editor = view.editor;
		if (!editor) {
			new Notice(this.t('notice.editorUnavailable'));
			return false;
		}
		insertTodayEntry(editor, value);

		// update
		this.updateHeatmaps();
		this.updateOverviews();

		return true;
	}

	// Parse JSON options for the heatmap processor with fallback
	private parseHeatmapOptions(source: string): Partial<CalendarHeatmapOptions> {
		try {
			return source.trim() ? JSON.parse(source) : {};
		} catch {
			console.warn('calendar-heatmap: unable to parse options JSON, using defaults');
			return {};
		}
	}

	private updateHeatmaps(): void {
		const data = parseEntries(this.getActiveContent());
		this.heatmaps.forEach(heatmap => heatmap.replaceData(data));
	}

	private updateOverviews(): void {
		if (!this.overviewBlocks.length) return;

		const entries = parseEntries(this.getActiveContent());
		const overview = computeDailyOverview(entries);

		for (const block of this.overviewBlocks) {
			updateDailyOverview(block, overview, this.translator);
		}
	}

	async onload() {
		// Load settings (includes migration from legacy weakStart)
		await this.loadSettings();
		this.refreshLocale();

		this.registerMarkdownCodeBlockProcessor('easy-tracker-my-goal', (source, el, _ctx) => {
			const container = el.createDiv({ cls: "easy-tracker-card" });
			container.setAttr('id', 'easy-tracker-my-goal');
			container.createEl('div', { cls: 'easy-tracker-card-title', text: this.t('card.goalTitle') });
			container.createEl('div', { cls: 'easy-tracker-my-goal', text: source.trim() || this.t('card.goalPlaceholder') });
		});

		// Render a yearly calendar heatmap from entries in the current note
		this.registerMarkdownCodeBlockProcessor('easy-tracker-year-calendar-heatmap', (source, el, _ctx) => {
			const data = parseEntries(this.getActiveContent());
			const options = this.parseHeatmapOptions(source);
			const container = el.createDiv({ cls: 'easy-tracker-card' });
			container.createEl('div', { cls: 'easy-tracker-card-title', text: this.t('card.activityHistoryTitle') });
			const heatmapElement = container.createDiv({ cls: 'easy-tracker-year-calendar-heatmap' });

			const heatmap = new CalendarHeatmap(heatmapElement, data, {
				weekStart: this.settings.weekStart,
				view: "year",
				year: new Date().getFullYear(),
				legend: false,
				language: this.locale,
				...options,
			});

			this.heatmaps.push(heatmap);
		});

		// Render a group of buttons that insert today's entry with a value
		// Example:
		// ```buttons
		//  Little | 1
		//  Enough | 2
		//  More   | 3
		// ```
		this.registerMarkdownCodeBlockProcessor("easy-tracker-buttons", (source, el) => {
			const container = el.createDiv({ cls: "easy-tracker-card" });
			container.setAttr('id', 'easy-tracker-buttons');
			container.createEl('div', { cls: 'easy-tracker-card-title', text: this.t('card.buttonsTitle') });

			if (this.isTodayCheckedIn()) {
				container.createEl('div', { cls: 'easy-tracker-card-message', text: this.t('card.checkInCongrats') });
				return;
			}

			const wrap = container.createDiv({ cls: "easy-tracker-button-group" });
			const lines = source.split("\n").map(s => s.trim()).filter(Boolean);

			for (const [index, line] of lines.entries()) {
				const [text, val] = line.split('|').map(s => s.trim());
				const btn = new ButtonComponent(wrap);
				btn.buttonEl.addClass("btn");
				btn.setButtonText(text || this.t('card.defaultButton'));
				btn.onClick(() => {
					const n = Number(val);
					const valueToInsert = Number.isFinite(n) ? n : index + 1; // use provided number, fallback to index
					const checkInResult = this.insertEntry(valueToInsert);

					if (checkInResult) {
						wrap.setAttribute('style', 'display: none;');
						container.createEl('div', { cls: 'easy-tracker-card-message', text: this.t('card.checkInCongrats') });
					}
				});
			}
		});

		this.registerMarkdownCodeBlockProcessor("easy-tracker-daily-overview", (_source, el) => {
			const entries = parseEntries(this.getActiveContent());
			const overview = computeDailyOverview(entries);
			renderDailyOverview(el, overview, this.translator);

			// Track this block for future updates
			this.overviewBlocks.push(el);
		});

		// Insert a bare heatmap block
		this.addCommand({
			id: 'insert-calendar-heatmap',
			name: this.t('command.insertCalendarHeatmap'),
			editorCallback: (editor: Editor, _view: MarkdownView) => {
				editor.replaceSelection([
					'```easy-tracker-year-calendar-heatmap',
					'```',
					'',
				].join('\n'));
			}
		});

		// Insert a heatmap + three preset buttons (1..3)
		this.addCommand({
			id: 'insert-check-in-component',
			name: this.t('command.insertCheckInComponent'),
			editorCallback: (editor: Editor, _view: MarkdownView) => {
				editor.replaceSelection([
					'```easy-tracker-daily-overview', '```',
					'```easy-tracker-year-calendar-heatmap', '```',
					'```easy-tracker-buttons',
					`  ${this.t('snippet.justABit')} | 1`,
					`  ${this.t('snippet.gotItDone')} | 2`,
					`  ${this.t('snippet.didExtra')} | 3`,
					'```',
					'```easy-tracker-my-goal', this.t('card.goalPlaceholder'), '```',
					''
				].join('\n'));
			},
		});

		// Insert a heatmap + single check-in button
		this.addCommand({
			id: 'insert-single-check-in-component',
			name: this.t('command.insertSingleCheckInComponent'),
			editorCallback: (editor: Editor, _view: MarkdownView) => {
				editor.replaceSelection([
					'```easy-tracker-daily-overview', '```',
					'```easy-tracker-year-calendar-heatmap', '```',
					'```easy-tracker-buttons',
					`  ${this.t('snippet.checkIn')} | 1`,
					'```',
					'```easy-tracker-my-goal', this.t('card.goalPlaceholder'), '```',
					''
				].join('\n'));
			},
		});

		this.addCommand({
			id: 'insert-easy-tracker-daily-overview',
			name: this.t('command.insertDailyOverview'),
			editorCallback: (editor: Editor, _view: MarkdownView) => {
				editor.replaceSelection(['```easy-tracker-daily-overview', '```', ''].join('\n'));
			},
		});

		this.addCommand({
			id: 'insert-easy-tracker-my-goal',
			name: this.t('command.insertMyGoal'),
			editorCallback: (editor: Editor, _view: MarkdownView) => {
				editor.replaceSelection(['```easy-tracker-easy-tracker-my-goal', this.t('card.goalPlaceholder'), '```', ''].join('\n'));
			},
		});

		// Settings tab
		this.addSettingTab(new EasyTrackerSettingTab(this.app, this));
	}

	onunload() { }

	// Load settings and migrate legacy weakStart -> weekStart
	async loadSettings() {
		const data: any = await this.loadData();
		const legacy = data?.weakStart; // legacy field (string '0'|'1')
		const migrated = typeof legacy !== 'undefined'
			? (parseInt(String(legacy)) === 0 ? 0 : 1)
			: undefined;
		const language: LanguageSetting = isLanguageSetting(data?.language) ? data.language : DEFAULT_SETTINGS.language;
		const overrides: Partial<MyPluginSettings> = {};

		if (typeof data?.weekStart === 'number') {
			overrides.weekStart = data.weekStart === 0 ? 0 : 1;
		}

		if (typeof migrated !== 'undefined') {
			overrides.weekStart = migrated;
		}

		this.settings = {
			...DEFAULT_SETTINGS,
			...overrides,
			language,
		};
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

// Plugin settings: weekStart (0 = Sunday, 1 = Monday)
interface MyPluginSettings {
	weekStart: 0 | 1;
	language: LanguageSetting;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	weekStart: 1,
	language: 'system',
};

class EasyTrackerSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

			new Setting(containerEl)
				.setName(this.plugin.t('setting.languageName'))
				.setDesc(this.plugin.t('setting.languageDescription'))
				.addDropdown(drop => {
					drop.addOption('system', this.plugin.t('setting.languageOption.system'));
					drop.addOption('en', this.plugin.t('setting.languageOption.en'));
					drop.addOption('zh-CN', this.plugin.t('setting.languageOption.zhCN'));
					drop.setValue(this.plugin.settings.language);
					drop.onChange(async (value) => {
						const next = isLanguageSetting(value) ? value : 'system';
						await this.plugin.updateLanguage(next);
						this.display();
					});
				});

			new Setting(containerEl)
				.setName(this.plugin.t('setting.weekStartName'))
				.setDesc(this.plugin.t('setting.weekStartDescription'))
				.addDropdown(drop => {
					// 1 = Monday (default); 0 = Sunday
					drop.addOption('1', this.plugin.t('setting.weekStart.monday'));
					drop.addOption('0', this.plugin.t('setting.weekStart.sunday'));
					drop.setValue(String(this.plugin.settings.weekStart));
					drop.onChange(async (value) => {
						this.plugin.settings.weekStart = value === '0' ? 0 : 1;
						await this.plugin.saveSettings();
					});
				});
	}
}
