/**
 * Value column mapping (SPEC §V25). The React model stores a metric value as a
 * single union (`number | string | boolean | null`); Postgres splits it across
 * three typed columns with a check constraint that exactly one is non-null.
 * This module is the sole translator between the two shapes.
 */
import { err, ok, type Result } from '../result';
import type { MetricEntryRow } from '../db/schema';

export type MetricValue = number | string | boolean | null;

export type MetricValueColumns = {
  valueDecimal: string | null;
  valueText: string | null;
  valueBoolean: boolean | null;
};

/**
 * Split a union value into the three DB columns. Rejects `null`/`NaN` because
 * the row would violate the exactly-one-value constraint (V25) — failing here
 * yields a clear invalid_payload instead of an opaque check-constraint error.
 */
export function metricValueToColumns(
  value: MetricValue,
  metricType: string,
): Result<MetricValueColumns> {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return err('invalid_payload', `${metricType}: numeric value must be finite, got ${value}`);
    }
    return ok({ valueDecimal: String(value), valueText: null, valueBoolean: null });
  }

  if (typeof value === 'string') {
    return ok({ valueDecimal: null, valueText: value, valueBoolean: null });
  }

  if (typeof value === 'boolean') {
    return ok({ valueDecimal: null, valueText: null, valueBoolean: value });
  }

  return err(
    'invalid_payload',
    `${metricType}: metric value is required (one of number, string, boolean), got null`,
  );
}

/** Reconstruct the union value from a persisted row. */
export function columnsToMetricValue(row: Pick<
  MetricEntryRow,
  'valueDecimal' | 'valueText' | 'valueBoolean'
>): MetricValue {
  if (row.valueDecimal !== null) {
    return Number(row.valueDecimal);
  }
  if (row.valueText !== null) {
    return row.valueText;
  }
  if (row.valueBoolean !== null) {
    return row.valueBoolean;
  }
  // Unreachable while the check constraint holds; surface as null defensively.
  return null;
}

/** Reconstruct the optional confidence value (stored as numeric string). */
export function rowConfidenceToNumber(confidence: string | null): number | undefined {
  return confidence === null ? undefined : Number(confidence);
}
