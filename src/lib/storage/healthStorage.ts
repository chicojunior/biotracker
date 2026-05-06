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
  | 'write_failed';

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

export type HealthStorageOptions = {
  storage?: Storage | null;
  now?: () => string;
};

export type HealthStorageEnvelope = {
  version: typeof HEALTH_STORAGE_VERSION;
  savedAt: string;
  updatedAt: string;
  entries: DailyHealthEntry[];
};

const dailyEntriesSchema = z.array(dailyHealthEntrySchema);

const envelopeVersionSchema = z
  .object({
    version: z.number().int(),
  })
  .passthrough();

const healthStorageEnvelopeSchema = z
  .object({
    version: z.literal(HEALTH_STORAGE_VERSION),
    savedAt: z.string().trim().min(1),
    updatedAt: z.string().trim().min(1),
    entries: dailyEntriesSchema,
  })
  .strict() satisfies z.ZodType<HealthStorageEnvelope>;

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

function resolveStorage(options: HealthStorageOptions): HealthStorageResult<Storage> {
  if ('storage' in options) {
    return options.storage
      ? success(options.storage)
      : failure('storage_unavailable', 'Health data storage is unavailable.');
  }

  try {
    return globalThis.localStorage
      ? success(globalThis.localStorage)
      : failure('storage_unavailable', 'Health data storage is unavailable.');
  } catch {
    return failure('storage_unavailable', 'Health data storage is unavailable.');
  }
}

function getNow(options: HealthStorageOptions): string {
  try {
    const timestamp = options.now?.() ?? new Date().toISOString();

    return timestamp.trim().length > 0 ? timestamp : '1970-01-01T00:00:00.000Z';
  } catch {
    return '1970-01-01T00:00:00.000Z';
  }
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

  const envelopeResult = healthStorageEnvelopeSchema.safeParse(parsedValue);

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

function buildEnvelope(entries: DailyHealthEntry[], options: HealthStorageOptions): HealthStorageEnvelope {
  const timestamp = getNow(options);

  return {
    version: HEALTH_STORAGE_VERSION,
    savedAt: timestamp,
    updatedAt: timestamp,
    entries,
  };
}

export function loadDailyEntries(options: HealthStorageOptions = {}): HealthStorageResult<DailyHealthEntry[]> {
  const storageResult = resolveStorage(options);

  if (!storageResult.ok) {
    return storageResult;
  }

  let rawValue: string | null;

  try {
    rawValue = storageResult.data.getItem(HEALTH_STORAGE_KEY);
  } catch {
    return failure('storage_unavailable', 'Health data storage is unavailable.');
  }

  if (rawValue === null) {
    return success([]);
  }

  const envelopeResult = parseEnvelope(rawValue);

  if (!envelopeResult.ok) {
    return envelopeResult;
  }

  return success(envelopeResult.data.entries);
}

export function saveDailyEntries(
  entries: DailyHealthEntry[],
  options: HealthStorageOptions = {},
): HealthStorageResult<DailyHealthEntry[]> {
  const entriesResult = validateDailyEntries(entries);

  if (!entriesResult.ok) {
    return entriesResult;
  }

  const storageResult = resolveStorage(options);

  if (!storageResult.ok) {
    return storageResult;
  }

  try {
    storageResult.data.setItem(
      HEALTH_STORAGE_KEY,
      JSON.stringify(buildEnvelope(entriesResult.data, options)),
    );
  } catch {
    return failure('write_failed', 'Health data could not be saved.');
  }

  return success(entriesResult.data);
}

export function upsertDailyEntry(
  entry: DailyHealthEntry,
  options: HealthStorageOptions = {},
): HealthStorageResult<DailyHealthEntry[]> {
  const entryResult = dailyHealthEntrySchema.safeParse(entry);

  if (!entryResult.success) {
    return failure(
      'invalid_payload',
      'Daily health entry failed validation.',
      validationDetails(entryResult.error),
    );
  }

  const entriesResult = loadDailyEntries(options);

  if (!entriesResult.ok) {
    return entriesResult;
  }

  const nextEntries = entriesResult.data.filter((existingEntry) => existingEntry.date !== entryResult.data.date);

  nextEntries.push(entryResult.data);

  return saveDailyEntries(nextEntries, options);
}

export function deleteDailyEntry(
  date: string,
  options: HealthStorageOptions = {},
): HealthStorageResult<DailyHealthEntry[]> {
  const entriesResult = loadDailyEntries(options);

  if (!entriesResult.ok) {
    return entriesResult;
  }

  return saveDailyEntries(
    entriesResult.data.filter((entry) => entry.date !== date),
    options,
  );
}

export function clearHealthData(options: HealthStorageOptions = {}): HealthStorageResult<void> {
  const storageResult = resolveStorage(options);

  if (!storageResult.ok) {
    return storageResult;
  }

  try {
    storageResult.data.removeItem(HEALTH_STORAGE_KEY);
  } catch {
    return failure('write_failed', 'Health data could not be saved.');
  }

  return success(undefined);
}

export function exportHealthData(options: HealthStorageOptions = {}): HealthStorageResult<string> {
  const entriesResult = loadDailyEntries(options);

  if (!entriesResult.ok) {
    return entriesResult;
  }

  return success(JSON.stringify(buildEnvelope(entriesResult.data, options)));
}

export function importHealthData(
  rawValue: string,
  options: HealthStorageOptions = {},
): HealthStorageResult<DailyHealthEntry[]> {
  const envelopeResult = parseEnvelope(rawValue);

  if (!envelopeResult.ok) {
    return envelopeResult;
  }

  return saveDailyEntries(envelopeResult.data.entries, options);
}
