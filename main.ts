import { Editor, MarkdownView, Notice, Plugin, TFile, getLanguage } from 'obsidian';
import { extractDateFromFilename, getDateFromFrontmatter } from './utils';
import { createTranslator, LocaleCode, LocaleKey, normalizeLocaleCode, Translator } from './locales';
import { HeatmapRenderChild, ButtonsRenderChild, DailyOverviewRenderChild, GoalChecklistRenderChild, NoteCounterRenderChild } from './render-markdown-render-children';
import { EasyTrackerPluginSettings, DEFAULT_SETTINGS, EasyTrackerSettingTab } from './setting-tab';
import { Entry } from './entry-types';

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

	// Normalize source path to handle different formats
	public normalizeSourcePath(sourcePath: string): string {
		let normalized = sourcePath.replace(/^[^/]+:\/\//, '');
		normalized = normalized.replace(/\\/g, '/');
		normalized = normalized.replace(/^\/+/, '');
		return normalized;
	}

	// Returns true if the given note's frontmatter already has the value field set
	public isCheckedIn(sourcePath: string): boolean {
		const normalized = this.normalizeSourcePath(sourcePath);
		const file = this.app.vault.getFileByPath(normalized);
		if (!file) {
			console.warn(`[EasyTracker] File not found: ${sourcePath} (normalized: ${normalized})`);
			return false;
		}
		const cache = this.app.metadataCache.getFileCache(file);
		return cache?.frontmatter?.[this.settings.valueField] != null;
	}

	// Get the current check-in value for a note
	public getCheckedInValue(sourcePath: string): number | null {
		const normalized = this.normalizeSourcePath(sourcePath);
		const file = this.app.vault.getFileByPath(normalized);
		if (!file) return null;
		const cache = this.app.metadataCache.getFileCache(file);
		const value = cache?.frontmatter?.[this.settings.valueField];
		return typeof value === 'number' ? value : null;
	}

	// Resolve the date a note represents: tries frontmatter dateField, then filename
	public getNoteDate(sourcePath: string): Date | null {
		const normalized = this.normalizeSourcePath(sourcePath);
		const file = this.app.vault.getFileByPath(normalized);
		if (!file) return null;
		const cache = this.app.metadataCache.getFileCache(file);
		if (cache?.frontmatter) {
			const d = getDateFromFrontmatter(cache.frontmatter, this.settings.dateField);
			if (d) return d;
		}
		return extractDateFromFilename(file.basename);
	}

	// Aggregate all check-in entries from the vault's metadata cache
	public getAllEntries(folderPath?: string): Entry[] {
		const { dateField, valueField } = this.settings;
		const entries: Entry[] = [];
		for (const file of this.app.vault.getMarkdownFiles()) {
			// Filter by folder if specified
			if (folderPath && !file.path.startsWith(folderPath)) {
				continue;
			}

			const cache = this.app.metadataCache.getFileCache(file);
			if (!cache?.frontmatter) continue;
			const rawValue = cache.frontmatter[valueField];
			if (rawValue == null) continue;
			const numValue = Number(rawValue);
			if (!Number.isFinite(numValue)) continue;

			let date = getDateFromFrontmatter(cache.frontmatter, dateField);
			if (!date) date = extractDateFromFilename(file.basename);
			if (!date) continue;

			entries.push({ date, value: numValue });
		}
		return entries;
	}

	// Write the check-in value into the note's frontmatter
	public async insertEntry(value: number, sourcePath: string): Promise<boolean> {
		const now = Date.now();
		if (now - this.lastCheckInTime < 1000) {
			new Notice(this.t('notice.checkInTooFast'));
			return false;
		}
		this.lastCheckInTime = now;

		const normalized = this.normalizeSourcePath(sourcePath);
		const file = this.app.vault.getFileByPath(normalized);

		if (!(file instanceof TFile)) {
			console.error('[EasyTracker] File not found or not TFile:', { sourcePath, normalized });
			new Notice(this.t('notice.fileNotFound'));
			return false;
		}

		// Check if already checked in and edit is not allowed
		const alreadyCheckedIn = this.isCheckedIn(sourcePath);
		if (alreadyCheckedIn && !this.settings.allowEdit) {
			new Notice(this.t('notice.alreadyCheckedIn'));
			return false;
		}

		try {
			const action = alreadyCheckedIn ? 'Updating' : 'Writing';
			console.log(`[EasyTracker] ${action} frontmatter:`, { file: file.path, value, field: this.settings.valueField });

			await this.app.fileManager.processFrontMatter(file, (fm) => {
				fm[this.settings.valueField] = value;
			});

			// Wait for metadataCache to update (max 3 seconds)
			const maxWait = 3000;
			const startTime = Date.now();

			await new Promise<void>((resolve, reject) => {
				const checkCache = () => {
					const cache = this.app.metadataCache.getFileCache(file);
					const currentValue = cache?.frontmatter?.[this.settings.valueField];

					if (currentValue === value) {
						console.log('[EasyTracker] Cache updated successfully');
						resolve();
					} else if (Date.now() - startTime > maxWait) {
						console.warn('[EasyTracker] Cache update timeout');
						reject(new Error('Cache update timeout'));
					} else {
						setTimeout(checkCache, 50);
					}
				};
				checkCache();
			});

			// Trigger refresh
			this.triggerRefresh();

			const successKey = alreadyCheckedIn ? 'notice.checkInUpdated' : 'notice.checkInSuccess';
			new Notice(this.t(successKey));
			return true;

		} catch (error) {
			console.error('[EasyTracker] Failed to insert entry:', error);
			new Notice(this.t('notice.checkInFailed'));
			return false;
		}
	}

	async onload() {
		await this.loadSettings();
		this.refreshLocale();

		// Trigger refresh whenever a tracked note's metadata is updated
		this.registerEvent(
			this.app.metadataCache.on('changed', (file) => {
				const cache = this.app.metadataCache.getFileCache(file);
				if (cache?.frontmatter?.[this.settings.valueField] != null) {
					this.triggerRefresh();
				}
			})
		);

		this.registerMarkdownCodeBlockProcessor('easy-tracker-my-goal', (source, el, _ctx) => {
			const container = el.createDiv({ cls: "easy-tracker-card" });
			container.setAttr('id', 'easy-tracker-my-goal');
			container.createEl('div', { cls: 'easy-tracker-card-title', text: this.t('card.goalTitle') });
			container.createEl('div', { cls: 'easy-tracker-my-goal', text: source.trim() || this.t('card.goalPlaceholder') });
		});

		// Render an interactive goal checklist
		this.registerMarkdownCodeBlockProcessor('easy-tracker-goal-checklist', (source, el, ctx) => {
			ctx.addChild(new GoalChecklistRenderChild(this, el, source, ctx.sourcePath));
		});

		// Render a yearly calendar heatmap sourced from all notes in the vault
		this.registerMarkdownCodeBlockProcessor('easy-tracker-year-calendar-heatmap', (source, el, ctx) => {
			ctx.addChild(new HeatmapRenderChild(this, el, source, ctx.sourcePath));
		});

		// Render a group of buttons that check in the current note
		this.registerMarkdownCodeBlockProcessor("easy-tracker-buttons", (source, el, ctx) => {
			ctx.addChild(new ButtonsRenderChild(this, el, source, ctx.sourcePath));
		});

		this.registerMarkdownCodeBlockProcessor("easy-tracker-daily-overview", (_source, el, ctx) => {
			ctx.addChild(new DailyOverviewRenderChild(this, el, ctx.sourcePath));
		});

		// Render a note counter showing today's new notes
		this.registerMarkdownCodeBlockProcessor("easy-tracker-note-counter", (_source, el, ctx) => {
			ctx.addChild(new NoteCounterRenderChild(this, el, ctx.sourcePath));
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
					'```easy-tracker-goal-checklist',
					this.t('card.goalChecklistPlaceholder'),
					'```',
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
					'```easy-tracker-goal-checklist',
					this.t('card.goalChecklistPlaceholder'),
					'```',
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
			name: this.t('command.insertGoalChecklist'),
			editorCallback: (editor: Editor, _view: MarkdownView) => {
				editor.replaceSelection([
					'```easy-tracker-goal-checklist',
					this.t('card.goalChecklistPlaceholder'),
					'```',
					''
				].join('\n'));
			},
		});

		this.addCommand({
			id: 'insert-note-counter',
			name: this.t('command.insertNoteCounter'),
			editorCallback: (editor: Editor, _view: MarkdownView) => {
				editor.replaceSelection([
					'```easy-tracker-note-counter',
					'```',
					''
				].join('\n'));
			},
		});

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

		if (typeof data?.dateField === 'string' && data.dateField.trim()) {
			overrides.dateField = data.dateField.trim();
		}

		if (typeof data?.valueField === 'string' && data.valueField.trim()) {
			overrides.valueField = data.valueField.trim();
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
