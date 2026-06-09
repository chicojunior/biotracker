# BioTracker Rewrite Context for Claude Code

## Mission

Rewrite BioTracker from the current React + TypeScript SPA into a Ruby on Rails
application.

The rewrite should preserve the product's core behavior and domain invariants
while simplifying the stack around Rails conventions.

## What BioTracker Is Today

BioTracker is a personal health tracking app focused on manual-first data entry,
local persistence, basic reporting, and future-ready support for multiple metric
sources.

Current stack:

- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router
- React Hook Form
- Zod
- Vitest + React Testing Library
- localStorage persistence

Current user-facing areas:

- Dashboard
- New entry
- History
- Reports
- Settings

Current navigation labels:

- Inicio
- Nova entrada
- Historico
- Relatorios
- Configuracoes

## Product Principles That Must Survive The Rewrite

- Manual-first workflows come before device integrations.
- The data model must stay ready for future multi-source metrics.
- Reports are informational only and must not present medical advice.
- The app should remain simple for one-person personal tracking.
- Backup and restore must exist.

## Domain Model In The Current App

### HealthMetricType

Known metrics today:

- weight
- bodyFatPercentage
- visceralFatLevel
- muscleMass
- bodyWaterPercentage
- boneMass
- bloodPressureSystolic
- bloodPressureDiastolic
- restingHeartRate
- sleepDuration
- sleepQuality
- dailySteps
- workoutNotes
- nutritionNotes

The current model also allows future metric strings beyond this list.

### HealthDataSource

Known sources today:

- manual
- smartScale
- smartBand
- bloodPressureMonitor
- fitnessPlatform
- importedCsv

The current model also allows future source strings beyond this list.

### Core Record Shapes

HealthMetricEntry:

- id
- metricType
- value as number | string | boolean | null
- unit nullable
- recordedAt
- source
- notes optional
- confidence optional
- isPreferredSource optional
- createdAt
- updatedAt

DailyHealthEntry:

- id
- date as YYYY-MM-DD
- metrics as a map from metric type to an array of HealthMetricEntry
- notes optional
- createdAt
- updatedAt

UserSettings:

- preferredUnits by metric
- preferredSourceByMetric by metric
- goalNotes by metric
- theme

ReportSummary:

- id
- summaryType: daily | weekly | monthly
- period.startDate
- period.endDate
- hasData
- observations[]
- missingData[]
- consistency
- disclaimer
- createdAt

## Current Data And Validation Rules

Validation is centralized today and should remain centralized after the rewrite.

Important current constraints:

- date keys use YYYY-MM-DD
- timestamps are ISO-like strings
- numeric metrics have range validation
- dailySteps is integer-like
- health data is validated before persistence

## Current Persistence Strategy

Health data is stored in localStorage under a versioned envelope:

- key: biotracker.health.dailyEntries
- version: 1

Envelope shape:

- version
- savedAt
- updatedAt
- entries[]

Settings are stored separately under:

- key: biotracker:user-settings:v1

Behavioral invariants worth preserving:

- daily entries are sorted by date key
- invalid payloads fail explicitly
- import/export is JSON-based
- storage errors are modeled explicitly

## Current Behavior By Area

### Dashboard

- Shows latest values for weight, sleep duration, resting heart rate, and daily
  steps.
- Uses preferred source and preferred unit when available.
- Provides quick access to create or edit today's entry.

### Entry

- Manual entry flow for daily data.
- App is oriented around a daily record with one or more metric entries per
  metric type.

### History

- Browse past entries and inspect details.

### Reports

- Builds daily, weekly, and monthly summaries from recorded entries.
- Uses date-range helpers and consistency calculations.
- Must always include an informational disclaimer, not medical guidance.

### Settings

- Manage metric unit preferences
- Manage preferred source by metric
- Goal notes
- Theme
- JSON import/export

## Recommended Rails Direction

Use modern full-stack Rails, not API-only Rails.

Reasoning:

- The current app is form-heavy and CRUD-heavy.
- Reports and settings fit naturally into Rails MVC.
- Rails resourceful routing and server-rendered HTML reduce SPA complexity.
- Turbo and Stimulus are enough for the expected interaction level.
- API-only mode would recreate frontend/backend split complexity too early.

Based on current Rails documentation, the default direction should be:

- Rails 8 full-stack app
- Active Record for persistence
- Resourceful routing
- Server-rendered HTML
- Turbo for navigation/form updates
- Stimulus only where light client behavior is needed
- Rails built-in test stack unless there is a strong reason to add RSpec

## Suggested Rails Architecture

### Models

Prefer normalized relational models rather than storing the current TypeScript
structure as a single JSON blob.

Suggested core models:

- User
- DailyEntry
- MetricEntry
- UserSetting or PreferenceSet
- DataImport

Suggested relationships:

- User has_many DailyEntry
- DailyEntry has_many MetricEntry
- User has_one settings record or equivalent preference table

Suggested MetricEntry fields:

- daily_entry_id
- metric_type
- value_decimal nullable
- value_text nullable
- value_boolean nullable
- unit
- recorded_at
- source
- notes
- confidence
- preferred_source boolean

The rewrite should choose a consistent way to represent the polymorphic value
field without making queries painful.

### Services / POROs

Extract business logic into service objects or plain Ruby objects for:

- report generation
- import/export
- validation or normalization of metric payloads
- date range calculations

### Controllers

Likely controllers:

- DashboardController
- DailyEntriesController
- MetricEntriesController if nested editing needs it
- ReportsController
- SettingsController
- ImportsController and ExportsController or a BackupController

### Views

Keep views simple and mostly server-rendered.

Hotwire should be used for:

- inline updates after save/delete
- dynamic report filtering
- optional dashboard refresh interactions

## Migration Priorities

### Phase 1

- Establish Rails app skeleton
- Model the domain in Active Record
- Port validations and invariants
- Recreate manual entry flow
- Recreate dashboard with latest daily values

### Phase 2

- Recreate history flow
- Recreate reports engine
- Recreate settings
- Recreate JSON export/import

### Phase 3

- Polish UX
- Add migration/import path from current browser JSON backup
- Add authentication only if genuinely needed

## Important Legacy-To-Rails Mapping

Map these current concepts carefully:

- DailyHealthEntry -> DailyEntry
- HealthMetricEntry -> MetricEntry
- UserSettings -> persistent settings model
- reportEngine.ts -> Report summary POROs/services
- healthSchemas.ts -> model validations + form object validations where needed
- healthStorage.ts -> database persistence + import/export service

## Constraints For The Rewrite

- Do not preserve the current frontend implementation mechanically.
- Preserve domain rules more than UI details.
- Keep the app simple; do not overengineer background jobs, event buses, or API
  layers unless they are clearly needed.
- Keep the rewrite compatible with future integrations, but do not implement
  those integrations now.
- Keep the medical disclaimer behavior in reports.

## Acceptance Criteria For The New Rails App

- A user can create and edit a daily entry.
- A user can record multiple metric entries per day when relevant.
- The dashboard shows latest important metrics.
- The app supports browsing entry history.
- The app generates daily, weekly, and monthly reports.
- The app stores user preferences.
- The app exports and imports user data in JSON.
- The app does not present diagnostic or prescriptive medical language.

## Existing Files Worth Reading Before Rewriting

- README.md
- package.json
- src/types/health.ts
- src/lib/validation/healthSchemas.ts
- src/lib/storage/healthStorage.ts
- src/lib/reports/reportEngine.ts
- src/lib/dates/dateRanges.ts
- src/features/health/hooks/useHealthData.ts
- src/features/settings/settingsStorage.ts
- src/app/router.tsx
- src/app/navigation.ts

## How I Want Claude Code To Work

When executing the rewrite, optimize for:

- preserving business behavior over UI parity
- small vertical slices
- Rails defaults over custom abstractions
- explicit tests for domain and reporting logic
- clear migration notes from the old app to the new one

Start by producing:

1. A target Rails architecture proposal.
2. A schema proposal for Active Record.
3. A migration plan from the current localStorage JSON model to relational
   tables.
4. A phased execution plan with acceptance criteria per phase.
