import { z } from 'zod';

import type { UserSettings } from '../../types/health';

export const SETTINGS_STORAGE_KEY = 'biotracker:user-settings:v1';

type SettingsStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export type SettingsPatch = Partial<{
  preferredUnits: UserSettings['preferredUnits'];
  preferredSourceByMetric: UserSettings['preferredSourceByMetric'];
  goalNotes: NonNullable<UserSettings['goalNotes']>;
  theme: NonNullable<UserSettings['theme']>;
}>;

export class SettingsStorageError extends Error {
  readonly cause: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'SettingsStorageError';
    this.cause = cause;
  }
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  preferredUnits: {
    weight: 'kg',
    bodyFatPercentage: '%',
    visceralFatLevel: 'level',
    muscleMass: 'kg',
    bodyWaterPercentage: '%',
    boneMass: 'kg',
    bloodPressureSystolic: 'mmHg',
    bloodPressureDiastolic: 'mmHg',
    restingHeartRate: 'bpm',
    sleepDuration: 'hours',
    sleepQuality: 'score',
    dailySteps: 'steps',
  },
  preferredSourceByMetric: {
    weight: 'smartScale',
    bodyFatPercentage: 'smartScale',
    visceralFatLevel: 'smartScale',
    muscleMass: 'smartScale',
    bodyWaterPercentage: 'smartScale',
    boneMass: 'smartScale',
    bloodPressureSystolic: 'bloodPressureMonitor',
    bloodPressureDiastolic: 'bloodPressureMonitor',
    restingHeartRate: 'smartBand',
    sleepDuration: 'smartBand',
    sleepQuality: 'smartBand',
    dailySteps: 'smartBand',
    workoutNotes: 'manual',
    nutritionNotes: 'manual',
  },
  goalNotes: {},
  theme: 'system',
};

const nonEmptyStringSchema = z.string().trim().min(1);
const settingsRecordSchema = z.record(nonEmptyStringSchema, nonEmptyStringSchema);
const goalNotesRecordSchema = z.record(nonEmptyStringSchema, z.string());
const userSettingsSchema = z.object({
  preferredUnits: settingsRecordSchema.optional(),
  preferredSourceByMetric: settingsRecordSchema.optional(),
  goalNotes: goalNotesRecordSchema.optional(),
  theme: z.enum(['system', 'light', 'dark']).optional(),
});

function getDefaultStorage(): SettingsStorage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function resolveStorage(storage?: SettingsStorage | null): SettingsStorage | null {
  return storage === undefined ? getDefaultStorage() : storage;
}

function cloneSettings(settings: UserSettings): UserSettings {
  return {
    preferredUnits: { ...settings.preferredUnits },
    preferredSourceByMetric: { ...settings.preferredSourceByMetric },
    goalNotes: { ...settings.goalNotes },
    theme: settings.theme ?? 'system',
  };
}

function mergeSettings(base: UserSettings, patch: SettingsPatch): UserSettings {
  return {
    preferredUnits: {
      ...base.preferredUnits,
      ...patch.preferredUnits,
    },
    preferredSourceByMetric: {
      ...base.preferredSourceByMetric,
      ...patch.preferredSourceByMetric,
    },
    goalNotes: {
      ...base.goalNotes,
      ...patch.goalNotes,
    },
    theme: patch.theme ?? base.theme ?? 'system',
  };
}

function normalizeSettings(rawSettings: unknown): UserSettings | null {
  const result = userSettingsSchema.safeParse(rawSettings);

  if (!result.success) {
    return null;
  }

  return mergeSettings(DEFAULT_USER_SETTINGS, result.data);
}

export function getDefaultUserSettings(): UserSettings {
  return cloneSettings(DEFAULT_USER_SETTINGS);
}

export function loadUserSettings(storage?: SettingsStorage | null): UserSettings {
  const storageRef = resolveStorage(storage);

  if (!storageRef) {
    return getDefaultUserSettings();
  }

  try {
    const storedSettings = storageRef.getItem(SETTINGS_STORAGE_KEY);

    if (!storedSettings) {
      return getDefaultUserSettings();
    }

    return normalizeSettings(JSON.parse(storedSettings)) ?? getDefaultUserSettings();
  } catch {
    return getDefaultUserSettings();
  }
}

export function saveUserSettings(
  settings: UserSettings,
  storage?: SettingsStorage | null,
): UserSettings {
  const storageRef = resolveStorage(storage);
  const normalizedSettings = normalizeSettings(settings);

  if (!normalizedSettings) {
    throw new SettingsStorageError('Cannot save invalid user settings');
  }

  if (!storageRef) {
    throw new SettingsStorageError('Settings storage is unavailable');
  }

  try {
    storageRef.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(normalizedSettings));
    return cloneSettings(normalizedSettings);
  } catch (error) {
    throw new SettingsStorageError('Failed to save user settings', error);
  }
}

export function resetUserSettings(storage?: SettingsStorage | null): UserSettings {
  const storageRef = resolveStorage(storage);

  if (!storageRef) {
    return getDefaultUserSettings();
  }

  try {
    storageRef.removeItem(SETTINGS_STORAGE_KEY);
    return getDefaultUserSettings();
  } catch (error) {
    throw new SettingsStorageError('Failed to reset user settings', error);
  }
}

export function updateUserSettings(
  patch:
    | SettingsPatch
    | ((currentSettings: UserSettings) => SettingsPatch),
  storage?: SettingsStorage | null,
): UserSettings {
  const currentSettings = loadUserSettings(storage);
  const nextPatch = typeof patch === 'function' ? patch(currentSettings) : patch;
  const nextSettings = mergeSettings(currentSettings, nextPatch);

  return saveUserSettings(nextSettings, storage);
}
