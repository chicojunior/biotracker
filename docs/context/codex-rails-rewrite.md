# BioTracker Rewrite Context for Codex

## Objective

Rewrite the current BioTracker app as a Ruby on Rails application.

Use the existing React + TypeScript app only as a product and behavior
reference. Do not treat the current code as something to transliterate line by
line.

## Current App Snapshot

Current stack:

- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Zod
- localStorage
- Vitest

Primary routes today:

- /
- /entry
- /history
- /reports
- /settings

Main nav labels today:

- Inicio
- Nova entrada
- Historico
- Relatorios
- Configuracoes

## Product Rules To Preserve

- Manual-first tracking
- Local personal tracking, not medical advice
- Future-ready for multiple data sources
- JSON backup/restore must exist

## Core Legacy Types

### Metrics

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

### Sources

- manual
- smartScale
- smartBand
- bloodPressureMonitor
- fitnessPlatform
- importedCsv

### Daily Entry Shape

The current app stores each day as a single record with:

- id
- date
- metrics hash
- notes
- createdAt
- updatedAt

The metrics hash points each metric type to an array of metric entries.

Each metric entry has:

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

## Current Persistence Details

Health data localStorage key:

- biotracker.health.dailyEntries

Settings localStorage key:

- biotracker:user-settings:v1

Health storage envelope:

- version = 1
- savedAt
- updatedAt
- entries[]

Important invariants:

- entries are validated before persistence
- invalid payloads fail explicitly
- daily records are ordered by date key
- date key format is YYYY-MM-DD
- reports use daily, weekly, and monthly periods

## Recommended Target Stack

Use Rails full-stack conventions.

Recommended baseline:

- Rails 8 full-stack app
- Active Record
- PostgreSQL in production
- SQLite acceptable for local development if desired
- Turbo for navigation/form updates
- Stimulus for focused client behavior only
- built-in Rails tests by default

Do not start with Rails API-only mode unless there is a firm product requirement
for a separate frontend.

## Suggested Relational Shape

### users

- id
- email if authentication exists later
- timestamps

### daily_entries

- id
- user_id
- entry_date date
- notes text
- timestamps

Suggested uniqueness:

- unique index on user_id + entry_date

### metric_entries

- id
- daily_entry_id
- metric_type string
- value_decimal decimal nullable
- value_text text nullable
- value_boolean boolean nullable
- unit string nullable
- recorded_at datetime
- source string
- notes text nullable
- confidence decimal nullable
- preferred_source boolean default false
- timestamps

### user_settings

Either:

- one row per user with JSON columns for units, preferred sources, goal notes,
  theme

Or:

- a normalized preferences table if query requirements justify it

Prefer the simpler one-row-per-user approach first.

## Suggested Rails Surface

Controllers:

- DashboardController
- DailyEntriesController
- ReportsController
- SettingsController
- BackupsController or separate ImportsController and ExportsController

POROs / services:

- ReportBuilder
- DateRangeHelper or report period objects
- ImportHealthData
- ExportHealthData
- MetricValueNormalizer

## Expected Feature Mapping

### Dashboard

- show latest daily values for weight, sleep duration, resting heart rate, daily
  steps
- use preferred source if configured

### Daily entry

- create and update one entry per day
- allow multiple metric entries inside a day where needed

### History

- browse entries ordered by date
- inspect full entry details

### Reports

- support daily summary
- support weekly summary
- support monthly summary
- include disclaimer text

### Settings

- preferred units by metric
- preferred source by metric
- goal notes by metric
- theme
- JSON import/export

## Concrete First Deliverables

If you are starting implementation, do this first:

1. Propose the Rails app structure and schema.
2. Generate the initial models and migrations.
3. Implement validations that match the current domain constraints.
4. Implement CRUD for daily entries.
5. Build a server-rendered dashboard page.
6. Add tests for models, report generation, and import/export.

## Legacy Files To Inspect

- README.md
- src/types/health.ts
- src/lib/validation/healthSchemas.ts
- src/lib/storage/healthStorage.ts
- src/lib/reports/reportEngine.ts
- src/lib/dates/dateRanges.ts
- src/features/health/hooks/useHealthData.ts
- src/features/settings/settingsStorage.ts
- src/app/router.tsx
- src/features/home/HomePage.tsx

## Guardrails

- Prefer Rails conventions over custom architecture.
- Preserve domain behavior, not frontend implementation details.
- Keep reporting logic outside controllers.
- Keep JSON import/export explicit and testable.
- Do not introduce medical claims or medical recommendation logic.
- Avoid unnecessary JavaScript.

## Prompt Starter For Codex

Rewrite this repository into a Ruby on Rails application.

Use the current React app only as behavioral reference.

Preserve these features:

- dashboard
- daily entry CRUD
- history
- daily/weekly/monthly reports
- settings
- JSON import/export

Preserve these product constraints:

- manual-first
- future multi-source metrics
- non-medical reporting

Implement the rewrite using full-stack Rails conventions, Active Record, Turbo
where useful, and Rails built-in tests unless there is a strong reason not to.

Start by proposing the schema, routes, controllers, models, service objects, and
a phased migration plan from the current localStorage JSON model.
