import { z } from 'zod';

import type { DailyHealthEntry, HealthMetricEntry } from '../../types/health';

const dateKeyPattern = /^\d{4}-\d{2}-\d{2}$/;
const isoLikeTimestampPattern =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?$/;

const numericMetricRanges = {
  weight: { min: 0, max: 1000 },
  bodyFatPercentage: { min: 0, max: 100 },
  visceralFatLevel: { min: 0, max: 60 },
  muscleMass: { min: 0, max: 500 },
  bodyWaterPercentage: { min: 0, max: 100 },
  boneMass: { min: 0, max: 20 },
  bloodPressureSystolic: { greaterThan: 0, max: 400 },
  bloodPressureDiastolic: { greaterThan: 0, max: 300 },
  restingHeartRate: { greaterThan: 0, max: 300 },
  sleepDuration: { min: 0, max: 24 },
  sleepQuality: { min: 1, max: 10 },
  dailySteps: { min: 0, max: 200000, integer: true },
} as const;

type NumericMetricType = keyof typeof numericMetricRanges;

const isNumericMetricType = (metricType: string): metricType is NumericMetricType =>
  Object.prototype.hasOwnProperty.call(numericMetricRanges, metricType);

const isValidDateKey = (value: string) => {
  if (!dateKeyPattern.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const isValidIsoLikeTimestamp = (value: string) => {
  if (!isoLikeTimestampPattern.test(value) || !isValidDateKey(value.slice(0, 10))) {
    return false;
  }

  return Number.isFinite(Date.parse(value));
};

const trimmedNonEmptyStringSchema = z.string().trim().min(1);

const optionalNotesSchema = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : undefined))
  .optional();

const nullableTrimmedStringSchema = z.union([
  z.string().trim().transform((value) => (value.length > 0 ? value : null)),
  z.null(),
]);

const dateKeySchema = z.string().trim().refine(isValidDateKey, {
  message: 'Expected a valid YYYY-MM-DD date key',
});

const isoLikeTimestampSchema = z.string().trim().refine(isValidIsoLikeTimestamp, {
  message: 'Expected a valid ISO-like timestamp',
});

const metricValueSchema = z.union([z.number().finite(), z.string().trim(), z.boolean(), z.null()]);

const validateNumericMetricValue = (
  metricType: NumericMetricType,
  value: HealthMetricEntry['value'],
  context: z.RefinementCtx,
) => {
  const range = numericMetricRanges[metricType];

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    context.addIssue({
      code: 'custom',
      path: ['value'],
      message: `${metricType} requires a numeric value`,
    });
    return;
  }

  if ('integer' in range && range.integer && !Number.isInteger(value)) {
    context.addIssue({
      code: 'custom',
      path: ['value'],
      message: `${metricType} requires an integer value`,
    });
  }

  if ('greaterThan' in range && value <= range.greaterThan) {
    context.addIssue({
      code: 'custom',
      path: ['value'],
      message: `${metricType} must be greater than ${range.greaterThan}`,
    });
  }

  if ('min' in range && value < range.min) {
    context.addIssue({
      code: 'custom',
      path: ['value'],
      message: `${metricType} must be at least ${range.min}`,
    });
  }

  if (value > range.max) {
    context.addIssue({
      code: 'custom',
      path: ['value'],
      message: `${metricType} must be at most ${range.max}`,
    });
  }
};

export const healthMetricEntrySchema = z
  .object({
    id: trimmedNonEmptyStringSchema,
    metricType: trimmedNonEmptyStringSchema,
    value: metricValueSchema,
    unit: nullableTrimmedStringSchema,
    recordedAt: isoLikeTimestampSchema,
    source: trimmedNonEmptyStringSchema,
    notes: optionalNotesSchema,
    confidence: z.number().finite().min(0).max(1).optional(),
    isPreferredSource: z.boolean().optional(),
    createdAt: isoLikeTimestampSchema,
    updatedAt: isoLikeTimestampSchema,
  })
  .strict()
  .superRefine((entry, context) => {
    if (isNumericMetricType(entry.metricType)) {
      validateNumericMetricValue(entry.metricType, entry.value, context);
    }
  }) satisfies z.ZodType<HealthMetricEntry>;

const metricsRecordSchema = z
  .record(trimmedNonEmptyStringSchema, z.array(healthMetricEntrySchema))
  .superRefine((metrics, context) => {
    Object.entries(metrics).forEach(([metricKey, entries]) => {
      entries.forEach((entry, entryIndex) => {
        if (entry.metricType !== metricKey) {
          context.addIssue({
            code: 'custom',
            path: [metricKey, entryIndex, 'metricType'],
            message: 'Metric entry type must match metrics record key',
          });
        }
      });
    });
  });

export const dailyHealthEntrySchema = z
  .object({
    id: trimmedNonEmptyStringSchema,
    date: dateKeySchema,
    metrics: metricsRecordSchema,
    notes: optionalNotesSchema,
    createdAt: isoLikeTimestampSchema,
    updatedAt: isoLikeTimestampSchema,
  })
  .strict() satisfies z.ZodType<DailyHealthEntry>;
