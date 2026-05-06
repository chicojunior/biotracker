import type { FormEvent } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Calendar,
  FileText,
  Heart,
  LoaderCircle,
  Moon,
  Plus,
  Save,
  X,
} from "lucide-react";

import type { HealthMetricType } from "../../types/health";
import { SettingsSection } from "../settings/components/SettingsSection";

export type EntryFormFieldKey = HealthMetricType | "date" | "notes";

export type EntryFormValues = Partial<Record<HealthMetricType, string>> & {
  notes?: string;
};

type EntryFormField = {
  description: string;
  inputMode?: "decimal" | "numeric" | "text";
  key: HealthMetricType | "notes";
  label: string;
  options?: Array<{ label: string; value: string }>;
  placeholder: string;
  type: "number" | "select" | "textarea";
  unit?: string;
};

type EntryFormSection = {
  description: string;
  fields: EntryFormField[];
  icon: LucideIcon;
  id: string;
  title: string;
};

export type EntryFormProps = {
  cancelLabel?: string;
  date: string;
  errors?: Partial<Record<EntryFormFieldKey, string>>;
  isLoading?: boolean;
  isSaving?: boolean;
  onCancel?: () => void;
  onDateChange: (value: string) => void;
  onFieldChange: (field: EntryFormFieldKey, value: string) => void;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  saveLabel?: string;
  values: EntryFormValues;
};

const INPUT_CLASS =
  "min-h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60";

const TEXTAREA_CLASS =
  "min-h-32 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm leading-6 text-foreground shadow-sm transition placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60";

const SECTIONS: EntryFormSection[] = [
  {
    id: "body-composition",
    title: "Body Composition",
    description:
      "Capture body measurements together so daily changes stay easy to compare over time.",
    icon: Activity,
    fields: [
      {
        key: "weight",
        label: "Weight",
        description: "Current scale reading or manual estimate.",
        placeholder: "0.0",
        type: "number",
        unit: "kg",
        inputMode: "decimal",
      },
      {
        key: "bodyFatPercentage",
        label: "Body fat",
        description: "Percent body fat from a scale or manual record.",
        placeholder: "0.0",
        type: "number",
        unit: "%",
        inputMode: "decimal",
      },
      {
        key: "visceralFatLevel",
        label: "Visceral fat level",
        description: "Use the same scale index when available.",
        placeholder: "0",
        type: "number",
        unit: "level",
        inputMode: "numeric",
      },
      {
        key: "muscleMass",
        label: "Muscle mass",
        description: "Estimated lean mass reading.",
        placeholder: "0.0",
        type: "number",
        unit: "kg",
        inputMode: "decimal",
      },
      {
        key: "bodyWaterPercentage",
        label: "Body water",
        description: "Hydration percentage from your tracking device.",
        placeholder: "0.0",
        type: "number",
        unit: "%",
        inputMode: "decimal",
      },
      {
        key: "boneMass",
        label: "Bone mass",
        description: "Optional smart scale estimate.",
        placeholder: "0.0",
        type: "number",
        unit: "kg",
        inputMode: "decimal",
      },
    ],
  },
  {
    id: "cardio",
    title: "Cardio",
    description:
      "Keep blood pressure and resting pulse together for a single daily cardio snapshot.",
    icon: Heart,
    fields: [
      {
        key: "bloodPressureSystolic",
        label: "Systolic",
        description: "Upper blood pressure value.",
        placeholder: "120",
        type: "number",
        unit: "mmHg",
        inputMode: "numeric",
      },
      {
        key: "bloodPressureDiastolic",
        label: "Diastolic",
        description: "Lower blood pressure value.",
        placeholder: "80",
        type: "number",
        unit: "mmHg",
        inputMode: "numeric",
      },
      {
        key: "restingHeartRate",
        label: "Resting heart rate",
        description: "Morning or seated resting pulse.",
        placeholder: "60",
        type: "number",
        unit: "bpm",
        inputMode: "numeric",
      },
    ],
  },
  {
    id: "sleep",
    title: "Sleep",
    description:
      "Record duration and perceived quality together for nightly recovery context.",
    icon: Moon,
    fields: [
      {
        key: "sleepDuration",
        label: "Sleep duration",
        description: "Total time asleep for the selected date.",
        placeholder: "8.0",
        type: "number",
        unit: "hours",
        inputMode: "decimal",
      },
      {
        key: "sleepQuality",
        label: "Sleep quality",
        description: "Simple personal rating to compare good and poor nights.",
        placeholder: "Choose a rating",
        type: "select",
        options: [
          { label: "Select quality", value: "" },
          { label: "Poor", value: "poor" },
          { label: "Fair", value: "fair" },
          { label: "Good", value: "good" },
          { label: "Very good", value: "veryGood" },
          { label: "Excellent", value: "excellent" },
        ],
      },
    ],
  },
  {
    id: "activity",
    title: "Activity",
    description:
      "Track movement volume manually when device syncs are unavailable or still being added.",
    icon: Plus,
    fields: [
      {
        key: "dailySteps",
        label: "Daily steps",
        description: "Estimated or counted movement total for the day.",
        placeholder: "10000",
        type: "number",
        unit: "steps",
        inputMode: "numeric",
      },
    ],
  },
  {
    id: "notes",
    title: "Notes",
    description:
      "Keep short personal context beside the day without turning the product into medical advice.",
    icon: FileText,
    fields: [
      {
        key: "workoutNotes",
        label: "Workout notes",
        description: "Optional details about training, intensity, or recovery.",
        placeholder: "Example: 30-minute walk and light mobility session.",
        type: "textarea",
      },
      {
        key: "nutritionNotes",
        label: "Nutrition notes",
        description: "Optional food or hydration context you want to remember later.",
        placeholder: "Example: Higher protein intake and extra water after training.",
        type: "textarea",
      },
      {
        key: "notes",
        label: "Daily notes",
        description: "Plain-language context for the day overall.",
        placeholder: "Anything important about how the day felt or what affected the data.",
        type: "textarea",
      },
    ],
  },
];

function joinClasses(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function renderFieldValue(
  fieldKey: EntryFormField["key"],
  values: EntryFormValues,
) {
  if (fieldKey === "notes") {
    return values.notes ?? "";
  }

  return values[fieldKey] ?? "";
}

function renderFieldError(
  fieldKey: EntryFormField["key"],
  errors?: Partial<Record<EntryFormFieldKey, string>>,
) {
  if (fieldKey === "notes") {
    return errors?.notes;
  }

  return errors?.[fieldKey];
}

export function EntryForm({
  cancelLabel = "Cancel",
  date,
  errors,
  isLoading = false,
  isSaving = false,
  onCancel,
  onDateChange,
  onFieldChange,
  onSubmit,
  saveLabel = "Save entry",
  values,
}: EntryFormProps) {
  const isDisabled = isLoading || isSaving;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit?.(event);
  };

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <section
        aria-labelledby="entry-date"
        className="rounded-lg border border-border bg-card text-card-foreground shadow-soft"
      >
        <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:gap-8">
          <div className="flex gap-3">
            <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-secondary text-primary">
              <Calendar aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h2 id="entry-date" className="text-lg font-semibold tracking-normal">
                Date
              </h2>
              <p className="mt-1 max-w-prose text-sm leading-6 text-muted-foreground">
                Start with the day you want to update, then fill only the metrics
                you have on hand.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,0.8fr)] sm:items-end">
            <label className="grid gap-2 text-sm" htmlFor="entry-date-input">
              <span className="font-medium text-foreground">Entry date</span>
              <input
                id="entry-date-input"
                type="date"
                value={date}
                onChange={(event) => onDateChange(event.target.value)}
                disabled={isDisabled}
                aria-invalid={errors?.date ? true : undefined}
                className={INPUT_CLASS}
              />
              {errors?.date ? (
                <span className="text-sm text-destructive">{errors.date}</span>
              ) : null}
            </label>

            <div className="rounded-md border border-border bg-secondary px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Source
              </p>
              <p className="mt-2 text-sm font-medium text-secondary-foreground">
                Manual entry
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Designed for quick daily capture while future connected sources
                remain compatible.
              </p>
            </div>
          </div>
        </div>
      </section>

      {SECTIONS.map((section) => (
        <SettingsSection
          key={section.id}
          id={section.id}
          icon={section.icon}
          title={section.title}
          description={section.description}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {section.fields.map((field) => {
              const fieldId = `entry-field-${field.key}`;
              const fieldValue = renderFieldValue(field.key, values);
              const fieldError = renderFieldError(field.key, errors);
              const isTextarea = field.type === "textarea";

              return (
                <label
                  key={field.key}
                  className={joinClasses(
                    "grid gap-2 text-sm",
                    isTextarea && "sm:col-span-2",
                  )}
                  htmlFor={fieldId}
                >
                  <span className="font-medium text-foreground">{field.label}</span>
                  <span className="text-sm leading-6 text-muted-foreground">
                    {field.description}
                  </span>

                  {field.type === "textarea" ? (
                    <textarea
                      id={fieldId}
                      rows={5}
                      value={fieldValue}
                      placeholder={field.placeholder}
                      disabled={isDisabled}
                      aria-invalid={fieldError ? true : undefined}
                      onChange={(event) =>
                        onFieldChange(field.key, event.target.value)
                      }
                      className={TEXTAREA_CLASS}
                    />
                  ) : field.type === "select" ? (
                    <select
                      id={fieldId}
                      value={fieldValue}
                      disabled={isDisabled}
                      aria-invalid={fieldError ? true : undefined}
                      onChange={(event) =>
                        onFieldChange(field.key, event.target.value)
                      }
                      className={INPUT_CLASS}
                    >
                      {field.options?.map((option) => (
                        <option key={option.value || option.label} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        id={fieldId}
                        type="text"
                        inputMode={field.inputMode}
                        value={fieldValue}
                        placeholder={field.placeholder}
                        disabled={isDisabled}
                        aria-invalid={fieldError ? true : undefined}
                        onChange={(event) =>
                          onFieldChange(field.key, event.target.value)
                        }
                        className={INPUT_CLASS}
                      />
                      {field.unit ? (
                        <span className="inline-flex min-h-12 shrink-0 items-center rounded-md border border-border bg-secondary px-3 text-sm text-secondary-foreground">
                          {field.unit}
                        </span>
                      ) : null}
                    </div>
                  )}

                  {fieldError ? (
                    <span className="text-sm text-destructive">{fieldError}</span>
                  ) : null}
                </label>
              );
            })}
          </div>
        </SettingsSection>
      ))}

      <section
        aria-labelledby="entry-actions"
        className="rounded-lg border border-border bg-card text-card-foreground shadow-soft"
      >
        <div className="grid gap-4 p-4 sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 id="entry-actions" className="text-lg font-semibold tracking-normal">
                Review and save
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                BioTracker helps organize personal observations. It does not
                diagnose, treat, or replace care from a qualified clinician.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              {onCancel ? (
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isDisabled}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:border-primary/70 hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                  {cancelLabel}
                </button>
              ) : null}

              <button
                type="submit"
                disabled={isDisabled}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {isSaving ? (
                  <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                ) : (
                  <Save aria-hidden="true" className="h-4 w-4" />
                )}
                {isSaving ? "Saving" : saveLabel}
              </button>
            </div>
          </div>
        </div>
      </section>
    </form>
  );
}
