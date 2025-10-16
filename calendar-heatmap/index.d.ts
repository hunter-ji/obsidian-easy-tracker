export interface CalendarHeatmapDatum {
  date?: Date | string;
  day?: Date | string;
  dateString?: string;
  value?: number;
  count?: number;
}

export type CalendarHeatmapColorScale =
  | string[]
  | ((value: number, maxValue: number | null) => string | { color?: string; level?: number });

export interface CalendarHeatmapOptions {
  view?: 'year' | 'month' | 'week' | 'recent';
  year?: number;
  month?: number;
  weekStart?: number;
  recentDays?: number;
  startDate?: Date | string;
  squareSize?: number;
  squareGap?: number;
  colorScale?: CalendarHeatmapColorScale;
  maxValue?: number | null;
  legend?: boolean;
  tooltip?: boolean;
  locale?: string | string[];
  language?: string;
}

export interface CalendarHeatmapLanguageConfig {
  locale?: string;
  legend?: { less: string; more: string };
  weekdays?: string[];
  tooltip?: (value: number, dateLabel: string) => string;
}

export default class CalendarHeatmap {
  constructor(
    container: string | HTMLElement,
    data?: CalendarHeatmapDatum[],
    options?: CalendarHeatmapOptions
  );

  setOptions(options?: CalendarHeatmapOptions): void;
  setData(data?: CalendarHeatmapDatum[]): void;
  replaceData(data?: CalendarHeatmapDatum[]): void;
  updateData(data?: CalendarHeatmapDatum[]): void;
  setValue(date: Date | string, value: number): void;
  render(): void;
  destroy(): void;

  static defaults: CalendarHeatmapOptions;
  static languages: Record<string, CalendarHeatmapLanguageConfig>;
}

declare global {
  interface Window {
    CalendarHeatmap: typeof CalendarHeatmap;
  }
}
