import { Editor, MarkdownView, Notice, Plugin, getLanguage } from 'obsidian';
import { hasTodayEntry, insertTodayEntry } from './utils';
import { createTranslator, LocaleCode, LocaleKey, normalizeLocaleCode, Translator } from './locales';
import { HeatmapRenderChild, ButtonsRenderChild, DailyOverviewRenderChild } from './render-markdown-render-children';
import { EasyTrackerPluginSettings, DEFAULT_SETTINGS, EasyTrackerSettingTab } from './setting-tab';

export default class EasyTrackerPlugin extends Plugin {
	settings: EasyTrackerPluginSettings;
	public locale: LocaleCode = 'en';
	public translator: Translator = createTranslator('en');
	private lastCheckInTime = 0;

	public t(key: LocaleKey, vars?: Record<string, string | number>): string {
		return this.translator(key, vars);
	}

	private getSystemLocale(): string {
		return getLanguage();
	}

	public refreshLocale(): void {
		const resolved = normalizeLocaleCode(this.getSystemLocale());
		this.locale = resolved;
		this.translator = createTranslator(resolved);
		this.triggerRefresh();
	}

    public triggerRefresh(): void {
        this.app.workspace.trigger('easy-tracker:refresh');
    }

	public triggerSettingsRefresh(): void {
		this.app.workspace.trigger('easy-tracker-setting:refresh');
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
	public getActiveContent(): string {
		const view = this.getActiveMarkdownView();
		return view ? (view.editor.getValue() || '') : '';
	}

	public isTodayCheckedIn(): boolean {
		const view = this.getActiveMarkdownView();
		if (!view) return false;

		const content = view.editor.getValue() || '';
		return hasTodayEntry(content);
	}

	// Safely insert today's entry with a value
	public insertEntry(value: number): boolean {
		const now = Date.now();
		if (now - this.lastCheckInTime < 1000) {
			new Notice(this.t('notice.checkInTooFast'));
			return false;
		}
		this.lastCheckInTime = now;

		const view = this.getActiveMarkdownView();
		if (!view) return false;

		if (view.getMode() !== 'source') {
			new Notice(this.t('notice.onlyCheckInInEditMode'));
			return false;
		}

		const editor = view.editor;
		if (!editor) {
			new Notice(this.t('notice.editorUnavailable'));
			return false;
		}
		insertTodayEntry(editor, value);

		// update
		this.triggerRefresh();

		return true;
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
		this.registerMarkdownCodeBlockProcessor('easy-tracker-year-calendar-heatmap', (source, el, ctx) => {
			ctx.addChild(new HeatmapRenderChild(this, el, source));
		});

		// Render a group of buttons that insert today's entry with a value
		// Example:
		// ```buttons
		//  Little | 1
		//  Enough | 2
		//  More   | 3
		// ```
		this.registerMarkdownCodeBlockProcessor("easy-tracker-buttons", (source, el, ctx) => {
			ctx.addChild(new ButtonsRenderChild(this, el, source));
		});

		this.registerMarkdownCodeBlockProcessor("easy-tracker-daily-overview", (_source, el, ctx) => {
			ctx.addChild(new DailyOverviewRenderChild(this, el));
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
					'',
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
					'',
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
			id: 'insert-daily-overview',
			name: this.t('command.insertDailyOverview'),
			editorCallback: (editor: Editor, _view: MarkdownView) => {
				editor.replaceSelection(['```easy-tracker-daily-overview', '```', ''].join('\n'));
			},
		});

		this.addCommand({
			id: 'insert-my-goal',
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
		const data = await this.loadData();
		const legacy = data?.weakStart; // legacy field (string '0'|'1')
		const migrated = typeof legacy !== 'undefined'
			? (parseInt(String(legacy)) === 0 ? 0 : 1)
			: undefined;
		const overrides: Partial<EasyTrackerPluginSettings> = {};

		if (typeof data?.weekStart === 'number') {
			overrides.weekStart = data.weekStart === 0 ? 0 : 1;
		}

		if (typeof migrated !== 'undefined') {
			overrides.weekStart = migrated;
		}

		this.settings = {
			...DEFAULT_SETTINGS,
			...overrides,
		};
	}

	async saveSettings() {
		await this.saveData(this.settings);
        this.triggerSettingsRefresh();
	}
}
