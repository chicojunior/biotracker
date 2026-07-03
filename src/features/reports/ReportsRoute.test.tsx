import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DailyHealthEntry, ReportSummary } from '../../types/health';
import { useHealthData } from '../health/hooks/useHealthData';
import {
  createDailyReportSummary,
  createMonthlyReportSummary,
  createWeeklyReportSummary,
} from '../../lib/reports/reportEngine';
import { ReportsRoute } from './ReportsRoute';
import type { ReportsPageProps } from './reportsPage.types';

vi.mock(import('../health/hooks/useHealthData'), () => ({
  useHealthData: vi.fn(),
}));

vi.mock(import('../../lib/reports/reportEngine'), () => ({
  createDailyReportSummary: vi.fn(),
  createMonthlyReportSummary: vi.fn(),
  createWeeklyReportSummary: vi.fn(),
}));

function makeSummary(summaryType: ReportSummary['summaryType'], id: string): ReportSummary {
  return {
    id,
    summaryType,
    period: {
      startDate: '2026-05-06',
      endDate: '2026-05-06',
    },
    hasData: true,
    observations: ['ok'],
    missingData: [],
    consistency: {
      score: 100,
      notes: 'ok',
    },
    disclaimer: 'ok',
    createdAt: '2026-05-06T12:00:00.000Z',
  };
}

const sampleEntries: DailyHealthEntry[] = [
  {
    id: 'entry-2026-05-06',
    date: '2026-05-06',
    metrics: {},
    createdAt: '2026-05-06T08:00:00.000Z',
    updatedAt: '2026-05-06T08:00:00.000Z',
  },
];

type TestPageProps = {
  onProps: (props: ReportsPageProps) => void;
};

function TestPage({ onProps, ...props }: ReportsPageProps & TestPageProps) {
  onProps(props);

  return (
    <div>
      <button onClick={() => props.onSummaryTypeChange('weekly')} type="button">
        weekly
      </button>
      <button onClick={() => props.onSummaryTypeChange('monthly')} type="button">
        monthly
      </button>
      <button onClick={() => props.onReferenceDateChange('2026-05-01')} type="button">
        set-date
      </button>
      <output aria-label="summary-id">{props.summary.id}</output>
      <output aria-label="summary-type">{props.summaryType}</output>
      <output aria-label="reference-date">{props.referenceDate}</output>
      <output aria-label="loading">{String(props.isLoading)}</output>
      <output aria-label="error">{props.errorMessage}</output>
    </div>
  );
}

describe('ReportsRoute', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    vi.mocked(useHealthData).mockReturnValue({
      entries: sampleEntries,
      errorMessage: '',
      exportData: vi.fn(),
      importData: vi.fn(),
      isLoading: false,
      reload: vi.fn(),
      removeEntry: vi.fn(),
      removeMetric: vi.fn(),
      status: 'ready',
      statusMessage: '',
      updateMetric: vi.fn(),
      upsertEntry: vi.fn(),
    });
  });

  it('builds the default daily summary and forwards derived props to page', () => {
    const pagePropsSpy = vi.fn();
    const dailySummary = makeSummary('daily', 'daily-1');

    vi.mocked(createDailyReportSummary).mockReturnValue(dailySummary);
    vi.mocked(createWeeklyReportSummary).mockReturnValue(makeSummary('weekly', 'weekly-1'));
    vi.mocked(createMonthlyReportSummary).mockReturnValue(makeSummary('monthly', 'monthly-1'));

    render(
      <ReportsRoute
        PageComponent={(props) => <TestPage {...props} onProps={pagePropsSpy} />}
        now={() => '2026-05-06T12:00:00.000Z'}
      />,
    );

    expect(createDailyReportSummary).toHaveBeenCalledWith(sampleEntries, '2026-05-06', {
      now: '2026-05-06T12:00:00.000Z',
      weekStartsOn: 1,
    });
    expect(createWeeklyReportSummary).not.toHaveBeenCalled();
    expect(createMonthlyReportSummary).not.toHaveBeenCalled();
    expect(screen.getByLabelText('summary-id')).toHaveTextContent('daily-1');
    expect(screen.getByLabelText('summary-type')).toHaveTextContent('daily');
    expect(screen.getByLabelText('reference-date')).toHaveTextContent('2026-05-06');
    expect(screen.getByLabelText('loading')).toHaveTextContent('false');
    expect(pagePropsSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        summary: dailySummary,
        summaryType: 'daily',
        referenceDate: '2026-05-06',
      }),
    );
  });

  it('rebuilds summary when period or reference date changes and keeps fixed now', async () => {
    const user = userEvent.setup();

    vi.mocked(createDailyReportSummary).mockReturnValue(makeSummary('daily', 'daily-1'));
    vi.mocked(createWeeklyReportSummary).mockReturnValue(makeSummary('weekly', 'weekly-1'));
    vi.mocked(createMonthlyReportSummary).mockReturnValue(makeSummary('monthly', 'monthly-1'));

    render(
      <ReportsRoute
        PageComponent={(props) => <TestPage {...props} onProps={() => {}} />}
        now={() => '2026-05-06T12:00:00.000Z'}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'weekly' }));

    expect(createWeeklyReportSummary).toHaveBeenLastCalledWith(sampleEntries, '2026-05-06', {
      now: '2026-05-06T12:00:00.000Z',
      weekStartsOn: 1,
    });
    expect(screen.getByLabelText('summary-id')).toHaveTextContent('weekly-1');
    expect(screen.getByLabelText('summary-type')).toHaveTextContent('weekly');

    await user.click(screen.getByRole('button', { name: 'set-date' }));

    expect(createWeeklyReportSummary).toHaveBeenLastCalledWith(sampleEntries, '2026-05-01', {
      now: '2026-05-06T12:00:00.000Z',
      weekStartsOn: 1,
    });
    expect(screen.getByLabelText('reference-date')).toHaveTextContent('2026-05-01');

    await user.click(screen.getByRole('button', { name: 'monthly' }));

    expect(createMonthlyReportSummary).toHaveBeenLastCalledWith(sampleEntries, '2026-05-01', {
      now: '2026-05-06T12:00:00.000Z',
      weekStartsOn: 1,
    });
    expect(screen.getByLabelText('summary-id')).toHaveTextContent('monthly-1');
    expect(screen.getByLabelText('summary-type')).toHaveTextContent('monthly');
  });
});
