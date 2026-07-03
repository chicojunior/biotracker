# Handoff Protocol

Tool-agnostic session continuity log for this project. Works with Claude,
Codex, Gemini, or any other AI coding tool — nothing here is tool-specific.

## What this is (and isn't)

- **This folder** = ephemeral session log. "What happened, what's the state
  right now, what's next." Written on request, at the end of a work session.
- **Not the contract.** [`../SPEC.md`](../SPEC.md) is the durable source of
  truth: goals, interfaces, invariants (§V), phased task list (§T), bug log
  (§B). Handovers reference SPEC ids, they don't restate them.
- **Not the mission/conventions doc.** [`../CLAUDE.md`](../CLAUDE.md) (mirrored
  by `../AGENTS.md` and `../GEMINI.md`) holds the standing rules: stack,
  guardrails, commands. Read once per tool session, rarely changes.

Read order for a fresh session: `AGENTS.md` (or your tool's equivalent) →
`handoff/LATEST.md` → `SPEC.md` §T for current task status → the actual code.
Do not re-derive project history from git log when a handover already has it.

## Files

- `LATEST.md` — full copy of the most recent handover. Always read this first;
  it is regenerated (not appended) every time a new handover is written.
- `YYYY-MM-DD-<slug>.md` — dated, immutable log entries. Kept for history; if
  you need "what did we decide three sessions ago," scan filenames by date.
- `TEMPLATE.md` — the structure new handovers follow.

## Automatic phase handover

At the end of each project phase, update the handover automatically even if the
user does not explicitly ask for it. Treat phase completion the same as a
handover request: write a dated handover file and overwrite `LATEST.md` with the
same content, after verifying the actual repo state.

## Requesting a handover

Say "gera handover" / "write a handover" / "handoff" (any language, any tool).
The acting tool should:

1. Fill `TEMPLATE.md`'s sections from the actual session — commits made, tests
   run, decisions with their *why*, open questions.
2. Save as `handoff/YYYY-MM-DD-<slug>.md` (date = today, slug = 2-4 words,
   kebab-case, describing the session's main thread).
3. Overwrite `handoff/LATEST.md` with the same content.
4. Keep it terse. Link to SPEC ids and file paths instead of re-explaining
   things that live there. A handover that duplicates SPEC.md content will
   drift from it and mislead the next session.

## Consuming a handover

Don't treat a handover as ground truth for code state — it's a snapshot from
whenever it was written. Cross-check anything load-bearing (test results,
"done" tasks) against the actual repo before acting on it: run the tests, grep
for the file, check `git log`. Handovers save you from re-deriving *history and
reasoning*; they don't replace verifying *current state*.
