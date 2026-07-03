import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { DailyHealthEntry, HealthMetricEntry } from '../../../types/health';
import { EntryDetailPanel } from './EntryDetailPanel';

const metricEntry = (overrides: Partial<HealthMetricEntry> = {}): HealthMetricEntry => ({
  id: '42',
  metricType: 'weight',
  value: 82.4,
  unit: 'kg',
  recordedAt: '2024-02-29T07:30:00.000Z',
  source: 'manual',
  notes: 'original note',
  createdAt: '2024-02-29T07:31:00.000Z',
  updatedAt: '2024-02-29T07:31:00.000Z',
  ...overrides,
});

const dailyEntry = (metric: HealthMetricEntry = metricEntry()): DailyHealthEntry => ({
  id: 'daily-2024-02-29',
  date: '2024-02-29',
  metrics: {
    weight: [metric],
  },
  createdAt: '2024-02-29T08:00:00.000Z',
  updatedAt: '2024-02-29T08:00:00.000Z',
});

describe('EntryDetailPanel metric actions', () => {
  it('submits an edited metric value through the callback', async () => {
    const user = userEvent.setup();
    const onUpdateMetric = vi.fn().mockResolvedValue(true);

    render(<EntryDetailPanel entry={dailyEntry()} onUpdateMetric={onUpdateMetric} />);

    await user.click(screen.getByRole('button', { name: /edit metric/i }));
    await user.clear(screen.getByLabelText('Value'));
    await user.type(screen.getByLabelText('Value'), '81.2');
    await user.clear(screen.getByLabelText('Notes'));
    await user.type(screen.getByLabelText('Notes'), 'updated note');
    await user.click(screen.getByRole('button', { name: /save metric/i }));

    await waitFor(() => {
      expect(onUpdateMetric).toHaveBeenCalledTimes(1);
    });

    expect(onUpdateMetric.mock.calls[0][0]).toMatchObject({
      id: '42',
      metricType: 'weight',
      value: 81.2,
      unit: 'kg',
      source: 'manual',
      notes: 'updated note',
    });
  });

  it('submits a metric delete through the callback', async () => {
    const user = userEvent.setup();
    const onDeleteMetric = vi.fn().mockResolvedValue(true);

    render(<EntryDetailPanel entry={dailyEntry()} onDeleteMetric={onDeleteMetric} />);

    await user.click(screen.getByRole('button', { name: /delete metric/i }));

    expect(onDeleteMetric).toHaveBeenCalledWith('42');
  });
});
