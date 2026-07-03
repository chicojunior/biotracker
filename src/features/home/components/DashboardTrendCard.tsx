import type { ReactElement } from 'react';
import type { DailyHealthEntry, HealthMetricType } from '../../../types/health';
import type { ChartConfig } from '../charts/metricChartConfig';
import type { DateRange } from '../../../lib/charts/types';
import { buildTrendSeries } from '../../../lib/charts/buildTrendSeries';
import { TrendChart } from './TrendChart';
import { TrendEmptyState } from './TrendEmptyState';
import { TrendInsufficientDataNote } from './TrendInsufficientDataNote';
import { TrendDeltaPill } from './TrendDeltaPill';

export type DashboardTrendCardProps = {
  config: ChartConfig;
  entries: DailyHealthEntry[];
  range: DateRange;
  preferredSources?: Partial<Record<HealthMetricType, string>>;
};

export function DashboardTrendCard({
  config,
  entries,
  range,
  preferredSources,
}: DashboardTrendCardProps): ReactElement {
  const result = buildTrendSeries({
    entries,
    metricTypes: config.series.map((s) => s.metricType),
    range,
    targetUnits: Object.fromEntries(config.series.map((s) => [s.metricType, config.unit])),
    preferredSources,
  });

  const totalCount = result.metrics.reduce((sum, m) => sum + m.count, 0);

  // Multi-series cards show systolic delta as the primary signal.
  const primaryDelta = result.metrics[0]?.delta ?? null;

  return (
    <article className="flex flex-col rounded-xl border border-border bg-card p-4 shadow-sm min-h-[280px]">
      <header className="flex items-start justify-between gap-2 mb-3">
        <h3 className="text-sm font-medium text-muted-foreground">{config.title}</h3>
        {primaryDelta !== null && totalCount >= 2 && (
          <TrendDeltaPill
            delta={primaryDelta}
            unit={config.unit}
            decimals={config.decimals}
            comparisonLabel={config.comparisonLabel}
            direction={config.direction}
          />
        )}
      </header>
      <div className="flex-1">
        {totalCount === 0 ? (
          <TrendEmptyState metricLabel={config.title} />
        ) : totalCount === 1 ? (
          <>
            <TrendInsufficientDataNote />
            <TrendChart
              data={result.data}
              series={config.series.map((s) => ({
                dataKey: s.metricType,
                label: s.label,
                colorVar: s.colorVar,
              }))}
              unit={config.unit}
              decimals={config.decimals}
              ariaLabel={`Tendência: ${config.title}`}
              caption={`Gráfico de linha mostrando ${config.title} ao longo do período selecionado.`}
              height={220}
            />
          </>
        ) : (
          <TrendChart
            data={result.data}
            series={config.series.map((s) => ({
              dataKey: s.metricType,
              label: s.label,
              colorVar: s.colorVar,
            }))}
            unit={config.unit}
            decimals={config.decimals}
            ariaLabel={`Tendência: ${config.title}`}
            caption={`Gráfico de linha mostrando ${config.title} ao longo do período selecionado.`}
            height={220}
          />
        )}
      </div>
    </article>
  );
}
