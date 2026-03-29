# PRD Backlog (Emergent Items)

> Items discovered during PRD creation or implementation that should become their own PRDs.
> Review periodically and promote to full PRDs when ready.
>
> **Agent instruction**: Any time during work you discover something that needs its own PRD, add a row here immediately. Do NOT wait until the end of the session. Include enough context that the item makes sense months later.

---

| Date | Discovered During | Item | Priority | Notes |
|------|-------------------|------|----------|-------|
| 2026-03-29 | PRD 70-80 creation | Create `.claude/agents/prd-worker.md` and `.claude/agents/orchestrator.md` agent definitions for Agent Teams | Medium | Requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` flag. Would enable true worktree isolation per PRD. Currently using subagent pattern instead. Revisit when agent teams feature is stable. |
| 2026-03-29 | PRD 70-80 creation | Create `parallel-execution` skill documenting orchestrator/worker patterns, batching strategy, conflict prevention | Low | Pattern is documented in `prd-creation` skill v2.2 and `SPRINT_EFG_CONTEXT.md`. May warrant own skill if pattern is reused beyond PRD execution (e.g., parallel refactoring, parallel test runs). |
| 2026-03-29 | PRD 74 planning | Email notification system for payment events (failed payments, subscription renewals, receipts) | Medium | Ties into PRD 38 (Notification Infrastructure, schema-only complete). Should build on existing notification DB schema. |
