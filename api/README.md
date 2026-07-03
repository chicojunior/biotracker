# BioTracker API

Node.js + TypeScript backend for BioTracker, added in roadmap phase **F1**. It
persists health data to PostgreSQL using the normalized schema ported from the
abandoned v2 Rails app, while keeping the React app's domain types and Zod
validation as the single source of truth (imported from `../src`).

The guiding principle is **explicit over implicit**: no ORM callbacks or
autoloading. Validations are Zod schemas at the boundary, migrations are plain
SQL, and side effects are named functions you can follow.

## Stack

- **Fastify 5** — HTTP server (`src/app.ts` builds a testable instance).
- **Drizzle ORM** + **node-postgres** — schema in `src/db/schema.ts`, SQL
  migrations in `drizzle/`.
- **PostgreSQL** — `biotracker_dev` and `biotracker_test` (local).
- Shared with the frontend: `../src/types/health.ts`,
  `../src/lib/validation/healthSchemas.ts`, `../src/lib/reports/reportEngine.ts`.

## Layout

```
api/
├── drizzle/                 # generated SQL migrations (committed)
├── src/
│   ├── app.ts               # buildApp() → Fastify instance (no listen)
│   ├── server.ts            # process entry point (listen + shutdown)
│   ├── env.ts               # explicit env loading (fails fast)
│   ├── result.ts            # Result envelope + HTTP status mapping
│   ├── db/{schema,client}.ts
│   ├── domain/metricValue.ts    # value union ↔ typed columns (V25)
│   ├── mapping/envelope.ts      # nested v1 shape ↔ normalized rows
│   ├── repositories/entriesRepository.ts
│   ├── validation/envelopeSchema.ts
│   └── routes/{entries,reports,backups}.ts
└── tests/                   # node:test + fastify.inject against biotracker_test
```

## Setup

Requires the pinned Node (`.nvmrc`, 25.9.0) and a local PostgreSQL 14+.

```bash
# from the repo root
createdb biotracker_dev
createdb biotracker_test
cp api/.env.example api/.env      # adjust DATABASE_URL if needed

npm run db:migrate                # apply migrations to $DATABASE_URL (api/.env)
DATABASE_URL=postgres://localhost:5432/biotracker_test npm run db:migrate
```

## Commands (run from repo root)

| Command | What |
| --- | --- |
| `npm run dev:api` | Fastify with watch reload (`api/.env`) |
| `npm run start:api` | Run the server once |
| `npm run typecheck:api` | `tsc -p api/tsconfig.json` |
| `npm run test:api` | Backend tests against `biotracker_test` (serialized) |
| `npm run db:generate` | Generate a migration from schema changes |
| `npm run db:migrate` | Apply pending migrations |

## Frontend integration (F2)

The React app now reads and writes health entries through the API client behind
`src/lib/storage/healthStorage.ts`. In development, Vite serves the frontend and
proxies `/api/*` to the Fastify server:

```bash
# terminal 1
npm run dev:api

# terminal 2
npm run dev
```

Defaults:

- Frontend API base: `/api` (`VITE_BIOTRACKER_API_BASE_URL` overrides it).
- Vite proxy target: `http://localhost:3001`
  (`VITE_BIOTRACKER_API_PROXY_TARGET` overrides it).

## Endpoints

Most responses use the `Result` envelope: `{ ok: true, data }` or
`{ ok: false, error: { code, message, details? } }`. `GET /backups/export`
returns the backup envelope directly so it can be downloaded/imported as-is.

```
GET    /health
GET    /entries
GET    /entries/:date            (YYYY-MM-DD)
POST   /entries
PATCH  /entries/:date
DELETE /entries/:date
GET    /reports/{daily,weekly,monthly}/:date
PATCH  /metrics/:id
DELETE /metrics/:id
GET    /backups/export
POST   /backups/import
```

Not yet implemented (F1 continuation, SPEC §T23): `/settings`.

## Migrating existing browser data (T12/T24)

Pre-F2 versions stored health entries in `localStorage` behind a versioned JSON
envelope. That same envelope is the migration path into Postgres:

1. In the old browser-backed React app, export a backup (Settings → export) to get the
   `{ version: 1, ..., entries: [...] }` JSON.
2. In the F2 React app, use Settings → import and select that JSON file. The
   frontend confirms the replace-all action and posts it to `/backups/import`.

For direct API use, `POST` the same JSON envelope to `/backups/import`.

Import is **replace-all** (SPEC §V16) and atomic (§V10): the whole set lands or
nothing changes. v1 string ids are not preserved — Postgres owns identity — but
values, dates, sources, and `recordedAt` are. Round-trip is covered in
`tests/backups.test.ts`.
