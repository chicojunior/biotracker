import { afterEach, describe, expect, it, vi } from 'vitest';

import type { DailyHealthEntry, HealthMetricEntry } from '../../types/health';
import {
  HEALTH_STORAGE_KEY,
  HEALTH_STORAGE_VERSION,
  clearHealthData,
  deleteDailyEntry,
  loadDailyEntries,
  saveDailyEntries,
  upsertDailyEntry,
} from './healthStorage';

const metricEntry = (overrides: Partial<HealthMetricEntry> = {}): HealthMetricEntry => ({
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

const dailyEntry = (overrides: Partial<DailyHealthEntry> = {}): DailyHealthEntry => ({
  id: 'daily-2024-02-29',
  date: '2024-02-29',
  metrics: {
    weight: [metricEntry()],
  },
  createdAt: '2024-02-29T08:00:00.000Z',
  updatedAt: '2024-02-29T08:00:00.000Z',
  ...overrides,
});

describe('health storage', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('loads an empty list when storage has no saved health data', () => {
    expect(loadDailyEntries()).toEqual({ ok: true, data: [] });
  });

  it('returns a storage unavailable error when localStorage is missing', () => {
    expect(loadDailyEntries({ storage: null })).toEqual({
      ok: false,
      error: {
        code: 'storage_unavailable',
        message: 'Health data storage is unavailable.',
      },
    });
  });

  it('saves and loads daily entries inside a versioned storage envelope', () => {
    const entries = [dailyEntry()];
    const savedAt = '2026-05-06T12:00:00.000Z';

    expect(saveDailyEntries(entries, { now: () => savedAt }).ok).toBe(true);

    const rawValue = localStorage.getItem(HEALTH_STORAGE_KEY);
    expect(rawValue).not.toBeNull();
    expect(JSON.parse(rawValue ?? '')).toEqual({
      version: HEALTH_STORAGE_VERSION,
      savedAt,
      updatedAt: savedAt,
      entries,
    });
    expect(loadDailyEntries()).toEqual({ ok: true, data: entries });
  });

  it('returns a parse error for malformed JSON', () => {
    localStorage.setItem(HEALTH_STORAGE_KEY, '{bad json');

    expect(loadDailyEntries()).toEqual({
      ok: false,
      error: {
        code: 'malformed_json',
        message: 'Saved health data is not valid JSON.',
      },
    });
  });

  it('returns an unsupported version error for future envelopes', () => {
    localStorage.setItem(
      HEALTH_STORAGE_KEY,
      JSON.stringify({
        version: HEALTH_STORAGE_VERSION + 1,
        savedAt: '2024-02-29T08:00:00.000Z',
        updatedAt: '2024-02-29T08:00:00.000Z',
        entries: [],
      }),
    );

    expect(loadDailyEntries()).toEqual({
      ok: false,
      error: {
        code: 'unsupported_version',
        message: `Saved health data version ${HEALTH_STORAGE_VERSION + 1} is not supported.`,
      },
    });
  });

  it('returns an invalid payload error when saved entries fail validation', () => {
    localStorage.setItem(
      HEALTH_STORAGE_KEY,
      JSON.stringify({
        version: HEALTH_STORAGE_VERSION,
        savedAt: '2024-02-29T08:00:00.000Z',
        updatedAt: '2024-02-29T08:00:00.000Z',
        entries: [
          dailyEntry({
            date: '2024-02-30',
          }),
        ],
      }),
    );

    const result = loadDailyEntries();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('invalid_payload');
      expect(result.error.message).toBe('Saved health data failed validation.');
      expect(result.error.details?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it('replaces an existing daily entry when upserting the same date', () => {
    const originalEntry = dailyEntry({
      id: 'daily-original',
      notes: 'Original notes',
    });
    const replacementEntry = dailyEntry({
      id: 'daily-replacement',
      notes: 'Replacement notes',
    });

    expect(saveDailyEntries([originalEntry]).ok).toBe(true);

    const result = upsertDailyEntry(replacementEntry);

    expect(result).toEqual({ ok: true, data: [replacementEntry] });
    expect(loadDailyEntries()).toEqual({ ok: true, data: [replacementEntry] });
  });

  it('adds a new daily entry and stores entries sorted by date', () => {
    const laterEntry = dailyEntry({
      id: 'daily-2024-03-01',
      date: '2024-03-01',
    });
    const earlierEntry = dailyEntry({
      id: 'daily-2024-02-28',
      date: '2024-02-28',
    });

    expect(saveDailyEntries([laterEntry]).ok).toBe(true);

    const result = upsertDailyEntry(earlierEntry);

    expect(result).toEqual({ ok: true, data: [earlierEntry, laterEntry] });
    expect(loadDailyEntries()).toEqual({ ok: true, data: [earlierEntry, laterEntry] });
  });

  it('deletes a daily entry by date and leaves other entries intact', () => {
    const entryToDelete = dailyEntry({
      id: 'daily-2024-02-28',
      date: '2024-02-28',
    });
    const entryToKeep = dailyEntry({
      id: 'daily-2024-03-01',
      date: '2024-03-01',
    });

    expect(saveDailyEntries([entryToDelete, entryToKeep]).ok).toBe(true);

    expect(deleteDailyEntry('2024-02-28')).toEqual({ ok: true, data: [entryToKeep] });
    expect(loadDailyEntries()).toEqual({ ok: true, data: [entryToKeep] });
  });

  it('clears saved health data', () => {
    expect(saveDailyEntries([dailyEntry()]).ok).toBe(true);

    expect(clearHealthData()).toEqual({ ok: true, data: undefined });
    expect(localStorage.getItem(HEALTH_STORAGE_KEY)).toBeNull();
  });

  it('returns a write error when localStorage setItem fails', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });

    expect(saveDailyEntries([dailyEntry()])).toEqual({
      ok: false,
      error: {
        code: 'write_failed',
        message: 'Health data could not be saved.',
      },
    });
  });
});
