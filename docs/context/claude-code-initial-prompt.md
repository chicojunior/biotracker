# Claude Code Initial Prompt

You are working in the BioTracker repository.

Start by reading these files completely before proposing changes:

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

Your mission is to rewrite BioTracker from the current React + TypeScript SPA
into a Ruby on Rails application.

Critical constraints:

- do not transliterate the SPA mechanically
- preserve product behavior and domain invariants
- preserve manual-first workflows
- keep support for future multi-source metrics
- keep reports informational only, never medical advice
- preserve JSON import/export and backup/restore behavior
- prefer Rails full-stack conventions, Active Record, server-rendered HTML,
  Turbo where useful, and Stimulus only where justified

Important domain facts to preserve:

- the core workflow revolves around daily entries
- a daily entry can contain multiple metric entries per metric type
- reports exist for daily, weekly, and monthly periods
- health data must be validated before persistence
- invalid payloads must fail explicitly

You should not treat integrations as future-only work.

I already want to develop the required API integrations for the new Rails
version. That means you must:

- identify the APIs needed for the target product direction
- propose the integration set explicitly
- define adapter boundaries early
- plan secrets, retry, rate limiting, and degraded-mode behavior
- design persistence so external synced data fits naturally
- include test strategy for integration boundaries

If a vendor choice is still open, keep moving by defining an adapter interface
and documenting the unresolved decision.

Use multiple agents whenever possible.

If the work can be split safely, parallelize it. At minimum, consider parallel
tracks for:

- legacy domain and invariants mapping
- Rails schema and migration proposal
- report engine design
- external API integration research and adapter design
- import/export and migration strategy
- test and regression risk review

Use the main thread only to consolidate outputs, resolve contradictions, and
produce the final plan.

Do not begin with broad code changes.

Start by producing these artifacts in order:

1. a target Rails architecture summary
2. an Active Record schema proposal
3. an API integration plan with vendors or adapter placeholders, flows, risks,
   and failure handling
4. a phased implementation plan with acceptance criteria per phase
5. a migration plan from the current localStorage JSON model into Rails
   persistence

After that, execute the rewrite in small vertical slices with tests.
