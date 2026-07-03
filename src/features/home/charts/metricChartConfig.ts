import type { HealthMetricType } from '../../../types/health';

export type ChartDirection = 'higher-is-better' | 'lower-is-better' | 'neutral';

export type ChartSeriesConfig = {
  metricType: HealthMetricType;
  label: string;
  colorVar: string;
};

export type ChartConfig = {
  key: DashboardMetricKey;
  title: string;
  series: ChartSeriesConfig[];
  unit: string;
  decimals: number;
  direction: ChartDirection;
  comparisonLabel: string;
};

export type DashboardMetricKey =
  | 'weight'
  | 'bodyFat'
  | 'muscleMass'
  | 'bloodPressure'
  | 'restingHeartRate'
  | 'sleepDuration';

export const METRIC_CHART_CONFIGS: Record<DashboardMetricKey, ChartConfig> = {
  weight: {
    key: 'weight',
    title: 'Peso',
    series: [{ metricType: 'weight', label: 'Peso', colorVar: '--chart-weight' }],
    unit: 'kg',
    decimals: 1,
    direction: 'neutral',
    comparisonLabel: 'vs. período anterior',
  },
  bodyFat: {
    key: 'bodyFat',
    title: 'Gordura Corporal',
    series: [{ metricType: 'bodyFatPercentage', label: 'Gordura Corporal', colorVar: '--chart-body-fat' }],
    unit: '%',
    decimals: 1,
    direction: 'neutral',
    comparisonLabel: 'vs. período anterior',
  },
  muscleMass: {
    key: 'muscleMass',
    title: 'Massa Muscular',
    series: [{ metricType: 'muscleMass', label: 'Massa Muscular', colorVar: '--chart-muscle' }],
    unit: 'kg',
    decimals: 1,
    direction: 'neutral',
    comparisonLabel: 'vs. período anterior',
  },
  bloodPressure: {
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
  },
  restingHeartRate: {
    key: 'restingHeartRate',
    title: 'Frequência de Repouso',
    series: [{ metricType: 'restingHeartRate', label: 'Frequência de Repouso', colorVar: '--chart-heart' }],
    unit: 'bpm',
    decimals: 0,
    direction: 'neutral',
    comparisonLabel: 'vs. período anterior',
  },
  sleepDuration: {
    key: 'sleepDuration',
    title: 'Sono',
    series: [{ metricType: 'sleepDuration', label: 'Sono', colorVar: '--chart-sleep' }],
    unit: 'h',
    decimals: 1,
    direction: 'neutral',
    comparisonLabel: 'vs. período anterior',
  },
};

export const DASHBOARD_METRIC_ORDER: DashboardMetricKey[] = [
  'weight',
  'bodyFat',
  'muscleMass',
  'bloodPressure',
  'restingHeartRate',
  'sleepDuration',
];
