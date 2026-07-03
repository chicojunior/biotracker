import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { normalizeDateKey } from "../../lib/dates/dateRanges";
import { dailyHealthEntrySchema } from "../../lib/validation/healthSchemas";
import type { DailyHealthEntry, HealthMetricEntry, HealthMetricType } from "../../types/health";
import { useHealthData } from "../health/hooks/useHealthData";
import { useSettings } from "../settings/hooks/useSettings";
import { EntryPage } from "./EntryPage";
import type { EntryFormFieldKey, EntryFormValues } from "./EntryForm";

const FORM_METRIC_KEYS: HealthMetricType[] = [
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

const NUMERIC_METRIC_KEYS = new Set<HealthMetricType>([
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
]);

const DEFAULT_UNIT_BY_METRIC: Partial<Record<HealthMetricType, string>> = {
  weight: "kg",
  bodyFatPercentage: "%",
  visceralFatLevel: "level",
  muscleMass: "kg",
  bodyWaterPercentage: "%",
  boneMass: "kg",
  bloodPressureSystolic: "mmHg",
  bloodPressureDiastolic: "mmHg",
  restingHeartRate: "bpm",
  sleepDuration: "hours",
  sleepQuality: "score",
  dailySteps: "steps",
};

const DEFAULT_SOURCE_BY_METRIC: Partial<Record<HealthMetricType, string>> = {
  weight: "smartScale",
  bodyFatPercentage: "smartScale",
  visceralFatLevel: "smartScale",
  muscleMass: "smartScale",
  bodyWaterPercentage: "smartScale",
  boneMass: "smartScale",
  bloodPressureSystolic: "bloodPressureMonitor",
  bloodPressureDiastolic: "bloodPressureMonitor",
  restingHeartRate: "smartBand",
  sleepDuration: "smartBand",
  sleepQuality: "smartBand",
  dailySteps: "smartBand",
  workoutNotes: "manual",
  nutritionNotes: "manual",
};

const SLEEP_QUALITY_TO_SCORE: Record<string, number> = {
  poor: 2,
  fair: 4,
  good: 6,
  veryGood: 8,
  excellent: 10,
};

const SCORE_TO_SLEEP_QUALITY = Object.entries(SLEEP_QUALITY_TO_SCORE).reduce<Record<number, string>>(
  (result, [quality, score]) => {
    result[score] = quality;
    return result;
  },
  {},
);

function toTodayDateKey(): string {
  return normalizeDateKey(new Date());
}

function resolveDateKey(value: string | null, fallbackDateKey: string): string {
  if (!value) {
    return fallbackDateKey;
  }

  try {
    return normalizeDateKey(value);
  } catch {
    return fallbackDateKey;
  }
}

function pickMetricEntry(metricEntries: HealthMetricEntry[] | undefined): HealthMetricEntry | undefined {
  if (!metricEntries || metricEntries.length === 0) {
    return undefined;
  }

  return [...metricEntries].sort((left, right) => {
    if (Boolean(left.isPreferredSource) !== Boolean(right.isPreferredSource)) {
      return left.isPreferredSource ? -1 : 1;
    }

    return right.recordedAt.localeCompare(left.recordedAt);
  })[0];
}

function toFormValues(entry: DailyHealthEntry | undefined): EntryFormValues {
  if (!entry) {
    return {};
  }

  const values: EntryFormValues = {};

  for (const metricKey of FORM_METRIC_KEYS) {
    const metricEntry = pickMetricEntry(entry.metrics[metricKey]);

    if (!metricEntry) {
      continue;
    }

    if (metricKey === "sleepQuality") {
      if (typeof metricEntry.value === "number") {
        values[metricKey] = SCORE_TO_SLEEP_QUALITY[metricEntry.value] ?? "";
        continue;
      }

      values[metricKey] = typeof metricEntry.value === "string" ? metricEntry.value : "";
      continue;
    }

    if (typeof metricEntry.value === "number") {
      values[metricKey] = String(metricEntry.value);
      continue;
    }

    values[metricKey] = typeof metricEntry.value === "string" ? metricEntry.value : "";
  }

  if (entry.notes) {
    values.notes = entry.notes;
  }

  return values;
}

type ParsedMetricValueResult =
  | { ok: true; value: string | number }
  | { error: string; ok: false };

function parseMetricValue(metricKey: HealthMetricType, rawValue: string): ParsedMetricValueResult {
  const trimmedValue = rawValue.trim();

  if (trimmedValue.length === 0) {
    return { ok: true, value: "" };
  }

  if (metricKey === "sleepQuality") {
    const score = SLEEP_QUALITY_TO_SCORE[trimmedValue];

    if (score === undefined) {
      return { error: "Choose a valid sleep quality.", ok: false };
    }

    return { ok: true, value: score };
  }

  if (NUMERIC_METRIC_KEYS.has(metricKey)) {
    const numericValue = Number(trimmedValue);

    if (!Number.isFinite(numericValue)) {
      return { error: "Enter a valid number.", ok: false };
    }

    return { ok: true, value: numericValue };
  }

  return { ok: true, value: trimmedValue };
}

function mapSchemaErrors(
  issues: Array<{ message: string; path: PropertyKey[] }>,
): Partial<Record<EntryFormFieldKey, string>> {
  const nextErrors: Partial<Record<EntryFormFieldKey, string>> = {};

  for (const issue of issues) {
    const [first, second] = issue.path;

    if (first === "date") {
      nextErrors.date = nextErrors.date ?? issue.message;
      continue;
    }

    if (first === "notes") {
      nextErrors.notes = nextErrors.notes ?? issue.message;
      continue;
    }

    if (first === "metrics" && typeof second === "string") {
      nextErrors[second as EntryFormFieldKey] = nextErrors[second as EntryFormFieldKey] ?? issue.message;
    }
  }

  return nextErrors;
}

export function EntryRoute() {
  const [searchParams, setSearchParams] = useSearchParams();
  const todayDateKey = useMemo(() => toTodayDateKey(), []);
  const [date, setDate] = useState(() => resolveDateKey(searchParams.get("date"), todayDateKey));
  const [values, setValues] = useState<EntryFormValues>({});
  const [errors, setErrors] = useState<Partial<Record<EntryFormFieldKey, string>>>({});
  const [localStatusMessage, setLocalStatusMessage] = useState("");
  const [localErrorMessage, setLocalErrorMessage] = useState("");

  const healthData = useHealthData();
  const settings = useSettings();

  useEffect(() => {
    const rawDate = searchParams.get("date");
    const normalizedDate = resolveDateKey(rawDate, todayDateKey);

    if (rawDate !== normalizedDate) {
      const nextSearchParams = new URLSearchParams(searchParams);
      nextSearchParams.set("date", normalizedDate);
      setSearchParams(nextSearchParams, { replace: true });
    }

    setDate((currentDate) => (currentDate === normalizedDate ? currentDate : normalizedDate));
  }, [searchParams, setSearchParams, todayDateKey]);

  const currentEntry = useMemo(
    () => healthData.entries.find((entry) => entry.date === date),
    [date, healthData.entries],
  );

  useEffect(() => {
    if (healthData.isLoading) {
      return;
    }

    setValues(toFormValues(currentEntry));
    setErrors({});
    setLocalErrorMessage("");
    setLocalStatusMessage("");
  }, [currentEntry, date, healthData.isLoading]);

  const handleDateChange = useCallback(
    (nextDate: string) => {
      setLocalErrorMessage("");
      setLocalStatusMessage("");
      setErrors((currentErrors) => ({ ...currentErrors, date: undefined }));

      const normalizedDate = resolveDateKey(nextDate, "");

      if (!normalizedDate) {
        setErrors((currentErrors) => ({
          ...currentErrors,
          date: "Choose a valid date.",
        }));
        return;
      }

      setDate(normalizedDate);

      const nextSearchParams = new URLSearchParams(searchParams);
      nextSearchParams.set("date", normalizedDate);
      setSearchParams(nextSearchParams);
    },
    [searchParams, setSearchParams],
  );

  const handleFieldChange = useCallback((field: EntryFormFieldKey, value: string) => {
    setLocalErrorMessage("");
    setLocalStatusMessage("");
    setErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }));

    if (field === "notes") {
      setValues((currentValues) => ({ ...currentValues, notes: value }));
      return;
    }

    if (field === "date") {
      return;
    }

    setValues((currentValues) => ({ ...currentValues, [field]: value }));
  }, []);

  const handleSubmit = useCallback<React.FormEventHandler<HTMLFormElement>>(
    async (event) => {
      event.preventDefault();

      setLocalErrorMessage("");
      setLocalStatusMessage("");
      setErrors({});

      let normalizedDate: string;

      try {
        normalizedDate = normalizeDateKey(date);
      } catch {
        setErrors({ date: "Choose a valid date." });
        setLocalErrorMessage("Could not save because the selected date is invalid.");
        return;
      }

      const now = new Date().toISOString();
      const recordedAt = `${normalizedDate}T12:00:00.000Z`;
      const existingEntryId = currentEntry?.id ?? `entry-${normalizedDate}`;
      const nextMetrics: DailyHealthEntry["metrics"] = {};
      const nextFieldErrors: Partial<Record<EntryFormFieldKey, string>> = {};

      for (const metricKey of FORM_METRIC_KEYS) {
        const rawValue = values[metricKey] ?? "";
        const parsedValue = parseMetricValue(metricKey, rawValue);

        if (!parsedValue.ok) {
          nextFieldErrors[metricKey] = parsedValue.error;
          continue;
        }

        if (parsedValue.value === "") {
          continue;
        }

        const existingMetricEntry = pickMetricEntry(currentEntry?.metrics[metricKey]);
        const metricPreferences = settings.settings.metricPreferences[metricKey];
        const unit = metricKey.endsWith("Notes")
          ? null
          : (metricPreferences?.unit ?? DEFAULT_UNIT_BY_METRIC[metricKey] ?? null);
        const source =
          metricPreferences?.source ?? DEFAULT_SOURCE_BY_METRIC[metricKey] ?? "manual";

        nextMetrics[metricKey] = [
          {
            id: existingMetricEntry?.id ?? `${existingEntryId}:${metricKey}`,
            metricType: metricKey,
            value: parsedValue.value,
            unit,
            recordedAt,
            source,
            isPreferredSource: true,
            createdAt: existingMetricEntry?.createdAt ?? now,
            updatedAt: now,
          },
        ];
      }

      if (Object.keys(nextFieldErrors).length > 0) {
        setErrors(nextFieldErrors);
        setLocalErrorMessage("Review the highlighted fields and try again.");
        return;
      }

      const entryToSave: DailyHealthEntry = {
        id: existingEntryId,
        date: normalizedDate,
        metrics: nextMetrics,
        notes: values.notes?.trim() ? values.notes.trim() : undefined,
        createdAt: currentEntry?.createdAt ?? now,
        updatedAt: now,
      };

      const schemaResult = dailyHealthEntrySchema.safeParse(entryToSave);

      if (!schemaResult.success) {
        setErrors(mapSchemaErrors(schemaResult.error.issues));
        setLocalErrorMessage("Entry validation failed. Please review the highlighted fields.");
        return;
      }

      const didSave = await healthData.upsertEntry(schemaResult.data);

      if (!didSave) {
        setLocalErrorMessage("Could not save the entry.");
        return;
      }

      setLocalStatusMessage(`Entry saved for ${normalizedDate}.`);
    },
    [currentEntry, date, healthData, settings.settings.metricPreferences, values],
  );

  return (
    <EntryPage
      date={date}
      errors={errors}
      errorMessage={localErrorMessage || healthData.errorMessage}
      isLoading={healthData.isLoading}
      isSaving={healthData.status === "saving"}
      onDateChange={handleDateChange}
      onFieldChange={handleFieldChange}
      onSubmit={handleSubmit}
      statusMessage={localStatusMessage || healthData.statusMessage}
      values={values}
    />
  );
}
