# CLAUDE.md

## Mission

Rewrite BioTracker from the current React + TypeScript SPA into a Ruby on Rails
application.

Do not transliterate the frontend line by line. Preserve product behavior,
domain rules, and reporting semantics while moving the implementation to Rails
conventions.

## First Reading

Before making architectural decisions or code changes, read these files:

- docs/context/claude-code-rails-rewrite.md
- docs/context/codex-rails-rewrite.md
- README.md
- src/types/health.ts
- src/lib/validation/healthSchemas.ts
- src/lib/storage/healthStorage.ts
- src/lib/reports/reportEngine.ts
- src/lib/dates/dateRanges.ts
- src/features/health/hooks/useHealthData.ts
- src/features/settings/settingsStorage.ts

Treat those files as the source of truth for the current product behavior.

## Product Intent

BioTracker is a personal health tracking app.

Non-negotiable product constraints:

- manual-first workflows come before automation
- future-ready support for multiple metric sources must remain possible
- reports are informational only and must not provide medical advice
- backup and restore must exist
- preserve simplicity for single-user personal tracking

## Rewrite Direction

Default target:

- Ruby on Rails full-stack app
- Rails 8 conventions when possible
- Active Record for persistence
- server-rendered HTML by default
- Turbo for navigation and form updates where useful
- Stimulus only for focused client-side behavior
- built-in Rails testing stack unless a strong reason emerges otherwise

Prefer Rails defaults over custom abstractions.

Do not introduce an API-only architecture unless there is a clear requirement
for a separate frontend.

## Domain Invariants To Preserve

- health tracking revolves around daily entries
- a daily entry can contain multiple metric entries per metric type
- date keys use YYYY-MM-DD semantics
- health data is validated before persistence
- invalid payloads fail explicitly
- reports exist for daily, weekly, and monthly periods
- reports always include non-medical disclaimer behavior
- import/export is JSON-based

Known metric types in the current product:

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

Known source types in the current product:

- manual
- smartScale
- smartBand
- bloodPressureMonitor
- fitnessPlatform
- importedCsv

## Execution Priorities

Build the Rails rewrite in vertical slices.

Preferred order:

1. Define target schema and domain model.
2. Port validations and normalization rules.
3. Implement daily entry CRUD.
4. Implement dashboard summary behavior.
5. Implement history.
6. Implement daily/weekly/monthly reports.
7. Implement settings.
8. Implement JSON export/import.
9. Implement required API integrations.

Preserve behavior first. UI parity is secondary.

## Required API Integration Direction

Do not treat integrations as a vague future possibility only.

Assume the rewrite should already move toward integrating the external APIs
needed for the intended product direction.

This means:

- identify the necessary external APIs early
- propose the integration set explicitly instead of leaving it implicit
- design the domain and persistence so synced external data fits naturally
- implement integration seams early, not only placeholders
- add credential handling, failure handling, retry strategy, and test doubles
  for each integration

Minimum integration expectations during planning and execution:

- determine which APIs are necessary for the new Rails version
- document why each API is needed
- define which data comes from which API
- model ingestion flows, sync frequency, and reconciliation rules
- plan secrets management and environment configuration
- plan rate limiting, backoff, and degraded-mode behavior
- add tests around integration boundaries

If the specific API vendor is still undecided, do not block the rewrite. Create
a clear adapter boundary and document the unresolved vendor choice explicitly.

Likely integration categories to consider from the existing domain:

- smart scale data
- smart band or wearable data
- blood pressure device data
- fitness platform data
- import pipelines for CSV or external exports

## Architecture Guidance

Prefer normalized relational models over storing the full legacy payload as a
single JSON blob.

Likely core Rails concepts:

- User
- DailyEntry
- MetricEntry
- UserSetting or PreferenceSet
- DataImport
- integration adapters and sync jobs as separate units

Keep business logic out of controllers.

Use POROs or service objects for:

- report generation
- date range calculations
- JSON import/export
- metric normalization
- external API ingestion and reconciliation

## Multi-Agent Policy

Work with multiple agents whenever possible.

If there are independent tracks of work, split them across agents instead of
handling everything serially in one thread.

Examples of parallelizable work:

- one agent maps the legacy domain and validations
- one agent proposes the Rails schema and migrations
- one agent designs or implements report generation
- one agent investigates required external APIs and integration strategy
- one agent prepares import/export and migration logic
- one agent reviews tests or regression risks

Use a coordinating agent or main thread only to:

- define the shared target architecture
- merge outputs
- resolve contradictions
- verify acceptance criteria

Avoid parallel work only when tasks are tightly coupled and likely to conflict
in the same files.

## Working Style

- prefer small, testable increments
- keep diffs focused
- favor explicit migrations and explicit validations
- keep reporting logic deterministic and well tested
- document tradeoffs when choosing between simpler implementation and long-term
  extensibility
- preserve domain behavior over UI details
- do not add speculative infrastructure without a concrete need

## Testing Expectations

Every meaningful slice should include validation.

Prioritize tests for:

- model validations
- report logic
- import/export
- API integration adapters
- sync or reconciliation behavior
- controller or system flows for key user journeys

## Commands For The Current Repository

These commands apply to the current pre-rewrite codebase and are useful for
understanding existing behavior:

- npm run dev
- npm run build
- npm test
- npm test -- src/lib/storage/healthStorage.test.ts

Use them when you need to inspect or preserve current behavior during the
rewrite.

## What To Produce Early

At the start of the rewrite, produce these artifacts before broad coding:

1. Target Rails architecture summary.
2. Active Record schema proposal.
3. API integration plan listing required vendors, flows, risks, and adapter
   boundaries.
4. Phased implementation plan with acceptance criteria.
5. Data migration plan from current localStorage JSON export into Rails
   persistence.

## Guardrails

- do not re-implement the SPA architecture inside Rails
- do not bury core domain rules inside views or controllers
- do not postpone all integrations indefinitely if they are part of the new
  product direction
- do not introduce medical diagnosis, prescription, or clinical guidance
- do not optimize for cleverness over clarity
