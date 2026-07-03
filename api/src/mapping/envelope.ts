/**
 * Translation between the React app's nested envelope (SPEC §I.envelope) and
 * the normalized Postgres rows. The nested `DailyHealthEntry.metrics` record is
 * flattened into metric_entries rows on write, and rebuilt on read.
 *
 * v1 string ids are not preserved: Postgres owns identity (bigserial), and on
 * export the numeric id is stringified. `recordedAt` (the real measurement
 * time) is preserved; row created_at/updated_at are DB-owned.
 */
import type {
  DailyHealthEntry,
  HealthMetricEntry,
  HealthMetricType,
} from '../../../src/types/health';
import { err, ok, type Result } from '../result';
import {
  columnsToMetricValue,
  metricValueToColumns,
  rowConfidenceToNumber,
} from '../domain/metricValue';
import type { DailyEntryRow, MetricEntryRow } from '../db/schema';

// Shape for inserting a metric row once its parent daily_entry id is known.
export type MetricEntryInsert = {
  dailyEntryId: number;
  metricType: string;
  source: string;
  valueDecimal: string | null;
  valueText: string | null;
  valueBoolean: boolean | null;
  unit: string | null;
  recordedAt: Date;
  notes: string | null;
  confidence: string | null;
  preferredSource: boolean;
};

function metricEntryToInsert(
  metricEntry: HealthMetricEntry,
  dailyEntryId: number,
): Result<MetricEntryInsert> {
  const columns = metricValueToColumns(metricEntry.value, metricEntry.metricType);

  if (!columns.ok) {
    return columns;
  }

  const recordedAt = new Date(metricEntry.recordedAt);

  if (Number.isNaN(recordedAt.getTime())) {
    return err('invalid_payload', `Invalid recordedAt timestamp: ${metricEntry.recordedAt}`);
  }

  return ok({
    dailyEntryId,
    metricType: metricEntry.metricType,
    source: metricEntry.source,
    valueDecimal: columns.data.valueDecimal,
    valueText: columns.data.valueText,
    valueBoolean: columns.data.valueBoolean,
    unit: metricEntry.unit,
    recordedAt,
    notes: metricEntry.notes ?? null,
    confidence:
      metricEntry.confidence === undefined ? null : String(metricEntry.confidence),
    preferredSource: metricEntry.isPreferredSource ?? false,
  });
}

/**
 * Flatten a nested daily entry into all its metric-row inserts for a known
 * daily_entry id. Fails atomically on the first invalid metric (V10).
 */
export function entryMetricsToInserts(
  entry: DailyHealthEntry,
  dailyEntryId: number,
): Result<MetricEntryInsert[]> {
  const inserts: MetricEntryInsert[] = [];

  for (const metricEntries of Object.values(entry.metrics)) {
    for (const metricEntry of metricEntries ?? []) {
      const insert = metricEntryToInsert(metricEntry, dailyEntryId);

      if (!insert.ok) {
        return insert;
      }

      inserts.push(insert.data);
    }
  }

  return ok(inserts);
}

function rowToMetricEntry(row: MetricEntryRow): HealthMetricEntry {
  return {
    id: String(row.id),
    metricType: row.metricType,
    value: columnsToMetricValue(row),
    unit: row.unit,
    recordedAt: row.recordedAt.toISOString(),
    source: row.source,
    notes: row.notes ?? undefined,
    confidence: rowConfidenceToNumber(row.confidence),
    isPreferredSource: row.preferredSource,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Rebuild the nested export shape from a daily row and its metric rows. */
export function rowsToEntry(
  daily: DailyEntryRow,
  metricRows: MetricEntryRow[],
): DailyHealthEntry {
  const metrics: Partial<Record<HealthMetricType, HealthMetricEntry[]>> = {};

  for (const row of metricRows) {
    const metricType = row.metricType as HealthMetricType;
    (metrics[metricType] ??= []).push(rowToMetricEntry(row));
  }

  return {
    id: String(daily.id),
    date: daily.entryDate,
    metrics,
    notes: daily.notes ?? undefined,
    createdAt: daily.createdAt.toISOString(),
    updatedAt: daily.updatedAt.toISOString(),
  };
}
