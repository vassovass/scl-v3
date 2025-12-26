# Admin Feedback System - Implementation Plan

## Overview

Implement the Admin Feedback System across 9 PRDs. Many features already exist; this plan focuses on gaps.

> [!NOTE]
> PRD 8 (Public Roadmap) is mostly done. Focus is on PRDs 1-3, 5-7, and 9.

---

## Strategy: Single Agent, Sequential

PRDs build on each other, so **one agent working sequentially** is best:

- PRD 1 creates schema that PRD 2-3 query
- PRD 2 creates APIs that PRD 3-5 consume
- PRD 3-7 are UI features that stack

---

## Proposed Changes

### PRD 1: Database Schema

#### [NEW] `supabase/migrations/20251226000000_feedback_timestamps.sql`

- `status_changed_at TIMESTAMPTZ` - auto-updated when `board_status` changes
- Trigger to update `updated_at` automatically
- Indexes: `(board_status, type)`, `(created_at)`, `(status_changed_at)`

---

### PRD 2: Admin APIs

#### [MODIFY] `src/app/api/admin/kanban/route.ts`

- GET: Add pagination (`?page=1&limit=50`)
- GET: Add filters (`?type=bug&status=new&dateFrom=...`)
- GET: Add search (`?search=keyword`)

#### [NEW] `src/app/api/admin/feedback/bulk/route.ts`

- POST: Bulk update `{ ids: [...], updates: { status, priority, is_public } }`

---

### PRD 3: Filter & Search

#### [NEW] `src/components/admin/FeedbackFilters.tsx`

- Type/status/priority dropdowns
- Date range picker
- Search with debounce
- Active filter badges + "Clear All"

---

### PRD 4: Page Enhancements

#### [MODIFY] `src/app/admin/feedback/page.tsx`

- Add FeedbackFilters component
- View toggle (list/kanban)
- Inline status/priority dropdowns
- Visual highlights for urgent items

---

### PRD 5: Multi-Select & Bulk

#### [NEW] `src/components/admin/BulkActionBar.tsx`

- Floating bar when items selected
- Count + bulk action buttons
- "Select All" checkbox

---

### PRD 6: Merge Items

#### [NEW] Migration: `merged_into_id UUID REFERENCES feedback(id)`

#### [NEW] `src/components/admin/MergeDialog.tsx`

- Select primary, preview result, confirm

---

### PRD 7: Saved Views

#### [NEW] `src/components/admin/SavedViews.tsx`

- localStorage-based (or DB table for cross-device)
- Save/restore/delete named filter presets

---

### PRD 8: Public Roadmap (Verify)

Already done. Just verify mobile responsiveness.

---

### PRD 9: Documentation

#### [NEW] `docs/admin-feedback-system.md`

- Overview + architecture diagram (mermaid)
- Flow diagram: feedback → triage → roadmap

---

## AGENTS.md Compliance

Per AGENTS.md rules:

- ✅ Use `adminClient` for all DB operations
- ✅ Mobile-first UI (base styles = mobile)
- ✅ Update `CHANGELOG.md` after each PRD
- ✅ Update roadmap when features complete
- ✅ Update `adminPages.ts` if adding admin pages

---

## Verification

Manual browser testing after each PRD via `/test-deployed` workflow.

---

## User Review Required

> [!IMPORTANT]
> **Implementation Scope**: Should I:
>
> 1. Implement all 9 PRDs sequentially in one session?
> 2. Implement in batches (PRDs 1-4, then 5-7, then 8-9)?
> 3. Start with just PRD 1-3 (foundation) and pause for review?

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2025-12-26 | AGENTS.md | Added compliance section based on project rules |
| 2025-12-26 | Initial | Plan created from PRD gap analysis |
