---
name: prd-creation
description: Creates outcome-based PRDs that define WHAT to achieve, not HOW to implement. Covers the PRD template, numbering scheme, database migration format, and integration with the roadmap system. Use when planning new features, writing requirements documents, or defining feature specifications.
compatibility: Antigravity, Claude Code, Cursor
metadata:
  version: "2.2"
  project: "stepleague"
---

# PRD Creation Skill

## Core Philosophy: Outcome-Based PRDs

> **THE GOLDEN RULE:** Define **WHAT** to achieve and **WHY** it matters.
> Let the implementing agent decide **HOW** to build it.

### ❌ WRONG: Implementation-Prescriptive

```markdown
## Feature: User Notifications
- Create a `notifications` table with columns: id, user_id, message, created_at
- Use React Query for fetching
- Create POST /api/notifications endpoint
```

### ✅ CORRECT: Outcome-Based

```markdown
## Feature: User Notifications
**Objective:** Users receive timely, contextual notifications about important events.

| # | Outcome | Success Criteria |
|---|---------|------------------|
| 1 | Users are notified of new league invites | Notification appears within 5s of invite |
| 2 | Notifications persist until read | Unread count visible, history accessible |
```

---

## Task-Optimized Structure for Agent Teams

PRDs should maximize parallelization across Claude Code subagents:

1. **Mark tasks as `[READ-ONLY]` vs `[WRITE]`**
2. **Mark task groups as `[PARALLEL]` vs `[SEQUENTIAL]`**
3. **Include self-verifiable success criteria** (e.g., `npx tsc --noEmit` — zero errors)
4. **Reference specific file paths** so agents navigate directly

**Agent types for different phases:**

| Type | Use Case |
|------|----------|
| `Explore` | Fast codebase search, find files |
| `Bash` | Run commands, git, build/test |
| `general-purpose` | Complex multi-step implementation |
| `Plan` | Design strategy, identify trade-offs |

### Example Structure

| Phase | Mode | Task |
|-------|------|------|
| 1 | `[READ-ONLY]` | Audit existing code for patterns |
| 2 | `[WRITE]` | Create rate limiter `[PARALLEL with Phase 3]` |
| 3 | `[WRITE]` | Add config to handler `[PARALLEL with Phase 2]` |
| 4 | `[WRITE]` | Apply to endpoints `[SEQUENTIAL]` |
| 5 | `[WRITE]` | Write Vitest + Playwright tests `[SEQUENTIAL]` |

---

## ⚠️ CRITICAL: PRD Index Update (NEVER SKIP)

**Every PRD creation or status change MUST update `docs/prds/admin-feedback-system/PRD_00_Index.md`:**

1. Add/update the PRD row in the appropriate section (Proposed/In Progress/Complete)
2. Update the header counts (Total PRDs, proposed/complete/in-progress)
3. Update the Summary table counts and PRD number list
4. Add a changelog entry at the bottom with date and description

**This is not optional.** The PRD index is the single source of truth for project planning. Skipping this creates invisible PRDs that no agent or human will find.

---

## PRD Location & Naming

**Location:** `docs/prds/admin-feedback-system/`

| Format | Example |
|--------|---------|
| Single PRD | `PRD_[number]_[Name_With_Underscores].md` |
| Index | `PRD_00_Index.md` (master registry) |

---

## Mandatory PRD Standards

Every PRD MUST include:

1. **Outcome-based requirements** in table format with numbered items
2. **Agent Context section** — files to study, skills to reference, MCP servers
3. **Task-Optimized Structure** with `[READ-ONLY]`/`[WRITE]` and `[PARALLEL]`/`[SEQUENTIAL]`
4. **Test requirements** — Vitest unit tests + Playwright E2E
5. **Self-verification commands** — `npx tsc --noEmit`, `npm test -- [pattern]`
6. **Documentation Update Checklist** — AGENTS.md, skills, CHANGELOG, PRD index
7. **Best Practice References** — relevant standards, RFCs, guidelines
8. **Changelog table** at the bottom
9. **Dependencies** — identified and ordered in the PRD header

### MCP Server References

Include only servers relevant to the specific PRD:

| Server | Use For |
|--------|---------|
| **Supabase MCP** | DB queries, schema verification, RLS testing |
| **GTM Stape MCP** | Tag/trigger creation, container management |
| **GA4 Stape MCP** | Analytics reports, event verification |
| **PostHog MCP** | Insights, feature flags, event queries |
| **Playwright MCP** | E2E test automation |

---

## Cross-Reference Skills

| Domain | Skill |
|--------|-------|
| UI/Styling | `design-system` |
| API routes | `api-handler` |
| Database/Auth | `supabase-patterns` |
| Forms | `form-components` |
| Error handling | `error-handling` |
| Architecture | `architecture-philosophy` |
| Testing | `testing-patterns` |
| Analytics | `analytics-tracking` |

---

## Before Finalizing a PRD

- [ ] **PRD_00_Index.md updated** — row added, counts updated, changelog entry added (MANDATORY)
- [ ] Objective is outcome-based (WHAT, not HOW)
- [ ] Requirements use table format with numbers
- [ ] Success criteria are measurable
- [ ] Agent Context section included (files, skills, MCPs)
- [ ] Task-Optimized Structure annotated
- [ ] Test requirements specified
- [ ] Documentation Update Checklist included
- [ ] Dependencies identified and ordered

### Anti-Patterns

| ❌ Don't | ✅ Do |
|----------|-------|
| Specify exact database columns | Describe data requirements |
| Prescribe specific libraries | State capability needs |
| Write implementation code | Define acceptance criteria |
| Skip test requirements | Specify Vitest + Playwright tests |
| Write monolithic sequential tasks | Structure for parallel agent execution |
| Skip committing after PRD | Commit with conventional message referencing PRD number |

---

## Reference Files

For the full PRD template, git commit format, sprint planning structure, and PRD index/dependency details, see:
- **[references/prd-template.md](./references/prd-template.md)** — Complete template and examples

---

---

## Parallel PRD Execution (Orchestrator/Worker Pattern)

When multiple PRDs run in parallel across separate Claude Code sessions:

### Orchestrator Role (Main Session)
The orchestrator coordinates sprint execution:
1. **Pre-flight**: Ask user which tracks to run in parallel before launching
2. **Launch**: Start parallel agents (subagents or background agents) for independent PRDs
3. **Quality gate**: After each batch — verify PRD files exist, check for conflicts, validate cross-references
4. **Consolidate**: Merge index updates, update CHANGELOG, check dependency graph consistency
5. **Gate check**: Verify sprint gate criteria before starting next sprint

### Worker Role (PRD Sessions)
Each PRD worker session must:
1. Read `AGENTS.md` first
2. Read the sprint shared context file (e.g., `docs/prds/SPRINT_EFG_CONTEXT.md`)
3. Read the specific PRD file for task details
4. Execute the PRD's task-optimized phases
5. Add emergent items to `docs/prds/PRD_BACKLOG.md` (append-only)
6. **Do NOT update PRD_00_Index.md or CHANGELOG.md** — orchestrator handles these

### Conflict Prevention Rules
| File | Who Edits | Why |
|------|-----------|-----|
| `PRD_00_Index.md` | Orchestrator only | Prevents merge conflicts from parallel writes |
| `CHANGELOG.md` | Orchestrator only | Single consolidated update |
| `PRD_BACKLOG.md` | Any worker (append-only) | Append-only = no conflicts |
| Individual PRD files | Owning worker only | Each worker owns its PRD |
| Source code | Workers in same sprint must not overlap | Orchestrator resolves if detected |

### Shared Context Pattern
For sprints with multiple PRDs, create a shared context file:
- **Location**: `docs/prds/SPRINT_[X]_CONTEXT.md`
- **Contains**: Business decisions, cross-PRD dependencies, architectural patterns, orchestrator protocol
- **Referenced by**: Every PRD in that sprint via Agent Context table (first row, marked **READ FIRST**)
- **Purpose**: Fresh agents get full context without reading all sibling PRDs

### PRD Research-First Mandate
Every PRD must include a **Research-First Mandate** section after the Objective:
> Before implementing this PRD, the agent MUST conduct intensive research into all relevant aspects — [domain-specific research areas]. This research phase should directly inform [decisions/implementation] and produce the best possible outcome. Do not skip or shortcut the research phase.

### Parallel Agent Batching
Group PRDs into batches by dependency:
- **Batch 1**: All independent PRDs (no dependencies) — run in parallel
- **Batch 2**: PRDs that depend only on Batch 1 outputs — run after Batch 1
- **Batch N**: Continue until all PRDs are scheduled
- **Max batch size**: 3-5 agents (balances speed vs. coordination overhead)

### Emergent PRD Tracking
During any work, agents will discover new items that need PRDs. These go in `docs/prds/PRD_BACKLOG.md`:
```markdown
| Date | Discovered During | Item | Priority | Notes |
|------|-------------------|------|----------|-------|
| 2026-03-29 | PRD 74 | Need email notification when payment fails | Medium | Ties into PRD 38 |
```

### Session Note Template
Add to every PRD that will run in its own session:
```markdown
> **Session note**: This PRD runs in its own Claude Code session. Read the shared context file first. Do NOT update PRD_00_Index.md or CHANGELOG.md — the orchestrator session handles those to prevent conflicts.
```

---

## Related Skills

- `architecture-philosophy` - Core principles for all implementations
- `project-updates` - How to update roadmap when PRD is complete
- `testing-patterns` - Test patterns for Vitest and Playwright
- `analytics-tracking` - Event tracking patterns and MCP server usage
