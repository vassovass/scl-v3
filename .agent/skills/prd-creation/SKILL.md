---
name: prd-creation
description: Creates outcome-based PRDs that define WHAT to achieve, not HOW to implement. Covers the PRD template, numbering scheme, database migration format, and integration with the roadmap system. Use when planning new features, writing requirements documents, or defining feature specifications.
compatibility: Antigravity, Claude Code, Cursor
metadata:
  version: "2.1"
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

- [ ] Objective is outcome-based (WHAT, not HOW)
- [ ] Requirements use table format with numbers
- [ ] Success criteria are measurable
- [ ] Agent Context section included (files, skills, MCPs)
- [ ] Task-Optimized Structure annotated
- [ ] Test requirements specified
- [ ] Documentation Update Checklist included
- [ ] Dependencies identified and ordered
- [ ] Index file updated with new PRD

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

## Related Skills

- `architecture-philosophy` - Core principles for all implementations
- `project-updates` - How to update roadmap when PRD is complete
- `testing-patterns` - Test patterns for Vitest and Playwright
- `analytics-tracking` - Event tracking patterns and MCP server usage
