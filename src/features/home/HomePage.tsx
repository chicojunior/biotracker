import { Activity, Droplet, Plus, Heart, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <div className="space-y-6 p-4 md:p-8">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Bem-vindo de volta! Aqui está o seu resumo de hoje.</p>
        </div>
      </header>

      <section aria-label="Métricas Diárias" className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {/* Metric Cards */}
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm flex flex-col justify-between aspect-square md:aspect-auto md:min-h-[140px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Peso Atual</span>
            <Activity size={16} className="text-primary" />
          </div>
          <div className="text-2xl font-bold">-- kg</div>
        </div>
        
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm flex flex-col justify-between aspect-square md:aspect-auto md:min-h-[140px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Água</span>
            <Droplet size={16} className="text-[hsl(var(--chart-heart))]" />
          </div>
          <div className="text-2xl font-bold">-- L</div>
        </div>

        <div className="bg-card rounded-xl p-4 border border-border shadow-sm flex flex-col justify-between aspect-square md:aspect-auto md:min-h-[140px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Sono</span>
            <Moon size={16} className="text-[hsl(var(--chart-sleep))]" />
          </div>
          <div className="text-2xl font-bold">-- h</div>
        </div>

        <div className="bg-card rounded-xl p-4 border border-border shadow-sm flex flex-col justify-between aspect-square md:aspect-auto md:min-h-[140px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Repouso</span>
            <Heart size={16} className="text-[hsl(var(--chart-heart))]" />
          </div>
          <div className="text-2xl font-bold">-- bpm</div>
        </div>
      </section>

      <section aria-label="Registro" className="pt-4 md:pt-8">
        <h2 className="text-xl font-semibold mb-4 text-foreground">Registro Rápido</h2>
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-4 min-h-[220px]">
          <div className="rounded-full bg-primary/10 p-5">
            <Plus size={32} className="text-primary" />
          </div>
          <p className="text-muted-foreground font-medium max-w-xs">Nenhum dado registrado hoje. Mantenha seu histórico atualizado.</p>
          <Link
            to="/entry"
            className="rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Adicionar Medição
          </Link>
        </div>
      </section>
    </div>
  );
}
