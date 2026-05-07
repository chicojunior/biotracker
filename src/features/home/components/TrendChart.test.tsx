import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TrendChart, type TrendChartProps } from './TrendChart';

// Mock recharts components for stable jsdom rendering.
// LineChart in jsdom gets zero dimensions and renders nothing — so we mock the
// chart container stack to directly render children and replace Legend with a
// predictable div so assertions against `.recharts-legend-wrapper` work.
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({
      children,
      height,
    }: {
      children: React.ReactElement;
      height?: number;
    }) => (
      <div data-testid="responsive-container" style={{ width: 600, height: height ?? 220 }}>
        {children}
      </div>
    ),
    LineChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="line-chart">{children}</div>
    ),
    Line: ({ dataKey }: { dataKey: string }) => (
      <div data-testid={`line-${dataKey}`} />
    ),
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />,
    Tooltip: () => <div data-testid="tooltip" />,
    Legend: ({
      wrapperStyle,
    }: {
      wrapperStyle?: React.CSSProperties;
    }) => (
      <div className="recharts-legend-wrapper" style={wrapperStyle} />
    ),
  };
});

const singleSeries: TrendChartProps['series'] = [
  { dataKey: 'weight', label: 'Peso', colorVar: '--chart-weight' },
];

const multiSeries: TrendChartProps['series'] = [
  { dataKey: 'systolic', label: 'Sistólica', colorVar: '--chart-heart' },
  { dataKey: 'diastolic', label: 'Diastólica', colorVar: '--chart-2' },
];

const threePoints: TrendChartProps['data'] = [
  { date: '2024-01-01', weight: 80 },
  { date: '2024-01-02', weight: 79.5 },
  { date: '2024-01-03', weight: 79.2 },
];

const bpPoints: TrendChartProps['data'] = [
  { date: '2024-01-01', systolic: 120, diastolic: 80 },
  { date: '2024-01-02', systolic: 118, diastolic: 78 },
  { date: '2024-01-03', systolic: 122, diastolic: 82 },
];

describe('TrendChart', () => {
  it('renders figure with aria-label and figcaption', () => {
    const { container } = render(
      <div style={{ width: 600, height: 400 }}>
        <TrendChart
          data={threePoints}
          series={singleSeries}
          unit="kg"
          decimals={1}
          ariaLabel="Tendência de peso"
          caption="Gráfico de linha mostrando peso ao longo do período"
        />
      </div>,
    );

    expect(screen.getByRole('img', { name: 'Tendência de peso' })).toBeInTheDocument();
    expect(
      screen.getByText('Gráfico de linha mostrando peso ao longo do período'),
    ).toBeInTheDocument();

    // figcaption should be in the document (even if visually hidden)
    const figcaption = container.querySelector('figcaption');
    expect(figcaption).toBeInTheDocument();
    expect(figcaption).toHaveClass('sr-only');
  });

  it('single series → no legend rendered', () => {
    const { container } = render(
      <div style={{ width: 600, height: 400 }}>
        <TrendChart
          data={threePoints}
          series={singleSeries}
          unit="kg"
          decimals={1}
          ariaLabel="Peso"
          caption="Gráfico de peso"
        />
      </div>,
    );

    expect(container.querySelectorAll('.recharts-legend-wrapper')).toHaveLength(0);
  });

  it('multi-series → legend present and both labels in document', () => {
    const { container } = render(
      <div style={{ width: 600, height: 400 }}>
        <TrendChart
          data={bpPoints}
          series={multiSeries}
          unit="mmHg"
          decimals={0}
          ariaLabel="Pressão Arterial"
          caption="Gráfico de pressão arterial"
        />
      </div>,
    );

    // The mocked Legend renders a div with recharts-legend-wrapper class
    expect(container.querySelectorAll('.recharts-legend-wrapper')).toHaveLength(1);
    // Both series Line elements appear (one per dataKey)
    expect(container.querySelector('[data-testid="line-systolic"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="line-diastolic"]')).toBeInTheDocument();
  });

  it('empty data → still renders figure without crashing', () => {
    render(
      <div style={{ width: 600, height: 400 }}>
        <TrendChart
          data={[]}
          series={singleSeries}
          unit="kg"
          decimals={1}
          ariaLabel="Peso vazio"
          caption="Sem dados disponíveis"
        />
      </div>,
    );

    expect(screen.getByRole('img', { name: 'Peso vazio' })).toBeInTheDocument();
  });
});
