# Handover — <YYYY-MM-DD> <short title>

Tool/session that wrote this: <claude|codex|gemini|other> — <one line, e.g. "Claude Code, F1 backend build">

## Session summary

1-3 sentences: what was the goal, what happened.

## State at end of session

- Tests: web `<X/X>`, api `<Y/Y>` (commands: `npm test`, `npm run test:api`)
- Build/typecheck: `<pass|fail, note>`
- Git: `<branch>`, HEAD = `<short sha>` (`<n>` commits this session, working
  tree `<clean|dirty>`)
- Running services / local state worth knowing (DBs seeded, servers left up, etc.)

## Decisions made (with why)

- `<decision>` — why: `<reason>`. Cites: `<SPEC id if applicable>`.

## Changed files (high-signal only)

- `<path>` — `<one line: what and why>`

Skip exhaustive diffs — `git log`/`git show` has those. List only what a fresh
session needs to know exists.

## Open items / next step

- `<item>` — `<what's blocking it, or what decision it needs>`

## Pointers

- SPEC.md §<relevant sections>
- <other relevant docs/files>
