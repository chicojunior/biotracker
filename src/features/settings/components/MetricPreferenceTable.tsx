import type { HealthDataSource, HealthMetricType } from "../../../types/health";

type SelectOption<Value extends string> = {
  label: string;
  value: Value;
};

export type MetricPreference = {
  description: string;
  key: HealthMetricType;
  label: string;
  sourceOptions: SelectOption<HealthDataSource>[];
  unitOptions: string[];
};

export type MetricPreferenceValue = {
  source: HealthDataSource;
  unit: string;
};

type MetricPreferenceTableProps = {
  metrics: MetricPreference[];
  onChange: (metric: HealthMetricType, value: MetricPreferenceValue) => void;
  values: Record<string, MetricPreferenceValue>;
};

export function MetricPreferenceTable({
  metrics,
  onChange,
  values,
}: MetricPreferenceTableProps) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-foreground">
        Preferred units and sources
      </legend>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        Choose how each metric should display and which source should be treated
        as primary when duplicate entries exist.
      </p>
      <div className="mt-4 divide-y divide-border border-y border-border">
        {metrics.map((metric) => {
          const currentValue = values[metric.key] ?? {
            source: metric.sourceOptions[0]?.value ?? "manual",
            unit: metric.unitOptions[0] ?? "",
          };
          const unitId = `${metric.key}-unit`;
          const sourceId = `${metric.key}-source`;

          return (
            <div
              key={metric.key}
              className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_9rem_12rem] sm:items-center"
            >
              <div className="min-w-0">
                <p className="font-medium text-foreground">{metric.label}</p>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  {metric.description}
                </p>
              </div>

              <label className="grid gap-1 text-sm" htmlFor={unitId}>
                <span className="text-muted-foreground">Unit</span>
                <select
                  id={unitId}
                  value={currentValue.unit}
                  onChange={(event) =>
                    onChange(metric.key, {
                      ...currentValue,
                      unit: event.target.value,
                    })
                  }
                  className="h-10 rounded-md border border-input bg-card px-3 text-foreground shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {metric.unitOptions.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-sm" htmlFor={sourceId}>
                <span className="text-muted-foreground">Source</span>
                <select
                  id={sourceId}
                  value={currentValue.source}
                  onChange={(event) =>
                    onChange(metric.key, {
                      ...currentValue,
                      source: event.target.value as HealthDataSource,
                    })
                  }
                  className="h-10 rounded-md border border-input bg-card px-3 text-foreground shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {metric.sourceOptions.map((source) => (
                    <option key={source.value} value={source.value}>
                      {source.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
