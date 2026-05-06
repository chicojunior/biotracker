export type HealthMetricType =
  | "weight"
  | "bodyFatPercentage"
  | "visceralFatLevel"
  | "muscleMass"
  | "bodyWaterPercentage"
  | "boneMass"
  | "bloodPressureSystolic"
  | "bloodPressureDiastolic"
  | "restingHeartRate"
  | "sleepDuration"
  | "sleepQuality"
  | "dailySteps"
  | "workoutNotes"
  | "nutritionNotes"
  | (string & {});

export type HealthDataSource =
  | "manual"
  | "smartScale"
  | "smartBand"
  | "bloodPressureMonitor"
  | "fitnessPlatform"
  | "importedCsv"
  | (string & {});

export type HealthMetricEntry = {
  id: string;
  metricType: HealthMetricType;
  value: number | string | boolean | null;
  unit: string | null;
  recordedAt: string;
  source: HealthDataSource;
  notes?: string;
  confidence?: number;
  isPreferredSource?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DailyHealthEntry = {
  id: string;
  date: string;
  metrics: Partial<Record<HealthMetricType, HealthMetricEntry[]>>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type UserSettings = {
  preferredUnits: Partial<Record<HealthMetricType, string>>;
  preferredSourceByMetric: Partial<Record<HealthMetricType, HealthDataSource>>;
  goalNotes?: Partial<Record<HealthMetricType, string>>;
  theme?: "system" | "light" | "dark";
};

export type ReportSummary = {
  id: string;
  summaryType: "daily" | "weekly" | "monthly";
  period: {
    startDate: string;
    endDate: string;
  };
  hasData: boolean;
  observations: string[];
  missingData: HealthMetricType[];
  consistency: {
    score?: number;
    notes?: string;
  };
  disclaimer: string;
  createdAt: string;
};
