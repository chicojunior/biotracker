import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { SETTINGS_STORAGE_KEY } from '../features/settings/settingsStorage';
import { App } from './App';

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.location.hash = '#/';
  });

  afterEach(() => {
    window.location.hash = '#/';
  });

  it('renders the home shell and navigates to settings', async () => {
    const user = userEvent.setup();

    render(<App />);

    expect(
      screen.getByRole('heading', { level: 1, name: /dashboard/i }),
    ).toBeInTheDocument();

    await user.click(screen.getAllByRole('link', { name: /configurações/i })[0]);

    expect(
      await screen.findByRole('heading', { level: 1, name: /settings/i }),
    ).toBeInTheDocument();
  });

  it('hydrates persisted settings when opened directly on the settings route', async () => {
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        preferredUnits: { weight: 'lb' },
        preferredSourceByMetric: { weight: 'manual' },
        goalNotes: { workoutNotes: 'Track recovery more carefully' },
        theme: 'dark',
      }),
    );
    window.location.hash = '#/settings';

    render(<App />);

    await waitFor(() => {
      const weightUnit = document.getElementById('weight-unit') as HTMLSelectElement | null;

      expect(weightUnit?.value).toBe('lb');
    });

    expect(screen.getByLabelText(/personal tracking notes/i)).toHaveValue(
      'Track recovery more carefully',
    );
    expect(screen.getByRole('button', { name: /dark/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('renders the reports controls instead of the placeholder when opening reports', async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getAllByRole('link', { name: /relatórios/i })[0]);

    expect(
      await screen.findByRole('heading', { level: 1, name: /relatórios/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/data de referência/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /diário/i })).toBeInTheDocument();
  });
});