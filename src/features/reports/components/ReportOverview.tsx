import { Activity, AlertTriangle, ShieldCheck } from 'lucide-react';

import type { ReportSummary } from '../../../types/health';
import { ReportSection } from './ReportSection';

type ReportOverviewProps = {
  summary: ReportSummary;
};

function toSummaryLabel(summaryType: ReportSummary['summaryType']) {
  if (summaryType === 'daily') {
    return 'Diário';
  }

  if (summaryType === 'weekly') {
    return 'Semanal';
  }

  return 'Mensal';
}

export function ReportOverview({ summary }: ReportOverviewProps) {
  const summaryLabel = toSummaryLabel(summary.summaryType);

  return (
    <div className="space-y-6">
      <ReportSection
        title={`Observações ${summaryLabel.toLowerCase()}`}
        icon={<Activity className="h-6 w-6" />}
      >
        {summary.observations.length > 0 ? (
          <ul className="space-y-3 text-sm text-muted-foreground">
            {summary.observations.map((observation) => (
              <li key={observation} className="rounded-lg bg-background px-4 py-3">
                {observation}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Sem observações para este período.</p>
        )}
      </ReportSection>

      <div className="grid gap-6 md:grid-cols-2">
        <ReportSection
          title="Consistência"
          icon={<ShieldCheck className="h-6 w-6 text-green-600" />}
          variant="muted"
        >
          <p>
            Cobertura e regularidade ajudam a deixar os resumos mais confiáveis ao longo do tempo.
          </p>
          <div className="mt-4 flex items-center justify-between p-3 bg-background rounded-md border border-border">
            <span className="font-medium text-sm">Taxa de preenchimento</span>
            <span className="text-accent font-bold">{summary.consistency.score ?? 0}%</span>
          </div>
          {summary.consistency.notes ? (
            <p className="text-xs text-muted-foreground mt-2">{summary.consistency.notes}</p>
          ) : null}
        </ReportSection>

        <ReportSection
          title="Dados ausentes"
          icon={<AlertTriangle className="h-6 w-6 text-accent" />}
          variant="warning"
        >
          {summary.missingData.length > 0 ? (
            <>
              <p className="text-muted-foreground">
                O resumo está limitado pelas métricas ainda não registradas neste período.
              </p>
              <ul className="list-inside list-disc mt-3 space-y-1 font-medium">
                {summary.missingData.map((metricType) => (
                  <li key={metricType}>{metricType}</li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-muted-foreground">
              Nenhuma métrica conhecida está ausente neste período.
            </p>
          )}
        </ReportSection>
      </div>
    </div>
  );
}
