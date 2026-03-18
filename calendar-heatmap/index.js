/*
 * CalendarHeatmap
 * Lightweight calendar-style heatmap renderer with GitHub-like layout.
 * Supports multiple time windows (year, month, week, rolling range) and custom color scales.
 * Github: https://github.com/hunter-ji/calendar-heatmap
 * Author: Hunter Ji
 */

(function (globalFactory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        module.exports = globalFactory();
    } else if (typeof define === 'function' && define.amd) {
        define(globalFactory);
    } else {
        const globalScope = typeof globalThis !== 'undefined' ? globalThis : window;
        globalScope.CalendarHeatmap = globalFactory();
    }
})(function calendarHeatmapFactory() {
    const DEFAULT_COLORS = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];
    const STYLE_ID = 'calendar-heatmap-style';

    const DEFAULT_OPTIONS = {
        view: 'year',
        year: new Date().getFullYear(),
        month: new Date().getMonth(),
        weekStart: 0, // 0 Sunday, 1 Monday
        recentDays: 7,
        squareSize: 14,
        squareGap: 2,
        colorScale: DEFAULT_COLORS,
        maxValue: null,
        legend: false,
        tooltip: true,
        locale: undefined,
        language: 'en'
    };

    const LANGUAGE_CONFIG = {
        en: {
            locale: 'en-US',
            legend: { less: 'Less', more: 'More' },
            weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            tooltip: (value, date, count) => `${value} on ${date}${count > 0 ? ` (${count} entries)` : ''}`
        },
        'zh-cn': {
            locale: 'zh-CN',
            legend: { less: '较少', more: '较多' },
            weekdays: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
            tooltip: (value, date, count) => `${date}：${value}${count > 0 ? `（${count}次）` : ''}`
        },
        'zh-tw': {
            locale: 'zh-TW',
            legend: { less: '較少', more: '較多' },
            weekdays: ['週日', '週一', '週二', '週三', '週四', '週五', '週六'],
            tooltip: (value, date, count) => `${date}：${value}${count > 0 ? `（${count}次）` : ''}`
        },
        ja: {
            locale: 'ja-JP',
            legend: { less: '少ない', more: '多い' },
            weekdays: ['日', '月', '火', '水', '木', '金', '土'],
            tooltip: (value, date, count) => `${date}：${value}${count > 0 ? `（${count}回）` : ''}`
        },
        fr: {
            locale: 'fr-FR',
            legend: { less: 'Moins', more: 'Plus' },
            weekdays: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
            tooltip: (value, date, count) => `${value} le ${date}${count > 0 ? ` (${count})` : ''}`
        },
        de: {
            locale: 'de-DE',
            legend: { less: 'Weniger', more: 'Mehr' },
            weekdays: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
            tooltip: (value, date, count) => `${value} am ${date}${count > 0 ? ` (${count})` : ''}`
        },
        ko: {
            locale: 'ko-KR',
            legend: { less: '적음', more: '많음' },
            weekdays: ['일', '월', '화', '수', '목', '금', '토'],
            tooltip: (value, date, count) => `${date} ${value}${count > 0 ? ` (${count}회)` : ''}`
        },
        es: {
            locale: 'es-ES',
            legend: { less: 'Menos', more: 'Más' },
            weekdays: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
            tooltip: (value, date, count) => `${value} el ${date}${count > 0 ? ` (${count})` : ''}`
        },
        it: {
            locale: 'it-IT',
            legend: { less: 'Meno', more: 'Più' },
            weekdays: ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'],
            tooltip: (value, date, count) => `${value} il ${date}${count > 0 ? ` (${count})` : ''}`
        }
    };

    const LANGUAGE_ALIASES = {
        en: 'en',
        'en-us': 'en',
        'en-gb': 'en',
        english: 'en',
        zh: 'zh-cn',
        'zh-cn': 'zh-cn',
        'zh-hans': 'zh-cn',
        'zh-sg': 'zh-cn',
        'zh-tw': 'zh-tw',
        'zh-hant': 'zh-tw',
        'zh-hk': 'zh-tw',
        ja: 'ja',
        'ja-jp': 'ja',
        japanese: 'ja',
        fr: 'fr',
        'fr-fr': 'fr',
        french: 'fr',
        de: 'de',
        'de-de': 'de',
        german: 'de',
        ko: 'ko',
        'ko-kr': 'ko',
        korean: 'ko',
        es: 'es',
        'es-es': 'es',
        spanish: 'es',
        it: 'it',
        'it-it': 'it',
        italian: 'it'
    };

    function resolveLanguageConfig(language) {
        const key = String(language || 'en').toLowerCase();
        const matched = LANGUAGE_ALIASES[key] || key;
        return LANGUAGE_CONFIG[matched] || LANGUAGE_CONFIG.en;
    }

    function normalizeContainer(container) {
        if (!container) {
            throw new Error('CalendarHeatmap: container is required.');
        }
        if (typeof container === 'string') {
            const node = document.querySelector(container);
            if (!node) {
                throw new Error(`CalendarHeatmap: container selector "${container}" not found.`);
            }
            return node;
        }
        return container;
    }

    function dateKey(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Normalizes input data into a Map for fast lookup.
     * Expects an array of objects with `date` (or `day`, `dateString`) and `value` (or `count`).
     */
    function normalizeData(data) {
        // Collapse incoming records into a date -> value map for quicker lookup during rendering.
        const map = new Map();
        if (!Array.isArray(data)) {
            return map;
        }
        data.forEach((item) => {
            if (!item) return;
            const date = new Date(item.date || item.day || item.dateString);
            if (Number.isNaN(date.getTime())) return;
            const key = dateKey(date);
            const value = typeof item.value === 'number' ? item.value : Number(item.count);
            if (Number.isNaN(value)) return;
            const count = typeof item.count === 'number' ? item.count : 1;
            const current = map.get(key) || { value: 0, count: 0 };
            current.value += value;
            current.count += Number.isNaN(count) ? 0 : count;
            map.set(key, current);
        });
        return map;
    }

    function addDays(base, amount) {
        const next = new Date(base);
        next.setDate(base.getDate() + amount);
        return next;
    }

    function startOfWeek(date, weekStart) {
        const current = new Date(date);
        const diff = (current.getDay() - weekStart + 7) % 7;
        current.setDate(current.getDate() - diff);
        current.setHours(0, 0, 0, 0);
        return current;
    }

    function endOfWeek(date, weekStart) {
        const start = startOfWeek(date, weekStart);
        return addDays(start, 6);
    }

    /**
     * Calculates the time range (start/end dates) based on the current view type.
     * Supports: 'year', 'month', 'week', and 'recent' (rolling days).
     */
    function generateRange(view, options) {
        const weekStart = options.weekStart % 7;
        let start;
        let end;

        if (view === 'year') {
            const year = Number(options.year);
            start = new Date(year, 0, 1);
            end = new Date(year, 11, 31);
        } else if (view === 'month') {
            const year = Number(options.year);
            const month = Number(options.month);
            start = new Date(year, month, 1);
            end = new Date(year, month + 1, 0);
        } else if (view === 'week') {
            const base = options.startDate ? new Date(options.startDate) : new Date();
            if (Number.isNaN(base.getTime())) {
                throw new Error('CalendarHeatmap: invalid startDate for week view.');
            }
            start = startOfWeek(base, weekStart);
            end = endOfWeek(base, weekStart);
        } else if (view === 'recent') {
            const days = Math.max(Number(options.recentDays) || 7, 1);
            end = new Date();
            end.setHours(0, 0, 0, 0);
            start = addDays(end, -days + 1);
        } else {
            throw new Error(`CalendarHeatmap: unsupported view "${view}".`);
        }

        // Expand range to full weeks for grid alignment.
        const alignedStart = startOfWeek(start, weekStart);
        const alignedEnd = endOfWeek(end, weekStart);

        const dates = [];
        let cursor = new Date(alignedStart);
        while (cursor <= alignedEnd) {
            dates.push(new Date(cursor));
            cursor = addDays(cursor, 1);
        }

        return { start, end, alignedStart, alignedEnd, dates };
    }

    /**
     * Determines the color level (0-4) for a given value relative to the maxValue.
     * Can handle custom color functions or arrays.
     */
    function computeColor(value, maxValue, colors) {
        const scale = Array.isArray(colors) && colors.length ? colors : DEFAULT_COLORS;
        if (typeof colors === 'function') {
            const result = colors(value, maxValue);
            if (typeof result === 'string') {
                return { color: result, level: value > 0 ? 1 : 0 };
            }
            if (result && typeof result === 'object') {
                const levelValue = Number(result.level);
                const safeLevel = Number.isFinite(levelValue) ? Math.max(0, Math.min(levelValue, scale.length - 1)) : value > 0 ? 1 : 0;
                return {
                    color: result.color || scale[safeLevel] || scale[0],
                    level: result.level != null ? safeLevel : value > 0 ? 1 : 0
                };
            }
        }
        if (!value || maxValue <= 0) {
            return { color: scale[0], level: 0 };
        }
        const levels = scale.length - 1;
        if (levels <= 0) {
            return { color: scale[0], level: value > 0 ? 1 : 0 };
        }
        const ratio = Math.min(value / maxValue, 1);
        const level = Math.max(1, Math.round(ratio * levels));
        return { color: scale[level], level };
    }

    function createLabels(options, languageConfig, locale) {
        if (typeof document === 'undefined') return null;
        const labels = document.createElement('div');
        labels.className = 'easy-tracker-heatmap-labels';
        const customWeekdays = Array.isArray(languageConfig.weekdays) && languageConfig.weekdays.length === 7 ? languageConfig.weekdays : null;
        const formatter = customWeekdays ? null : new Intl.DateTimeFormat(locale, { weekday: 'short' });
        for (let i = 0; i < 7; i += 1) {
            const weekdayIndex = (i + options.weekStart) % 7;
            const text = customWeekdays ? customWeekdays[weekdayIndex] : formatter.format(new Date(2021, 7, weekdayIndex + 1));
            const label = document.createElement('span');
            label.textContent = text;
            labels.appendChild(label);
        }
        return labels;
    }

    /**
     * Creates the legend element showing the color scale.
     * Uses CSS class easy-tracker-heatmap-swatch and data-level attributes to allow CSS styling.
     */
    function createLegend(colors, legendTexts) {
        if (typeof document === 'undefined') return null;
        const scale = Array.isArray(colors) && colors.length ? colors : DEFAULT_COLORS;
        const legend = document.createElement('div');
        legend.className = 'easy-tracker-heatmap-legend';
        const captionLow = document.createElement('span');
        captionLow.textContent = legendTexts.less;
        legend.appendChild(captionLow);
        scale.forEach((color, index) => {
            const swatch = document.createElement('span');
            swatch.className = 'easy-tracker-heatmap-swatch';
            swatch.dataset.level = String(index);
            legend.appendChild(swatch);
        });
        const captionHigh = document.createElement('span');
        captionHigh.textContent = legendTexts.more;
        legend.appendChild(captionHigh);
        return legend;
    }

    function attachTooltip(root, formatter) {
        if (typeof document === 'undefined') return;
        let tooltip = document.createElement('div');
        tooltip.className = 'easy-tracker-heatmap-tooltip';
        tooltip.style.display = 'none';
        document.body.appendChild(tooltip);

        const handleMouseMove = (event) => {
            const target = event.target.closest('.easy-tracker-heatmap-day');
            if (!target || !root.contains(target)) {
                tooltip.style.display = 'none';
                return;
            }
            tooltip.innerHTML = formatter(target.dataset);
            tooltip.style.display = 'block';
            tooltip.style.left = `${event.pageX + 10}px`;
            tooltip.style.top = `${event.pageY + 10}px`;
        };

        const handleMouseLeave = () => {
            tooltip.style.display = 'none';
        };

        root.addEventListener('mousemove', handleMouseMove);
        root.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            root.removeEventListener('mousemove', handleMouseMove);
            root.removeEventListener('mouseleave', handleMouseLeave);
            if (tooltip && tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
            }
            tooltip = null;
        };
    }

    class CalendarHeatmap {
        constructor(container, data = [], options = {}) {
            if (typeof document === 'undefined') {
                throw new Error('CalendarHeatmap: browser environment required.');
            }
            this.container = normalizeContainer(container);
            this.options = Object.assign({}, DEFAULT_OPTIONS, options);
            this.data = normalizeData(data);
            this.tooltipDisposer = null;
            this.render();
        }

        setOptions(options = {}) {
            this.options = Object.assign({}, this.options, options);
            this.render();
        }

        setData(data = []) {
            this.data = normalizeData(data);
            this.render();
        }

        replaceData(data = []) {
            this.setData(data);
        }

        render() {
            const { dates, start, end } = generateRange(this.options.view, this.options);
            const languageConfig = resolveLanguageConfig(this.options.language || this.options.locale);
            const locale = this.options.locale || languageConfig.locale || undefined;
            let dateFormatter;
            try {
                dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });
            } catch (error) {
                dateFormatter = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' });
            }
            const values = Array.from(this.data.values());
            const maxValue = this.options.maxValue != null
                ? this.options.maxValue
                : values.reduce((acc, datum) => Math.max(acc, Number(datum?.value) || 0), 0);

            const root = document.createElement('div');
            root.className = 'easy-tracker-heatmap-root';

            // Inject custom colors as CSS variables to override defaults in styles.css
            if (Array.isArray(this.options.colorScale)) {
                this.options.colorScale.forEach((color, index) => {
                    root.style.setProperty(`--easy-tracker-heatmap-color-level-${index}`, color);
                });
            }
            root.style.setProperty('--easy-tracker-heatmap-size', `${this.options.squareSize}px`);
            root.style.setProperty('--easy-tracker-heatmap-gap', `${this.options.squareGap}px`);

            const gridWrapper = document.createElement('div');
            gridWrapper.style.display = 'flex';

            const labels = createLabels(this.options, languageConfig, locale);
            if (labels) {
                gridWrapper.appendChild(labels);
            }

            const grid = document.createElement('div');
            grid.className = 'easy-tracker-heatmap-grid';

            // Track week columns for grouping.
            let currentWeek = [];
            let currentWeekNumber = null;
            const isYearView = this.options.view === 'year';

            const today = new Date();
            const weekStart = this.options.weekStart % 7;

            // Iterate over every day in the range to build the grid cells
            for (let index = 0; index < dates.length; index += 1) {
                const dayDate = dates[index];
                const key = dateKey(dayDate);
                if (isYearView && key > dateKey(today)) {
                    break;
                }

                const weekNumber = Math.floor(index / 7);
                if (currentWeekNumber !== weekNumber) {
                    if (currentWeek.length) {
                        grid.appendChild(buildWeekColumn(currentWeek));
                        currentWeek = [];
                    }
                    currentWeekNumber = weekNumber;
                }

                const datum = this.data.get(key) || { value: 0, count: 0 };
                const value = Number(datum.value) || 0;
                const count = Number(datum.count) || 0;
                const { color, level } = computeColor(value, maxValue, this.options.colorScale);
                const weekdayIndex = (dayDate.getDay() - weekStart + 7) % 7;

                const dayNode = document.createElement('div');
                dayNode.className = 'easy-tracker-heatmap-day';
                dayNode.dataset.level = String(level);
                dayNode.dataset.value = String(value);
                dayNode.dataset.count = String(count);
                dayNode.dataset.date = key;
                dayNode.dataset.rangeStart = dateKey(start);
                dayNode.dataset.rangeEnd = dateKey(end);
                dayNode.title = '';
                dayNode.style.gridRowStart = String(weekdayIndex + 1);

                currentWeek.push(dayNode);
            };

            if (currentWeek.length) {
                grid.appendChild(buildWeekColumn(currentWeek));
            }

            gridWrapper.appendChild(grid);
            root.appendChild(gridWrapper);
            if (this.options.view === 'year') {
				scheduleTrimToFit(this.container, grid);
			}

            if (this.options.legend) {
                const legendTexts = Object.assign({}, LANGUAGE_CONFIG.en.legend, languageConfig.legend);
                const legend = createLegend(this.options.colorScale, legendTexts);
                if (legend) {
                    root.appendChild(legend);
                }
            }

            this.container.innerHTML = '';
            this.container.appendChild(root);

            if (this.tooltipDisposer) {
                this.tooltipDisposer();
                this.tooltipDisposer = null;
            }
            if (this.options.tooltip) {
                const tooltipFormatter = (dataset) => {
                    const value = Number(dataset.value) || 0;
                    const count = Number(dataset.count) || 0;
                    const parsed = new Date(dataset.date);
                    const dateLabel = Number.isNaN(parsed.getTime()) ? dataset.date : dateFormatter.format(parsed);
                    return languageConfig.tooltip
                        ? languageConfig.tooltip(value, dateLabel, count)
                        : LANGUAGE_CONFIG.en.tooltip(value, dateLabel, count);
                };
                this.tooltipDisposer = attachTooltip(root, tooltipFormatter);
            }
        }

        destroy() {
            if (this.tooltipDisposer) {
                this.tooltipDisposer();
                this.tooltipDisposer = null;
            }
            this.container.innerHTML = '';
        }
    }

    function buildWeekColumn(days) {
        const column = document.createElement('div');
        column.className = 'easy-tracker-heatmap-week';
        days.forEach((day) => {
            column.appendChild(day);
        });
        return column;
    }

    function scheduleTrimToFit(container, grid) {
        if (typeof window === 'undefined') return;
        const executeTrim = () => {
            const availableWidth = container.clientWidth || container.getBoundingClientRect().width || 0;
            if (!availableWidth) return;
            while (grid.scrollWidth > availableWidth - 40 && grid.children.length > 1) {
                const firstColumn = grid.firstElementChild;
                if (!firstColumn) break;
                grid.removeChild(firstColumn);
            }
        };
        if (typeof window.requestAnimationFrame === 'function') {
            window.requestAnimationFrame(executeTrim);
        } else {
            executeTrim();
        }
    }

    CalendarHeatmap.defaults = Object.assign({}, DEFAULT_OPTIONS);
    CalendarHeatmap.languages = LANGUAGE_CONFIG;

    return CalendarHeatmap;
});
