import { z } from 'zod';

import type { DailyHealthEntry } from '../../types/health';
import { compareDateKeys } from '../dates/dateRanges';
import { dailyHealthEntrySchema } from '../validation/healthSchemas';

export const HEALTH_STORAGE_KEY = 'biotracker.health.dailyEntries';
export const HEALTH_STORAGE_VERSION = 1;

export type HealthStorageErrorCode =
  | 'storage_unavailable'
  | 'malformed_json'
  | 'unsupported_version'
  | 'invalid_payload'
  | 'write_failed'
  | 'not_found';

export type HealthStorageError = {
  code: HealthStorageErrorCode;
  message: string;
  details?: string[];
};

export type HealthStorageResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: HealthStorageError;
    };

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type HealthStorageOptions = {
  apiBaseUrl?: string;
  fetchImpl?: FetchLike;
  now?: () => string;
  /**
   * Kept for older tests/call sites while F2 moves persistence to the HTTP API.
   * The browser localStorage object is no longer used for health entries.
   */
  storage?: Storage | null;
};

export type HealthStorageEnvelope = {
  version: typeof HEALTH_STORAGE_VERSION;
  savedAt?: string;
  updatedAt?: string;
  exportedAt?: string;
  entries: DailyHealthEntry[];
};

type ApiError = {
  code: string;
  message: string;
  details?: string[];
};

type ApiResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: ApiError;
    };

const DEFAULT_API_BASE_URL = import.meta.env.VITE_BIOTRACKER_API_BASE_URL?.trim() || '/api';

const dailyEntriesSchema = z.array(dailyHealthEntrySchema);

const envelopeVersionSchema = z
  .object({
    version: z.number().int(),
  })
  .passthrough();

const importEnvelopeSchema = z
  .object({
    version: z.literal(HEALTH_STORAGE_VERSION),
    savedAt: z.string().trim().min(1).optional(),
    updatedAt: z.string().trim().min(1).optional(),
    exportedAt: z.string().trim().min(1).optional(),
    entries: dailyEntriesSchema,
  })
  .passthrough() satisfies z.ZodType<HealthStorageEnvelope>;

const apiErrorSchema = z
  .object({
    code: z.string().trim().min(1),
    message: z.string().trim().min(1),
    details: z.array(z.string()).optional(),
  })
  .passthrough() satisfies z.ZodType<ApiError>;

function apiResultSchema<T>(dataSchema: z.ZodType<T>): z.ZodType<ApiResult<T>> {
  return z.union([
    z.object({
      ok: z.literal(true),
      data: dataSchema,
    }),
    z.object({
      ok: z.literal(false),
      error: apiErrorSchema,
    }),
  ]) as z.ZodType<ApiResult<T>>;
}

function success<T>(data: T): HealthStorageResult<T> {
  return { ok: true, data };
}

function failure(code: HealthStorageErrorCode, message: string, details?: string[]): HealthStorageResult<never> {
  return {
    ok: false,
    error: details && details.length > 0 ? { code, message, details } : { code, message },
  };
}

function validationDetails(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';

    return `${path}${issue.message}`;
  });
}

function sortEntries(entries: DailyHealthEntry[]): DailyHealthEntry[] {
  return [...entries].sort((left, right) => compareDateKeys(left.date, right.date));
}

function validateDailyEntries(entries: DailyHealthEntry[]): HealthStorageResult<DailyHealthEntry[]> {
  const result = dailyEntriesSchema.safeParse(entries);

  if (!result.success) {
    return failure(
      'invalid_payload',
      'Health data failed validation.',
      validationDetails(result.error),
    );
  }

  return success(sortEntries(result.data));
}

function getNow(options: HealthStorageOptions): string {
  try {
    const timestamp = options.now?.() ?? new Date().toISOString();

    return timestamp.trim().length > 0 ? timestamp : '1970-01-01T00:00:00.000Z';
  } catch {
    return '1970-01-01T00:00:00.000Z';
  }
}

function buildEnvelope(entries: DailyHealthEntry[], options: HealthStorageOptions): HealthStorageEnvelope {
  const timestamp = getNow(options);

  return {
    version: HEALTH_STORAGE_VERSION,
    savedAt: timestamp,
    updatedAt: timestamp,
    entries,
  };
}

function parseEnvelope(rawValue: string): HealthStorageResult<HealthStorageEnvelope> {
  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(rawValue);
  } catch {
    return failure('malformed_json', 'Saved health data is not valid JSON.');
  }

  const versionResult = envelopeVersionSchema.safeParse(parsedValue);

  if (!versionResult.success) {
    return failure(
      'invalid_payload',
      'Saved health data failed validation.',
      validationDetails(versionResult.error),
    );
  }

  if (versionResult.data.version !== HEALTH_STORAGE_VERSION) {
    return failure(
      'unsupported_version',
      `Saved health data version ${versionResult.data.version} is not supported.`,
    );
  }

  const envelopeResult = importEnvelopeSchema.safeParse(parsedValue);

  if (!envelopeResult.success) {
    return failure(
      'invalid_payload',
      'Saved health data failed validation.',
      validationDetails(envelopeResult.error),
    );
  }

  return success({
    ...envelopeResult.data,
    entries: sortEntries(envelopeResult.data.entries),
  });
}

function resolveFetch(options: HealthStorageOptions): HealthStorageResult<FetchLike> {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch?.bind(globalThis);

  return fetchImpl
    ? success(fetchImpl)
    : failure('storage_unavailable', 'Health data API is unavailable.');
}

function buildApiUrl(path: string, options: HealthStorageOptions): string {
  const baseUrl = options.apiBaseUrl?.trim() ?? DEFAULT_API_BASE_URL;
  const normalizedBase = baseUrl.replace(/\/+$/, '');

  return normalizedBase ? `${normalizedBase}${path}` : path;
}

function toStorageErrorCode(code: string): HealthStorageErrorCode {
  switch (code) {
    case 'malformed_json':
    case 'unsupported_version':
    case 'invalid_payload':
    case 'write_failed':
    case 'not_found':
      return code;
    default:
      return 'write_failed';
  }
}

function apiFailure(error: ApiError): HealthStorageResult<never> {
  return failure(toStorageErrorCode(error.code), error.message, error.details);
}

async function readJson(response: Response): Promise<HealthStorageResult<unknown>> {
  let rawValue = '';

  try {
    rawValue = await response.text();
  } catch {
    return failure('malformed_json', 'Health data API response could not be read.');
  }

  if (rawValue.trim().length === 0) {
    return failure('malformed_json', 'Health data API returned an empty response.');
  }

  try {
    return success(JSON.parse(rawValue));
  } catch {
    return failure('malformed_json', 'Health data API returned invalid JSON.');
  }
}

async function requestApiResult<T>(
  path: string,
  dataSchema: z.ZodType<T>,
  options: HealthStorageOptions,
  init: RequestInit = {},
): Promise<HealthStorageResult<T>> {
  const fetchResult = resolveFetch(options);

  if (!fetchResult.ok) {
    return fetchResult;
  }

  let response: Response;

  try {
    response = await fetchResult.data(buildApiUrl(path, options), {
      ...init,
      headers: {
        ...(init.body ? { 'content-type': 'application/json' } : {}),
        ...init.headers,
      },
    });
  } catch {
    return failure('storage_unavailable', 'Health data API is unavailable.');
  }

  const jsonResult = await readJson(response);

  if (!jsonResult.ok) {
    return jsonResult;
  }

  const parsedResult = apiResultSchema(dataSchema).safeParse(jsonResult.data);

  if (!parsedResult.success) {
    return failure(
      'malformed_json',
      'Health data API response failed validation.',
      validationDetails(parsedResult.error),
    );
  }

  if (!parsedResult.data.ok) {
    return apiFailure(parsedResult.data.error);
  }

  return success(parsedResult.data.data);
}

async function importEnvelope(
  envelope: HealthStorageEnvelope,
  options: HealthStorageOptions,
): Promise<HealthStorageResult<DailyHealthEntry[]>> {
  return requestApiResult('/backups/import', dailyEntriesSchema, options, {
    method: 'POST',
    body: JSON.stringify(envelope),
  });
}

export async function loadDailyEntries(
  options: HealthStorageOptions = {},
): Promise<HealthStorageResult<DailyHealthEntry[]>> {
  const result = await requestApiResult('/entries', dailyEntriesSchema, options);

  if (!result.ok) {
    return result;
  }

  return success(sortEntries(result.data));
}

export async function saveDailyEntries(
  entries: DailyHealthEntry[],
  options: HealthStorageOptions = {},
): Promise<HealthStorageResult<DailyHealthEntry[]>> {
  const entriesResult = validateDailyEntries(entries);

  if (!entriesResult.ok) {
    return entriesResult;
  }

  return importEnvelope(buildEnvelope(entriesResult.data, options), options);
}

export async function upsertDailyEntry(
  entry: DailyHealthEntry,
  options: HealthStorageOptions = {},
): Promise<HealthStorageResult<DailyHealthEntry[]>> {
  const entryResult = dailyHealthEntrySchema.safeParse(entry);

  if (!entryResult.success) {
    return failure(
      'invalid_payload',
      'Daily health entry failed validation.',
      validationDetails(entryResult.error),
    );
  }

  const upsertResult = await requestApiResult('/entries', dailyHealthEntrySchema, options, {
    method: 'POST',
    body: JSON.stringify(entryResult.data),
  });

  if (!upsertResult.ok) {
    return upsertResult;
  }

  return loadDailyEntries(options);
}

export async function deleteDailyEntry(
  date: string,
  options: HealthStorageOptions = {},
): Promise<HealthStorageResult<DailyHealthEntry[]>> {
  const deleteResult = await requestApiResult(`/entries/${encodeURIComponent(date)}`, z.object({ date: z.string() }), options, {
    method: 'DELETE',
  });

  if (!deleteResult.ok) {
    return deleteResult;
  }

  return loadDailyEntries(options);
}

export async function clearHealthData(options: HealthStorageOptions = {}): Promise<HealthStorageResult<void>> {
  const result = await saveDailyEntries([], options);

  if (!result.ok) {
    return result;
  }

  return success(undefined);
}

export async function exportHealthData(options: HealthStorageOptions = {}): Promise<HealthStorageResult<string>> {
  const entriesResult = await loadDailyEntries(options);

  if (!entriesResult.ok) {
    return entriesResult;
  }

  return success(JSON.stringify(buildEnvelope(entriesResult.data, options)));
}

export async function importHealthData(
  rawValue: string,
  options: HealthStorageOptions = {},
): Promise<HealthStorageResult<DailyHealthEntry[]>> {
  const envelopeResult = parseEnvelope(rawValue);

  if (!envelopeResult.ok) {
    return envelopeResult;
  }

  return importEnvelope(envelopeResult.data, options);
}
