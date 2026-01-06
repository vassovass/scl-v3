# PRD 30: Duplicate Submission Conflict Resolution

> **Order:** 30 of 36
> **Previous:** [PRD 29: Unified Progress](./PRD_29_Unified_Progress.md)
> **Next:** [PRD 31: Social Encouragement](./PRD_31_Social_Encouragement.md)
> **Priority:** High (User Request)
> **Dependencies:** None (builds on existing submission system)
> **Status:** 📋 Proposed

---

## ⚠️ Agent Instructions (MANDATORY)

Before starting work on this PRD, the implementing agent MUST:

1. **Read these files for context:**
   - `AGENTS.md` - Critical rules, patterns, and documentation requirements
   - `src/app/api/submissions/route.ts` - Current submission logic
   - `src/components/forms/SubmissionForm.tsx` - Current form logic

2. **Follow documentation rules:**
   - Update `CHANGELOG.md` with all changes
   - Use date format `YYYY-MM-DD` (current year is 2026)

3. **After completion:**
   - Commit with message format: `feat(PRD-30): Brief description`
   - Mark this PRD as done on the Kanban board

---

## Problem Statement

The current system allows multiple step submissions for the same date, as shown in user feedback where single days have 3-4 entries.

This creates:
1. **Data Integrity Issues** - Which step count is correct for any given date?
2. **Leaderboard Inconsistency** - Are duplicates being summed or just showing the latest?
3. **User Confusion** - No clear way to identify or correct the "real" value
4. **Audit Problems** - Hard to track which submissions are legitimate vs duplicates

---

## Goals

1. **Enforce One Submission Per Date** - Only one step count per user per date (per league context)
2. **Smart Conflict Resolution** - When duplicates detected, help user choose the most accurate
3. **Verification-Weighted Defaults** - Screenshots > Manual Unverified entries
4. **Batch-Friendly UX** - Handle bulk upload conflicts efficiently with selection table
5. **Non-Destructive** - Keep audit trail of what was replaced

---

## User Review Required

> [!IMPORTANT]
> **Breaking Change Potential**: This feature will change how duplicates are handled. Existing duplicates in the database will need a migration strategy:
> - **Option A**: Keep newest entry per date (simple, may lose verified data)
> - **Option B**: Keep verified entry over unverified (preserves trust)
> - **Option C**: Flag duplicates for user review before cleanup
>
> **Recommended:** Option C initially (flag and surface to users), then Option B as cleanup.

---

## Proposed Changes

### Part A: Database-Level Enforcement

#### [MODIFY] [route.ts](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/app/api/submissions/route.ts)

The current API already returns a 409 conflict when a submission exists. However, the `overwrite` flag bypasses this without user confirmation. We need to:

1. Remove silent `overwrite` behavior for conflicting submissions
2. Add explicit conflict detection that returns both entries for comparison
3. Store which entry was replaced (audit trail)

**New Conflict Response Structure:**
```typescript
{
  "conflict": true,
  "existing": { "steps": 18488, "verified": true, "source": "screenshot" },
  "incoming": { "steps": 17314, "verified": false, "source": "manual" },
  "recommendation": "keep_existing",
  "message": "A verified screenshot submission already exists. Do you want to replace it?"
}
```

### Part B: Conflict Resolution API

#### [NEW] [resolve/route.ts](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/app/api/submissions/resolve/route.ts)

New endpoint to handle conflict resolution decisions:

```typescript
// POST /api/submissions/resolve
{
  "date": "2025-12-16",
  "action": "keep_existing" | "use_incoming" | "skip",
  "incoming_data": { ... }
}
```

### Part C: Single Entry Conflict UI

#### [MODIFY] [SubmissionForm.tsx](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/components/forms/SubmissionForm.tsx)

1. **Pre-submission Check**: When user selects a date, check if submission exists
2. **Inline Warning**: Show alert if date already has data
3. **Confirmation Dialog**: On submit conflict, show `ConflictResolutionDialog`

#### [NEW] [ConflictResolutionDialog.tsx](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/components/forms/ConflictResolutionDialog.tsx)

A shadcn `Dialog` displaying "Existing vs New" side-by-side comparison with smart default actions.

### Part D: Batch Upload Conflict Resolution

#### [NEW] [BatchConflictTable.tsx](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/components/forms/BatchConflictTable.tsx)

For batch uploads with multiple conflicts, show a selection table allowing bulk actions ("Keep All Existing", "Use All New") or individual row overrides.

---

## Verification Checklist

> **IMPORTANT:** After implementation, verify at these specific locations.

### Frontend Checks

| Check | URL/Location | Expected Result |
|-------|--------------|-----------------|
| Conflict detect | `/submit?date=TODAY` | If data exists, trying to submit shows dialog |
| Resolution UI | Dialog | Shows Existing vs New side-by-side |
| Replace action | Dialog -> Replace | Updates DB with new value |
| Keep action | Dialog -> Keep | Retains old value, closes dialog |
| Batch table | Batch Upload | Table appears if duplicates found |

### Backend Checks

| Check | Method | Expected Result |
|-------|--------|-----------------|
| API Conflict | `POST /api/submissions` | Returns 409 + conflict JSON |
| Resolve API | `POST /api/.../resolve` | Successfully updates correct record |

### Documentation Checks

- [ ] CHANGELOG.md updated
- [ ] AGENTS.md updated

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-01-05 | Initial | PRD created based on user feedback with screenshot evidence |
