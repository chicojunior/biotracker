# BioTracker Copilot Instructions

## Build and test commands

- `npm run build` — production build (`tsc -b && vite build`)
- `npm test` — run the full Vitest suite once
- `npm run test:watch` — run Vitest in watch mode
- `npm test -- src/lib/storage/healthStorage.test.ts` — run a single test file

## High-level architecture

BioTracker is a Vite + React + TypeScript single-page app with Tailwind styling. The app boots from `src/main.tsx`, renders `src/app/App.tsx`, and uses a `createHashRouter` router defined in `src/app/router.tsx`. Route content is wrapped by `src/app/layout/AppShell.tsx`, which provides the responsive shell and shared navigation from `src/app/layout/AppNavigation.tsx`.

The codebase is organized by feature. `src/features/home/` contains the dashboard route. `src/features/settings/` is the most complete feature and shows the intended pattern: `SettingsRoute.tsx` wires state and persistence, `SettingsPage.tsx` is the composed page UI, and the `components/` folder contains focused presentational pieces. Entry, history, and reports routes are already registered in the router but are still placeholder pages.

The shared domain model lives in `src/types/health.ts`. Validation is centralized in `src/lib/validation/healthSchemas.ts` with Zod schemas for metric entries and daily entries. Local persistence is split by concern:

- `src/lib/storage/healthStorage.ts` stores daily health entries in a versioned localStorage envelope and returns explicit `{ ok: true | false }` results.
- `src/features/settings/settingsStorage.ts` handles persisted user settings, merges partial saved data onto defaults, and throws `SettingsStorageError` on write failures.

Date math is centralized in `src/lib/dates/dateRanges.ts`. Those helpers normalize to local noon before range arithmetic so date iteration remains stable across DST boundaries.

## Key conventions

- Follow the existing feature-first structure. Keep route wiring/hooks separate from page rendering; `SettingsRoute` + `useSettings` + `SettingsPage` is the reference pattern for new features.
- Do not read or write health data or settings directly from components when a storage helper already exists. Extend the existing storage modules so validation, sorting, versioning, and default-merging stay consistent.
- When adding new metric types or sources, keep `src/types/health.ts`, Zod validation in `src/lib/validation/healthSchemas.ts`, settings defaults in `src/features/settings/settingsStorage.ts`, and settings UI metadata in `src/features/settings/SettingsPage.tsx` aligned.
- Preserve storage invariants: daily entries are stored per date, sorted with `compareDateKeys`, and serialized inside the versioned `HEALTH_STORAGE_KEY` envelope; settings are loaded by merging saved partial values onto `DEFAULT_USER_SETTINGS`.
- Tests are colocated as `*.test.ts` / `*.test.tsx` next to the code they cover. UI tests use React Testing Library with the shared setup in `src/test/setup.ts`. App-level navigation tests use `window.location.hash` because routing is hash-based.
- Preserve the project’s health-product constraints from the existing brief: manual-first workflows, future-ready multi-source metric data, and no diagnostic/medical-advice behavior.
