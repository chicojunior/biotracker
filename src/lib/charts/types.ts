import type { HealthMetricType } from '../../types/health';

export type { DateRange } from '../dates/dateRanges';

export type TrendSeriesMetricMeta = {
  metricType: HealthMetricType;
  /** Number of non-null data points */
  count: number;
  /** First non-null value in window (chronological) */
  firstValue: number | null;
  /** Last non-null value in window (chronological) */
  lastValue: number | null;
  /** lastValue - firstValue (null if either side is null) */
  delta: number | null;
};

export type TrendSeriesPoint = {
  date: string; // YYYY-MM-DD
  /** keyed by metricType — null when no entry that day */
  [metricKey: string]: string | number | null;
};

export type TrendSeriesWarning = {
  metricType: HealthMetricType;
  date: string;
  message: string;
};

export type TrendSeriesResult = {
  data: TrendSeriesPoint[];
  metrics: TrendSeriesMetricMeta[];
  warnings: TrendSeriesWarning[];
};
