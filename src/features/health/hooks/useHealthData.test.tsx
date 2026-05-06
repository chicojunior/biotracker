import { renderHook, waitFor, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DailyHealthEntry, HealthMetricEntry } from '../../../types/health';
import {
  deleteDailyEntry,
  exportHealthData,
  importHealthData,
  loadDailyEntries,
  upsertDailyEntry,
} from '../../../lib/storage/healthStorage';
import { useHealthData } from './useHealthData';

vi.mock(import('../../../lib/storage/healthStorage'), () => ({
  deleteDailyEntry: vi.fn(),
  exportHealthData: vi.fn(),
  importHealthData: vi.fn(),
  loadDailyEntries: vi.fn(),
  upsertDailyEntry: vi.fn(),
}));

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

describe('useHealthData', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('loads entries on mount and exposes ready state', async () => {
    const entries = [dailyEntry()];

    vi.mocked(loadDailyEntries).mockReturnValue({ ok: true, data: entries });

    const { result } = renderHook(() => useHealthData());

    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });

    expect(loadDailyEntries).toHaveBeenCalledTimes(1);
    expect(result.current.entries).toEqual(entries);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.errorMessage).toBe('');
  });

  it('exposes a friendly error when initial load fails', async () => {
    vi.mocked(loadDailyEntries).mockReturnValue({
      ok: false,
      error: {
        code: 'storage_unavailable',
        message: 'Health data storage is unavailable.',
      },
    });

    const { result } = renderHook(() => useHealthData());

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });

    expect(result.current.errorMessage).toBe('Health data storage is unavailable on this device.');
    expect(result.current.entries).toEqual([]);
  });

  it('upserts an entry and updates list with success status', async () => {
    const entry = dailyEntry();

    vi.mocked(loadDailyEntries).mockReturnValue({ ok: true, data: [] });
    vi.mocked(upsertDailyEntry).mockReturnValue({ ok: true, data: [entry] });

    const { result } = renderHook(() => useHealthData());

    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });

    let upsertResult = false;

    act(() => {
      upsertResult = result.current.upsertEntry(entry);
    });

    expect(upsertResult).toBe(true);
    expect(upsertDailyEntry).toHaveBeenCalledWith(entry, {
      now: undefined,
      storage: undefined,
    });
    expect(result.current.entries).toEqual([entry]);
    expect(result.current.statusMessage).toBe('Entry saved.');
    expect(result.current.errorMessage).toBe('');
  });

  it('removes an entry and keeps remaining entries', async () => {
    const keptEntry = dailyEntry({
      id: 'daily-2024-03-01',
      date: '2024-03-01',
    });

    vi.mocked(loadDailyEntries).mockReturnValue({ ok: true, data: [dailyEntry(), keptEntry] });
    vi.mocked(deleteDailyEntry).mockReturnValue({ ok: true, data: [keptEntry] });

    const { result } = renderHook(() => useHealthData());

    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });

    let removeResult = false;

    act(() => {
      removeResult = result.current.removeEntry('2024-02-29');
    });

    expect(removeResult).toBe(true);
    expect(deleteDailyEntry).toHaveBeenCalledWith('2024-02-29', {
      now: undefined,
      storage: undefined,
    });
    expect(result.current.entries).toEqual([keptEntry]);
    expect(result.current.statusMessage).toBe('Entry removed.');
  });

  it('supports manual reload when autoLoad is disabled', () => {
    vi.mocked(loadDailyEntries).mockReturnValue({ ok: true, data: [dailyEntry()] });

    const { result } = renderHook(() => useHealthData({ autoLoad: false }));

    expect(loadDailyEntries).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');

    let reloadResult = false;

    act(() => {
      reloadResult = result.current.reload();
    });

    expect(reloadResult).toBe(true);
    expect(loadDailyEntries).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('ready');
    expect(result.current.entries).toHaveLength(1);
  });

  it('imports and exports health data through storage API', async () => {
    const importedEntry = dailyEntry({
      id: 'daily-2024-03-02',
      date: '2024-03-02',
    });

    vi.mocked(loadDailyEntries).mockReturnValue({ ok: true, data: [] });
    vi.mocked(importHealthData).mockReturnValue({ ok: true, data: [importedEntry] });
    vi.mocked(exportHealthData).mockReturnValue({ ok: true, data: '{"version":1}' });

    const { result } = renderHook(() => useHealthData());

    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });

    let importResult = false;

    act(() => {
      importResult = result.current.importData('{"version":1}');
    });

    expect(importResult).toBe(true);
    expect(result.current.entries).toEqual([importedEntry]);

    let exportedValue: string | null = null;

    act(() => {
      exportedValue = result.current.exportData();
    });

    expect(exportedValue).toBe('{"version":1}');
    expect(result.current.statusMessage).toBe('Health data exported.');
  });
});
