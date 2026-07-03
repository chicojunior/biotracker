import { useMemo } from 'react';
import { Activity, Plus, Heart, Moon, Footprints } from 'lucide-react';
import { Link } from 'react-router-dom';

import { normalizeDateKey, type DateRange } from '../../lib/dates/dateRanges';
import type { HealthMetricEntry, HealthMetricType } from '../../types/health';
import { useHealthData } from '../health/hooks/useHealthData';
import { useSettings } from '../settings/hooks/useSettings';
import { DASHBOARD_METRIC_ORDER, METRIC_CHART_CONFIGS } from './charts/metricChartConfig';
import { DashboardTrendCard } from './components/DashboardTrendCard';

function getTimestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function selectMetricEntry(
  entries: HealthMetricEntry[] | undefined,
  preferredSource?: string,
): HealthMetricEntry | undefined {
  if (!entries || entries.length === 0) {
    return undefined;
  }

  const sourceFiltered = preferredSource
    ? entries.filter((entry) => entry.source === preferredSource)
    : entries;
  const sourceCandidates = sourceFiltered.length > 0 ? sourceFiltered : entries;

  const preferredCandidates = sourceCandidates.filter((entry) => entry.isPreferredSource);
  const metricEntries = preferredCandidates.length > 0 ? preferredCandidates : sourceCandidates;

  return [...metricEntries].sort(
    (left, right) => getTimestamp(right.recordedAt) - getTimestamp(left.recordedAt),
  )[0];
}

function renderMetricValue(
  entry: HealthMetricEntry | undefined,
  fallbackUnit: string,
  formatOptions: Intl.NumberFormatOptions,
): string {
  if (!entry || typeof entry.value !== 'number' || !Number.isFinite(entry.value)) {
    return '--';
  }

  const formatter = new Intl.NumberFormat('pt-BR', formatOptions);
  const unit = entry.unit ?? fallbackUnit;
  const suffix = unit ? ` ${unit}` : '';

  return `${formatter.format(entry.value)}${suffix}`;
}

function getLast30DayRange(today: Date): DateRange {
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29, 12);

  return {
    start: normalizeDateKey(start),
    end: normalizeDateKey(end),
  };
}

export function HomePage() {
  const { entries, isLoading } = useHealthData();
  const { settings } = useSettings();

  const today = useMemo(() => new Date(), []);
  const todayDate = useMemo(() => normalizeDateKey(today), [today]);
  const trendRange = useMemo(() => getLast30DayRange(today), [today]);
  const todayEntry = useMemo(
    () => entries.find((entry) => entry.date === todayDate),
    [entries, todayDate],
  );
  const preferredSources = useMemo(
    () =>
      DASHBOARD_METRIC_ORDER.reduce<Partial<Record<HealthMetricType, string>>>(
        (result, metricKey) => {
          for (const series of METRIC_CHART_CONFIGS[metricKey].series) {
            const preferredSource = settings.metricPreferences[series.metricType]?.source;

            if (preferredSource) {
              result[series.metricType] = preferredSource;
            }
          }

          return result;
        },
        {},
      ),
    [settings.metricPreferences],
  );

  const todayWeightEntry = selectMetricEntry(
    todayEntry?.metrics.weight,
    settings.metricPreferences.weight?.source,
  );
  const todaySleepDurationEntry = selectMetricEntry(
    todayEntry?.metrics.sleepDuration,
    settings.metricPreferences.sleepDuration?.source,
  );
  const todayRestingHeartRateEntry = selectMetricEntry(
    todayEntry?.metrics.restingHeartRate,
    settings.metricPreferences.restingHeartRate?.source,
  );
  const todayDailyStepsEntry = selectMetricEntry(
    todayEntry?.metrics.dailySteps,
    settings.metricPreferences.dailySteps?.source,
  );

  const hasTodayEntry = Boolean(todayEntry);

  return (
    <div className="space-y-6 p-4 md:p-8">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Bem-vindo de volta! Aqui está o seu resumo de hoje.</p>
        </div>
      </header>

      <section aria-label="Métricas Diárias" className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {/* Metric Cards */}
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm flex flex-col justify-between aspect-square md:aspect-auto md:min-h-[140px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Peso Atual</span>
            <Activity size={16} className="text-primary" />
          </div>
          <div className="text-2xl font-bold">
            {renderMetricValue(todayWeightEntry, settings.metricPreferences.weight?.unit ?? 'kg', {
              maximumFractionDigits: 1,
              minimumFractionDigits: 0,
            })}
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 border border-border shadow-sm flex flex-col justify-between aspect-square md:aspect-auto md:min-h-[140px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Sono</span>
            <Moon size={16} className="text-[hsl(var(--chart-sleep))]" />
          </div>
          <div className="text-2xl font-bold">
            {renderMetricValue(
              todaySleepDurationEntry,
              settings.metricPreferences.sleepDuration?.unit ?? 'hours',
              {
                maximumFractionDigits: 1,
                minimumFractionDigits: 0,
              },
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 border border-border shadow-sm flex flex-col justify-between aspect-square md:aspect-auto md:min-h-[140px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Repouso</span>
            <Heart size={16} className="text-[hsl(var(--chart-heart))]" />
          </div>
          <div className="text-2xl font-bold">
            {renderMetricValue(
              todayRestingHeartRateEntry,
              settings.metricPreferences.restingHeartRate?.unit ?? 'bpm',
              {
                maximumFractionDigits: 0,
              },
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 border border-border shadow-sm flex flex-col justify-between aspect-square md:aspect-auto md:min-h-[140px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Passos</span>
            <Footprints size={16} className="text-primary" />
          </div>
          <div className="text-2xl font-bold">
            {renderMetricValue(todayDailyStepsEntry, settings.metricPreferences.dailySteps?.unit ?? 'steps', {
              maximumFractionDigits: 0,
            })}
          </div>
        </div>
      </section>

      <section aria-labelledby="dashboard-trends" className="pt-2">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="dashboard-trends" className="text-xl font-semibold text-foreground">Tendências</h2>
            <p className="text-sm text-muted-foreground">Últimos 30 dias</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {DASHBOARD_METRIC_ORDER.map((metricKey) => (
            <DashboardTrendCard
              key={metricKey}
              config={METRIC_CHART_CONFIGS[metricKey]}
              entries={entries}
              range={trendRange}
              preferredSources={preferredSources}
            />
          ))}
        </div>
      </section>

      <section aria-label="Registro" className="pt-4 md:pt-8">
        <h2 className="text-xl font-semibold mb-4 text-foreground">Registro Rápido</h2>
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-4 min-h-[220px]">
          <div className="rounded-full bg-primary/10 p-5">
            <Plus size={32} className="text-primary" />
          </div>
          <p className="text-muted-foreground font-medium max-w-xs">
            {isLoading
              ? 'Carregando dados de hoje...'
              : hasTodayEntry
                ? 'Você já registrou dados hoje. Atualize sua entrada sempre que necessário.'
                : 'Nenhum dado registrado hoje. Mantenha seu histórico atualizado.'}
          </p>
          <Link
            to="/entry"
            className="rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {hasTodayEntry ? 'Editar Medição de Hoje' : 'Adicionar Medição'}
          </Link>
        </div>
      </section>
    </div>
  );
}
