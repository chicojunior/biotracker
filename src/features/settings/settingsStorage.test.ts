import { describe, expect, it } from 'vitest';

import type { UserSettings } from '../../types/health';
import {
  DEFAULT_USER_SETTINGS,
  SETTINGS_STORAGE_KEY,
  SettingsStorageError,
  loadUserSettings,
  resetUserSettings,
  saveUserSettings,
  updateUserSettings,
} from './settingsStorage';

type MemoryStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> & {
  entries: Map<string, string>;
};

const createMemoryStorage = (): MemoryStorage => {
  const entries = new Map<string, string>();

  return {
    entries,
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => {
      entries.set(key, value);
    },
    removeItem: (key) => {
      entries.delete(key);
    },
  };
};

describe('settings storage', () => {
  it('loads default settings when no stored settings exist', () => {
    expect(loadUserSettings(createMemoryStorage())).toEqual(DEFAULT_USER_SETTINGS);
    expect(loadUserSettings(null)).toEqual(DEFAULT_USER_SETTINGS);
  });

  it('saves and loads settings roundtrip', () => {
    const storage = createMemoryStorage();
    const settings: UserSettings = {
      preferredUnits: {
        ...DEFAULT_USER_SETTINGS.preferredUnits,
        weight: 'lb',
        sleepDuration: 'minutes',
      },
      preferredSourceByMetric: {
        ...DEFAULT_USER_SETTINGS.preferredSourceByMetric,
        weight: 'manual',
      },
      goalNotes: {
        weight: 'Maintain current range',
        dailySteps: 'Average 9000 per day',
      },
      theme: 'dark',
    };

    saveUserSettings(settings, storage);

    expect(loadUserSettings(storage)).toEqual(settings);
  });

  it('merges partial stored settings with defaults', () => {
    const storage = createMemoryStorage();
    storage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        preferredUnits: {
          weight: 'lb',
        },
        theme: 'light',
      }),
    );

    expect(loadUserSettings(storage)).toEqual({
      ...DEFAULT_USER_SETTINGS,
      preferredUnits: {
        ...DEFAULT_USER_SETTINGS.preferredUnits,
        weight: 'lb',
      },
      theme: 'light',
    });
  });

  it('falls back to defaults for malformed JSON and invalid setting shapes', () => {
    const malformedStorage = createMemoryStorage();
    malformedStorage.setItem(SETTINGS_STORAGE_KEY, '{not-json');

    expect(loadUserSettings(malformedStorage)).toEqual(DEFAULT_USER_SETTINGS);

    const invalidShapeStorage = createMemoryStorage();
    invalidShapeStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        preferredUnits: 'kg',
        preferredSourceByMetric: {
          weight: 42,
        },
        theme: 'neon',
      }),
    );

    expect(loadUserSettings(invalidShapeStorage)).toEqual(DEFAULT_USER_SETTINGS);
  });

  it('updates settings with a deep patch and persists the result', () => {
    const storage = createMemoryStorage();
    saveUserSettings(
      {
        ...DEFAULT_USER_SETTINGS,
        preferredUnits: {
          ...DEFAULT_USER_SETTINGS.preferredUnits,
          sleepDuration: 'hours',
        },
        goalNotes: {
          weight: 'Hold steady',
        },
      },
      storage,
    );

    const updated = updateUserSettings(
      {
        preferredUnits: {
          weight: 'lb',
        },
        goalNotes: {
          dailySteps: 'Hit 8000 most days',
        },
        theme: 'dark',
      },
      storage,
    );

    expect(updated).toEqual({
      ...DEFAULT_USER_SETTINGS,
      preferredUnits: {
        ...DEFAULT_USER_SETTINGS.preferredUnits,
        sleepDuration: 'hours',
        weight: 'lb',
      },
      preferredSourceByMetric: DEFAULT_USER_SETTINGS.preferredSourceByMetric,
      goalNotes: {
        weight: 'Hold steady',
        dailySteps: 'Hit 8000 most days',
      },
      theme: 'dark',
    });
    expect(loadUserSettings(storage)).toEqual(updated);
  });

  it('resets settings to defaults and removes stored settings', () => {
    const storage = createMemoryStorage();
    saveUserSettings(
      {
        ...DEFAULT_USER_SETTINGS,
        preferredUnits: {
          ...DEFAULT_USER_SETTINGS.preferredUnits,
          weight: 'lb',
        },
        theme: 'dark',
      },
      storage,
    );

    expect(resetUserSettings(storage)).toEqual(DEFAULT_USER_SETTINGS);
    expect(storage.entries.has(SETTINGS_STORAGE_KEY)).toBe(false);
  });

  it('throws explicit storage errors for write failures', () => {
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota exceeded');
      },
      removeItem: () => undefined,
    } satisfies Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

    expect(() => saveUserSettings(DEFAULT_USER_SETTINGS, storage)).toThrow(SettingsStorageError);
    expect(() => updateUserSettings({ theme: 'light' }, storage)).toThrow(SettingsStorageError);
  });
});
