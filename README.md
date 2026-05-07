# BioTracker

BioTracker is a personal health tracking web app for recording and reviewing health data in one place. It is designed to be manual-first, local-first, and easy to extend later if future data sources are added.

## Current MVP

The current MVP includes:

- Manual health metric entry
- Dashboard with latest daily values
- History for reviewing past entries
- Reports for simple daily, weekly, and monthly summaries
- Settings for basic preferences
- JSON backup and restore
- Local browser persistence

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router
- React Hook Form
- Zod
- Vitest + React Testing Library

## Getting Started

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run the full test suite:

```bash
npm test
```

Run a single test file:

```bash
npm test -- src/lib/storage/healthStorage.test.ts
```

## Project Structure

- `src/app` — app shell, router, and top-level composition
- `src/features` — feature-focused screens and feature logic
- `src/lib` — shared helpers such as storage, validation, and date utilities
- `src/types` — shared TypeScript domain types

## Product Principles

- Manual-first workflows come before any device or platform integrations
- The data model should stay ready for future multi-source metrics
- Insights and summaries are for personal tracking only, not medical advice

## Current Status

The MVP is active and runnable locally. Polish, consistency, and trend work are still in progress.

## Contributing

Before making changes, run the local build and test commands above to verify the app still works. Keep changes focused, simple, and consistent with the existing feature-first structure.
