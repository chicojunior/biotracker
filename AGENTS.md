# AGENTS.md

Full project instructions live in [`CLAUDE.md`](CLAUDE.md) — read it, it
applies to every AI tool working in this repo, not just Claude.

**Start here, in order:**

1. [`handoff/LATEST.md`](handoff/LATEST.md) — what happened last session,
   current state, what's next. Read this before re-deriving context from git
   log or exploring the codebase cold.
2. [`SPEC.md`](SPEC.md) — the project contract: goals (§G), constraints (§C),
   interfaces (§I), invariants (§V), task list (§T), bug log (§B).
3. [`CLAUDE.md`](CLAUDE.md) — mission, stack, domain invariants, guardrails,
   commands.
4. [`api/README.md`](api/README.md) — backend setup and endpoints, if working
   on `api/`.

When a session's work is done, or the user asks for a "handover"/"handoff",
write one per [`handoff/README.md`](handoff/README.md)'s protocol.
