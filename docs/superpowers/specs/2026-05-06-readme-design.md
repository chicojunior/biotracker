# BioTracker README Design

## Summary

Create a balanced GitHub README for BioTracker that serves both repository visitors and developers. The README should explain what the project is, what the current MVP includes, how to run it locally, and how the codebase is organized, without overstating unfinished functionality.

## Audience

- Developers evaluating or contributing to the project
- Visitors trying to understand what BioTracker does and its current maturity

## Goals

- Make the repository understandable from the GitHub landing page
- Provide accurate local setup and validation commands
- Reflect the real current state of the MVP
- Preserve product constraints such as manual-first workflows and non-medical-advice positioning

## Proposed README Structure

1. **Title and overview**
   - Project name
   - Short description of BioTracker as a personal health tracking app
   - One concise paragraph on the product goal

2. **Current MVP**
   - Short list of currently implemented capabilities
   - Mention that the app is local-first and manual-first

3. **Tech stack**
   - React
   - TypeScript
   - Vite
   - Tailwind CSS
   - React Hook Form
   - Zod
   - Recharts
   - Vitest + React Testing Library

4. **Getting started**
   - Install dependencies
   - Run local development server
   - Build for production
   - Run tests
   - Run a single test file

5. **Project structure**
   - High-level explanation of `src/app`, `src/features`, `src/lib`, and `src/types`
   - Brief note about the feature-first organization

6. **Product principles**
   - Manual-first data entry
   - Future-ready multi-source metric model
   - Personal tracking only, not medical advice

7. **Roadmap / next steps**
   - Honest note on remaining polish or trend/report/dashboard expansion

8. **Contributing**
   - Short note inviting contributions and encouraging local verification before changes

## Content Rules

- Keep the tone practical and GitHub-native rather than marketing-heavy
- Use only verified commands from `package.json`
- Describe implemented features accurately and avoid implying that unfinished roadmap work already exists
- Keep architecture concise and high-level
- Avoid exhaustive directory listings

## Risks and Decisions

- The README must not claim full product completeness if dashboard/report polish is still in progress
- The README should use English consistently
- Screenshots are optional and should not block the initial README

## Deliverable

Create `README.md` in the repository root using the approved balanced structure.
