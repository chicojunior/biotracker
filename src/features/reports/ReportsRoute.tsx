import { useMemo, useState, type ComponentType } from 'react';

import { useHealthData } from '../health/hooks/useHealthData';
import {
  createDailyReportSummary,
  createMonthlyReportSummary,
  createWeeklyReportSummary,
} from '../../lib/reports/reportEngine';
import type { ReportSummary } from '../../types/health';
import type { ReportPeriodType, ReportsPageProps } from './reportsPage.types';

type ReportsRouteProps = {
  PageComponent: ComponentType<ReportsPageProps>;
  initialReferenceDate?: string;
  initialSummaryType?: ReportPeriodType;
  now?: () => string;
  weekStartsOn?: number;
};

function toReferenceDateKey(timestamp: string): string {
  const parsed = new Date(timestamp);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid now timestamp: ${timestamp}`);
  }

  return parsed.toISOString().slice(0, 10);
}

function createSummary(
  summaryType: ReportPeriodType,
  entries: ReturnType<typeof useHealthData>['entries'],
  referenceDate: string,
  now: string,
  weekStartsOn: number,
): ReportSummary {
  const options = {
    now,
    weekStartsOn,
  };

  if (summaryType === 'daily') {
    return createDailyReportSummary(entries, referenceDate, options);
  }

  if (summaryType === 'weekly') {
    return createWeeklyReportSummary(entries, referenceDate, options);
  }

  return createMonthlyReportSummary(entries, referenceDate, options);
}

export function ReportsRoute({
  PageComponent,
  initialReferenceDate,
  initialSummaryType = 'daily',
  now = () => new Date().toISOString(),
  weekStartsOn = 1,
}: ReportsRouteProps) {
  const [fixedNow] = useState<string>(() => now());
  const [summaryType, setSummaryType] = useState<ReportPeriodType>(initialSummaryType);
  const [referenceDate, setReferenceDate] = useState(() => {
    if (initialReferenceDate) {
      return initialReferenceDate;
    }

    return toReferenceDateKey(fixedNow);
  });

  const healthData = useHealthData();

  const summary = useMemo(
    () => createSummary(summaryType, healthData.entries, referenceDate, fixedNow, weekStartsOn),
    [fixedNow, healthData.entries, referenceDate, summaryType, weekStartsOn],
  );

  return (
    <PageComponent
      errorMessage={healthData.errorMessage}
      isLoading={healthData.isLoading}
      onReferenceDateChange={setReferenceDate}
      onSummaryTypeChange={setSummaryType}
      referenceDate={referenceDate}
      summary={summary}
      summaryType={summaryType}
    />
  );
}
