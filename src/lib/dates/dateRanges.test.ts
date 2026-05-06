import { describe, expect, it, vi } from 'vitest';

import {
  compareDateKeys,
  countMissingDateKeys,
  enumerateDateKeysInRange,
  getDayRange,
  getMonthRange,
  getWeekRange,
  isDateKeyInRange,
  normalizeDateKey,
} from './dateRanges';

describe('date range helpers', () => {
  it('normalizes Date objects and ISO-like date strings to date keys', () => {
    expect(normalizeDateKey(new Date(2024, 1, 29, 23, 45))).toBe('2024-02-29');
    expect(normalizeDateKey('2024-02-29T22:15:00Z')).toBe('2024-02-29');
    expect(normalizeDateKey('2024-02-29')).toBe('2024-02-29');
  });

  it('sorts date keys chronologically', () => {
    expect(['2024-02-29', '2023-12-31', '2024-01-01'].sort(compareDateKeys)).toEqual([
      '2023-12-31',
      '2024-01-01',
      '2024-02-29',
    ]);
  });

  it('returns a single-day range', () => {
    expect(getDayRange('2024-02-29')).toEqual({
      start: '2024-02-29',
      end: '2024-02-29',
    });
  });

  it('returns Monday-start week ranges that can span months and years', () => {
    expect(getWeekRange('2024-03-01')).toEqual({
      start: '2024-02-26',
      end: '2024-03-03',
    });

    expect(getWeekRange('2025-01-01')).toEqual({
      start: '2024-12-30',
      end: '2025-01-05',
    });
  });

  it('supports custom week starts', () => {
    expect(getWeekRange('2024-03-01', 0)).toEqual({
      start: '2024-02-25',
      end: '2024-03-02',
    });
  });

  it('returns month ranges for leap years and month end boundaries', () => {
    expect(getMonthRange('2024-02-10')).toEqual({
      start: '2024-02-01',
      end: '2024-02-29',
    });

    expect(getMonthRange('2023-02-28')).toEqual({
      start: '2023-02-01',
      end: '2023-02-28',
    });
  });

  it('checks inclusive range membership', () => {
    const range = getWeekRange('2024-03-01');

    expect(isDateKeyInRange('2024-02-26', range)).toBe(true);
    expect(isDateKeyInRange('2024-03-03', range)).toBe(true);
    expect(isDateKeyInRange('2024-02-25', range)).toBe(false);
    expect(isDateKeyInRange('2024-03-04', range)).toBe(false);
  });

  it('enumerates date keys across leap day and counts missing date keys', () => {
    const range = { start: '2024-02-27', end: '2024-03-02' };

    expect(enumerateDateKeysInRange(range)).toEqual([
      '2024-02-27',
      '2024-02-28',
      '2024-02-29',
      '2024-03-01',
      '2024-03-02',
    ]);

    expect(countMissingDateKeys(['2024-02-27', '2024-02-29', '2024-03-02'], range)).toBe(2);
  });

  it('uses local date arithmetic across US DST boundaries without skips or duplicates', () => {
    vi.stubEnv('TZ', 'America/New_York');

    try {
      expect(new Date(2026, 2, 8, 0, 30).getTimezoneOffset()).toBe(300);
      expect(new Date(2026, 2, 8, 3, 30).getTimezoneOffset()).toBe(240);
      expect(new Date(2026, 10, 1, 0, 30).getTimezoneOffset()).toBe(240);
      expect(new Date(2026, 10, 1, 3, 30).getTimezoneOffset()).toBe(300);

      expect(enumerateDateKeysInRange({ start: '2026-03-06', end: '2026-03-10' })).toEqual([
        '2026-03-06',
        '2026-03-07',
        '2026-03-08',
        '2026-03-09',
        '2026-03-10',
      ]);

      const fallBackDateKeys = enumerateDateKeysInRange({
        start: '2026-10-30',
        end: '2026-11-03',
      });

      expect(fallBackDateKeys).toEqual([
        '2026-10-30',
        '2026-10-31',
        '2026-11-01',
        '2026-11-02',
        '2026-11-03',
      ]);
      expect(new Set(fallBackDateKeys).size).toBe(fallBackDateKeys.length);

      expect(normalizeDateKey(new Date(2026, 2, 8, 0, 30))).toBe('2026-03-08');
      expect(normalizeDateKey(new Date(2026, 2, 8, 3, 30))).toBe('2026-03-08');
      expect(normalizeDateKey(new Date(2026, 10, 1, 0, 30))).toBe('2026-11-01');
      expect(normalizeDateKey(new Date(2026, 10, 1, 3, 30))).toBe('2026-11-01');
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
