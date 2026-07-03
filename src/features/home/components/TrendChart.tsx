import type { ReactElement, ReactNode } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export type TrendChartSeries = {
  dataKey: string;
  label: string;
  colorVar: string; // e.g. '--chart-weight' (no `var()` wrapper, just the name)
};

export type TrendChartPoint = {
  date: string; // YYYY-MM-DD
  [dataKey: string]: string | number | null;
};

export type TrendChartProps = {
  data: TrendChartPoint[];
  series: TrendChartSeries[];
  unit: string;
  decimals: number;
  ariaLabel: string;
  caption: string; // visible figcaption text
  height?: number; // default 220
};

function parseDateLocal(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

function formatDateTick(dateStr: string): string {
  const date = parseDateLocal(dateStr);
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date);
}

function formatTooltipLabel(label: ReactNode): ReactNode {
  if (typeof label !== 'string') {
    return label;
  }

  const date = parseDateLocal(label);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function TrendChart(props: TrendChartProps): ReactElement {
  const { data, series, unit, decimals, ariaLabel, caption, height = 220 } = props;

  const numberFormatter = new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  });

  function formatTooltipValue(value: unknown, name: unknown, item: { name?: unknown }): [ReactNode, string] {
    const formatted =
      typeof value === 'number'
        ? numberFormatter.format(value)
        : Array.isArray(value)
          ? value.join(' - ')
          : value === null || value === undefined
            ? '--'
            : String(value);
    const label = item.name ?? name;
    return [`${formatted} ${unit}`, String(label ?? '')];
  }

  return (
    <figure role="img" aria-label={ariaLabel}>
      <figcaption className="sr-only">{caption}</figcaption>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDateTick}
            stroke="hsl(var(--muted-foreground))"
            tick={{ fontSize: 12 }}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            tick={{ fontSize: 12 }}
            unit={` ${unit}`}
            domain={['auto', 'auto']}
          />
          <Tooltip
            formatter={formatTooltipValue}
            labelFormatter={formatTooltipLabel}
            contentStyle={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              color: 'hsl(var(--foreground))',
            }}
          />
          {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
          {series.map((s) => (
            <Line
              key={s.dataKey}
              type="monotone"
              dataKey={s.dataKey}
              name={s.label}
              stroke={`hsl(var(${s.colorVar}))`}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </figure>
  );
}
