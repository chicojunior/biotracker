import { Info } from 'lucide-react';

export function TrendInsufficientDataNote() {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
      <Info size={14} />
      <span>Necessário pelo menos 2 registros para visualizar a tendência.</span>
    </div>
  );
}
