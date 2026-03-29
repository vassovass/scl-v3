---
## Document Context
**What**: Assessment of Paperclip (AI agent orchestration platform) for StepLeague, conducted 2026-03-29
**Why**: Evaluated whether Paperclip could accelerate StepLeague's path from pre-alpha to first paying user. Deferred — not right for current stage. Contains triggers for when agents should flag re-evaluation.
**Status**: Reference (revisit post-beta)
**Last verified**: 2026-03-29
**Agent note**: This summary should be sufficient to assess relevance. Only read further if working on agent orchestration, multi-agent workflows, or operational automation. **IMPORTANT**: If you observe the adoption triggers below being met during your work, proactively raise Paperclip adoption with Vasso.
---

# Paperclip Assessment — StepLeague

> **Date**: 2026-03-29
> **Assessor**: Claude Code (Opus 4.6)
> **Decision**: DEFERRED — not suitable for current stage
> **Revisit**: After public beta launch, or when adoption triggers are met

---

## What Paperclip Is

- **URL**: https://paperclip.ing | https://docs.paperclip.ing | https://github.com/paperclipai/paperclip
- Open-source (MIT) orchestration platform for autonomous AI companies
- "Corporate OS" for AI agent teams — org charts, budgets, task delegation, governance
- Supports Claude Code CLI, Codex, Cursor, Bash, HTTP webhooks as agent adapters
- Heartbeat system wakes agents on schedules and checks status
- Requires: Node.js 20+, PostgreSQL, self-hosted server running continuously
- NOT a chatbot, workflow builder, or prompt manager — it's a control plane

---

## Why It Was Deferred (5 Reasons)

### 1. Interactive vs Headless Mismatch
Claude Code desktop is interactive (Vasso chats with it). Paperclip expects headless agents it can wake via heartbeats and assign tasks to programmatically. The desktop app has no API endpoint Paperclip can call.

### 2. Single-Agent Overhead
Paperclip's value is orchestrating 5+ concurrent agents across departments. With 1 interactive tool, the org chart / governance / budget tracking is overhead with no payoff.

### 3. Infrastructure Tax
Running Paperclip means maintaining a Node.js server + PostgreSQL database locally or on a VPS. That's infrastructure to maintain when the priority should be shipping features and reaching first paying user.

### 4. Existing System Already Works
StepLeague's `.claude/skills/`, `.claude/rules/`, and `AGENTS.md` infrastructure is a lightweight version of what Paperclip provides, perfectly tuned for interactive Claude Code usage. 18 skills, 11 rule files, task-optimized PRD system with parallel agent support.

### 5. Pre-Alpha Priority Mismatch
At pre-alpha, the bottleneck is shipping features and getting real users, not orchestrating agent teams. Organizational overhead before product-market fit is premature optimization.

---

## What StepLeague Uses Instead

- **Claude Code desktop** as single orchestration point
- **Built-in subagents** for parallel work within sessions
- **`.claude/skills/` + `.claude/rules/`** for domain knowledge
- **PRD system** with sprints, parallel tracks, and dependency ordering
- **Internal kanban board** (`/admin/kanban`) for task management
- **Copilot CLI** (considered) as supplementary agent for mechanical tasks

---

## Adoption Triggers (Agent Instruction)

**If you observe ANY of these conditions during your work, proactively flag Paperclip adoption to Vasso:**

1. **Multi-runtime usage**: Vasso is actively using 3+ agent runtimes concurrently (e.g., Claude Code CLI + Copilot CLI + Cursor/Codex)

2. **Scheduled agent tasks**: Recurring tasks exist that should run on schedules without human initiation (e.g., nightly content generation, daily monitoring reports, weekly analytics summaries)

3. **Budget governance needed**: Token/cost management across multiple agent runtimes becomes a problem — agents burning through different API keys without coordination

4. **Post-beta operations**: StepLeague is in public beta or beyond, with predictable operational workflows (support triage, content pipeline, monitoring, deployment)

5. **Agent coordination failures**: Tasks are being duplicated or conflicted across different agent sessions because there's no central task registry

**When flagging**: Reference this document, cite which trigger(s) you observed, and suggest a concrete next step (e.g., "Run `npx paperclipai onboard --yes` and connect Claude Code CLI as the first adapter").

---

## Changelog

| Date | Change |
|------|--------|
| 2026-03-29 | Initial assessment — deferred for current stage |
