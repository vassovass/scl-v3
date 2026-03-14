# PRD 67 — Documentation Artifacts Cleanup

> **Order:** 67
> **Status:** Proposed
> **Priority:** Low
> **Type:** Housekeeping

---

## Problem

The `docs/artifacts/` directory has 23 files with:

- **Mixed formats** — `.docx`, `.md`, and a `screenshots/` folder with no clear purpose
- **No naming convention** — some files use `plan_`, `task_`, `decisions_` prefixes; others use freeform names like `walkthrough.md` or `implementation_plan.md`
- **Organizational drift** — completed plans (`task_prd12.md`, `plan_prd41_proxy_refactor.md`) sit alongside active documents, making it unclear what is current vs. historical

---

## Desired Outcome

An organized artifacts directory where any contributor can quickly find relevant documents, distinguish active from completed work, and follow a consistent pattern when adding new artifacts.

---

## Success Criteria

1. All files follow the naming convention: `decisions_[topic].md`, `plan_[feature].md`, `research_[topic].md`, `task_[scope].md`
2. A `docs/artifacts/README.md` index exists listing each artifact with a one-line description
3. Completed/obsolete items are moved to `docs/artifacts/archive/`
4. No `.docx` files remain in the active directory (converted to `.md` or archived)
5. The `screenshots/` folder is either organized with clear naming or archived

---

## Proposed Approach

### 1. Audit all 23 files

Categorize each file as **active**, **completed**, or **obsolete**:

- **Active** — still referenced or relevant to ongoing work
- **Completed** — tied to a shipped PRD or finished task
- **Obsolete** — outdated research, superseded decisions, or unused drafts

### 2. Archive completed and obsolete files

Move to `docs/artifacts/archive/`. This preserves git history while decluttering the active directory.

### 3. Enforce naming convention

Rename remaining active files to follow the pattern:

| Prefix | Use case | Example |
|--------|----------|---------|
| `decisions_` | Architecture or product decisions | `decisions_tone_softening.md` |
| `plan_` | Feature implementation plans | `plan_admin_feedback.md` |
| `research_` | Exploration and comparison docs | `research_navigation_patterns.md` |
| `task_` | Scoped task breakdowns | `task_admin_feedback.md` |

### 4. Create README index

Add a `docs/artifacts/README.md` listing every active artifact with its category and a one-line summary.

### 5. Handle non-markdown files

- Convert `.docx` files to `.md` if still relevant
- Archive `.docx` files that are no longer needed
- Organize or archive the `screenshots/` folder

---

## Risks

**Low** — This is pure housekeeping. No code changes, no schema changes, no user-facing impact. The only risk is accidentally archiving something still referenced, which is mitigable by searching for internal links before moving files.

---

## Dependencies

None.
