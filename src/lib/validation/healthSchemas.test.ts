import { describe, expect, it } from 'vitest';

import { dailyHealthEntrySchema, healthMetricEntrySchema } from './healthSchemas';
import type { HealthMetricEntry } from '../../types/health';

const baseMetricEntry = (overrides: Partial<HealthMetricEntry> = {}): HealthMetricEntry => ({
  id: 'metric-1',
  metricType: 'weight',
  value: 82.4,
  unit: 'kg',
  recordedAt: '2024-02-29T07:30:00.000Z',
  source: 'manual',
  createdAt: '2024-02-29T07:31:00.000Z',
  updatedAt: '2024-02-29T07:31:00.000Z',
  ...overrides,
});

describe('health schemas', () => {
  it('accepts a valid partial daily entry and trims notes', () => {
    const result = dailyHealthEntrySchema.safeParse({
      id: 'daily-2024-02-29',
      date: '2024-02-29',
      metrics: {
        sleepDuration: [
          baseMetricEntry({
            id: 'sleep-1',
            metricType: 'sleepDuration',
            value: 7.5,
            unit: 'hours',
          }),
        ],
      },
      notes: '  Felt rested  ',
      createdAt: '2024-02-29T08:00:00.000Z',
      updatedAt: '2024-02-29T08:00:00.000Z',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notes).toBe('Felt rested');
    }
  });

  it('rejects metric entries stored under a different metric key', () => {
    const result = dailyHealthEntrySchema.safeParse({
      id: 'daily-2024-02-29',
      date: '2024-02-29',
      metrics: {
        sleepDuration: [
          baseMetricEntry({
            id: 'metric-mismatch',
            metricType: 'weight',
            value: 82.4,
            unit: 'kg',
          }),
        ],
      },
      createdAt: '2024-02-29T08:00:00.000Z',
      updatedAt: '2024-02-29T08:00:00.000Z',
    });

    expect(result.success).toBe(false);
  });

  it('accepts custom metric entries when the metric key matches the entry type', () => {
    const result = dailyHealthEntrySchema.safeParse({
      id: 'daily-2024-02-29',
      date: '2024-02-29',
      metrics: {
        hydrationScore: [
          baseMetricEntry({
            id: 'hydration-1',
            metricType: 'hydrationScore',
            value: 81,
            unit: 'score',
          }),
        ],
      },
      createdAt: '2024-02-29T08:00:00.000Z',
      updatedAt: '2024-02-29T08:00:00.000Z',
    });

    expect(result.success).toBe(true);
  });

  it('rejects negative numeric metric values for known numeric metrics', () => {
    const result = healthMetricEntrySchema.safeParse(
      baseMetricEntry({
        metricType: 'dailySteps',
        value: -1,
        unit: 'steps',
      }),
    );

    expect(result.success).toBe(false);
  });

  it('rejects sleep duration outside a 0 to 24 hour range', () => {
    expect(
      healthMetricEntrySchema.safeParse(
        baseMetricEntry({
          metricType: 'sleepDuration',
          value: -0.25,
          unit: 'hours',
        }),
      ).success,
    ).toBe(false);

    expect(
      healthMetricEntrySchema.safeParse(
        baseMetricEntry({
          metricType: 'sleepDuration',
          value: 24.25,
          unit: 'hours',
        }),
      ).success,
    ).toBe(false);
  });

  it('rejects non-positive blood pressure values', () => {
    expect(
      healthMetricEntrySchema.safeParse(
        baseMetricEntry({
          metricType: 'bloodPressureSystolic',
          value: 0,
          unit: 'mmHg',
        }),
      ).success,
    ).toBe(false);

    expect(
      healthMetricEntrySchema.safeParse(
        baseMetricEntry({
          metricType: 'bloodPressureDiastolic',
          value: -80,
          unit: 'mmHg',
        }),
      ).success,
    ).toBe(false);
  });

  it('accepts custom metric types and sources allowed by the shared types', () => {
    const result = healthMetricEntrySchema.safeParse(
      baseMetricEntry({
        metricType: 'hydrationScore',
        value: 81,
        unit: 'score',
        source: 'customDevice',
      }),
    );

    expect(result.success).toBe(true);
  });

  it('accepts optional notes and trims present notes', () => {
    const withoutNotes = healthMetricEntrySchema.safeParse(baseMetricEntry());
    const withNotes = healthMetricEntrySchema.safeParse(
      baseMetricEntry({
        notes: '  Measured after breakfast  ',
      }),
    );

    expect(withoutNotes.success).toBe(true);
    expect(withNotes.success).toBe(true);
    if (withNotes.success) {
      expect(withNotes.data.notes).toBe('Measured after breakfast');
    }
  });

  it('rejects invalid date keys and timestamp strings', () => {
    expect(
      dailyHealthEntrySchema.safeParse({
        id: 'daily-invalid',
        date: '2024-02-30',
        metrics: {},
        createdAt: '2024-02-29T08:00:00.000Z',
        updatedAt: '2024-02-29T08:00:00.000Z',
      }).success,
    ).toBe(false);

    expect(
      healthMetricEntrySchema.safeParse(
        baseMetricEntry({
          recordedAt: 'not-a-date',
        }),
      ).success,
    ).toBe(false);
  });
});
