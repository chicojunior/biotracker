import {
  compareDateKeys,
  countMissingDateKeys,
  enumerateDateKeysInRange,
  getDayRange,
  getMonthRange,
  getWeekRange,
  isDateKeyInRange,
  normalizeDateKey,
  type DateRange,
} from '../dates/dateRanges';
import type {
  DailyHealthEntry,
  HealthMetricEntry,
  HealthMetricType,
  ReportSummary,
} from '../../types/health';

type ReportSummaryType = ReportSummary['summaryType'];

type ReportBuildOptions = {
  now: string;
  weekStartsOn?: number;
};

const DEFAULT_DISCLAIMER =
  'Resumo informativo para acompanhamento de rotina. Este conteudo nao realiza diagnostico nem orientacao medica.';

function toIsoString(value: string): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid now timestamp: ${value}`);
  }

  return parsed.toISOString();
}

function clampToThreeDecimals(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function formatDelta(value: number): string {
  const rounded = clampToThreeDecimals(value);

  if (rounded > 0) {
    return `+${rounded}`;
  }

  return String(rounded);
}

function addDays(dateKey: string, days: number): string {
  const normalized = normalizeDateKey(dateKey);
  const [year, month, day] = normalized.split('-').map(Number);
  const date = new Date(year, month - 1, day + days, 12);

  return normalizeDateKey(date);
}

function shiftRangeByDays(range: DateRange, days: number): DateRange {
  return {
    start: addDays(range.start, days),
    end: addDays(range.end, days),
  };
}

function getPreviousRange(summaryType: ReportSummaryType, range: DateRange): DateRange {
  if (summaryType === 'daily') {
    return shiftRangeByDays(range, -1);
  }

  if (summaryType === 'weekly') {
    const dayCount = enumerateDateKeysInRange(range).length;
    return shiftRangeByDays(range, -dayCount);
  }

  const dayBeforeCurrentMonth = addDays(range.start, -1);
  return getMonthRange(dayBeforeCurrentMonth);
}

function selectEntryByRange(entries: DailyHealthEntry[], range: DateRange): DailyHealthEntry[] {
  return entries
    .filter((entry) => isDateKeyInRange(entry.date, range))
    .slice()
    .sort((left, right) => compareDateKeys(left.date, right.date));
}

function getAllMetricTypes(entries: DailyHealthEntry[]): HealthMetricType[] {
  const metricTypes = new Set<HealthMetricType>();

  for (const entry of entries) {
    for (const metricType of Object.keys(entry.metrics) as HealthMetricType[]) {
      metricTypes.add(metricType);
    }
  }

  return Array.from(metricTypes).sort((left, right) => left.localeCompare(right));
}

function getMetricTypesForPeriod(entries: DailyHealthEntry[]): Set<HealthMetricType> {
  const metricTypes = new Set<HealthMetricType>();

  for (const entry of entries) {
    for (const metricType of Object.keys(entry.metrics) as HealthMetricType[]) {
      const metricEntries = entry.metrics[metricType];
      if (metricEntries && metricEntries.length > 0) {
        metricTypes.add(metricType);
      }
    }
  }

  return metricTypes;
}

function isFiniteNumber(value: HealthMetricEntry['value']): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function getNumericMetricAverages(entries: DailyHealthEntry[]): Map<HealthMetricType, number> {
  const totals = new Map<HealthMetricType, { sum: number; count: number }>();

  for (const entry of entries) {
    for (const metricType of Object.keys(entry.metrics) as HealthMetricType[]) {
      const metricEntries = entry.metrics[metricType] ?? [];

      for (const metricEntry of metricEntries) {
        if (!isFiniteNumber(metricEntry.value)) {
          continue;
        }

        const current = totals.get(metricType) ?? { sum: 0, count: 0 };
        totals.set(metricType, {
          sum: current.sum + metricEntry.value,
          count: current.count + 1,
        });
      }
    }
  }

  const averages = new Map<HealthMetricType, number>();

  for (const [metricType, metricTotals] of totals) {
    averages.set(metricType, clampToThreeDecimals(metricTotals.sum / metricTotals.count));
  }

  return averages;
}

function buildChangeObservations(
  currentEntries: DailyHealthEntry[],
  previousEntries: DailyHealthEntry[],
): string[] {
  const currentAverages = getNumericMetricAverages(currentEntries);
  const previousAverages = getNumericMetricAverages(previousEntries);
  const deltas: Array<{ metricType: HealthMetricType; delta: number }> = [];

  for (const [metricType, currentValue] of currentAverages) {
    const previousValue = previousAverages.get(metricType);

    if (previousValue === undefined) {
      continue;
    }

    const delta = clampToThreeDecimals(currentValue - previousValue);

    if (Math.abs(delta) < 0.001) {
      continue;
    }

    deltas.push({ metricType, delta });
  }

  deltas.sort((left, right) => {
    if (Math.abs(right.delta) !== Math.abs(left.delta)) {
      return Math.abs(right.delta) - Math.abs(left.delta);
    }

    return left.metricType.localeCompare(right.metricType);
  });

  if (deltas.length === 0) {
    return ['Sem variacoes metricas relevantes em comparacao ao periodo anterior.'];
  }

  return deltas
    .slice(0, 3)
    .map(
      ({ metricType, delta }) =>
        `Comparado ao periodo anterior, ${metricType} variou ${formatDelta(delta)}.`,
    );
}

function buildConsistency(
  range: DateRange,
  currentEntries: DailyHealthEntry[],
  expectedMetrics: HealthMetricType[],
): ReportSummary['consistency'] {
  const totalDays = enumerateDateKeysInRange(range).length;
  const presentDateKeys = new Set(currentEntries.map((entry) => normalizeDateKey(entry.date)));
  const missingDates = countMissingDateKeys(presentDateKeys, range);
  const presentDays = totalDays - missingDates;

  const periodMetricTypes = getMetricTypesForPeriod(currentEntries);
  const metricCoverage =
    expectedMetrics.length === 0 ? 0 : periodMetricTypes.size / expectedMetrics.length;
  const dayCoverage = totalDays === 0 ? 0 : presentDays / totalDays;
  const score = Math.round((dayCoverage * 0.7 + metricCoverage * 0.3) * 100);

  return {
    score,
    notes:
      `Cobertura de dias: ${presentDays}/${totalDays}. ` +
      `Cobertura de metricas esperadas: ${periodMetricTypes.size}/${expectedMetrics.length}.`,
  };
}

function getRangeForSummaryType(
  summaryType: ReportSummaryType,
  referenceDate: string,
  weekStartsOn: number,
): DateRange {
  if (summaryType === 'daily') {
    return getDayRange(referenceDate);
  }

  if (summaryType === 'weekly') {
    return getWeekRange(referenceDate, weekStartsOn);
  }

  return getMonthRange(referenceDate);
}

function buildBaseObservations(range: DateRange, currentEntries: DailyHealthEntry[]): string[] {
  if (currentEntries.length === 0) {
    return ['Nenhum registro encontrado no periodo selecionado.'];
  }

  const totalDays = enumerateDateKeysInRange(range).length;
  const presentDays = new Set(currentEntries.map((entry) => normalizeDateKey(entry.date))).size;

  return [`Periodo coberto por ${presentDays} de ${totalDays} dias com registro.`];
}

function createSummary(
  summaryType: ReportSummaryType,
  entries: DailyHealthEntry[],
  referenceDate: string,
  options: ReportBuildOptions,
): ReportSummary {
  const weekStartsOn = options.weekStartsOn ?? 1;
  const createdAt = toIsoString(options.now);
  const range = getRangeForSummaryType(summaryType, referenceDate, weekStartsOn);
  const currentEntries = selectEntryByRange(entries, range);
  const previousRange = getPreviousRange(summaryType, range);
  const previousEntries = selectEntryByRange(entries, previousRange);

  const expectedMetrics = getAllMetricTypes(entries);
  const currentMetricTypes = getMetricTypesForPeriod(currentEntries);
  const missingData = expectedMetrics.filter((metricType) => !currentMetricTypes.has(metricType));
  const hasData = currentEntries.length > 0;

  const observations = [
    ...buildBaseObservations(range, currentEntries),
    ...buildChangeObservations(currentEntries, previousEntries),
  ];

  if (missingData.length > 0) {
    observations.push(`Dados ausentes no periodo: ${missingData.join(', ')}.`);
  }

  return {
    id: `${summaryType}:${range.start}:${range.end}`,
    summaryType,
    period: {
      startDate: range.start,
      endDate: range.end,
    },
    hasData,
    observations,
    missingData,
    consistency: buildConsistency(range, currentEntries, expectedMetrics),
    disclaimer: DEFAULT_DISCLAIMER,
    createdAt,
  };
}

export function createDailyReportSummary(
  entries: DailyHealthEntry[],
  referenceDate: string,
  options: ReportBuildOptions,
): ReportSummary {
  return createSummary('daily', entries, referenceDate, options);
}

export function createWeeklyReportSummary(
  entries: DailyHealthEntry[],
  referenceDate: string,
  options: ReportBuildOptions,
): ReportSummary {
  return createSummary('weekly', entries, referenceDate, options);
}

export function createMonthlyReportSummary(
  entries: DailyHealthEntry[],
  referenceDate: string,
  options: ReportBuildOptions,
): ReportSummary {
  return createSummary('monthly', entries, referenceDate, options);
}
