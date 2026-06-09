# Codex Initial Prompt

Work on this repository as a Ruby on Rails rewrite of the current BioTracker
application.

Before proposing architecture or writing code, read these files:

- CLAUDE.md
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

Use the current React + TypeScript app only as behavioral reference.

Do not port the SPA structure literally into Rails.

Target direction:

- Rails full-stack app
- Active Record persistence
- server-rendered HTML by default
- Turbo where useful
- Stimulus only for focused client-side behavior
- Rails defaults over custom abstractions

Preserve these product rules:

- manual-first tracking
- future-ready support for multiple metric sources
- non-medical reporting only
- JSON backup/import/export support

Preserve these core behaviors:

- daily entry centered workflow
- multiple metric entries per metric type when relevant
- explicit validation before persistence
- explicit failure on invalid payloads
- daily, weekly, and monthly reporting

I already want the new Rails version to move toward required API integrations.

So you must include API integration work from the start:

- identify required external APIs
- explain why each API is needed
- define adapter boundaries early
- design ingestion and reconciliation flows
- account for credentials, retries, rate limiting, and degraded mode
- add tests or test doubles around integrations

If vendor decisions are not final, do not block. Create adapter seams and mark
the vendor choice as open.

Work with multiple agents whenever possible. Split independent work into
parallel tracks such as:

- legacy domain mapping
- schema and migration design
- report engine porting strategy
- API integration planning
- import/export migration strategy
- risk and testing review

Start with planning and architecture, not a blind scaffold.

First deliverables:

1. target Rails architecture
2. schema proposal
3. routes, controllers, models, and service-object plan
4. API integration plan
5. phased execution plan
6. migration plan from current localStorage JSON export to Rails persistence

Then implement the rewrite in small vertical slices, validating each slice with
focused tests.
