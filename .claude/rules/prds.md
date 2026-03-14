---
description: PRD creation and modification rules — index updates, numbering, commit format
paths:
  - docs/prds/**
---

# PRD Rules

## ⚠️ MANDATORY: Update PRD Index on Every PRD Change

**Every time you create, modify status, or delete a PRD, you MUST update `docs/prds/admin-feedback-system/PRD_00_Index.md`:**

1. **New PRD** → Add row to Proposed table, increment total count in header, update Summary table
2. **Status change** → Update status emoji (📋→🔄→✅), move between sections if needed, update Summary counts
3. **Delete PRD** → Remove row, decrement counts

**Also add a changelog entry** at the bottom of PRD_00_Index.md with the date and what changed.

This is non-negotiable. The PRD index is the single source of truth for project planning.

## PRD Philosophy

PRDs define **WHAT** to achieve, not **HOW** to implement:

- **Outcome-based** — describe the desired result, not implementation steps
- **Task-optimized** — structure for parallel agent execution (`[READ-ONLY]`/`[WRITE]`, `[PARALLEL]`/`[SEQUENTIAL]`)
- **Self-verifiable** — include success criteria agents can test (`npx tsc --noEmit`, `npm test`)

See `prd-creation` skill for full template and standards.

## Numbering & Location

- **Location:** `docs/prds/admin-feedback-system/PRD_[number]_[Name].md`
- **Next available number:** Check PRD_00_Index.md header for current total, use total + 1
- **Commit format:** `docs(prd): PRD XX — short description`

## After Creating/Completing a PRD

1. Update PRD_00_Index.md (see above — MANDATORY)
2. Update CHANGELOG.md
3. Update ROADMAP.md if user-facing feature
4. If new patterns introduced, update relevant skill/rule
