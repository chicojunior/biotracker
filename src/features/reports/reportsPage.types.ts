import type { ReportSummary } from '../../types/health';

export type ReportPeriodType = ReportSummary['summaryType'];

export type ReportsPageProps = {
  errorMessage: string;
  isLoading: boolean;
  referenceDate: string;
  summary: ReportSummary;
  summaryType: ReportPeriodType;
  onReferenceDateChange: (nextDate: string) => void;
  onSummaryTypeChange: (nextType: ReportPeriodType) => void;
};
