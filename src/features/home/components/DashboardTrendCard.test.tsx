import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { DashboardTrendCard } from './DashboardTrendCard';
import type { DailyHealthEntry } from '../../../types/health';
import type { ChartConfig } from '../charts/metricChartConfig';
import type { DateRange } from '../../../lib/charts/types';

// Mock TrendChart to avoid Recharts jsdom flake
vi.mock('./TrendChart', () => ({
  TrendChart: ({ ariaLabel }: { ariaLabel: string }) => (
    <div data-testid="trend-chart" aria-label={ariaLabel} />
  ),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const RANGE: DateRange = { start: '2026-04-08', end: '2026-05-07' };

const WEIGHT_CONFIG: ChartConfig = {
  key: 'weight',
  title: 'Peso',
  series: [{ metricType: 'weight', label: 'Peso', colorVar: '--chart-weight' }],
  unit: 'kg',
  decimals: 1,
  direction: 'neutral',
  comparisonLabel: 'vs. período anterior',
};

const BP_CONFIG: ChartConfig = {
  key: 'bloodPressure',
  title: 'Pressão Arterial',
  series: [
    { metricType: 'bloodPressureSystolic', label: 'Sistólica', colorVar: '--chart-heart' },
    { metricType: 'bloodPressureDiastolic', label: 'Diastólica', colorVar: '--chart-2' },
  ],
  unit: 'mmHg',
  decimals: 0,
  direction: 'neutral',
  comparisonLabel: 'vs. período anterior',
};

let entryCounter = 0;

function makeEntry(
  date: string,
  metrics: DailyHealthEntry['metrics'],
): DailyHealthEntry {
  const id = `entry-${++entryCounter}`;
  return {
    id,
    date,
    metrics,
    createdAt: `${date}T00:00:00Z`,
    updatedAt: `${date}T00:00:00Z`,
  };
}

function makeMetricEntry(
  metricType: string,
  value: number,
  unit: string,
): import('../../../types/health').HealthMetricEntry {
  return {
    id: `m-${entryCounter}-${metricType}`,
    metricType,
    value,
    unit,
    recordedAt: new Date().toISOString(),
    source: 'manual',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function renderCard(config: ChartConfig, entries: DailyHealthEntry[]) {
  return render(
    <MemoryRouter>
      <DashboardTrendCard config={config} entries={entries} range={RANGE} />
    </MemoryRouter>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DashboardTrendCard', () => {
  it('zero entries → renders empty state CTA; no chart; no delta pill', () => {
    renderCard(WEIGHT_CONFIG, []);

    // Empty state CTA must be visible
    expect(screen.getByRole('link', { name: 'Adicionar Medição' })).toBeInTheDocument();

    // No chart
    expect(screen.queryByTestId('trend-chart')).not.toBeInTheDocument();

    // No delta pill (role=status is used by TrendDeltaPill)
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('single point → renders TrendInsufficientDataNote AND TrendChart; no delta pill', () => {
    const entries = [
      makeEntry('2026-05-01', {
        weight: [makeMetricEntry('weight', 80, 'kg')],
      }),
    ];

    renderCard(WEIGHT_CONFIG, entries);

    // Insufficient data note
    expect(
      screen.getByText('Necessário pelo menos 2 registros para visualizar a tendência.'),
    ).toBeInTheDocument();

    // Chart placeholder (mock)
    expect(screen.getByTestId('trend-chart')).toBeInTheDocument();

    // No delta pill
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('multiple points (single-series, weight) → renders TrendChart and delta pill with formatted delta + comparison label', () => {
    const entries = [
      makeEntry('2026-04-10', {
        weight: [makeMetricEntry('weight', 80, 'kg')],
      }),
      makeEntry('2026-04-20', {
        weight: [makeMetricEntry('weight', 78.5, 'kg')],
      }),
      makeEntry('2026-05-01', {
        weight: [makeMetricEntry('weight', 77, 'kg')],
      }),
    ];

    renderCard(WEIGHT_CONFIG, entries);

    // Chart placeholder
    expect(screen.getByTestId('trend-chart')).toBeInTheDocument();

    // Delta pill present (role=status)
    const pill = screen.getByRole('status');
    expect(pill).toBeInTheDocument();

    // Delta is 77 - 80 = -3 kg. Formatted as "-3 kg" in pt-BR
    expect(pill).toHaveTextContent('kg');
    expect(pill).toHaveTextContent('vs. período anterior');
  });

  it('multiple points (multi-series BP) → uses systolic series for delta; pill shows mmHg unit and 0 decimals', () => {
    const entries = [
      makeEntry('2026-04-10', {
        bloodPressureSystolic: [makeMetricEntry('bloodPressureSystolic', 120, 'mmHg')],
        bloodPressureDiastolic: [makeMetricEntry('bloodPressureDiastolic', 80, 'mmHg')],
      }),
      makeEntry('2026-04-20', {
        bloodPressureSystolic: [makeMetricEntry('bloodPressureSystolic', 125, 'mmHg')],
        bloodPressureDiastolic: [makeMetricEntry('bloodPressureDiastolic', 82, 'mmHg')],
      }),
    ];

    renderCard(BP_CONFIG, entries);

    // Chart placeholder
    expect(screen.getByTestId('trend-chart')).toBeInTheDocument();

    // Delta pill present
    const pill = screen.getByRole('status');
    expect(pill).toBeInTheDocument();

    // Systolic delta = 125 - 120 = +5 mmHg
    expect(pill).toHaveTextContent('mmHg');

    // aria-label confirms the value and comparison label
    const ariaLabel = pill.getAttribute('aria-label') ?? '';
    expect(ariaLabel).toContain('mmHg');
    expect(ariaLabel).toContain('vs. período anterior');
  });

  it('card has accessible heading at level 3 with config.title', () => {
    renderCard(WEIGHT_CONFIG, []);

    expect(
      screen.getByRole('heading', { level: 3, name: WEIGHT_CONFIG.title }),
    ).toBeInTheDocument();
  });

  it('delta pill hidden when all metrics return null delta (no entries with values)', () => {
    // Two entries but with metrics that don't match the config
    const entries = [
      makeEntry('2026-04-10', {
        sleepDuration: [makeMetricEntry('sleepDuration', 7, 'h')],
      }),
      makeEntry('2026-04-11', {
        sleepDuration: [makeMetricEntry('sleepDuration', 8, 'h')],
      }),
    ];

    // WEIGHT_CONFIG looks for 'weight' — so these entries produce null delta
    renderCard(WEIGHT_CONFIG, entries);

    // No delta pill since totalCount === 0 → empty state
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Adicionar Medição' })).toBeInTheDocument();
  });
});
