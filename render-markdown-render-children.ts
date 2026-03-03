import { MarkdownRenderChild, ButtonComponent, setIcon } from "obsidian";
import type EasyTrackerPlugin from "./main";
import CalendarHeatmap, { CalendarHeatmapOptions } from './calendar-heatmap/index.js';
import { computeDailyOverview, buildDailyOverview } from './daily-overview';

export class HeatmapRenderChild extends MarkdownRenderChild {
    plugin: EasyTrackerPlugin;
    source: string;
    sourcePath: string;
    heatmap: CalendarHeatmap | null = null;
    container: HTMLElement;

    constructor(plugin: EasyTrackerPlugin, containerEl: HTMLElement, source: string, sourcePath: string) {
        super(containerEl);
        this.plugin = plugin;
        this.source = source;
        this.sourcePath = sourcePath;
        this.container = containerEl;
    }

    onload() {
        this.display();

        // Re-render data on check-in or any vault metadata change
        this.registerEvent(this.plugin.app.workspace.on('easy-tracker:refresh', this.update.bind(this)));

        // Re-render fully when week start setting changes
        this.registerEvent(this.plugin.app.workspace.on('easy-tracker-setting:refresh', this.display.bind(this)));
    }

    onunload() {
        if (this.heatmap) {
            this.heatmap.destroy();
            this.heatmap = null;
        }
    }

    display() {
        this.container.empty();

        // Parse options from source - can include folder path
        const rawOptions = this.parseHeatmapOptions(this.source);
        const folderPath = (rawOptions as any).folder as string | undefined;

        // Get data, optionally filtered by folder
        const data = this.plugin.getAllEntries(folderPath);

        const cardTitle = this.container.createDiv({ cls: 'easy-tracker-card' });
        cardTitle.createEl('div', { cls: 'easy-tracker-card-title', text: this.plugin.t('card.activityHistoryTitle') });
        const heatmapElement = cardTitle.createDiv({ cls: 'easy-tracker-year-calendar-heatmap' });

        this.onunload();
        this.heatmap = new CalendarHeatmap(heatmapElement, data, {
            weekStart: this.plugin.settings.weekStart,
            view: "year",
            year: new Date().getFullYear(),
            legend: false,
            language: this.plugin.locale,
            ...rawOptions,
        });
    }

    update() {
        if (this.heatmap) {
            const rawOptions = this.parseHeatmapOptions(this.source);
            const folderPath = (rawOptions as any).folder as string | undefined;
            this.heatmap.replaceData(this.plugin.getAllEntries(folderPath));
        } else {
            this.display();
        }
    }

    private parseHeatmapOptions(source: string): Partial<CalendarHeatmapOptions> {
        try {
            return source.trim() ? JSON.parse(source) : {};
        } catch {
            console.warn('calendar-heatmap: unable to parse options JSON, using defaults');
            return {};
        }
    }
}

export class DailyOverviewRenderChild extends MarkdownRenderChild {
    plugin: EasyTrackerPlugin;
    sourcePath: string;
    container: HTMLElement;

    constructor(plugin: EasyTrackerPlugin, containerEl: HTMLElement, sourcePath: string) {
        super(containerEl);
        this.plugin = plugin;
        this.sourcePath = sourcePath;
        this.container = containerEl;
    }

    onload() {
        this.display();
        this.registerEvent(this.plugin.app.workspace.on('easy-tracker:refresh', this.display.bind(this)));
    }

    display() {
        this.container.empty();
        const entries = this.plugin.getAllEntries();
        const referenceDate = this.plugin.getNoteDate(this.sourcePath) ?? new Date();
        const overview = computeDailyOverview(entries, referenceDate);
        buildDailyOverview(this.container, overview, this.plugin.translator);
    }
}

export class ButtonsRenderChild extends MarkdownRenderChild {
    plugin: EasyTrackerPlugin;
    source: string;
    sourcePath: string;
    container: HTMLElement;

    constructor(plugin: EasyTrackerPlugin, containerEl: HTMLElement, source: string, sourcePath: string) {
        super(containerEl);
        this.plugin = plugin;
        this.source = source;
        this.sourcePath = sourcePath;
        this.container = containerEl;
    }

    onload() {
        this.display();
        this.registerEvent(this.plugin.app.workspace.on('easy-tracker:refresh', this.display.bind(this)));
    }

    display() {
        this.container.empty();
        const container = this.container.createDiv({ cls: "easy-tracker-card" });
        container.setAttr('id', 'easy-tracker-buttons');
        container.createEl('div', { cls: 'easy-tracker-card-title', text: this.plugin.t('card.buttonsTitle') });

        const isCheckedIn = this.plugin.isCheckedIn(this.sourcePath);
        const currentValue = this.plugin.getCheckedInValue(this.sourcePath);

        // Show current value if checked in and edit is allowed
        if (isCheckedIn && this.plugin.settings.allowEdit && currentValue !== null) {
            const message = container.createDiv({ cls: 'easy-tracker-card-message' });
            message.setText(this.plugin.t('card.currentValue', { value: String(currentValue) }));
        } else if (isCheckedIn && !this.plugin.settings.allowEdit) {
            container.createEl('div', { cls: 'easy-tracker-card-message', text: this.plugin.t('card.checkInCongrats') });
            return;
        }

        const wrap = container.createDiv({ cls: "easy-tracker-button-group" });
        const lines = this.source.split("\n").map(s => s.trim()).filter(Boolean);

        for (const [index, line] of lines.entries()) {
            const [text, val] = line.split('|').map(s => s.trim());
            const btn = new ButtonComponent(wrap);
            btn.buttonEl.addClass("btn");

            // Highlight current value button
            const n = Number(val);
            const buttonValue = Number.isFinite(n) ? n : index + 1;
            if (currentValue === buttonValue) {
                btn.buttonEl.addClass("btn-active");
            }

            btn.setButtonText(text || this.plugin.t('card.defaultButton'));
            btn.onClick(async () => {
                try {
                    const success = await this.plugin.insertEntry(buttonValue, this.sourcePath);
                    if (success) {
                        // Immediately refresh button state
                        this.display();
                    }
                } catch (error) {
                    console.error('[EasyTracker] Check-in button error:', error);
                }
            });
        }
    }
}

export class GoalChecklistRenderChild extends MarkdownRenderChild {
    plugin: EasyTrackerPlugin;
    source: string;
    sourcePath: string;
    container: HTMLElement;

    constructor(plugin: EasyTrackerPlugin, containerEl: HTMLElement, source: string, sourcePath: string) {
        super(containerEl);
        this.plugin = plugin;
        this.source = source;
        this.sourcePath = sourcePath;
        this.container = containerEl;
    }

    onload() {
        this.display();
        this.registerEvent(this.plugin.app.workspace.on('easy-tracker:refresh', this.display.bind(this)));
    }

    display() {
        this.container.empty();
        const container = this.container.createDiv({ cls: "easy-tracker-card" });
        container.setAttr('id', 'easy-tracker-goal-checklist');
        container.createEl('div', { cls: 'easy-tracker-card-title', text: this.plugin.t('card.goalChecklistTitle') });

        // Parse goals from source (each line is a goal)
        const lines = this.source.split('\n').map(l => l.trim()).filter(Boolean);

        if (lines.length === 0) {
            container.createEl('div', { cls: 'easy-tracker-card-message', text: this.plugin.t('card.goalChecklistPlaceholder') });
            return;
        }

        // Get checked state from frontmatter
        const checkedGoals = this.getCheckedGoals();

        const listContainer = container.createDiv({ cls: 'easy-tracker-goal-checklist' });

        lines.forEach((goalText, index) => {
            const itemDiv = listContainer.createDiv({ cls: 'easy-tracker-goal-item' });

            const checkbox = itemDiv.createEl('input', {
                type: 'checkbox',
                cls: 'easy-tracker-goal-checkbox'
            });
            checkbox.checked = checkedGoals.includes(index);

            checkbox.addEventListener('change', async () => {
                await this.toggleGoal(index, checkbox.checked);
            });

            const label = itemDiv.createEl('label', {
                cls: 'easy-tracker-goal-label',
                text: goalText
            });

            if (checkbox.checked) {
                label.addClass('easy-tracker-goal-completed');
            }
        });
    }

    private getCheckedGoals(): number[] {
        const normalized = this.plugin.normalizeSourcePath(this.sourcePath);
        const file = this.plugin.app.vault.getFileByPath(normalized);
        if (!file) return [];

        const cache = this.plugin.app.metadataCache.getFileCache(file);
        const checkedGoals = cache?.frontmatter?.['tracker-goals'];

        if (Array.isArray(checkedGoals)) {
            return checkedGoals.filter(n => typeof n === 'number');
        }
        return [];
    }

    private async toggleGoal(index: number, checked: boolean) {
        const normalized = this.plugin.normalizeSourcePath(this.sourcePath);
        const file = this.plugin.app.vault.getFileByPath(normalized);
        if (!file) return;

        try {
            await this.plugin.app.fileManager.processFrontMatter(file, (fm) => {
                let checkedGoals = fm['tracker-goals'];
                if (!Array.isArray(checkedGoals)) {
                    checkedGoals = [];
                }

                if (checked) {
                    if (!checkedGoals.includes(index)) {
                        checkedGoals.push(index);
                    }
                } else {
                    checkedGoals = checkedGoals.filter((i: number) => i !== index);
                }

                fm['tracker-goals'] = checkedGoals.sort((a: number, b: number) => a - b);
            });

            // Wait a bit for cache to update
            await new Promise(resolve => setTimeout(resolve, 100));
            this.display();
        } catch (error) {
            console.error('[EasyTracker] Failed to toggle goal:', error);
        }
    }
}

export class NoteCounterRenderChild extends MarkdownRenderChild {
    plugin: EasyTrackerPlugin;
    sourcePath: string;
    container: HTMLElement;

    constructor(plugin: EasyTrackerPlugin, containerEl: HTMLElement, sourcePath: string) {
        super(containerEl);
        this.plugin = plugin;
        this.sourcePath = sourcePath;
        this.container = containerEl;
    }

    onload() {
        this.display();
        // Refresh when vault changes
        this.registerEvent(this.plugin.app.vault.on('create', () => this.display()));
        this.registerEvent(this.plugin.app.vault.on('delete', () => this.display()));
    }

    display() {
        this.container.empty();
        const container = this.container.createDiv({ cls: "easy-tracker-card" });
        container.setAttr('id', 'easy-tracker-note-counter');
        container.createEl('div', { cls: 'easy-tracker-card-title', text: this.plugin.t('card.noteCounterTitle') });

        const referenceDate = this.plugin.getNoteDate(this.sourcePath) ?? new Date();
        const count = this.getDateNoteCount(referenceDate);

        const statsContainer = container.createDiv({ cls: 'easy-tracker-note-counter' });

        const countDiv = statsContainer.createDiv({ cls: 'easy-tracker-note-counter__count' });
        countDiv.createEl('div', { cls: 'easy-tracker-note-counter__number', text: String(count) });
        countDiv.createEl('div', { cls: 'easy-tracker-note-counter__label', text: this.plugin.t('card.noteCounterLabel') });

        const hintDiv = statsContainer.createDiv({ cls: 'easy-tracker-note-counter__hint' });
        hintDiv.setText(this.plugin.t('card.noteCounterHint', { count: String(count) }));
    }

    private getDateNoteCount(referenceDate: Date): number {
        const targetDate = new Date(referenceDate);
        targetDate.setHours(0, 0, 0, 0);
        const startTime = targetDate.getTime();
        const endTime = startTime + 24 * 60 * 60 * 1000;

        let count = 0;
        for (const file of this.plugin.app.vault.getMarkdownFiles()) {
            if (file.stat.ctime >= startTime && file.stat.ctime < endTime) {
                count++;
            }
        }
        return count;
    }
}
