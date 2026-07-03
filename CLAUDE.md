# CLAUDE.md

## Mission

Evolve BioTracker on its **official stack: React (frontend) + Node.js (backend)**.

The Rails rewrite (`../biotracker-v2`) was abandoned as a direction and is now a
**read-only reference** — never modify it. Use it for architecture and feature
progress only: data modeling (schema/migrations), business rules, routes,
validations, and integration research. Do not transliterate Ruby code; reimplement
idiomatically in TypeScript.

Guiding principle: **explicit over implicit.** Everything Rails does implicitly
(validations, associations, callbacks, autoloading) must be visible, traceable
code here: Zod schemas at boundaries, explicit queries, named service functions
instead of ORM hooks.

## Current State

- React 19 SPA (Vite + Tailwind + React Router 7 + RHF/Zod + Recharts + Vitest).
- Persistence: browser localStorage behind `src/lib/storage/healthStorage.ts`
  (versioned JSON envelope, `Result {ok,data}|{ok,error}` contract).
- No backend yet — building the Node API is the core of the evolution roadmap.
- `SPEC.md` at repo root is the project contract: goals, interfaces, invariants
  (§V), and the phased task list (§T). Read it before architectural decisions.

## First Reading

- SPEC.md
- src/types/health.ts
- src/lib/validation/healthSchemas.ts
- src/lib/storage/healthStorage.ts
- src/lib/reports/reportEngine.ts
- src/lib/dates/dateRanges.ts
- src/features/health/hooks/useHealthData.ts

Reference (read-only, in ../biotracker-v2):

- SPEC.md — invariants V1–V30, integration research (Google Health API v4,
  Health Connect, OMRON CSV), schema decisions
- rails_app/db/schema.rb — normalized relational model to port

## Product Intent

BioTracker is a personal health tracking app. Non-negotiable constraints:

- manual-first workflows come before automation
- future-ready support for multiple metric sources must remain possible
- reports are informational only and must not provide medical advice
- backup and restore must exist (JSON envelope)
- preserve simplicity for single-user personal tracking

## Domain Invariants To Preserve

- health tracking revolves around daily entries
- a daily entry can contain multiple metric entries per metric type
- date keys use YYYY-MM-DD semantics
- health data is validated before persistence
- invalid payloads fail explicitly
- reports exist for daily, weekly, and monthly periods
- reports always include non-medical disclaimer behavior
- import/export is JSON-based

Metric types (14): weight, bodyFatPercentage, visceralFatLevel, muscleMass,
bodyWaterPercentage, boneMass, bloodPressureSystolic, bloodPressureDiastolic,
restingHeartRate, sleepDuration, sleepQuality, dailySteps, workoutNotes,
nutritionNotes.

Source types: manual, smartScale, smartBand, bloodPressureMonitor,
fitnessPlatform, importedCsv, healthConnect.

## Architecture Direction

- Frontend stays a React SPA; feature-first structure under `src/features`.
- Backend (roadmap Phase 1): Node + TypeScript API, PostgreSQL with the
  normalized schema ported from v2 (users, daily_entries, metric_entries,
  user_settings, data_imports, connected_accounts). Explicit SQL migrations.
- Shared domain types and Zod schemas move to a shared package when the API
  lands; they are the single source of truth for validation on both sides.
- Business logic lives in plain, testable functions/services — never in route
  handlers or React components.
- Keep the `Result` envelope contract across all service boundaries.

## Commands

Node is pinned via `.nvmrc` (25.9.0); run `nvm use` (or equivalent) first.
The machine default Node 16 cannot run the toolchain.

- npm run dev — Vite dev server
- npm run build — typecheck + production build
- npm test — full Vitest suite
- npm test -- src/lib/storage/healthStorage.test.ts — single file

## Working Style

- small, testable increments; focused diffs
- semantic commit messages (feat/fix/test/chore/docs/refactor)
- every new function gets a test; every bug fix gets a regression test
- deterministic report logic: inject `now`, never read the wall clock inside
- never modify ../biotracker-v2

## Guardrails

- do not suggest changing framework — stack is fixed (React + Node)
- do not port Ruby code literally; reimplement idiomatically in TS
- do not bury domain rules in components or route handlers
- do not introduce medical diagnosis, prescription, or clinical guidance
- do not add speculative infrastructure without a concrete need
