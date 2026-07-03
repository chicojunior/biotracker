# Handover — 2026-07-03 F1 backend landed

Tool/session that wrote this: Claude Code (Sonnet/Opus/Fable rotation) — v1/v2 recon, F0 cleanup, F1 backend build.

## Session summary

Two v1/v2 BioTracker copies existed in this workspace: v1 (React+Node, this
repo) was abandoned in favor of a Rails rewrite (`../biotracker-v2`), which
itself got abandoned because Rails' implicit conventions (ActiveRecord,
callbacks, autoloading) hurt traceability. Decision: v1 is now the official
base again; v2 stays as a **read-only** architecture/feature reference. This
session did recon of both, wrote a gap analysis + roadmap, then executed
phase F0 (repo cleanup) and F1 (Node backend scaffold).

## State at end of session

- Tests: web `106/106` (`npm test`), api `23/23` (`npm run test:api`)
- Typecheck: web build passes, `npm run typecheck:api` clean
- Git: branch `main`, working tree clean, 8 commits this session (see `git log
  --oneline -10`). No push done.
- Local state: PostgreSQL 14 running via brew; `biotracker_dev` and
  `biotracker_test` databases exist with migrations applied. `api/.env`
  created locally from `.env.example` (gitignored, no secrets — just points at
  `biotracker_dev`). Node pinned to 25.9.0 via `.nvmrc`; machine default is
  Node 16 and cannot run this toolchain — always `nvm use` or prefix `PATH`
  first.

## Decisions made (with why)

- **v1 (React+Node) is the official stack going forward** — why: user rejected
  Rails' implicit-magic direction after living with v2. Cites: SPEC.md §G.
- **v2 is read-only reference, never modified** — why: still valuable for
  schema decisions and integration research (Google Health API v4, Health
  Connect, OMRON CSV) already done there. Cites: SPEC.md §C8.
- **Backend layout = `api/` subfolder, not a monorepo** — why: user chose this
  explicitly over `apps/web`+`apps/api`+`packages/shared` to avoid disrupting
  the working frontend. `api/` imports Zod schemas + types directly from
  `../src` (no package boundary, no duplication). Cites: SPEC.md §C11.
- **Backend stack = Fastify 5 + Drizzle ORM + node-postgres** — why: user
  chose this explicitly over Express and Hono; Drizzle's explicit SQL
  migrations (no ORM callbacks) directly serve the "explicit over implicit"
  principle that motivated leaving Rails. Cites: SPEC.md §C11.
- **Accepted 4 moderate dev-only vulnerabilities** (drizzle-kit → esbuild
  ≤0.24.2, GHSA-67mh-4wv8-2f99) — why: no non-breaking fix exists yet, scope is
  local migration tooling only, not an exposed server. Revisit on drizzle-kit
  major bump. Cites: SPEC.md §C15.
- **Test env fix**: Node ≥22's experimental `localStorage` global shadowed
  jsdom's in Vitest, breaking 17 tests. Fixed with an in-memory `Storage`
  polyfill on `Storage.prototype` (keeps `vi.spyOn` compatibility). Cites:
  SPEC.md §B1.
- **api tests run serialized** (`--test-concurrency=1`) — why: parallel
  `TRUNCATE ... CASCADE` on the shared `biotracker_test` DB deadlocked
  Postgres. Cites: SPEC.md §B3.

## Changed files (high-signal only)

- `SPEC.md` — new. Project contract adapted from v2's SPEC.md, invariant ids
  (V1-V30) kept aligned for cross-reference. Source of truth for what's
  done/todo (§T) and why things are the way they are (§C, §V).
- `CLAUDE.md` — rewritten. Mission = React+Node evolution (was: Rails rewrite
  mission, now obsolete/wrong).
- `.nvmrc`, `package.json` engines — Node 25.9.0 pinned.
- `src/test/setup.ts` — in-memory Storage polyfill (see B1 above).
- `api/` — new, whole backend. Start with `api/README.md` for setup,
  endpoints, and the localStorage→Postgres migration procedure (T12).
- Merged `feat/dashboard-trend-charts` branch into `main` — trend chart
  components exist (`src/features/home/components/DashboardTrendCard.tsx`
  etc.) but are **not yet wired into HomePage** (see SPEC T7, still todo).

## Open items / next step

- **F2** (SPEC T13-T14): swap the frontend's `healthStorage` localStorage
  backend for an HTTP client against the new API. Hooks (`useHealthData`)
  should not need to change shape, only the storage implementation behind
  them.
- **F1 continuation** (SPEC T23-T24, not yet done): `/settings` endpoints
  (GET/PATCH/reset) and `/metrics/:id` granular CRUD. F1 shipped the vertical
  slice that proves the foundation + migration path; these two are the
  remaining gaps before calling F1 fully complete.
- **T7** (quick win, not yet done): mount `DashboardTrendCard` into
  `HomePage` — it's built and tested but sitting unused.
- User was asked to choose between F2 and T23 next; no answer captured before
  this handover was requested. Ask again or check chat continuation.
- Codacy MCP was not connected this session — the workspace's mandatory
  post-edit `codacy_cli_analyze` rule could not run. If available in a future
  session, consider running it against `api/` retroactively.

## Pointers

- `SPEC.md` — full contract, read §T for task status, §V for invariants, §B
  for known bugs/gotchas.
- `CLAUDE.md` / `AGENTS.md` / `GEMINI.md` — mission, stack, guardrails
  (identical content, different filenames per tool convention).
- `api/README.md` — backend setup, commands, endpoint list, migration guide.
- `../biotracker-v2/SPEC.md` — reference only, has the deeper integration
  research (Google Health API v4 client shape, Health Connect backup format,
  OMRON CSV column mapping) that F3/F4 will need. Do not port code from there,
  reimplement idiomatically.
