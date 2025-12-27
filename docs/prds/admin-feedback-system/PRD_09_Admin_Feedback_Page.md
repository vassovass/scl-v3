# PRD 09: Admin Feedback Page Polish

> **Order:** 9 of 17  
> **Previous:** [PRD 8: Homepage Swap](./PRD_08_Homepage_Swap.md)  
> **Next:** [PRD 10: Bulk Actions API](./PRD_10_Bulk_Actions_API.md)

---

## ⚠️ Agent Instructions (MANDATORY)

Before starting work on this PRD, the implementing agent MUST:

1. **Read these files for context:**
   - `AGENTS.md` - Critical rules, patterns, and documentation requirements
   - `src/app/admin/feedback/page.tsx` - Current admin feedback page
   - `src/components/admin/FeedbackList.tsx` - Feedback list component
   - `src/components/admin/KanbanBoard.tsx` - Kanban board (already exists)
   - `src/components/shared/UniversalFilters.tsx` - Filter component (PRD 03)
   - `src/lib/filters/feedbackFilters.ts` - Filter configuration

2. **Follow documentation rules:**
   - Update `CHANGELOG.md` with all changes
   - Use date format `YYYY-MM-DD` (current year is 2025)
   - Store artifacts in `docs/artifacts/`
   - Update roadmap when complete

3. **After completion:**
   - Commit with message format: `feat(PRD-XX): Brief description`
   - Mark this PRD as done on the Kanban board

---

## Outcome

The Admin Feedback page at `/admin/feedback` is polished and fully functional with both list and Kanban views.

---

## Current State

The admin feedback page **already exists** with:

- ✅ List view (`FeedbackList.tsx`)
- ✅ Kanban view (`KanbanBoard.tsx`)
- ✅ Filters (`UniversalFilters.tsx` from PRD 03)
- ✅ Basic CRUD operations

---

## What is Needed (Polish Only)

### 0. User Feedback Only (CRITICAL)

The `/admin/feedback` page must show **only user-submitted feedback** (items where `user_id IS NOT NULL`):

- This page is for triaging real user feedback
- Admin-created tasks/features remain on `/admin/kanban` only
- Remove the "Source" filter from this page (not needed since it's always user-submitted)

### 1. View Toggle

- Clear toggle between List and Kanban views
- Remember user's preference (localStorage)

### 2. Quick Actions (if missing)

Each feedback item should allow:

- Change status without opening modal
- Change priority inline
- Toggle roadmap visibility
- View full details

### 3. Visual Clarity

- High priority items visually prominent
- Different types (bug, feature) distinguishable
- New/unread items highlighted
- Use Badge component from PRD 06 (if completed)

### 4. Loading States

- Show skeleton/spinner while loading
- Empty state when no feedback

### 5. Access Control

- Page only accessible to SuperAdmins
- Non-SuperAdmins redirected to dashboard

---

## Files to Modify

| File | Action |
|------|--------|
| `src/app/admin/feedback/page.tsx` | MODIFY - Add view toggle, access control |
| `src/components/admin/FeedbackList.tsx` | MODIFY - Polish UI, add quick actions |
| `src/components/admin/KanbanBoard.tsx` | MODIFY - Ensure consistent styling |

---

## Success Criteria

- [ ] SuperAdmin can toggle between list and Kanban views
- [ ] View preference persists across sessions
- [ ] Quick actions work on feedback items
- [ ] High priority items are visually distinct
- [ ] Non-SuperAdmins are redirected
- [ ] Page loads quickly (< 2 seconds)
- [ ] Build passes (`npm run build`)

---

## Out of Scope

- Multi-select (PRD 11)
- Bulk actions (PRD 10)
- Merge functionality (PRD 12)

---

## Related PRDs

- **Depends on:** PRD 03 (Filter & Search) ✅
- **Uses if available:** PRD 06 (Badge & Color System)
- **Foundation for:** PRD 10 (Bulk Actions), PRD 11 (Multi-Select)

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2025-12-28 | Implementation | Completed - AdminFeedbackClient, FeedbackList updates, user-only filter |
| 2025-12-28 | Requirements | Added user feedback only requirement (user_id IS NOT NULL) |
| 2025-12-26 | Initial | Created PRD for admin feedback page polish |
