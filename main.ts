import { App, ButtonComponent, Editor, MarkdownView, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import CalendarHeatmap, { CalendarHeatmapOptions } from 'calendar-heatmap';
import { hasTodayEntry, insertTodayEntry, parseEntries } from './utils';
import { renderDailyOverview, computeDailyOverview } from './daily-overview';

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	// Get the active Markdown view or notify the user
	private getActiveMarkdownView(): MarkdownView | null {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) {
			new Notice('No active Markdown view');
			return null;
		}
		return view;
	}

	// Read the current note content safely
	private getActiveContent(): string {
		const view = this.getActiveMarkdownView();
		return view ? (view.editor.getValue() || '') : '';
	}

	// Safely insert today's entry with a value (prevents duplicates)
	private insertEntry(value: number): void {
		const view = this.getActiveMarkdownView();
		if (!view) return;

		const content = view.editor.getValue() || '';
		if (hasTodayEntry(content)) {
			new Notice('Already checked in today');
			return;
		}

		const editor = view.editor;
		if (!editor) {
			new Notice('Editor instance not available');
			return;
		}
		insertTodayEntry(editor, value);
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

	async onload() {
		// Load settings (includes migration from legacy weakStart)
		await this.loadSettings();

		// Render a yearly calendar heatmap from entries in the current note
		this.registerMarkdownCodeBlockProcessor('year-calendar-heatmap', (source, el, _ctx) => {
			const data = parseEntries(this.getActiveContent());
			const options = this.parseHeatmapOptions(source);
			const container = el.createDiv({ cls: 'calendar-heatmap-container' });

			new CalendarHeatmap(container, data, {
				weekStart: this.settings.weekStart,
				year: new Date().getFullYear(),
				legend: false,
				...options,
			});
		});

		// Render a group of buttons that insert today's entry with a value
		// Example:
		// ```buttons
		//  Little | 1
		//  Enough | 2
		//  More   | 3
		// ```
		this.registerMarkdownCodeBlockProcessor("buttons", (source, el) => {
			const wrap = el.createDiv({ cls: "easy-tracker-button-group" });
			const lines = source.split("\n").map(s => s.trim()).filter(Boolean);

			for (const [index, line] of lines.entries()) {
				const [text, val] = line.split('|').map(s => s.trim());
				const btn = new ButtonComponent(wrap);
				btn.buttonEl.addClass("btn");
				btn.setButtonText(text || "Button");
				btn.onClick(() => {
					const n = Number(val);
					const valueToInsert = Number.isFinite(n) ? n : index + 1; // use provided number, fallback to index
					this.insertEntry(valueToInsert);
				});
			}
		});

		this.registerMarkdownCodeBlockProcessor("easy-tracker-daily-overview", (_source, el) => {
			const entries = parseEntries(this.getActiveContent());
			const overview = computeDailyOverview(entries);
			renderDailyOverview(el, overview);
		});
		// Insert a bare heatmap block
		this.addCommand({
			id: 'insert-calendar-heatmap',
			name: 'Insert calendar heatmap',
			editorCallback: (editor: Editor, _view: MarkdownView) => {
				editor.replaceSelection([
					'```year-calendar-heatmap',
					'{',
					'  "view": "year"',
					'}',
					'```',
					'',
				].join('\n'));
			}
		});

		// Insert a heatmap + three preset buttons (1..3)
		this.addCommand({
			id: 'insert-positive-check-in-component',
			name: 'Insert Positive Check-in Component',
			editorCallback: (editor: Editor, _view: MarkdownView) => {
				editor.replaceSelection([
					'```easy-tracker-daily-overview',
					'```',
					'```year-calendar-heatmap',
					'{',
					'  "view": "year"',
					'}',
					'```',
					'',
					'```buttons',
					'  Little | 1',
					'  Enough | 2',
					'  More | 3',
					'```',
					''
				].join('\n'));
			},
		});

		// Insert a heatmap + single check-in button
		this.addCommand({
			id: 'insert-normal-check-in-component',
			name: 'Insert Normal Check-in Component',
			editorCallback: (editor: Editor, _view: MarkdownView) => {
				editor.replaceSelection([
					'```easy-tracker-daily-overview',
					'```',
					'```year-calendar-heatmap',
					'{',
					'  "view": "year"',
					'}',
					'```',
					'',
					'```buttons',
					'  Check in | 1',
					'```',
					''
				].join('\n'));
			},
		});

		this.addCommand({
			id: 'insert-easy-tracker-daily-overview',
			name: 'Insert Daily Overview',
			editorCallback: (editor: Editor, _view: MarkdownView) => {
				editor.replaceSelection(['```easy-tracker-daily-overview', '```', ''].join('\n'));
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

		this.settings = {
			...DEFAULT_SETTINGS,
			...(typeof data?.weekStart === 'number' ? { weekStart: data.weekStart === 0 ? 0 : 1 } : {}),
			...(typeof migrated !== 'undefined' ? { weekStart: migrated } : {}),
		};
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

// Plugin settings: weekStart (0 = Sunday, 1 = Monday)
interface MyPluginSettings {
	weekStart: 0 | 1;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	weekStart: 1,
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
			.setName('Week start')
			.setDesc('Choose the first day of the week used by the calendar')
			.addDropdown(drop => {
				// 1 = Monday (default); 0 = Sunday
				drop.addOption('1', 'Monday');
				drop.addOption('0', 'Sunday');
				drop.setValue(String(this.plugin.settings.weekStart));
				drop.onChange(async (value) => {
					this.plugin.settings.weekStart = value === '0' ? 0 : 1;
					await this.plugin.saveSettings();
				});
			});
	}
}
