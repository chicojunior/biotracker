import { FileSearch } from "lucide-react";

export function EmptyState({ referenceDate }: { referenceDate: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-24 text-center animate-in fade-in duration-700">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary/50 mb-6">
        <FileSearch className="h-10 w-10 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-semibold text-foreground tracking-tight">
        Nenhum dado consolidado ainda
      </h2>
      <p className="mt-3 max-w-sm text-sm text-muted-foreground">
        Nós precisamos de um volume mínimo de entradas preenchidas para gerar relatórios relevantes. 
        Continue alimentando as métricas diárias e volte aqui no final da semana.
      </p>
      <p className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        Referência atual: {referenceDate}
      </p>
    </div>
  );
}
