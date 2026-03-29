# PRD 70: Docs Cleanup & Context Headers

> **Order:** 70
> **Status:** ✅ Complete
> **Type:** Refactor
> **Dependencies:** None
> **Blocks:** None
> **Supersedes:** [PRD 67 — Artifacts Cleanup](../prd-67-artifacts-cleanup.md) (expands scope from `docs/artifacts/` to all of `docs/`)

---

## 🎯 Objective

Make every file in `docs/` immediately assessable without reading it. Agents currently waste tokens opening documents to determine relevance. This PRD adds a standardized context header to every active doc, archives stale files, and deletes ephemeral task artifacts — so any agent (or human) can scan the docs tree and know exactly what each file contains, whether it's current, and whether it's worth reading.

PRD 68 (Database Schema Docs) remains separate — it is a content-creation task, not cleanup.

---

## ⚠️ Research-First Mandate

Before implementing this PRD, the agent MUST conduct intensive research into all relevant aspects — existing file contents, naming conventions in comparable open-source projects, documentation best practices, and agent-optimized doc structures. This research phase should directly inform decisions and produce the best possible outcome. Do not skip or shortcut the research phase.

---

> **Session note**: This PRD runs in its own Claude Code session. Read the shared context file first. Do NOT update PRD_00_Index.md or CHANGELOG.md — the orchestrator session handles those to prevent conflicts.

## ⚠️ Agent Context

| File | Purpose |
|------|---------|
| docs/prds/SPRINT_EFG_CONTEXT.md | **READ FIRST** — Shared context for PRDs 70-80: business decisions, cross-PRD dependencies, architectural patterns, orchestration protocol |
| `docs/` (all files) | Target directory — every file here needs triage |
| `docs/artifacts/` (all files) | Subset with highest stale-file density |
| `docs/handoff/PRD-42-test-coverage-handoff.md` | Candidate for archive |
| `docs/prds/prd-67-artifacts-cleanup.md` | `[READ-ONLY]` Prior scope definition — this PRD supersedes it |
| `docs/prds/prd-68-database-schema-docs.md` | `[READ-ONLY]` Separate PRD — do not touch its scope |
| `AGENTS.md` | May reference docs/ files — verify links still resolve after moves |
| `CLAUDE.md` | May reference docs/ files — verify links still resolve after moves |

### MCP Servers

_None required — this PRD is file-move and file-edit only. No database, no API, no browser._

### Task-Optimized Structure

| Phase | Mode | Task |
|-------|------|------|
| 1 | `[READ-ONLY]` | Audit all ~30 docs/ files — confirm archive/delete/keep classification `[SEQUENTIAL]` |
| 2 | `[WRITE]` | Create `docs/archive/` directory `[SEQUENTIAL]` |
| 3 | `[WRITE]` | Delete ephemeral task files (3 files) `[PARALLEL]` |
| 4 | `[WRITE]` | Delete PDF duplicate (1 file) `[PARALLEL with 3]` |
| 5 | `[WRITE]` | Move stale files to `docs/archive/` (~10 files) `[PARALLEL with 3, 4]` |
| 6 | `[WRITE]` | Move `PRD_51-56_Implementation_Summary.md` to `docs/artifacts/` `[PARALLEL with 3, 4, 5]` |
| 7 | `[WRITE]` | Add context headers to all remaining active docs/ files (~20 files) `[PARALLEL]` |
| 8 | `[WRITE]` | Rename files where naming is unclear `[PARALLEL with 7]` |
| 9 | `[READ-ONLY]` | Verify no broken links in AGENTS.md, CLAUDE.md, or other docs referencing moved files `[SEQUENTIAL]` |
| 10 | `[WRITE]` | Fix any broken references found in phase 9 `[SEQUENTIAL]` |

---

## 🏗️ Detailed Feature Requirements

### Section A: File Cleanup — 5 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **A-1** | `docs/archive/` directory exists | No designated place for stale docs — they clutter active directories | Directory created; git-tracked with at least one file |
| **A-2** | 3 ephemeral task files deleted: `docs/artifacts/task.md`, `docs/artifacts/task_admin_feedback.md`, `docs/artifacts/task_prd12.md` | One-off task breakdowns with no long-term value pollute the artifacts folder | Files absent from working tree; git history preserved |
| **A-3** | `docs/PRD_51-56_Implementation_Summary.pdf` deleted | Duplicate of the .md version — binary files don't belong in docs/ | PDF absent from working tree |
| **A-4** | `docs/PRD_51-56_Implementation_Summary.md` moved to `docs/artifacts/` | Implementation summary is an artifact, not a top-level doc | File exists at `docs/artifacts/PRD_51-56_Implementation_Summary.md` |
| **A-5** | ~10 stale files moved to `docs/archive/` | Outdated research, completed plans, and debug prompts sit alongside active docs | Each file listed below exists in `docs/archive/` and is absent from its original location |

**Files to archive (A-5):**

| Original Location | Reason |
|-------------------|--------|
| `docs/artifacts/GrowthBook vs PostHog_ Choosing an Experimentation Platform.docx` | Completed research — decision made |
| `docs/artifacts/PostHog vs Hotjar_ Session Recording Comparison for StepLeague.md` | Completed research — decision made |
| `docs/artifacts/admin-menu-debug-prompt.md` | One-off debug prompt — no reuse value |
| `docs/artifacts/implementation_plan.md` | Generic plan superseded by PRD system |
| `docs/artifacts/plan_admin_feedback.md` | Completed plan — PRD 9 shipped |
| `docs/artifacts/plan_prd12.md` | Completed plan — PRD 12 shipped |
| `docs/artifacts/plan_prd41_proxy_refactor.md` | Completed plan — PRD 41 shipped |
| `docs/artifacts/schema_analysis.md` | Superseded by PRD 68 scope |
| `docs/artifacts/schema_prd41_migration.md` | Completed migration — PRD 41 shipped |
| `docs/handoff/PRD-42-test-coverage-handoff.md` | Completed handoff — PRD 42 shipped |

### Section B: Context Headers — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **B-1** | Standard context header template defined and documented | No convention for doc headers — agents must read entire files to assess relevance | Template documented in this PRD (see below) and applied consistently |
| **B-2** | Context header added to all ~20 remaining active docs/ files (excluding archived, deleted, and PRD files) | Agents waste tokens opening docs to check relevance | Every non-PRD file in `docs/` (and subdirectories) has the header block at the top |
| **B-3** | Context header added to `docs/artifacts/README.md` with index of active artifacts | No way to scan artifacts folder without opening each file | README lists every active artifact with its one-line description from the header |

### Section C: Reference Integrity — 2 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **C-1** | All cross-references to moved/deleted files updated | Moving files breaks links in AGENTS.md, CLAUDE.md, other docs | `grep -r` for old file paths returns 0 matches in non-archive files |
| **C-2** | PRD 67 marked as superseded by PRD 70 in its own file and in PRD_00_Index.md | Prevents duplicate work if an agent picks up PRD 67 | PRD 67 header shows "Superseded by PRD 70"; index reflects this |

---

## Context Header Template

Every active (non-PRD) document in `docs/` must begin with this block:

```markdown
---
## Document Context
**What**: [One-line description]
**Why**: [Why this doc exists and when it's useful]
**Status**: [Current/Stale/Archived/Reference]
**Last verified**: [Date]
**Agent note**: This summary should be sufficient to assess relevance. Only read further if this document matches your current task.
---
```

**Status values:**
- **Current** — Actively maintained, reflects the live codebase
- **Reference** — Accurate but not actively updated (e.g., design decisions that are settled)
- **Stale** — May contain outdated information; verify before trusting
- **Archived** — Moved to `docs/archive/`, kept for historical context only

---

## ✅ Success Criteria

| Metric | Target | Verification Method |
|--------|--------|---------------------|
| Ephemeral files deleted | 3 task files + 1 PDF = 4 files removed | `ls docs/artifacts/task*.md` returns nothing; `ls docs/*.pdf` returns nothing |
| Files archived | ~10 files in `docs/archive/` | `ls docs/archive/` shows expected files |
| Implementation summary relocated | File at `docs/artifacts/PRD_51-56_Implementation_Summary.md` | `ls docs/artifacts/PRD_51-56*` shows .md file |
| Context headers applied | All ~20 active non-PRD docs have the header | `grep -r "## Document Context" docs/ --include="*.md"` returns ~20 matches (excluding archive) |
| No broken references | Zero dangling links to moved/deleted files | `grep -r` for old paths in non-archive .md files returns 0 |
| PRD 67 superseded | PRD 67 file and index updated | PRD 67 shows "Superseded by PRD 70" |
| Artifacts README updated | Index lists all active artifacts | `docs/artifacts/README.md` contains one-line description per active artifact |

---

## 📅 Implementation Plan Reference

### Phase 1: Audit (5 min)
1. Open each file in `docs/`, `docs/artifacts/`, `docs/handoff/`, `docs/architecture/`, `docs/research/`, `docs/diagrams/`
2. Classify as: **keep** (add header), **archive** (move to `docs/archive/`), **delete** (ephemeral), or **relocate**
3. Confirm classification matches this PRD's lists — flag any discrepancies

### Phase 2: Cleanup (10 min)
4. Create `docs/archive/`
5. Delete the 3 task files and 1 PDF
6. Move ~10 stale files to `docs/archive/`
7. Move `PRD_51-56_Implementation_Summary.md` to `docs/artifacts/`

### Phase 3: Headers (15 min)
8. Add context header to each remaining active doc
9. Update `docs/artifacts/README.md` with artifact index
10. Rename any files where the current name is ambiguous

### Phase 4: Integrity (5 min)
11. Search all non-archive .md files for references to moved/deleted paths
12. Update broken references
13. Mark PRD 67 as superseded
14. Update PRD_00_Index.md

---

## 🔍 Systems & Design Considerations

1. **Git history preservation** — Files must be `git mv`'d (not delete + create) so blame and log history carry forward. This is the single most important technical constraint.

2. **PRD files excluded from headers** — PRD files already have their own standardized header format (Order, Status, Type, Dependencies, Blocks). Adding a second header would create conflicting conventions. This PRD only targets non-PRD documentation.

3. **Archive directory at `docs/archive/` not `docs/artifacts/archive/`** — PRD 67 proposed `docs/artifacts/archive/`. This PRD widens scope to all of `docs/`, so the archive lives one level up. This keeps a single archive for the entire docs tree rather than per-subfolder archives.

4. **Header is a convention, not enforcement** — There is no linter or CI check for the header. Compliance depends on agents and contributors following the pattern. If drift becomes a problem, a future PRD can add a simple script to verify headers.

5. **Stale vs. Archived distinction** — "Stale" means the file is still in-place but its content may be outdated. "Archived" means it has been physically moved to `docs/archive/`. A file should not be marked "Stale" and left in place indefinitely — either update it or archive it.

6. **`.docx` files in archive** — The two .docx files are moved to archive as-is. Converting them to .md is not in scope — they are historical artifacts, not active documents. If they need to be referenced in the future, the original format is sufficient.

7. **Subdirectory docs** — Files in `docs/architecture/`, `docs/research/`, `docs/diagrams/`, and `docs/handoff/` also get context headers. After archiving the handoff file, `docs/handoff/` may be empty — if so, remove the empty directory.

8. **Future-proofing for PRD 68** — PRD 68 (Database Schema Docs) will create or heavily rewrite `docs/DATABASE_SCHEMA.md`. The context header added here will be overwritten during that PRD's execution, which is fine. The header establishes the convention; PRD 68 maintains it.

---

## 💡 Proactive Considerations

_(Included as items 5-8 in Systems & Design Considerations above.)_

---

## 📋 Documentation Update Checklist

- [ ] PRD_00_Index.md — Add PRD 70 as Proposed, update counts (69 → 70 total, 4 → 5 proposed)
- [ ] PRD_00_Index.md — Update PRD 67 row to show "Superseded by PRD 70"
- [ ] PRD 67 file — Add superseded note to header
- [ ] CHANGELOG.md — Log PRD creation
- [ ] ROADMAP.md — No update needed (internal refactor, not user-facing)
- [ ] `docs/artifacts/README.md` — Update with artifact index after cleanup
- [ ] **Git commit** — `docs(prd): PRD 70 — docs cleanup and context headers`

---

## 📚 Best Practice References

- **Convention over configuration** — A lightweight text convention (the header block) is preferable to tooling that requires maintenance. The header is human-readable and grep-able.
- **git mv for history** — Git tracks renames via similarity detection. Using `git mv` ensures `git log --follow` works on archived files.
- **Single source of truth** — PRD_00_Index.md is the canonical PRD registry. PRD 67's scope is superseded here rather than maintaining two overlapping PRDs.
- **Agent token efficiency** — Context headers let agents skip irrelevant docs without opening them, reducing token usage on multi-file tasks.

---

## 🔗 Related Documents

- [PRD 67: Artifacts Cleanup](../prd-67-artifacts-cleanup.md) — Original scope (artifacts only); superseded by this PRD
- [PRD 68: Database Schema Docs](../prd-68-database-schema-docs.md) — Content task for `DATABASE_SCHEMA.md`; stays separate
- [PRD 18: Documentation](./PRD_18_Documentation.md) — Original documentation PRD from foundation phase

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-03-29 | Initial | Created PRD — supersedes PRD 67, expands scope to all docs/ |
