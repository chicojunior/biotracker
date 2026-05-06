import { CalendarRange, CircleAlert, Pencil, Trash2 } from "lucide-react";

import type {
  DailyHealthEntry,
  HealthMetricEntry,
  HealthMetricType,
} from "../../../types/health";

export type EntryDetailPanelProps = {
  entry: DailyHealthEntry | null;
  onEditEntry?: (entryId: string) => void;
  onDeleteEntry?: (entryId: string) => void;
  isLoading?: boolean;
  errorMessage?: string;
  statusMessage?: string;
  emptyTitle?: string;
  emptyDescription?: string;
};

const METRIC_LABELS: Partial<Record<HealthMetricType, string>> = {
  weight: "Weight",
  bodyFatPercentage: "Body fat percentage",
  visceralFatLevel: "Visceral fat level",
  muscleMass: "Muscle mass",
  bodyWaterPercentage: "Body water percentage",
  boneMass: "Bone mass",
  bloodPressureSystolic: "Blood pressure systolic",
  bloodPressureDiastolic: "Blood pressure diastolic",
  restingHeartRate: "Resting heart rate",
  sleepDuration: "Sleep duration",
  sleepQuality: "Sleep quality",
  dailySteps: "Daily steps",
  workoutNotes: "Workout notes",
  nutritionNotes: "Nutrition notes",
};

const METRIC_ORDER: HealthMetricType[] = [
  "weight",
  "bodyFatPercentage",
  "visceralFatLevel",
  "muscleMass",
  "bodyWaterPercentage",
  "boneMass",
  "bloodPressureSystolic",
  "bloodPressureDiastolic",
  "restingHeartRate",
  "sleepDuration",
  "sleepQuality",
  "dailySteps",
  "workoutNotes",
  "nutritionNotes",
];

function formatDate(date: string, options: Intl.DateTimeFormatOptions) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("en-US", options).format(parsedDate);
}

function formatMetricValue(metricEntry: HealthMetricEntry) {
  if (typeof metricEntry.value === "boolean") {
    return metricEntry.value ? "Yes" : "No";
  }

  if (metricEntry.value === null || metricEntry.value === "") {
    return "Not recorded";
  }

  if (typeof metricEntry.value === "number") {
    return `${metricEntry.value}${metricEntry.unit ? ` ${metricEntry.unit}` : ""}`;
  }

  return metricEntry.unit
    ? `${metricEntry.value} ${metricEntry.unit}`
    : metricEntry.value;
}

function getMetricGroups(entry: DailyHealthEntry) {
  return Object.entries(entry.metrics)
    .filter(([, metricEntries]) => (metricEntries?.length ?? 0) > 0)
    .sort(([leftMetric], [rightMetric]) => {
      const leftIndex = METRIC_ORDER.indexOf(leftMetric as HealthMetricType);
      const rightIndex = METRIC_ORDER.indexOf(rightMetric as HealthMetricType);

      if (leftIndex === -1 && rightIndex === -1) {
        return leftMetric.localeCompare(rightMetric);
      }

      if (leftIndex === -1) {
        return 1;
      }

      if (rightIndex === -1) {
        return -1;
      }

      return leftIndex - rightIndex;
    })
    .map(([metricType, metricEntries]) => ({
      metricType: metricType as HealthMetricType,
      metricEntries: [...(metricEntries ?? [])].sort((leftEntry, rightEntry) => {
        return (
          new Date(rightEntry.recordedAt).getTime() -
          new Date(leftEntry.recordedAt).getTime()
        );
      }),
    }));
}

function DetailPanelSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
      <div className="animate-pulse space-y-5">
        <div className="space-y-2">
          <div className="h-4 w-28 rounded bg-secondary" />
          <div className="h-8 w-48 rounded bg-secondary" />
          <div className="h-4 w-36 rounded bg-secondary" />
        </div>
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-border p-4">
              <div className="h-5 w-32 rounded bg-secondary" />
              <div className="mt-4 h-16 rounded bg-secondary" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function EntryDetailPanel({
  entry,
  onEditEntry,
  onDeleteEntry,
  isLoading = false,
  errorMessage,
  statusMessage,
  emptyTitle = "Select an entry to inspect",
  emptyDescription = "Choose a day from the list to review recorded metrics, notes, and entry actions.",
}: EntryDetailPanelProps) {
  if (isLoading) {
    return <DetailPanelSkeleton />;
  }

  if (errorMessage) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive shadow-sm">
        <div className="flex gap-3">
          <CircleAlert aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">Unable to open entry details</p>
            <p className="mt-1 leading-6">{errorMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card px-5 py-12 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <CalendarRange aria-hidden="true" className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-foreground">{emptyTitle}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          {emptyDescription}
        </p>
      </div>
    );
  }

  const metricGroups = getMetricGroups(entry);
  const totalObservations = metricGroups.reduce((total, metricGroup) => {
    return total + metricGroup.metricEntries.length;
  }, 0);

  return (
    <aside className="rounded-xl border border-border bg-card p-5 shadow-soft sm:p-6">
      <header className="border-b border-border pb-5">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Entry details
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
          {formatDate(entry.date, {
            day: "numeric",
            month: "long",
            weekday: "long",
            year: "numeric",
          })}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {metricGroups.length} metrics • {totalObservations} recorded values
        </p>

        {statusMessage ? (
          <p
            role="status"
            className="mt-4 rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-secondary-foreground"
          >
            {statusMessage}
          </p>
        ) : null}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => onEditEntry?.(entry.id)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary/70 hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Pencil aria-hidden="true" className="h-4 w-4" />
            Edit entry
          </button>
          <button
            type="button"
            onClick={() => onDeleteEntry?.(entry.id)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition hover:bg-destructive/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Trash2 aria-hidden="true" className="h-4 w-4" />
            Delete entry
          </button>
        </div>
      </header>

      <div className="mt-5 space-y-4">
        {metricGroups.map(({ metricType, metricEntries }) => (
          <section
            key={metricType}
            className="rounded-xl border border-border bg-background p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {METRIC_LABELS[metricType] ?? metricType}
                </h3>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {metricEntries.length} {metricEntries.length === 1 ? "measurement" : "measurements"}
                </p>
              </div>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                Latest {formatDate(metricEntries[0]?.recordedAt ?? entry.date, { hour: "numeric", minute: "2-digit" })}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {metricEntries.map((metricEntry) => (
                <div
                  key={metricEntry.id}
                  className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-foreground">
                        {formatMetricValue(metricEntry)}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {formatDate(metricEntry.recordedAt, {
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          month: "short",
                        })}
                      </p>
                    </div>

                    <div className="flex flex-wrap justify-end gap-2">
                      <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                        {metricEntry.source}
                      </span>
                      {typeof metricEntry.confidence === "number" ? (
                        <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                          Confidence {metricEntry.confidence}%
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {metricEntry.notes ? (
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {metricEntry.notes}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ))}

        {entry.notes ? (
          <section className="rounded-xl border border-border bg-secondary/40 p-4">
            <h3 className="text-sm font-semibold text-foreground">Day notes</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{entry.notes}</p>
          </section>
        ) : null}
      </div>
    </aside>
  );
}
