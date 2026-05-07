import type { DailyHealthEntry, HealthMetricType } from '../../types/health';
import { enumerateDateKeysInRange } from '../dates/dateRanges';
import { selectPreferredMetricEntry } from '../health/selectPreferredMetricEntry';
import type { DateRange, TrendSeriesMetricMeta, TrendSeriesPoint, TrendSeriesResult, TrendSeriesWarning } from './types';
import { convertToMetric } from './unitConversion';

export type BuildTrendSeriesInput = {
  entries: DailyHealthEntry[];
  metricTypes: HealthMetricType[];
  range: DateRange;
  /** Target unit per metric — values converted to this unit. */
  targetUnits: Partial<Record<HealthMetricType, string>>;
  /** Optional preferred source per metric (passed to selectPreferredMetricEntry). */
  preferredSources?: Partial<Record<HealthMetricType, string>>;
};

export function buildTrendSeries(input: BuildTrendSeriesInput): TrendSeriesResult {
  const { entries, metricTypes, range, targetUnits, preferredSources } = input;

  // Build a date-keyed lookup map for O(1) access
  const entriesByDate = new Map<string, DailyHealthEntry>();
  for (const entry of entries) {
    entriesByDate.set(entry.date, entry);
  }

  const dateKeys = enumerateDateKeysInRange(range);

  const warnings: TrendSeriesWarning[] = [];
  const data: TrendSeriesPoint[] = [];

  for (const date of dateKeys) {
    const dailyEntry = entriesByDate.get(date);
    const row: TrendSeriesPoint = { date };

    for (const metricType of metricTypes) {
      const metricEntries = dailyEntry?.metrics[metricType];
      const preferredSource = preferredSources?.[metricType];
      const selected = selectPreferredMetricEntry(metricEntries, preferredSource);

      if (selected === undefined || !Number.isFinite(selected.value)) {
        row[metricType] = null;
        continue;
      }

      const rawValue = selected.value as number;
      const targetUnit = targetUnits[metricType];

      if (targetUnit === undefined) {
        // No target unit specified — use raw value
        row[metricType] = rawValue;
        continue;
      }

      const conversion = convertToMetric(rawValue, selected.unit, targetUnit);

      if (!conversion.converted && conversion.warning) {
        warnings.push({
          metricType,
          date,
          message: conversion.warning,
        });
      }

      row[metricType] = conversion.value;
    }

    data.push(row);
  }

  // Compute per-metric meta by walking data ascending
  const metrics: TrendSeriesMetricMeta[] = metricTypes.map((metricType) => {
    let count = 0;
    let firstValue: number | null = null;
    let lastValue: number | null = null;

    for (const row of data) {
      const val = row[metricType];
      if (val !== null && typeof val === 'number') {
        count++;
        if (firstValue === null) {
          firstValue = val;
        }
        lastValue = val;
      }
    }

    const delta =
      firstValue !== null && lastValue !== null ? lastValue - firstValue : null;

    return {
      metricType,
      count,
      firstValue,
      lastValue,
      delta,
    };
  });

  return { data, metrics, warnings };
}
