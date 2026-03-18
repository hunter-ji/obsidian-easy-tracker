import { MarkdownRenderChild, ButtonComponent } from "obsidian";
import type EasyTrackerPlugin from "./main";
import CalendarHeatmap, { CalendarHeatmapOptions } from './calendar-heatmap/index.js';
import { parseEntries, formatDate } from './utils';
import { computeDailyOverview, buildDailyOverview } from './daily-overview';
import { CustomValueModal } from "./custom-value-modal";

export class HeatmapRenderChild extends MarkdownRenderChild {
    plugin: EasyTrackerPlugin;
    source: string;
    heatmap: CalendarHeatmap | null = null;
    container: HTMLElement;

    constructor(plugin: EasyTrackerPlugin, containerEl: HTMLElement, source: string) {
        super(containerEl);
        this.plugin = plugin;
        this.source = source;
        this.container = containerEl;
    }

    onload() {
        this.display();

        // only need to update on data refresh
        this.registerEvent(this.plugin.app.workspace.on('easy-tracker:refresh', this.update.bind(this)));

        // If the week start setting changes, need to re-render
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
        const rawData = parseEntries(this.plugin.getActiveContent());
        const aggregated = this.aggregateData(rawData);
        const sourceOptions = this.parseHeatmapOptions(this.source);

        const cardTitle = this.container.createDiv({ cls: 'easy-tracker-card' });
        cardTitle.createEl('div', { cls: 'easy-tracker-card-title', text: this.plugin.t('card.activityHistoryTitle') });
        const heatmapElement = cardTitle.createDiv({ cls: 'easy-tracker-year-calendar-heatmap' });

        this.onunload()
        this.heatmap = new CalendarHeatmap(heatmapElement, aggregated, {
            weekStart: this.plugin.settings.weekStart,
            view: "year",
            year: new Date().getFullYear(),
            legend: false,
            language: this.plugin.locale,
            maxValue: (sourceOptions as any).target || null,
            ...sourceOptions,
            tooltip: true,
        });

        // Set custom tooltip if available in the library
        this.heatmap.setOptions({
            tooltip: true,
        });
    }

    private aggregateData(entries: any[]): any[] {
        const map = new Map<string, { value: number; count: number }>();
        for (const entry of entries) {
            const day = formatDate(entry.date, false);
            const current = map.get(day) || { value: 0, count: 0 };
            current.value += entry.value;
            current.count += 1;
            map.set(day, current);
        }

        return Array.from(map.entries()).map(([date, data]) => ({
            date,
            value: data.value,
            count: data.count
        }));
    }

    update() {
        if (this.heatmap) {
            const rawData = parseEntries(this.plugin.getActiveContent());
            const aggregated = this.aggregateData(rawData);
            this.heatmap.replaceData(aggregated);
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
    container: HTMLElement;

    constructor(plugin: EasyTrackerPlugin, containerEl: HTMLElement) {
        super(containerEl);
        this.plugin = plugin;
        this.container = containerEl;
    }

    onload() {
        this.display();
        this.registerEvent(this.plugin.app.workspace.on('easy-tracker:refresh', this.display.bind(this)));
    }

    display() {
        this.container.empty();
        const entries = parseEntries(this.plugin.getActiveContent());
        const overview = computeDailyOverview(entries);
        buildDailyOverview(this.container, overview, this.plugin.translator);
    }
}

export class ButtonsRenderChild extends MarkdownRenderChild {
    plugin: EasyTrackerPlugin;
    source: string;
    container: HTMLElement;

    constructor(plugin: EasyTrackerPlugin, containerEl: HTMLElement, source: string) {
        super(containerEl);
        this.plugin = plugin;
        this.source = source;
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

        const entries = parseEntries(this.plugin.getActiveContent());
        const todayStr = formatDate(new Date(), false);
        const todayEntries = entries.filter(e => formatDate(e.date, false) === todayStr);
        const todayTotal = todayEntries.reduce((sum, e) => sum + e.value, 0);

        if (todayEntries.length > 0) {
            container.createEl('div', {
                cls: 'easy-tracker-card-message',
                text: this.plugin.t('card.todayTotal', { total: todayTotal })
            });
        }

        const wrap = container.createDiv({ cls: "easy-tracker-button-group" });
        const lines = this.source.split("\n").map(s => s.trim()).filter(Boolean);

        for (const [index, line] of lines.entries()) {
            const [text, val] = line.split('|').map(s => s.trim());
            const btn = new ButtonComponent(wrap);
            btn.buttonEl.addClass("btn");
            btn.setButtonText(text || this.plugin.t('card.defaultButton'));
            btn.onClick(() => {
                if (val === '?') {
                    new CustomValueModal(this.plugin.app, this.plugin, (customVal) => {
                        this.plugin.insertEntry(customVal);
                    }).open();
                } else {
                    const n = Number(val);
                    const valueToInsert = Number.isFinite(n) ? n : index + 1;
                    this.plugin.insertEntry(valueToInsert);
                }
            });
        }
    }
}
