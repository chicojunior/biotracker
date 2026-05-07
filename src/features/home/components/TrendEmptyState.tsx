import { BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

export type TrendEmptyStateProps = {
  metricLabel: string;
};

export function TrendEmptyState({ metricLabel }: TrendEmptyStateProps) {
  return (
    <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 text-center px-4">
      <BarChart3 size={32} className="text-muted-foreground/60" />
      <h3 className="sr-only">Sem dados para {metricLabel}</h3>
      <p className="text-sm text-muted-foreground">
        Adicione registros para visualizar a tendência.
      </p>
      <Link
        to="/entry"
        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Adicionar Medição
      </Link>
    </div>
  );
}
