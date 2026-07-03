# SPEC — BioTracker (React + Node)

## §G Goal

Evolve BioTracker on official stack: React 19 SPA + Node/TS backend. v1 = official base. `../biotracker-v2` (Rails) = abandoned direction, read-only reference for architecture & feature progress. ⊥ literal Ruby port — reimplement idiomatic TS, explicit > implicit.

**Provenance**: adapted from `../biotracker-v2/SPEC.md` (invariant ids V1–V30 kept aligned for traceability). v1 domain code = source of truth for current behavior; v2 SPEC = source for backend schema, integration research, validation ranges.

## §C Constraints

- C1: stack fixed: React (frontend) + Node.js (backend). ⊥ framework swap.
- C2: explicit > implicit. Zod schemas at boundaries. Explicit SQL migrations. ⊥ ORM callbacks/hooks — side effects = named service functions, called visibly.
- C3: manual-first workflows. Automation augments, ⊥ replaces.
- C4: reports informational only. ⊥ medical advice, diagnosis, prescription.
- C5: JSON import/export & backup/restore ! first-class. Envelope = §I.envelope.
- C6: single-user. Auth deferred. Data model ! user-scoping-ready (F1+).
- C7: ∀ service boundary → `Result {ok:true,data}|{ok:false,error:{code,message,details[]}}`. ⊥ exceptions across boundary.
- C8: `../biotracker-v2` read-only. ⊥ modify, ⊥ delete.
- C9: semantic commits (feat/fix/test/chore/docs/refactor).
- C10: Node pinned `.nvmrc` = 25.9.0; `engines.node >= 20.19`. Machine default Node 16 ⊥ runs toolchain.
- C11 (confirmed 2026-07-03): backend = Fastify 5 + Drizzle ORM + node-postgres, PostgreSQL. Layout = **subfolder `api/`** (web stays at repo root); `api/` imports shared Zod schemas + types from `../src` (⊥ monorepo workspaces). Single root `package.json` serves web + api. Migrations via drizzle-kit → `api/drizzle/*.sql` (committed). DBs: `biotracker_dev`, `biotracker_test` (local pg 14).
- C15: dev-only vuln accepted: `drizzle-kit` → `@esbuild-kit` → esbuild ≤0.24.2 (GHSA-67mh-4wv8-2f99, dev server request bleed). 4 moderate, no non-breaking fix. Scope = local migration tooling, ⊥ exposed server. Revisit on drizzle-kit major bump.
- C12: report logic deterministic — `now` injected (V17).

## §I Interfaces

### I.metricType — enum, 14 values

```
weight bodyFatPercentage visceralFatLevel muscleMass bodyWaterPercentage boneMass
bloodPressureSystolic bloodPressureDiastolic restingHeartRate
sleepDuration sleepQuality dailySteps
workoutNotes nutritionNotes
```

Numeric: all except workoutNotes, nutritionNotes (text).
TS type open (`string & {}`) for forward-compat; validation closed to known set.

### I.source — enum, 7 values

```
manual smartScale smartBand bloodPressureMonitor fitnessPlatform importedCsv healthConnect
```

`healthConnect` adopted from v2 (F3+). v1 code currently lists 6 — extend w/ F3.

### I.dateKey — string `YYYY-MM-DD`

Regex `/^\d{4}-\d{2}-\d{2}$/` & valid calendar date.

### I.envelope — current v1 localStorage/export shape (version 1)

```json
{
  "version": 1,
  "savedAt": "<ISO8601>",
  "updatedAt": "<ISO8601>",
  "entries": [DailyHealthEntry]
}
```

Impl: `src/lib/storage/healthStorage.ts` (`HEALTH_STORAGE_KEY = biotracker.health.dailyEntries`). Entries sorted by date asc (V26). ≠ v2 envelope (`exportedAt`, settings co-envelope) — F1 import endpoint ! accept v1 shape as-is (migration path), v2-style extension ? decide at F1.

### I.error.codes

```
storage_unavailable malformed_json unsupported_version invalid_payload write_failed
```

### I.storage — healthStorage API (current persistence boundary)

```
loadDailyEntries() → Result<DailyHealthEntry[]>
saveDailyEntries(entries) → Result<DailyHealthEntry[]>
upsertDailyEntry(entry) → Result<DailyHealthEntry[]>
deleteDailyEntry(date) → Result<DailyHealthEntry[]>
clearHealthData() → Result<void>
exportHealthData() → Result<string>
importHealthData(raw) → Result<DailyHealthEntry[]>
```

F2 swaps backing store localStorage → API client. Contract stays.

### I.schema — F1 Postgres target (port of v2 `rails_app/db/schema.rb`)

```
users              id, email?, ts
daily_entries      id, user_id fk, entry_date date !, notes?, ts; unique(user_id, entry_date)
metric_entries     id, daily_entry_id fk, metric_type !, source !, value_decimal(12,4)?,
                   value_text?, value_boolean?, unit?, recorded_at datetime !, notes?,
                   confidence decimal(4,3)?, preferred_source bool default false, ts;
                   check: exactly one value_* non-null (V25)
user_settings      id, user_id fk unique, preferred_units jsonb, preferred_source_by_metric jsonb,
                   goal_notes jsonb, theme ∈ {system,light,dark}, ts
data_imports       id, user_id fk, kind !, status ∈ {pending,succeeded,failed},
                   source_payload jsonb?, error_message?, imported_at?, ts
connected_accounts id, user_id fk, provider !, access_token ! encrypted,
                   refresh_token ! encrypted, token_expires_at?, external_user_id?, scopes?,
                   status ∈ {connected,needs_reauth,disconnected}, last_synced_at?, ts;
                   unique(user_id, provider)
```

### I.api — F1 REST routes (mirror v2 `config/routes.rb`, JSON)

```
GET/POST           /entries            list, create
GET/PATCH/DELETE   /entries/:date      show, update, destroy
POST               /entries/:date/metrics
PATCH/DELETE       /metrics/:id
GET                /reports/{daily|weekly|monthly}/:date
GET/PATCH          /settings           + POST /settings/reset
GET                /backups/export     POST /backups/import
```

F3+: `/backups/health-connect`, `/backups/health-connect/sync`. F4: `/integrations/{connect,callback,disconnect,sync-now}`. `:date` constraint = I.dateKey regex.

### I.integrations — reference research (v2 SPEC, reuse ⊥ redo)

- Google Health API v4 (`https://health.googleapis.com/v4/`): OAuth endpoints, scopes, data_type→metric mapping, error→exception mapping documented ∈ `../biotracker-v2/SPEC.md` §I.google_health_client & §C12.
- Health Connect backup ZIP (SQLite inside): record mapping table ∈ v2 §I.health_connect_backup. Watermark incremental import.
- OMRON Connect CSV (pt-BR headers): section/column mapping ∈ v2 §I.omron_csv_import.

## §V Invariants

Ids aligned w/ v2 SPEC. `[F1+]` = active once backend lands; until then applies to SPA layer where relevant.

V1: entry date matches I.dateKey & valid calendar date → reject Feb 30.
V2: `recordedAt` ! valid ISO8601, stored UTC.
V3: `metricType` ∈ I.metricType (validation layer; TS type stays open).
V4: `source` ∈ I.source.
V5: numeric ranges per metric_type (draft, from v2 — confirm w/ product):

```
weight 0..1000 | bodyFatPercentage 0..100 | visceralFatLevel 0..60 | muscleMass 0..500
bodyWaterPercentage 0..100 | boneMass 0..20 | bloodPressureSystolic >0..400
bloodPressureDiastolic >0..300 | restingHeartRate >0..300 | sleepDuration 0..24
sleepQuality 1..10 | dailySteps 0..200000 (integer, V6)
```

V6: dailySteps ! integer.
V7: `confidence` if present → 0 ≤ x ≤ 1, finite.
V8: [F1+] daily_entries unique (user_id, entry_date). SPA: one entry per date key (upsert replaces).
V9: import: ∀ metricEntry.metricType ∈ I.metricType else `invalid_payload`.
V10: invalid payload → fail explicit, atomic, ⊥ partial write.
V11: envelope `version == 1` else `unsupported_version`.
V12: report `disclaimer` ! non-medical informational language, always present.
V13: report aggregation skips non-finite & non-numeric values.
V14: multi-entry per day per metric → aggregation = average over all readings; display layer picks preferred source separately.
V15: consistency score = `round((day_cov*0.7 + metric_cov*0.3)*100)` (draft, v2 formula).
V16: import semantics = replace-all. ⊥ merge. UI ! warn before action.
V17: report determinism: same entries + same `now` → identical output. `now` injected.
V18: reports ⊥ medical diagnosis/prescription/guidance.
V19: = C7 (Result envelope ∀ service ops).
V20: [F4] integrations ⊥ log credentials/tokens/secrets.
V21: [F4] sync retry: backoff on 5xx & 429. ⊥ retry non-429 4xx. Discard on auth failure.
V22: [F3+] external ingest preserves all readings. ⊥ dedup at ingest. Display picks via `preferredSourceByMetric`.
V23: [F1+] `entry_date` = date column (no time); `recorded_at` = datetime UTC.
V24: week starts configurable 0..6, default 1 (Mon). Week range = start..start+6.
V25: [F1+] metric_entries: exactly one of {value_decimal, value_text, value_boolean} non-null. Numeric type → decimal; notes types → text.
V26: export entries sorted by date asc.
V27: top-N deltas in observations, N=3 draft: |delta| desc, then metric_type asc.
V28: empty range → `observations=[]`, `hasData=false`, `consistency.score=0`. ⊥ hardcoded prose fallback.
V29: string fields `.trim()` before persist; empty after trim → null/absent.
V30: report `period.startDate ≤ period.endDate` ! else explicit error.

## §T Tasks

```
id|status|task|cites
T1|x|pin Node 25.9.0: .nvmrc + engines|C10
T2|x|test env fix: in-memory Storage on Storage.prototype, exclude .worktrees from vitest|B1,B2
T3|x|merge feat/dashboard-trend-charts (+18 files, trend components + libs, tests)|—
T4|x|rewrite CLAUDE.md: mission React+Node, v2 read-only reference|C1,C8
T5|x|commit PRODUCT.md, DESIGN.md, .impeccable; gitignore .claude|—
T6|x|SPEC.md adapted from v2|C8
T7|x|wire DashboardTrendCard into HomePage (built ∈ T3, not mounted)|—
T8|x|F1: subfolder `api/` layout (⊥ monorepo); Fastify+Drizzle+pg deps; tsconfig imports ../src; drizzle-kit config w/ process.loadEnvFile|C11,C15
T9|x|F1: Fastify buildApp() factory + Result envelope (result.ts) + error handler malformed_json; testable via inject|C7,C11
T10|x|F1: Drizzle schema (6 tables incl connected_accounts) + migration 0000; V25 check `num_nonnulls=1`; applied dev+test|I.schema,V25
T11|x|F1: REST routes entries CRUD + reports daily/weekly/monthly + backups export/import; Zod validation reusing dailyHealthEntrySchema; :date regex constraint|I.api,V1..V10
T12|x|F1: import endpoint accepts v1 envelope → replace-all migration path localStorage→Postgres; export→import round-trip tested|I.envelope,V16
T23|.|F1 cont: settings endpoints GET/PATCH/reset /settings + user_settings repo (defaults merge, theme inclusion)|I.api,I.schema
T24|x|F1 cont: data migration UX — one-shot `POST /backups/import` of the browser's localStorage export (documented in api/README)|I.envelope,V16
T13|x|F2: API client w/ Result contract; swap healthStorage backing; hook surface names unchanged (async over HTTP)|I.storage,C7
T14|x|F2: metric-level CRUD UI (PATCH/DELETE /metrics/:id)|I.api
T15|.|F3: data_imports audit table + write path|I.schema
T16|.|F3: OMRON CSV importer (mapping ∈ v2 §I.omron_csv_import)|I.integrations,V10
T17|.|F3: Health Connect ZIP importer (better-sqlite3 + unzip; watermark)|I.integrations,V22
T18|.|F4: connected_accounts + token encryption|I.schema,V20
T19|.|F4: Google Health API v4 OAuth + sync job w/ cursor + backoff|I.integrations,V21
T20|.|F4: Google Drive backup auto-fetch|I.integrations
T21|.|F5: i18n pt-BR default + en (react-i18next); disclaimer via i18n key|V12
T22|.|F5: CI GitHub Actions: test, build, lint, npm audit|C9
```

Status: `x` done, `~` wip, `.` todo, `-` cancelled.

Phasing:

```
F0 saneamento   T1..T6 (done)
F1 backend      T8..T12,T24 (done), T23 (todo)
F2 front on API T7,T13,T14 (done)
F3 importers    T15..T17
F4 integrations T18..T20
F5 quality      T21..T22
```

## §B Bugs

```
id|date|cause|fix
B1|2026-07-03|Node ≥22 experimental localStorage global (non-functional w/o --localstorage-file) shadows jsdom impl → 17 test fails `localStorage.clear is not a function`|T2: in-memory Storage installed in test setup, methods on Storage.prototype (spyOn compat)
B2|2026-07-03|vitest discovered `.worktrees/` git-worktree copies → duplicate failing suites|T2: exclude `**/.worktrees/**` in vitest.config.ts
B3|2026-07-03|node:test ran api test files in parallel; concurrent `TRUNCATE ... CASCADE` on shared biotracker_test → pg deadlock 40P01|test:api runs `--test-concurrency=1` (integration tests share one DB)
B4|2026-07-03|app caches userId (C6); test truncated `users` mid-run then reused same app → stale id → FK violation on import insert. ⊥ prod bug (user never deleted; import resolves/creates user on demand)|round-trip test uses a fresh buildTestApp() after reset to mirror real migration-into-empty-DB
B5|2026-07-03|clean `npm run build` lacked declared React type packages and trend components used global `JSX.Element`/narrow Recharts formatter signatures|added `@types/react`/`@types/react-dom`; typed trend components with `ReactElement` and broader tooltip formatter inputs
```
