import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeEach } from 'vitest';

import { DEFAULT_USER_SETTINGS, SETTINGS_STORAGE_KEY } from './settingsStorage';
import { SettingsRoute } from './SettingsRoute';

describe('settings route', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('hydrates the form with persisted settings', () => {
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        ...DEFAULT_USER_SETTINGS,
        preferredUnits: {
          ...DEFAULT_USER_SETTINGS.preferredUnits,
          weight: 'lb',
        },
        goalNotes: {
          ...DEFAULT_USER_SETTINGS.goalNotes,
          workoutNotes: 'Track weekly trend shifts',
        },
        theme: 'dark',
      }),
    );

    render(<SettingsRoute />);

    const weightUnit = document.getElementById('weight-unit');

    expect(weightUnit).not.toBeNull();
    expect((weightUnit as HTMLSelectElement).value).toBe('lb');
    expect(screen.getByLabelText(/personal tracking notes/i)).toHaveValue(
      'Track weekly trend shifts',
    );
    expect(screen.getByRole('button', { name: /dark/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('saves edited settings and preserves non-edited fields', async () => {
    const user = userEvent.setup();

    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        ...DEFAULT_USER_SETTINGS,
        preferredUnits: {
          ...DEFAULT_USER_SETTINGS.preferredUnits,
          visceralFatLevel: 'index',
        },
        preferredSourceByMetric: {
          ...DEFAULT_USER_SETTINGS.preferredSourceByMetric,
          sleepQuality: 'importedCsv',
        },
        goalNotes: {
          dailySteps: 'Keep average above 8000',
        },
      }),
    );

    render(<SettingsRoute />);

    const weightUnit = document.getElementById('weight-unit');

    expect(weightUnit).not.toBeNull();
    await user.selectOptions(weightUnit as HTMLSelectElement, 'lb');
    await user.click(screen.getByRole('button', { name: /save settings/i }));

    const savedSettingsRaw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);

    expect(savedSettingsRaw).not.toBeNull();

    const savedSettings = JSON.parse(savedSettingsRaw as string);

    expect(savedSettings.preferredUnits.weight).toBe('lb');
    expect(savedSettings.preferredUnits.visceralFatLevel).toBe('index');
    expect(savedSettings.preferredSourceByMetric.sleepQuality).toBe('importedCsv');
    expect(savedSettings.goalNotes.dailySteps).toBe('Keep average above 8000');
    expect(savedSettings.goalNotes.workoutNotes).toBeTruthy();
    expect(screen.getByRole('status')).toHaveTextContent('Settings saved.');
  });

  it('resets persisted settings to defaults and updates the form', async () => {
    const user = userEvent.setup();

    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        ...DEFAULT_USER_SETTINGS,
        preferredUnits: {
          ...DEFAULT_USER_SETTINGS.preferredUnits,
          weight: 'lb',
        },
        theme: 'dark',
      }),
    );

    render(<SettingsRoute />);

    await user.click(screen.getByRole('button', { name: /reset/i }));

    expect(window.localStorage.getItem(SETTINGS_STORAGE_KEY)).toBeNull();

    const weightUnit = document.getElementById('weight-unit');

    expect(weightUnit).not.toBeNull();
    expect((weightUnit as HTMLSelectElement).value).toBe('kg');
    expect(screen.getByRole('button', { name: /system/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('status')).toHaveTextContent('Settings reset.');
  });
});
