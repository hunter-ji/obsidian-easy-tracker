
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

export const computeDailyOverview = (entries: any[]): DailyOverview => {
    const dates = new Set<string>();
    let earliestKey: string | null = null;

    for (const entry of entries ?? []) {
        const raw = entry?.date ?? entry?.day ?? entry?.key ?? entry;
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

export const renderDailyOverview = (el: HTMLElement, overview: DailyOverview): void => {
    const container = el.createDiv({ cls: 'easy-tracker-daily-overview' });
    container.createEl('div', { cls: 'easy-tracker-daily-overview__title', text: '今日概览' });

    const metrics: Array<{ label: string; value: string; hint?: string; modifier?: string }> = [
        {
            label: '今日状态',
            value: overview.hasToday ? '已打卡' : '未打卡',
            hint: overview.hasToday ? '保持节奏' : '记得打卡',
            modifier: overview.hasToday ? 'easy-tracker-daily-overview__value--positive' : 'easy-tracker-daily-overview__value--warning',
        },
        {
            label: '连续打卡',
            value: `${overview.hasEntries ? overview.streak : 0} 天`,
            hint: overview.hasEntries && overview.streak > 0 ? '继续累计' : '等待开始',
        },
        {
            label: '最近空缺',
            value: overview.hasEntries ? overview.lastMissing ?? '无空缺' : '暂无数据',
            hint: overview.lastMissing ? '关注这一天' : '表现稳定',
        },
    ];

    const grid = container.createDiv({ cls: 'easy-tracker-daily-overview__grid' });

    for (const metric of metrics) {
        const card = grid.createDiv({ cls: 'easy-tracker-daily-overview__item' });
        card.createEl('div', { cls: 'easy-tracker-daily-overview__label', text: metric.label });

        const valueEl = card.createEl('div', { cls: 'easy-tracker-daily-overview__value', text: metric.value });
        if (metric.modifier) {
            valueEl.addClass(metric.modifier);
        }

        if (metric.hint) {
            card.createEl('div', { cls: 'easy-tracker-daily-overview__hint', text: metric.hint });
        }
    }
}
