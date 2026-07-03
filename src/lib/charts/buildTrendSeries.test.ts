import { describe, expect, it } from 'vitest';

import type { DailyHealthEntry, HealthMetricEntry } from '../../types/health';
import { buildTrendSeries } from './buildTrendSeries';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEntry(
  overrides: Partial<HealthMetricEntry> & {
    metricType: HealthMetricEntry['metricType'];
    value: HealthMetricEntry['value'];
  },
): HealthMetricEntry {
  return {
    id: 'e1',
    unit: null,
    recordedAt: '2024-01-01T12:00:00Z',
    source: 'manual',
    createdAt: '2024-01-01T12:00:00Z',
    updatedAt: '2024-01-01T12:00:00Z',
    ...overrides,
  };
}

function makeDailyEntry(
  date: string,
  metrics: DailyHealthEntry['metrics'] = {},
): DailyHealthEntry {
  return {
    id: `day-${date}`,
    date,
    metrics,
    createdAt: `${date}T00:00:00Z`,
    updatedAt: `${date}T00:00:00Z`,
  };
}

// ---------------------------------------------------------------------------
// Test 1: Empty entries → rows of nulls
// ---------------------------------------------------------------------------

describe('buildTrendSeries', () => {
  it('1. empty entries → 30 rows of nulls, count=0, firstValue/lastValue/delta all null', () => {
    const result = buildTrendSeries({
      entries: [],
      metricTypes: ['weight'],
      range: { start: '2024-01-01', end: '2024-01-30' },
      targetUnits: { weight: 'kg' },
    });

    expect(result.data).toHaveLength(30);
    expect(result.data[0]).toEqual({ date: '2024-01-01', weight: null });
    expect(result.data[29]).toEqual({ date: '2024-01-30', weight: null });
    result.data.forEach((row) => {
      expect(row.weight).toBeNull();
    });

    expect(result.metrics).toHaveLength(1);
    const meta = result.metrics[0];
    expect(meta.metricType).toBe('weight');
    expect(meta.count).toBe(0);
    expect(meta.firstValue).toBeNull();
    expect(meta.lastValue).toBeNull();
    expect(meta.delta).toBeNull();

    expect(result.warnings).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // Test 2: Single point in window
  // -------------------------------------------------------------------------

  it('2. single point → count=1, firstValue===lastValue===point, delta===0', () => {
    const entry = makeDailyEntry('2024-01-15', {
      weight: [makeEntry({ metricType: 'weight', value: 70, unit: 'kg' })],
    });

    const result = buildTrendSeries({
      entries: [entry],
      metricTypes: ['weight'],
      range: { start: '2024-01-01', end: '2024-01-30' },
      targetUnits: { weight: 'kg' },
    });

    expect(result.data).toHaveLength(30);
    const row = result.data.find((r) => r.date === '2024-01-15');
    expect(row).toBeDefined();
    expect(row!.weight).toBe(70);

    // All other days are null
    result.data
      .filter((r) => r.date !== '2024-01-15')
      .forEach((r) => expect(r.weight).toBeNull());

    const meta = result.metrics[0];
    expect(meta.count).toBe(1);
    expect(meta.firstValue).toBe(70);
    expect(meta.lastValue).toBe(70);
    expect(meta.delta).toBe(0);
  });

  // -------------------------------------------------------------------------
  // Test 3: Multiple points → ascending order, delta = last - first
  // -------------------------------------------------------------------------

  it('3. multiple points → ascending date order, delta = lastValue - firstValue', () => {
    const entries = [
      makeDailyEntry('2024-01-05', {
        weight: [makeEntry({ metricType: 'weight', value: 68, unit: 'kg' })],
      }),
      makeDailyEntry('2024-01-10', {
        weight: [makeEntry({ metricType: 'weight', value: 70, unit: 'kg' })],
      }),
      makeDailyEntry('2024-01-20', {
        weight: [makeEntry({ metricType: 'weight', value: 65, unit: 'kg' })],
      }),
    ];

    const result = buildTrendSeries({
      entries,
      metricTypes: ['weight'],
      range: { start: '2024-01-01', end: '2024-01-31' },
      targetUnits: { weight: 'kg' },
    });

    expect(result.data[0].date).toBe('2024-01-01');
    expect(result.data[result.data.length - 1].date).toBe('2024-01-31');

    const meta = result.metrics[0];
    expect(meta.count).toBe(3);
    expect(meta.firstValue).toBe(68);
    expect(meta.lastValue).toBe(65);
    expect(meta.delta).toBe(65 - 68); // -3
  });

  // -------------------------------------------------------------------------
  // Test 4: Two metrics → both keys present per row
  // -------------------------------------------------------------------------

  it('4. two metrics (systolic + diastolic) → both keys present per row', () => {
    const entry = makeDailyEntry('2024-01-10', {
      bloodPressureSystolic: [
        makeEntry({ metricType: 'bloodPressureSystolic', value: 120, unit: 'mmHg' }),
      ],
      bloodPressureDiastolic: [
        makeEntry({ metricType: 'bloodPressureDiastolic', value: 80, unit: 'mmHg' }),
      ],
    });

    const result = buildTrendSeries({
      entries: [entry],
      metricTypes: ['bloodPressureSystolic', 'bloodPressureDiastolic'],
      range: { start: '2024-01-01', end: '2024-01-15' },
      targetUnits: {
        bloodPressureSystolic: 'mmHg',
        bloodPressureDiastolic: 'mmHg',
      },
    });

    expect(result.data).toHaveLength(15);

    result.data.forEach((row) => {
      expect(Object.prototype.hasOwnProperty.call(row, 'bloodPressureSystolic')).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(row, 'bloodPressureDiastolic')).toBe(true);
    });

    const row = result.data.find((r) => r.date === '2024-01-10');
    expect(row!.bloodPressureSystolic).toBe(120);
    expect(row!.bloodPressureDiastolic).toBe(80);

    expect(result.metrics).toHaveLength(2);
  });

  // -------------------------------------------------------------------------
  // Test 5: Source preference selection
  // -------------------------------------------------------------------------

  it('5. preferredSources picks smartScale entry over manual entry same day', () => {
    const entry = makeDailyEntry('2024-01-10', {
      weight: [
        makeEntry({ id: 'manual-1', metricType: 'weight', value: 72, unit: 'kg', source: 'manual' }),
        makeEntry({
          id: 'scale-1',
          metricType: 'weight',
          value: 71.5,
          unit: 'kg',
          source: 'smartScale',
        }),
      ],
    });

    const result = buildTrendSeries({
      entries: [entry],
      metricTypes: ['weight'],
      range: { start: '2024-01-10', end: '2024-01-10' },
      targetUnits: { weight: 'kg' },
      preferredSources: { weight: 'smartScale' },
    });

    expect(result.data[0].weight).toBe(71.5);
  });

  // -------------------------------------------------------------------------
  // Test 6: Multiple readings same day → most recent by recordedAt wins
  // -------------------------------------------------------------------------

  it('6. multiple readings same day → most recent by recordedAt wins (no preferredSources)', () => {
    const entry = makeDailyEntry('2024-01-10', {
      weight: [
        makeEntry({
          id: 'older',
          metricType: 'weight',
          value: 72,
          unit: 'kg',
          recordedAt: '2024-01-10T08:00:00Z',
        }),
        makeEntry({
          id: 'newer',
          metricType: 'weight',
          value: 71,
          unit: 'kg',
          recordedAt: '2024-01-10T18:00:00Z',
        }),
      ],
    });

    const result = buildTrendSeries({
      entries: [entry],
      metricTypes: ['weight'],
      range: { start: '2024-01-10', end: '2024-01-10' },
      targetUnits: { weight: 'kg' },
    });

    expect(result.data[0].weight).toBe(71);
  });

  // -------------------------------------------------------------------------
  // Test 7: Date range honored — entries outside range excluded
  // -------------------------------------------------------------------------

  it('7. entries outside range are excluded from output', () => {
    const entries = [
      makeDailyEntry('2024-01-01', {
        weight: [makeEntry({ metricType: 'weight', value: 80, unit: 'kg' })],
      }),
      makeDailyEntry('2024-01-10', {
        weight: [makeEntry({ metricType: 'weight', value: 70, unit: 'kg' })],
      }),
      makeDailyEntry('2024-01-20', {
        weight: [makeEntry({ metricType: 'weight', value: 60, unit: 'kg' })],
      }),
    ];

    const result = buildTrendSeries({
      entries,
      metricTypes: ['weight'],
      range: { start: '2024-01-05', end: '2024-01-15' },
      targetUnits: { weight: 'kg' },
    });

    expect(result.data).toHaveLength(11);
    // Only the Jan 10 entry falls in range
    const jan10 = result.data.find((r) => r.date === '2024-01-10');
    expect(jan10!.weight).toBe(70);

    // Jan 01 and Jan 20 do not appear at all
    expect(result.data.find((r) => r.date === '2024-01-01')).toBeUndefined();
    expect(result.data.find((r) => r.date === '2024-01-20')).toBeUndefined();

    // meta reflects only the in-range data point
    expect(result.metrics[0].count).toBe(1);
  });

  // -------------------------------------------------------------------------
  // Test 8: Gaps preserved as null (not zero or interpolated)
  // -------------------------------------------------------------------------

  it('8. gaps preserved as null — never zero or interpolated', () => {
    const entries = [
      makeDailyEntry('2024-01-01', {
        weight: [makeEntry({ metricType: 'weight', value: 70, unit: 'kg' })],
      }),
      makeDailyEntry('2024-01-05', {
        weight: [makeEntry({ metricType: 'weight', value: 72, unit: 'kg' })],
      }),
    ];

    const result = buildTrendSeries({
      entries,
      metricTypes: ['weight'],
      range: { start: '2024-01-01', end: '2024-01-05' },
      targetUnits: { weight: 'kg' },
    });

    // Jan 02, 03, 04 should be null — not 0 or interpolated
    const gapDates = ['2024-01-02', '2024-01-03', '2024-01-04'];
    gapDates.forEach((date) => {
      const row = result.data.find((r) => r.date === date);
      expect(row).toBeDefined();
      expect(row!.weight).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Test 9: lb → kg conversion
  // -------------------------------------------------------------------------

  it('9. lb→kg conversion: 150 lb ≈ 68.04 kg', () => {
    const entry = makeDailyEntry('2024-01-10', {
      weight: [makeEntry({ metricType: 'weight', value: 150, unit: 'lb' })],
    });

    const result = buildTrendSeries({
      entries: [entry],
      metricTypes: ['weight'],
      range: { start: '2024-01-10', end: '2024-01-10' },
      targetUnits: { weight: 'kg' },
    });

    expect(result.data[0].weight as number).toBeCloseTo(68.04, 2);
    expect(result.warnings).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // Test 10: min → h conversion for sleepDuration
  // -------------------------------------------------------------------------

  it('10. min→h conversion: 480 min = 8 h for sleepDuration', () => {
    const entry = makeDailyEntry('2024-01-10', {
      sleepDuration: [makeEntry({ metricType: 'sleepDuration', value: 480, unit: 'min' })],
    });

    const result = buildTrendSeries({
      entries: [entry],
      metricTypes: ['sleepDuration'],
      range: { start: '2024-01-10', end: '2024-01-10' },
      targetUnits: { sleepDuration: 'h' },
    });

    expect(result.data[0].sleepDuration).toBe(8);
    expect(result.warnings).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // Test 11: Unknown unit → value passes through, warning appears
  // -------------------------------------------------------------------------

  it('11. unknown unit (stones) → value passes through, warning in result.warnings', () => {
    const entry = makeDailyEntry('2024-01-10', {
      weight: [makeEntry({ metricType: 'weight', value: 11, unit: 'stones' })],
    });

    const result = buildTrendSeries({
      entries: [entry],
      metricTypes: ['weight'],
      range: { start: '2024-01-10', end: '2024-01-10' },
      targetUnits: { weight: 'kg' },
    });

    // Value still appears (pass-through)
    expect(result.data[0].weight).toBe(11);

    // Warning emitted
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].metricType).toBe('weight');
    expect(result.warnings[0].date).toBe('2024-01-10');
    expect(result.warnings[0].message).toContain('stones');
  });

  // -------------------------------------------------------------------------
  // Non-finite value → treated as null
  // -------------------------------------------------------------------------

  it('non-finite value (string) → cell is null', () => {
    const entry = makeDailyEntry('2024-01-10', {
      weight: [makeEntry({ metricType: 'weight', value: 'not-a-number', unit: 'kg' })],
    });

    const result = buildTrendSeries({
      entries: [entry],
      metricTypes: ['weight'],
      range: { start: '2024-01-10', end: '2024-01-10' },
      targetUnits: { weight: 'kg' },
    });

    expect(result.data[0].weight).toBeNull();
    expect(result.metrics[0].count).toBe(0);
  });

  it('null value → cell is null', () => {
    const entry = makeDailyEntry('2024-01-10', {
      weight: [makeEntry({ metricType: 'weight', value: null, unit: 'kg' })],
    });

    const result = buildTrendSeries({
      entries: [entry],
      metricTypes: ['weight'],
      range: { start: '2024-01-10', end: '2024-01-10' },
      targetUnits: { weight: 'kg' },
    });

    expect(result.data[0].weight).toBeNull();
  });
});
