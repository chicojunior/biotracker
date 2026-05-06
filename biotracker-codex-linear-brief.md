# BioTracker — Codex Initial Project Setup

## Role

You are the Orchestrator for this project.

Follow the Ultralight Orchestration workflow:

1. First, delegate the request to the Planner agent.
2. The Planner must research the project context, confirm the recommended stack and structure, identify edge cases, and produce an implementation plan.
3. Parse the Planner output into execution phases.
4. Split work by files and avoid file conflicts.
5. Delegate implementation tasks to the Coder agent.
6. Delegate UI/UX, layout, design system, accessibility, and visual decisions to the Designer agent.
7. Do not implement anything directly as the Orchestrator.
8. Before coding, output the execution plan and wait for my approval.

## Project Name

BioTracker

## Project Summary

BioTracker is a personal health tracking web application designed to centralize, organize, and analyze health data from multiple sources.

The main problem is that health data is fragmented across different apps and devices, such as smart bands, body composition scales, blood pressure monitors, and fitness platforms. These systems often do not integrate well with each other, making it hard to understand progress, detect patterns, and make informed health decisions.

BioTracker should provide a single dashboard where users can manually input, visualize, compare, and review their health metrics over time.

## Core Goal

Build an MVP that allows the user to manually register health metrics, visualize trends, and generate simple daily, weekly, and monthly health summaries.

The MVP should not depend on external device integrations yet. Integrations can be added later after the data model and reporting flow are stable.

## Initial Tech Stack Proposal

Use a modern, simple, maintainable stack:

- Frontend: React + TypeScript
- Build tool: Vite
- Styling: Tailwind CSS
- UI components: shadcn/ui if appropriate
- Charts: Recharts
- Forms: React Hook Form
- Validation: Zod
- State management: start simple with local state and/or lightweight context
- Persistence for MVP: localStorage or IndexedDB
- Testing: Vitest + React Testing Library
- Package manager: pnpm if available, otherwise npm

The Planner should verify whether this stack is appropriate before implementation.

## Mandatory Coding Principles

Follow these principles:

- Keep the project structure predictable and easy to regenerate.
- Group code by feature, not by technical layer only.
- Prefer simple and explicit code over clever abstractions.
- Keep shared utilities minimal.
- Use descriptive names.
- Keep functions small to medium-sized.
- Avoid deep nesting.
- Make errors explicit.
- Keep the app testable.
- Prefer deterministic behavior.
- Add comments only for important assumptions, invariants, or external requirements.
- Use framework-native patterns.
- Avoid premature backend architecture.
- Do not over-engineer the MVP.

## MVP Functional Requirements

### 1. Health Metrics Entry

Create a way to manually register daily health measurements.

Initial metrics:

- Weight
- Body fat percentage
- Visceral fat level
- Muscle mass
- Body water percentage
- Bone mass
- Blood pressure systolic
- Blood pressure diastolic
- Resting heart rate
- Sleep duration
- Sleep quality
- Daily steps
- Workout notes
- Nutrition notes

### 2. Dashboard

Create a dashboard showing:

- Latest measurement summary
- Weight trend
- Body fat trend
- Muscle mass trend
- Blood pressure trend
- Resting heart rate trend
- Sleep trend
- Simple progress indicators

### 3. History

Create a history page or section where the user can review past entries.

It should support:

- Listing entries by date
- Viewing entry details
- Editing an existing entry
- Deleting an entry

### 4. Reports

Create simple generated summaries:

- Daily summary
- Weekly summary
- Monthly summary

Reports should highlight:

- Metric changes
- Positive trends
- Negative trends
- Missing data
- Consistency
- Basic observations

Do not provide medical diagnosis. Use neutral language such as:

- trend
- variation
- worth monitoring
- consider discussing with a healthcare professional

### 5. Data Source Model

Even though the MVP is manual-first, design the data model so future integrations are possible.

Each metric entry should be able to include:

- Value
- Unit
- Date/time
- Source
- Notes
- Confidence or preferred source flag, if useful

Example future sources:

- Manual entry
- Smart scale
- Smart band
- Blood pressure monitor
- Fitness platform
- Imported CSV

### 6. Settings

Create basic settings for:

- Preferred units
- Preferred source per metric
- User goal notes
- Export/import local data if feasible in MVP

## UX Requirements

The Designer agent should create a clean, calm, health-focused interface.

Design principles:

- Clear dashboard first
- Mobile-friendly
- Accessible color contrast
- Easy-to-read charts
- Avoid visual clutter
- Support light and dark mode if feasible
- Make data entry fast and low-friction
- Make empty states helpful
- Make trends understandable without overwhelming the user

The visual style should feel:

- Minimal
- Trustworthy
- Modern
- Calm
- Practical

## Important Health Disclaimer

The app must not diagnose, prescribe treatment, or replace medical advice.

Any generated insight should be framed as personal tracking information only.

Example wording:

> This is not medical advice. Use this information for personal tracking and discuss relevant changes with a healthcare professional.

## Initial Pages / Routes

The Planner should decide the final structure, but consider:

- `/` Dashboard
- `/entry/new` Add measurement
- `/history` Measurement history
- `/reports` Reports
- `/settings` Settings

## Suggested Feature-Based Structure

The Planner should validate this structure before implementation:

- `src/app/App.tsx`
- `src/app/routes.tsx`
- `src/features/dashboard/`
- `src/features/entries/`
- `src/features/history/`
- `src/features/reports/`
- `src/features/settings/`
- `src/components/layout/`
- `src/components/ui/`
- `src/lib/storage/`
- `src/lib/validation/`
- `src/lib/dates/`
- `src/lib/calculations/`
- `src/types/health.ts`
- `src/test/`

## Data Model Requirements

Create TypeScript types for:

- `HealthMetricType`
- `HealthMetricEntry`
- `DailyHealthEntry`
- `HealthDataSource`
- `UserSettings`
- `ReportSummary`

The data model should support adding new metric types later without major rewrites.

## Reporting Logic

Implement simple deterministic report logic.

Examples:

- Compare latest weight with previous entry.
- Compare weekly average with previous weekly average.
- Detect missing data days.
- Detect whether a metric is trending up, down, or stable.
- Summarize blood pressure values without diagnosing.

Keep this logic separate from UI components.

## Testing Requirements

Add tests for:

- Data validation
- Storage helpers
- Trend calculations
- Report generation logic

Prioritize business logic tests over snapshot tests.

## Planner Instructions

Before implementation, produce:

1. Summary of the proposed MVP.
2. Recommended architecture.
3. Recommended file structure.
4. Implementation phases.
5. File assignments per phase.
6. Which tasks can run in parallel.
7. Which tasks must run sequentially.
8. Edge cases.
9. Open questions.
10. Risks of over-engineering.

Do not write code yet.

## Execution Plan Format

Use this format:

### Phase 1: Project Foundation

- Task 1.1: [description] -> Coder
  - Files: [...]
- Task 1.2: [description] -> Designer
  - Files: [...]

Parallelization note: No file overlap -> parallel execution allowed.

### Phase 2: Core Data Model

- Task 2.1: [description] -> Coder
  - Files: [...]

Dependency note: Depends on Phase 1.

### Phase 3: UI Implementation

- Task 3.1: [description] -> Designer
  - Files: [...]
- Task 3.2: [description] -> Coder
  - Files: [...]

## Important

Stop after producing the execution plan.

Wait for my approval before making any file changes.

---

# Linear Issue Summary

## Title

BioTracker MVP — Initial Project Setup

## Description

Build the initial MVP for BioTracker, a personal health tracking web app that centralizes health metrics from fragmented sources.

## Goal

Create a manual-first health dashboard where users can register daily measurements, visualize trends, and generate simple daily, weekly, and monthly summaries.

## MVP Scope

- Manual health data entry
- Dashboard with latest values and trends
- Measurement history
- Edit/delete entries
- Simple reports
- Local persistence
- Basic settings
- Future-ready data model for device/app integrations

## Initial Metrics

- Weight
- Body fat percentage
- Visceral fat
- Muscle mass
- Body water
- Bone mass
- Blood pressure
- Resting heart rate
- Sleep
- Steps
- Workout notes
- Nutrition notes

## Non-goals for MVP

- No full device integrations yet
- No medical diagnosis
- No backend unless strictly necessary
- No over-engineered architecture

## Suggested Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Recharts
- React Hook Form
- Zod
- Vitest
- localStorage or IndexedDB

## Acceptance Criteria

- User can create, edit, delete, and view health entries.
- Dashboard shows latest measurements and basic trends.
- Reports summarize daily, weekly, and monthly progress.
- Data model supports future multiple sources per metric.
- App includes a clear disclaimer that insights are not medical advice.
- Business logic has basic tests.
