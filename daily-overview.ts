import { Translator } from './locales';
import { Entry } from './entry-types';

// Daily overview interface
export interface DailyOverview {
    hasEntries: boolean;
    hasToday: boolean;
    streak: number;
    lastMissing: string | null;
}

const normalizeDateKey = (value: string | Date): string => {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
}

const dateFromKey = (key: string): Date => {
    const [year, month, day] = key.split('-').map(Number);
    return new Date(year, (month || 1) - 1, day || 1);
}

export const computeDailyOverview = (entries: Entry[]): DailyOverview => {
    const dates = new Set<string>();
    let earliestKey: string | null = null;

    for (const entry of entries ?? []) {
        let raw: string | Date = '';
        if (entry?.date !== undefined) raw = entry.date;
        else if (entry?.day !== undefined) raw = entry.day;
        else if (entry?.key !== undefined) raw = entry.key;
        else if (typeof entry === 'string' || entry instanceof Date) raw = entry as string | Date;

        const key = normalizeDateKey(raw);
        if (!key) continue;

        dates.add(key);
        if (!earliestKey || key < earliestKey) {
            earliestKey = key;
        }
    }

    const todayKey = normalizeDateKey(new Date());
    const hasEntries = dates.size > 0;
    const hasToday = dates.has(todayKey);

    let streak = 0;
    if (hasEntries) {
        const cursor = new Date();
        if (!hasToday) {
            cursor.setDate(cursor.getDate() - 1);
        }
        while (dates.has(normalizeDateKey(cursor))) {
            streak += 1;
            cursor.setDate(cursor.getDate() - 1);
        }
    }

    let lastMissing: string | null = null;
    if (hasEntries && earliestKey) {
        const earliestDate = dateFromKey(earliestKey);
        const cursor = new Date();
        while (cursor >= earliestDate) {
            const key = normalizeDateKey(cursor);
            if (!dates.has(key)) {
                lastMissing = key;
                break;
            }
            cursor.setDate(cursor.getDate() - 1);
        }
    }

    return { hasEntries, hasToday, streak, lastMissing };
}

const buildDailyOverview = (container: HTMLElement, overview: DailyOverview, t: Translator): void => {
	container.empty();
	container.addClass('easy-tracker-card');
    container.setAttr('id', 'easy-tracker-daily-overview');
    container.createEl('div', { cls: 'easy-tracker-card-title', text: t('overview.title') });

	const metrics: Array<{ label: string; value: string; hint?: string; modifier?: string }> = [
		{
            label: t('overview.statusLabel'),
            value: overview.hasToday ? t('overview.statusValue.checkedIn') : t('overview.statusValue.missed'),
            hint: overview.hasToday ? t('overview.statusHint.checkedIn') : t('overview.statusHint.missed'),
			modifier: overview.hasToday ? 'easy-tracker-daily-overview__value--positive' : 'easy-tracker-daily-overview__value--warning',
		},
		{
            label: t('overview.streakLabel'),
            value: t('overview.streakValue', { count: String(overview.hasEntries ? overview.streak : 0) }),
            hint: overview.hasEntries && overview.streak > 0 ? t('overview.streakHint.active') : t('overview.streakHint.inactive'),
		},
		{
            label: t('overview.gapLabel'),
            value: overview.hasEntries ? overview.lastMissing ?? t('overview.gapValue.none') : t('overview.noData'),
            hint: overview.lastMissing ? t('overview.gapHint.present') : t('overview.gapHint.none'),
		},
	];

    const grid = container.createDiv({ cls: 'easy-tracker-daily-overview__grid' });
	for (const metric of metrics) {
		const card = grid.createDiv({ cls: 'easy-tracker-daily-overview__item' });
		card.createEl('div', { cls: 'easy-tracker-daily-overview__label', text: metric.label });

		const valueEl = card.createEl('div', { cls: 'easy-tracker-daily-overview__value', text: metric.value });
		if (metric.modifier) valueEl.addClass(metric.modifier);

		if (metric.hint) {
			card.createEl('div', { cls: 'easy-tracker-daily-overview__hint', text: metric.hint });
		}
	}
};

export const renderDailyOverview = (el: HTMLElement, overview: DailyOverview, t: Translator): void => {
    const container = el.createDiv();
    buildDailyOverview(container, overview, t);
};

export const updateDailyOverview = (el: HTMLElement, overview: DailyOverview, t: Translator): void => {
    const container = el.querySelector('#easy-tracker-daily-overview');
    if (container instanceof HTMLElement) {
        buildDailyOverview(container, overview, t);
    } else {
        renderDailyOverview(el, overview, t);
    }
};
