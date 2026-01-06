# PRD 35: Duplicate Submission Conflict Resolution

> **Priority:** High (User Request)  
> **Dependencies:** None (builds on existing submission system)  
> **Estimated Effort:** Medium

---

## Problem Statement

The current system allows multiple step submissions for the same date, as shown in the screenshot below where Dec 16 has 4 entries (128,009, 17,314, 18,488, and two entries at 12,333), Dec 20 has 3 entries (12,000, 10,000, 5,000), etc.

![Duplicate Submissions Screenshot](./uploaded_image_1767620179481.png)

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
// When POST detects existing submission for same date
{
  "conflict": true,
  "existing": {
    "id": "uuid",
    "steps": 18488,
    "verified": true,
    "proof_path": "/path/to/screenshot.jpg",
    "source": "screenshot"  // "screenshot" | "manual" | "batch"
  },
  "incoming": {
    "steps": 17314,
    "verified": false,
    "proof_path": null,
    "source": "manual"
  },
  "recommendation": "keep_existing",  // Based on verification status
  "message": "A verified screenshot submission already exists for Dec 16. The screenshot is likely more accurate. Do you want to replace it with 17,314 steps?"
}
```

---

### Part B: Conflict Resolution API

#### [NEW] [resolve/route.ts](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/app/api/submissions/resolve/route.ts)

New endpoint to handle conflict resolution decisions:

```typescript
// POST /api/submissions/resolve
{
  "date": "2025-12-16",
  "league_id": "uuid" | null,  // null for global
  "action": "keep_existing" | "use_incoming" | "skip",
  "incoming_data": {  // Only required if action = "use_incoming"
    "steps": 17314,
    "proof_path": null
  },
  "resolution_reason": "user_confirmed"  // For audit
}
```

---

### Part C: Single Entry Conflict UI

#### [MODIFY] [SubmissionForm.tsx](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/components/forms/SubmissionForm.tsx)

Add conflict detection and resolution flow:

1. **Pre-submission Check**: When user selects a date, check if submission exists
2. **Inline Warning**: Show alert if date already has data
3. **Confirmation Dialog**: On submit conflict, show `ConflictResolutionDialog`

#### [NEW] [ConflictResolutionDialog.tsx](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/components/forms/ConflictResolutionDialog.tsx)

A shadcn `Dialog` component with:

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️ Submission Already Exists for Dec 16                       │
│ ─────────────────────────────────────────────────────────────── │
│                                                                 │
│  You already have a submission for this date.                   │
│                                                                 │
│  ┌─────────────────────┐    ┌─────────────────────┐            │
│  │ EXISTING (Current)  │ vs │ NEW (Your Entry)    │            │
│  ├─────────────────────┤    ├─────────────────────┤            │
│  │ 18,488 steps        │    │ 17,314 steps        │            │
│  │ ✓ Verified          │    │ ⏳ Unverified       │            │
│  │ 📷 Has Screenshot   │    │ ✗ No Screenshot     │            │
│  └─────────────────────┘    └─────────────────────┘            │
│                                                                 │
│  💡 The existing submission has a verified screenshot and is   │
│     likely more accurate. Are you sure you want to replace it? │
│                                                                 │
│           ┌──────────────────┐  ┌──────────────────┐           │
│           │  Keep Existing   │  │  Replace with    │           │
│           │  (Recommended)   │  │  New Entry       │           │
│           └──────────────────┘  └──────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

**Smart Default Logic:**
| Existing | Incoming | Default Action | Message |
|----------|----------|----------------|---------|
| Verified + Screenshot | Unverified | Keep Existing | "Screenshot is more accurate" |
| Verified + Screenshot | Verified + Screenshot | User Choice | "Both have screenshots, please verify" |
| Unverified | Verified + Screenshot | Use Incoming | "New screenshot is more accurate" |
| Unverified | Unverified | Keep Existing | "Please submit a screenshot for accuracy" |

---

### Part D: Batch Upload Conflict Resolution

#### [NEW] [BatchConflictTable.tsx](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/components/forms/BatchConflictTable.tsx)

For batch uploads with multiple conflicts, show a selection table:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ⚠️ 4 Conflicts Found                                                       │
│  Select which data to keep for each date:                                   │
│ ────────────────────────────────────────────────────────────────────────── │
│                                                                             │
│  Bulk Actions: [Keep All Existing ▼] [Use All New ▼] [Skip All]            │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ☐ │ DATE       │ EXISTING            │ NEW                 │ ACTION │   │
│  ├───┼────────────┼─────────────────────┼─────────────────────┼────────│   │
│  │ ☐ │ Dec 16     │ 18,488 ✓ (📷)       │ 17,314 (manual)     │ [Keep ▼]   │
│  │ ☐ │ Dec 17     │ 16,358 ✓ (📷)       │ 15,000 (📷)         │ [Keep ▼]   │
│  │ ☐ │ Dec 18     │ 16,693 (manual)     │ 17,500 ✓ (📷)       │ [New ▼]    │
│  │ ☐ │ Dec 20     │ 10,000 (manual)     │ 12,000 (manual)     │ [Keep ▼]   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ✓ = Verified    📷 = Has Screenshot                                       │
│                                                                             │
│  💡 Rows where NEW has a screenshot and EXISTING doesn't are pre-selected  │
│     to use the NEW value (likely more accurate).                            │
│                                                                             │
│                              [Cancel]  [Apply Selections]                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Features:**
- **Checkbox column** for multi-select
- **Per-row dropdown** for individual decisions
- **Bulk action toolbar** appears when items selected
- **Smart pre-selection** based on verification status
- **Visual indicators** for verified (✓) and screenshot (📷)
- **Sticky header** for long lists

---

### Part E: Update Bulk Unverified Form

#### [MODIFY] [BulkUnverifiedForm.tsx](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/components/forms/BulkUnverifiedForm.tsx)

Currently skips dates with existing submissions. Update to:

1. Detect conflicts upfront (before submission)
2. Show `BatchConflictTable` for user decision
3. Process resolved conflicts with user's choices
4. Still protect verified submissions by default

---

## Verification Plan

### Automated Tests
```bash
npm run build  # Ensure no TypeScript errors
```

### Manual Verification

1. **Single Entry Conflict:**
   - Submit steps for a date
   - Submit again for same date → Dialog appears
   - Verify smart default is correct based on verification status
   - Test "Keep Existing" and "Replace" flows

2. **Batch Upload Conflict:**
   - Upload 5 screenshots, 2 of which conflict with existing
   - Verify `BatchConflictTable` appears with correct data
   - Test bulk actions ("Keep All Existing", etc.)
   - Verify only selected entries are replaced

3. **Bulk Manual Conflict:**
   - Enter 5 manual entries, 3 of which conflict
   - Verify conflict table appears
   - Test that verified existing entries are protected by default

---

## Related PRDs & Cross-References

> [!NOTE]
> **This PRD overlaps with the following and should be referenced as context:**
>
> | PRD | Overlap | Note |
> |-----|---------|------|
> | [PRD 22: PWA Offline](./PRD_22_PWA_Offline.md) | Offline queuing may cause conflicts when coming back online | Conflict resolution should handle offline-submitted entries specially |
> | [PRD 24: Smart Engagement](./PRD_24_Smart_Engagement.md) | Missed day prompts may encourage catch-up submissions | Prompts should warn if date already has data |
> | [PRD 28: League Hub](./PRD_28_League_Hub.md) | Hub may show submission history | Should show deduplicated history only |
> | [PRD 29: Unified Progress](./PRD_29_Unified_Progress.md) | Progress view may display duplicate data | Must aggregate dates, not double-count |

---

## Files Changed Summary

| File | Change Type |
|------|-------------|
| [route.ts](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/app/api/submissions/route.ts) | MODIFY |
| [resolve/route.ts](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/app/api/submissions/resolve/route.ts) | NEW |
| [SubmissionForm.tsx](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/components/forms/SubmissionForm.tsx) | MODIFY |
| [BatchSubmissionForm.tsx](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/components/forms/BatchSubmissionForm.tsx) | MODIFY |
| [BulkUnverifiedForm.tsx](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/components/forms/BulkUnverifiedForm.tsx) | MODIFY |
| [ConflictResolutionDialog.tsx](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/components/forms/ConflictResolutionDialog.tsx) | NEW |
| [BatchConflictTable.tsx](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/components/forms/BatchConflictTable.tsx) | NEW |

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-01-05 | Initial | PRD created based on user feedback with screenshot evidence |
