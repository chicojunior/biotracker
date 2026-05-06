import { CalendarDays, ChevronRight, CircleAlert, FileClock, StickyNote } from "lucide-react";

import type { DailyHealthEntry, HealthMetricType } from "../../../types/health";

export type EntryListProps = {
  entries: DailyHealthEntry[];
  selectedEntryId?: string | null;
  onSelectEntry?: (entryId: string) => void;
  isLoading?: boolean;
  errorMessage?: string;
  statusMessage?: string;
  emptyTitle?: string;
  emptyDescription?: string;
};

const METRIC_LABELS: Partial<Record<HealthMetricType, string>> = {
  weight: "Weight",
  bodyFatPercentage: "Body fat",
  visceralFatLevel: "Visceral fat",
  muscleMass: "Muscle mass",
  bodyWaterPercentage: "Body water",
  boneMass: "Bone mass",
  bloodPressureSystolic: "Systolic pressure",
  bloodPressureDiastolic: "Diastolic pressure",
  restingHeartRate: "Resting heart rate",
  sleepDuration: "Sleep duration",
  sleepQuality: "Sleep quality",
  dailySteps: "Daily steps",
  workoutNotes: "Workout notes",
  nutritionNotes: "Nutrition notes",
};

function formatDate(date: string, options: Intl.DateTimeFormatOptions) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("en-US", options).format(parsedDate);
}

function sortEntriesByDate(entries: DailyHealthEntry[]) {
  return [...entries].sort((leftEntry, rightEntry) => {
    return new Date(rightEntry.date).getTime() - new Date(leftEntry.date).getTime();
  });
}

function getObservationCount(entry: DailyHealthEntry) {
  return Object.values(entry.metrics).reduce((total, metricEntries) => {
    return total + (metricEntries?.length ?? 0);
  }, 0);
}

function getMetricPreview(entry: DailyHealthEntry) {
  return Object.entries(entry.metrics)
    .filter(([, metricEntries]) => (metricEntries?.length ?? 0) > 0)
    .map(([metricType]) => METRIC_LABELS[metricType as HealthMetricType] ?? metricType)
    .slice(0, 3);
}

function EntryListSkeleton() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="rounded-xl border border-border bg-card p-4 shadow-sm"
        >
          <div className="animate-pulse space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="h-4 w-28 rounded bg-secondary" />
                <div className="h-7 w-20 rounded bg-secondary" />
              </div>
              <div className="h-5 w-16 rounded-full bg-secondary" />
            </div>
            <div className="flex gap-2">
              <div className="h-6 w-20 rounded-full bg-secondary" />
              <div className="h-6 w-24 rounded-full bg-secondary" />
            </div>
            <div className="h-4 w-40 rounded bg-secondary" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EntryList({
  entries,
  selectedEntryId,
  onSelectEntry,
  isLoading = false,
  errorMessage,
  statusMessage,
  emptyTitle = "No history entries yet",
  emptyDescription = "Saved daily records will appear here so you can review recent days and spot patterns over time.",
}: EntryListProps) {
  const sortedEntries = sortEntriesByDate(entries);

  if (isLoading) {
    return <EntryListSkeleton />;
  }

  if (errorMessage) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive shadow-sm">
        <div className="flex gap-3">
          <CircleAlert aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">Unable to load history</p>
            <p className="mt-1 leading-6">{errorMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  if (sortedEntries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card px-5 py-12 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <FileClock aria-hidden="true" className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-foreground">{emptyTitle}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          {emptyDescription}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {statusMessage ? (
        <p
          role="status"
          className="rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-secondary-foreground"
        >
          {statusMessage}
        </p>
      ) : null}

      {sortedEntries.map((entry, index) => {
        const isSelected =
          entry.id === (selectedEntryId ?? sortedEntries[0]?.id ?? null);
        const metricPreview = getMetricPreview(entry);
        const observationCount = getObservationCount(entry);
        const noteCount = entry.notes ? 1 : 0;

        return (
          <button
            key={entry.id}
            type="button"
            onClick={() => onSelectEntry?.(entry.id)}
            className={[
              "w-full rounded-xl border p-4 text-left shadow-sm transition",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              isSelected
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-primary/50 hover:bg-secondary/40",
            ].join(" ")}
            aria-pressed={isSelected}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  {index === 0 ? "Most recent" : formatDate(entry.date, { month: "long", year: "numeric" })}
                </p>
                <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-1">
                  <p className="text-2xl font-semibold tracking-tight text-foreground">
                    {formatDate(entry.date, { day: "numeric" })}
                  </p>
                  <p className="pb-1 text-sm text-muted-foreground">
                    {formatDate(entry.date, {
                      month: "short",
                      weekday: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <span
                className={[
                  "inline-flex min-h-9 items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground",
                ].join(" ")}
              >
                <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" />
                {observationCount} {observationCount === 1 ? "record" : "records"}
              </span>
            </div>

            {metricPreview.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {metricPreview.map((metricLabel) => (
                  <span
                    key={metricLabel}
                    className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground"
                  >
                    {metricLabel}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
              <div className="flex flex-wrap items-center gap-3">
                <span>{Object.keys(entry.metrics).length} tracked metrics</span>
                {noteCount > 0 ? (
                  <span className="inline-flex items-center gap-1.5">
                    <StickyNote aria-hidden="true" className="h-4 w-4" />
                    Notes included
                  </span>
                ) : null}
              </div>

              <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                Review
                <ChevronRight aria-hidden="true" className="h-4 w-4" />
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
