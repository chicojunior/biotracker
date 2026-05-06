import { useMemo, useState } from "react";
import {
  Database,
  Info,
  Palette,
  RotateCcw,
  Ruler,
  Save,
  Target,
} from "lucide-react";

import type { HealthDataSource, HealthMetricType } from "../../types/health";
import { ImportExportPanel } from "./components/ImportExportPanel";
import {
  MetricPreferenceTable,
  type MetricPreference,
  type MetricPreferenceValue,
} from "./components/MetricPreferenceTable";
import { SegmentedControl } from "./components/SegmentedControl";
import { SettingsSection } from "./components/SettingsSection";

type ThemePreference = "system" | "light" | "dark";

export type SettingsPageValue = {
  goalNotes: string;
  metricPreferences: Record<string, MetricPreferenceValue>;
  theme: ThemePreference;
};

type SettingsPageProps = {
  initialSettings?: Partial<SettingsPageValue>;
  isSaving?: boolean;
  onExport?: () => void;
  onImport?: () => void;
  onReset?: () => void;
  onSave?: (settings: SettingsPageValue) => void;
};

const SOURCE_OPTIONS: Record<string, { label: string; value: HealthDataSource }[]> = {
  activity: [
    { label: "Fitness platform", value: "fitnessPlatform" },
    { label: "Smart band", value: "smartBand" },
    { label: "Manual", value: "manual" },
  ],
  body: [
    { label: "Smart scale", value: "smartScale" },
    { label: "Manual", value: "manual" },
    { label: "CSV import", value: "importedCsv" },
  ],
  cardio: [
    { label: "Blood pressure monitor", value: "bloodPressureMonitor" },
    { label: "Manual", value: "manual" },
    { label: "CSV import", value: "importedCsv" },
  ],
  sleep: [
    { label: "Smart band", value: "smartBand" },
    { label: "Fitness platform", value: "fitnessPlatform" },
    { label: "Manual", value: "manual" },
  ],
};

const METRICS: MetricPreference[] = [
  {
    description: "Body mass trend.",
    key: "weight",
    label: "Weight",
    sourceOptions: SOURCE_OPTIONS.body,
    unitOptions: ["kg", "lb"],
  },
  {
    description: "Estimated body fat reading.",
    key: "bodyFatPercentage",
    label: "Body fat",
    sourceOptions: SOURCE_OPTIONS.body,
    unitOptions: ["%"],
  },
  {
    description: "Estimated lean mass reading.",
    key: "muscleMass",
    label: "Muscle mass",
    sourceOptions: SOURCE_OPTIONS.body,
    unitOptions: ["kg", "lb"],
  },
  {
    description: "Upper blood pressure value.",
    key: "bloodPressureSystolic",
    label: "Blood pressure systolic",
    sourceOptions: SOURCE_OPTIONS.cardio,
    unitOptions: ["mmHg"],
  },
  {
    description: "Lower blood pressure value.",
    key: "bloodPressureDiastolic",
    label: "Blood pressure diastolic",
    sourceOptions: SOURCE_OPTIONS.cardio,
    unitOptions: ["mmHg"],
  },
  {
    description: "Resting pulse trend.",
    key: "restingHeartRate",
    label: "Resting heart rate",
    sourceOptions: SOURCE_OPTIONS.activity,
    unitOptions: ["bpm"],
  },
  {
    description: "Nightly sleep duration.",
    key: "sleepDuration",
    label: "Sleep duration",
    sourceOptions: SOURCE_OPTIONS.sleep,
    unitOptions: ["hours"],
  },
  {
    description: "Daily movement volume.",
    key: "dailySteps",
    label: "Daily steps",
    sourceOptions: SOURCE_OPTIONS.activity,
    unitOptions: ["steps"],
  },
];

const THEME_OPTIONS: Array<{
  description: string;
  label: string;
  value: ThemePreference;
}> = [
  { description: "Use device setting.", label: "System", value: "system" },
  { description: "Light interface.", label: "Light", value: "light" },
  { description: "Dark interface.", label: "Dark", value: "dark" },
];

function createDefaultMetricPreferences() {
  return METRICS.reduce<Record<string, MetricPreferenceValue>>((preferences, metric) => {
    preferences[metric.key] = {
      source: metric.sourceOptions[0]?.value ?? "manual",
      unit: metric.unitOptions[0] ?? "",
    };
    return preferences;
  }, {});
}

function createInitialSettings(
  initialSettings?: Partial<SettingsPageValue>,
): SettingsPageValue {
  return {
    goalNotes:
      initialSettings?.goalNotes ??
      "Focus on consistent tracking, sleep regularity, and weekly trend review.",
    metricPreferences: {
      ...createDefaultMetricPreferences(),
      ...initialSettings?.metricPreferences,
    },
    theme: initialSettings?.theme ?? "system",
  };
}

export function SettingsPage({
  initialSettings,
  isSaving = false,
  onExport,
  onImport,
  onReset,
  onSave,
}: SettingsPageProps) {
  const initialValue = useMemo(
    () => createInitialSettings(initialSettings),
    [initialSettings],
  );
  const [settings, setSettings] = useState<SettingsPageValue>(initialValue);
  const [statusMessage, setStatusMessage] = useState("");

  const updateMetricPreference = (
    metric: HealthMetricType,
    value: MetricPreferenceValue,
  ) => {
    setSettings((current) => ({
      ...current,
      metricPreferences: {
        ...current.metricPreferences,
        [metric]: value,
      },
    }));
    setStatusMessage("");
  };

  const resetSettings = () => {
    const nextSettings = createInitialSettings(initialSettings);

    setSettings(nextSettings);
    setStatusMessage("Settings reset for this view.");
    onReset?.();
  };

  const saveSettings = () => {
    onSave?.(settings);
    setStatusMessage(
      onSave
        ? "Settings saved."
        : "Changes are staged in this view.",
    );
  };

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-6">
        <header className="grid gap-4 border-b border-border pb-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div>
            <p className="text-sm font-medium text-primary">BioTracker</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
              Settings
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Tune units, preferred sources, display mode, and personal goal
              notes for daily tracking.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row md:justify-end">
            <button
              type="button"
              onClick={resetSettings}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:border-primary/70 hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
              Reset
            </button>
            <button
              type="button"
              onClick={saveSettings}
              disabled={isSaving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <Save aria-hidden="true" className="h-4 w-4" />
              {isSaving ? "Saving" : "Save settings"}
            </button>
          </div>
        </header>

        {statusMessage ? (
          <p
            role="status"
            className="rounded-md border border-border bg-secondary px-4 py-3 text-sm text-secondary-foreground"
          >
            {statusMessage}
          </p>
        ) : null}

        <div className="grid gap-5">
          <SettingsSection
            id="display-settings"
            icon={Palette}
            title="Display"
            description="Match BioTracker to your current viewing preference."
          >
            <SegmentedControl
              legend="Theme preference"
              description="System follows your device when light or dark mode changes."
              options={THEME_OPTIONS}
              value={settings.theme}
              onChange={(theme) => {
                setSettings((current) => ({ ...current, theme }));
                setStatusMessage("");
              }}
            />
          </SettingsSection>

          <SettingsSection
            id="measurement-settings"
            icon={Ruler}
            title="Measurements"
            description="Keep repeated entries comparable across manual input and device imports."
          >
            <MetricPreferenceTable
              metrics={METRICS}
              values={settings.metricPreferences}
              onChange={updateMetricPreference}
            />
          </SettingsSection>

          <SettingsSection
            id="goal-settings"
            icon={Target}
            title="Goal Notes"
            description="Store plain-language context for what you want to watch over time."
          >
            <label className="grid gap-2" htmlFor="goal-notes">
              <span className="text-sm font-medium text-foreground">
                Personal tracking notes
              </span>
              <textarea
                id="goal-notes"
                value={settings.goalNotes}
                onChange={(event) => {
                  setSettings((current) => ({
                    ...current,
                    goalNotes: event.target.value,
                  }));
                  setStatusMessage("");
                }}
                rows={6}
                className="min-h-36 resize-y rounded-md border border-input bg-background px-3 py-2 text-sm leading-6 text-foreground shadow-sm transition placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                placeholder="Example: Keep weight trend stable while improving sleep consistency."
              />
            </label>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Use notes for personal context, not diagnosis or treatment
              decisions.
            </p>
          </SettingsSection>

          <SettingsSection
            id="data-settings"
            icon={Database}
            title="Data"
            description="Back up or restore local records when data tools are available."
          >
            <ImportExportPanel onExport={onExport} onImport={onImport} />
          </SettingsSection>

          <section
            aria-labelledby="health-disclaimer"
            className="rounded-lg border border-border bg-secondary p-4 text-secondary-foreground sm:p-5"
          >
            <div className="flex gap-3">
              <Info
                aria-hidden="true"
                className="mt-0.5 h-5 w-5 shrink-0 text-primary"
              />
              <div>
                <h2 id="health-disclaimer" className="font-medium">
                  Health Notice
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  BioTracker helps organize personal observations. It is not a
                  medical device and does not diagnose, treat, or replace advice
                  from a qualified clinician.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
