import { useCallback, useState } from 'react';

import type { HealthMetricType, UserSettings } from '../../../types/health';
import {
  loadUserSettings,
  resetUserSettings,
  updateUserSettings,
} from '../settingsStorage';
import {
  METRICS,
  createInitialSettings,
  type SettingsPageValue,
} from '../SettingsPage';

type SettingsStorageRef = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

type UseSettingsOptions = {
  storage?: SettingsStorageRef | null;
};

type UseSettingsValue = {
  isSaving: boolean;
  onChange: (settings: SettingsPageValue) => void;
  onReset: () => void;
  onSave: () => void;
  settings: SettingsPageValue;
  statusMessage: string;
};

const GOAL_NOTES_KEY: HealthMetricType = 'workoutNotes';

function toSettingsPageValue(userSettings: UserSettings): SettingsPageValue {
  const defaults = createInitialSettings();

  return {
    goalNotes: userSettings.goalNotes?.[GOAL_NOTES_KEY] ?? defaults.goalNotes,
    metricPreferences: METRICS.reduce<Record<string, { source: string; unit: string }>>(
      (preferences, metric) => {
        preferences[metric.key] = {
          source:
            userSettings.preferredSourceByMetric[metric.key] ??
            defaults.metricPreferences[metric.key]?.source ??
            metric.sourceOptions[0]?.value ??
            'manual',
          unit:
            userSettings.preferredUnits[metric.key] ??
            defaults.metricPreferences[metric.key]?.unit ??
            metric.unitOptions[0] ??
            '',
        };

        return preferences;
      },
      {},
    ),
    theme: userSettings.theme ?? defaults.theme,
  };
}

function toSettingsPatch(settings: SettingsPageValue): {
  goalNotes: Record<string, string>;
  preferredSourceByMetric: Record<string, string>;
  preferredUnits: Record<string, string>;
  theme: SettingsPageValue['theme'];
} {
  return {
    goalNotes: {
      [GOAL_NOTES_KEY]: settings.goalNotes,
    },
    preferredSourceByMetric: METRICS.reduce<Record<string, string>>((result, metric) => {
      result[metric.key] = settings.metricPreferences[metric.key]?.source ?? 'manual';
      return result;
    }, {}),
    preferredUnits: METRICS.reduce<Record<string, string>>((result, metric) => {
      result[metric.key] = settings.metricPreferences[metric.key]?.unit ?? '';
      return result;
    }, {}),
    theme: settings.theme,
  };
}

export function useSettings(options?: UseSettingsOptions): UseSettingsValue {
  const storage = options?.storage;
  const [settings, setSettings] = useState<SettingsPageValue>(() =>
    toSettingsPageValue(loadUserSettings(storage)),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const onChange = useCallback((nextSettings: SettingsPageValue) => {
    setSettings(nextSettings);
    setStatusMessage('');
  }, []);

  const onSave = useCallback(() => {
    setIsSaving(true);

    try {
      updateUserSettings(toSettingsPatch(settings), storage);
      setStatusMessage('Settings saved.');
    } catch {
      setStatusMessage('Could not save settings.');
    } finally {
      setIsSaving(false);
    }
  }, [settings, storage]);

  const onReset = useCallback(() => {
    try {
      const nextSettings = resetUserSettings(storage);
      setSettings(toSettingsPageValue(nextSettings));
      setStatusMessage('Settings reset.');
    } catch {
      setStatusMessage('Could not reset settings.');
    }
  }, [storage]);

  return {
    isSaving,
    onChange,
    onReset,
    onSave,
    settings,
    statusMessage,
  };
}
