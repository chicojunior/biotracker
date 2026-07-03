import { ArrowDown, ArrowUp, Minus } from 'lucide-react';

export type TrendDeltaPillProps = {
  delta: number | null;
  unit: string;
  decimals: number;
  comparisonLabel: string;
  direction?: 'higher-is-better' | 'lower-is-better' | 'neutral';
};

function getTintClasses(
  direction: 'higher-is-better' | 'lower-is-better' | 'neutral',
  delta: number,
): string {
  if (direction === 'neutral' || delta === 0) {
    return 'bg-muted text-muted-foreground';
  }

  if (direction === 'higher-is-better') {
    if (delta > 0) return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
    return 'bg-rose-500/10 text-rose-700 dark:text-rose-400';
  }

  // lower-is-better
  if (delta < 0) return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
  return 'bg-rose-500/10 text-rose-700 dark:text-rose-400';
}

export function TrendDeltaPill({
  delta,
  unit,
  decimals,
  comparisonLabel,
  direction = 'neutral',
}: TrendDeltaPillProps): JSX.Element | null {
  if (delta === null) return null;

  const formatter = new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
    signDisplay: 'exceptZero',
  });

  const formatted = formatter.format(delta);
  const valueText = `${formatted} ${unit}`;
  const tint = getTintClasses(direction, delta);

  return (
    <span
      role="status"
      aria-label={`Variação: ${valueText} ${comparisonLabel}`}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${tint}`}
    >
      {delta > 0 && (
        <span data-testid="delta-arrow-up">
          <ArrowUp size={12} aria-hidden />
        </span>
      )}
      {delta < 0 && (
        <span data-testid="delta-arrow-down">
          <ArrowDown size={12} aria-hidden />
        </span>
      )}
      {delta === 0 && (
        <span data-testid="delta-arrow-neutral">
          <Minus size={12} aria-hidden />
        </span>
      )}
      <span>{valueText}</span>
      <span className="font-normal opacity-70" aria-hidden>
        · {comparisonLabel}
      </span>
    </span>
  );
}
