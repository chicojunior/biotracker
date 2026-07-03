import { afterEach, describe, expect, it, vi } from 'vitest';

import type { DailyHealthEntry, HealthMetricEntry } from '../../types/health';
import {
  HEALTH_STORAGE_VERSION,
  clearHealthData,
  deleteDailyEntry,
  deleteMetricEntry,
  exportHealthData,
  importHealthData,
  loadDailyEntries,
  saveDailyEntries,
  updateMetricEntry,
  upsertDailyEntry,
} from './healthStorage';

type FetchMock = (input: string, init?: RequestInit) => Promise<Response>;

const API_BASE_URL = 'http://api.test';
const SAVED_AT = '2026-05-06T12:00:00.000Z';

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

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
    status: 200,
    ...init,
  });
}

function createFetchMock(...responses: Response[]): ReturnType<typeof vi.fn<FetchMock>> {
  const fetchImpl = vi.fn<FetchMock>();

  for (const response of responses) {
    fetchImpl.mockResolvedValueOnce(response);
  }

  return fetchImpl;
}

function options(fetchImpl: FetchMock) {
  return {
    apiBaseUrl: API_BASE_URL,
    fetchImpl,
    now: () => SAVED_AT,
  };
}

describe('health storage API client', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads daily entries from the API and sorts them by date', async () => {
    const laterEntry = dailyEntry({ id: 'daily-2024-03-01', date: '2024-03-01' });
    const earlierEntry = dailyEntry({ id: 'daily-2024-02-28', date: '2024-02-28' });
    const fetchImpl = createFetchMock(jsonResponse({ ok: true, data: [laterEntry, earlierEntry] }));

    await expect(loadDailyEntries(options(fetchImpl))).resolves.toEqual({
      ok: true,
      data: [earlierEntry, laterEntry],
    });

    expect(fetchImpl.mock.calls[0][0]).toBe(`${API_BASE_URL}/entries`);
  });

  it('returns a storage unavailable error when the API cannot be reached', async () => {
    const fetchImpl = vi.fn<FetchMock>().mockRejectedValue(new TypeError('Network failed'));

    await expect(loadDailyEntries(options(fetchImpl))).resolves.toEqual({
      ok: false,
      error: {
        code: 'storage_unavailable',
        message: 'Health data API is unavailable.',
      },
    });
  });

  it('returns a malformed JSON error when the API response is not JSON', async () => {
    const fetchImpl = createFetchMock(new Response('{bad json', { status: 200 }));

    await expect(loadDailyEntries(options(fetchImpl))).resolves.toEqual({
      ok: false,
      error: {
        code: 'malformed_json',
        message: 'Health data API returned invalid JSON.',
      },
    });
  });

  it('passes API result errors through the storage Result contract', async () => {
    const fetchImpl = createFetchMock(
      jsonResponse({
        ok: false,
        error: {
          code: 'invalid_payload',
          message: 'Daily entry failed validation.',
          details: ['entries.0.date: Expected a valid YYYY-MM-DD date key'],
        },
      }, { status: 422 }),
    );

    await expect(loadDailyEntries(options(fetchImpl))).resolves.toEqual({
      ok: false,
      error: {
        code: 'invalid_payload',
        message: 'Daily entry failed validation.',
        details: ['entries.0.date: Expected a valid YYYY-MM-DD date key'],
      },
    });
  });

  it('saves daily entries by posting a versioned import envelope', async () => {
    const entry = dailyEntry();
    const fetchImpl = createFetchMock(jsonResponse({ ok: true, data: [entry] }));

    await expect(saveDailyEntries([entry], options(fetchImpl))).resolves.toEqual({
      ok: true,
      data: [entry],
    });

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe(`${API_BASE_URL}/backups/import`);
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual({
      version: HEALTH_STORAGE_VERSION,
      savedAt: SAVED_AT,
      updatedAt: SAVED_AT,
      entries: [entry],
    });
  });

  it('upserts a daily entry and reloads the full list', async () => {
    const entry = dailyEntry();
    const fetchImpl = createFetchMock(
      jsonResponse({ ok: true, data: entry }, { status: 201 }),
      jsonResponse({ ok: true, data: [entry] }),
    );

    await expect(upsertDailyEntry(entry, options(fetchImpl))).resolves.toEqual({
      ok: true,
      data: [entry],
    });

    expect(fetchImpl.mock.calls[0][0]).toBe(`${API_BASE_URL}/entries`);
    expect(fetchImpl.mock.calls[0][1]?.method).toBe('POST');
    expect(fetchImpl.mock.calls[1][0]).toBe(`${API_BASE_URL}/entries`);
  });

  it('deletes a daily entry by date and reloads the full list', async () => {
    const keptEntry = dailyEntry({ id: 'daily-2024-03-01', date: '2024-03-01' });
    const fetchImpl = createFetchMock(
      jsonResponse({ ok: true, data: { date: '2024-02-29' } }),
      jsonResponse({ ok: true, data: [keptEntry] }),
    );

    await expect(deleteDailyEntry('2024-02-29', options(fetchImpl))).resolves.toEqual({
      ok: true,
      data: [keptEntry],
    });

    expect(fetchImpl.mock.calls[0][0]).toBe(`${API_BASE_URL}/entries/2024-02-29`);
    expect(fetchImpl.mock.calls[0][1]?.method).toBe('DELETE');
  });

  it('updates one metric entry and reloads the full list', async () => {
    const entry = dailyEntry();
    const metric = entry.metrics.weight?.[0] as HealthMetricEntry;
    const updatedEntry = dailyEntry({
      metrics: {
        weight: [metricEntry({ id: metric.id, value: 81.2, notes: 'updated' })],
      },
    });
    const fetchImpl = createFetchMock(
      jsonResponse({ ok: true, data: updatedEntry }),
      jsonResponse({ ok: true, data: [updatedEntry] }),
    );

    await expect(
      updateMetricEntry({ ...metric, value: 81.2, notes: 'updated' }, options(fetchImpl)),
    ).resolves.toEqual({
      ok: true,
      data: [updatedEntry],
    });

    expect(fetchImpl.mock.calls[0][0]).toBe(`${API_BASE_URL}/metrics/${metric.id}`);
    expect(fetchImpl.mock.calls[0][1]?.method).toBe('PATCH');
  });

  it('deletes one metric entry and reloads the full list', async () => {
    const entry = dailyEntry();
    const metric = entry.metrics.weight?.[0] as HealthMetricEntry;
    const updatedEntry = dailyEntry({ metrics: {} });
    const fetchImpl = createFetchMock(
      jsonResponse({ ok: true, data: updatedEntry }),
      jsonResponse({ ok: true, data: [updatedEntry] }),
    );

    await expect(deleteMetricEntry(metric.id, options(fetchImpl))).resolves.toEqual({
      ok: true,
      data: [updatedEntry],
    });

    expect(fetchImpl.mock.calls[0][0]).toBe(`${API_BASE_URL}/metrics/${metric.id}`);
    expect(fetchImpl.mock.calls[0][1]?.method).toBe('DELETE');
  });

  it('clears health data through an empty replace-all import', async () => {
    const fetchImpl = createFetchMock(jsonResponse({ ok: true, data: [] }));

    await expect(clearHealthData(options(fetchImpl))).resolves.toEqual({
      ok: true,
      data: undefined,
    });

    expect(JSON.parse(String(fetchImpl.mock.calls[0][1]?.body))).toMatchObject({
      version: HEALTH_STORAGE_VERSION,
      entries: [],
    });
  });

  it('exports health data as the v1 browser backup envelope', async () => {
    const entry = dailyEntry();
    const fetchImpl = createFetchMock(jsonResponse({ ok: true, data: [entry] }));

    const result = await exportHealthData(options(fetchImpl));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(JSON.parse(result.data)).toEqual({
        version: HEALTH_STORAGE_VERSION,
        savedAt: SAVED_AT,
        updatedAt: SAVED_AT,
        entries: [entry],
      });
    }
  });

  it('imports a v1 envelope through the API', async () => {
    const entry = dailyEntry();
    const fetchImpl = createFetchMock(jsonResponse({ ok: true, data: [entry] }));

    await expect(
      importHealthData(
        JSON.stringify({
          version: HEALTH_STORAGE_VERSION,
          savedAt: SAVED_AT,
          updatedAt: SAVED_AT,
          entries: [entry],
        }),
        options(fetchImpl),
      ),
    ).resolves.toEqual({ ok: true, data: [entry] });

    expect(fetchImpl.mock.calls[0][0]).toBe(`${API_BASE_URL}/backups/import`);
  });

  it('returns a parse error for malformed imported JSON before calling the API', async () => {
    const fetchImpl = createFetchMock();

    await expect(importHealthData('{bad json', options(fetchImpl))).resolves.toEqual({
      ok: false,
      error: {
        code: 'malformed_json',
        message: 'Saved health data is not valid JSON.',
      },
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('returns an unsupported version error for future import envelopes', async () => {
    const fetchImpl = createFetchMock();

    await expect(
      importHealthData(
        JSON.stringify({
          version: HEALTH_STORAGE_VERSION + 1,
          entries: [],
        }),
        options(fetchImpl),
      ),
    ).resolves.toEqual({
      ok: false,
      error: {
        code: 'unsupported_version',
        message: `Saved health data version ${HEALTH_STORAGE_VERSION + 1} is not supported.`,
      },
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('returns an invalid payload error when imported entries fail validation', async () => {
    const fetchImpl = createFetchMock();

    const result = await importHealthData(
      JSON.stringify({
        version: HEALTH_STORAGE_VERSION,
        entries: [
          dailyEntry({
            date: '2024-02-30',
          }),
        ],
      }),
      options(fetchImpl),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('invalid_payload');
      expect(result.error.message).toBe('Saved health data failed validation.');
      expect(result.error.details?.length ?? 0).toBeGreaterThan(0);
    }
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
