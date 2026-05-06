import { FileText } from 'lucide-react';

import { SegmentedControl } from '../settings/components/SegmentedControl';
import { DisclaimerBlock } from './components/DisclaimerBlock';
import { EmptyState } from './components/EmptyState';
import { ReportOverview } from './components/ReportOverview';
import type { ReportPeriodType, ReportsPageProps } from './reportsPage.types';

const PERIOD_OPTIONS: Array<{
  description: string;
  label: string;
  value: ReportPeriodType;
}> = [
  { label: 'Diário', value: 'daily', description: 'Resumo do dia selecionado.' },
  { label: 'Semanal', value: 'weekly', description: 'Compara a semana atual com a anterior.' },
  { label: 'Mensal', value: 'monthly', description: 'Mostra cobertura e mudanças no mês.' },
];

const NO_RECORDS_OBSERVATION = 'Nenhum registro encontrado no periodo selecionado.';

function toSummaryTypeLabel(summaryType: ReportPeriodType): string {
  if (summaryType === 'daily') {
    return 'Diário';
  }

  if (summaryType === 'weekly') {
    return 'Semanal';
  }

  return 'Mensal';
}

function formatSummaryCreatedAt(createdAt: string): string {
  const parsed = new Date(createdAt);

  if (Number.isNaN(parsed.getTime())) {
    return createdAt;
  }

  return parsed.toLocaleString('pt-BR');
}

function hasReportData(summary: ReportsPageProps['summary']) {
  return !summary.observations.includes(NO_RECORDS_OBSERVATION);
}

export function ReportsPage({
  errorMessage,
  isLoading,
  referenceDate,
  summary,
  summaryType,
  onReferenceDateChange,
  onSummaryTypeChange,
}: ReportsPageProps) {
  const hasData = hasReportData(summary);
  const summaryLabel = toSummaryTypeLabel(summary.summaryType);
  const createdAtLabel = formatSummaryCreatedAt(summary.createdAt);

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-16">
      <header className="border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            Relatórios
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Resumos e análises geradas deterministicamente com base nos seus registros.
          </p>
        </div>
      </header>

      {errorMessage ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}

      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SegmentedControl<ReportPeriodType>
              legend="Período do Relatório"
              description="Troque a janela de análise sem perder a mesma data de referência."
              onChange={onSummaryTypeChange}
              value={summaryType}
              options={PERIOD_OPTIONS}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="report-date" className="text-sm font-medium text-foreground">
              Data de Referência
            </label>
            <input
              id="report-date"
              type="date"
              value={referenceDate}
              onChange={(event) => onReferenceDateChange(event.target.value)}
              className="min-h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {summaryType === 'daily'
                ? 'Selecione o dia desejado.'
                : summaryType === 'weekly'
                  ? 'Selecione qualquer data dentro da semana desejada.'
                  : 'Selecione qualquer data dentro do mês desejado.'}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-border bg-card px-5 py-6 text-sm text-muted-foreground shadow-sm">
            Carregando registros para montar o relatório...
          </div>
        ) : hasData ? (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm md:col-span-2">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Janela analisada
                </p>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Início</p>
                    <p className="text-lg font-semibold text-foreground">{summary.period.startDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fim</p>
                    <p className="text-lg font-semibold text-foreground">{summary.period.endDate}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Resumo pronto
                </p>
                <p className="mt-3 text-3xl font-semibold text-foreground">{summaryLabel}</p>
                <p className="mt-2 text-sm text-muted-foreground">Gerado em {createdAtLabel}</p>
              </div>
            </div>

            <main className="space-y-6">
              <ReportOverview summary={summary} />
              <DisclaimerBlock disclaimer={summary.disclaimer} />
            </main>
          </>
        ) : (
          <EmptyState referenceDate={referenceDate} />
        )}
      </div>
    </div>
  );
}
