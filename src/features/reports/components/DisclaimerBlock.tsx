import { Info } from 'lucide-react';

export function DisclaimerBlock({ disclaimer }: { disclaimer: string }) {
  return (
    <div className="mt-8 rounded-lg border border-dashed border-muted-foreground/40 bg-muted/30 p-5 flex gap-4">
      <div className="shrink-0 mt-1">
        <Info className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <h4 className="text-sm font-medium text-foreground mb-1">Nota de Limitação de Responsabilidade</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {disclaimer}
        </p>
      </div>
    </div>
  );
}
