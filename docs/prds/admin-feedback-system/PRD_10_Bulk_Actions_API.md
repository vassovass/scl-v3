# PRD 10: Bulk Actions API

> **Order:** 10 of 17  
> **Previous:** [PRD 9: Admin Feedback Page](./PRD_09_Admin_Feedback_Page.md)  
> **Next:** [PRD 11: Multi-Select UI](./PRD_11_MultiSelect_UI.md)

---

## ⚠️ Agent Instructions (MANDATORY)

Before starting work on this PRD, the implementing agent MUST:

1. **Read these files for context:**
   - `AGENTS.md` - Critical rules, patterns, and documentation requirements
   - `src/app/api/admin/kanban/route.ts` - Current kanban API
   - `src/app/api/admin/feedback/bulk/route.ts` - May already exist
   - `src/lib/api.ts` - API response helpers
   - `src/lib/api/handler.ts` - Unified handler (if PRD 04 complete)

2. **Follow documentation rules:**
   - Update `CHANGELOG.md` with all changes
   - Use date format `YYYY-MM-DD` (current year is 2026)
   - Store artifacts in `docs/artifacts/`
   - Update roadmap when complete

3. **After completion:**
   - Commit with message format: `feat(PRD-XX): Brief description`
   - Mark this PRD as done on the Kanban board

---

## Outcome

Backend API endpoints that allow performing actions on multiple feedback/task items at once, enabling efficient bulk operations.

---

## What is Needed

### 1. Bulk Update Endpoint

`PATCH /api/admin/feedback/bulk`

```typescript
// Request body
{
  ids: string[];           // Array of feedback IDs
  updates: {
    board_status?: string; // Move all to this status
    priority?: number;     // Set priority on all
    is_public?: boolean;   // Set roadmap visibility
    target_release?: string; // Set release column
  }
}

// Response
{
  success: true;
  updated: number;  // Count of items updated
}
```

### 2. Bulk Archive Endpoint

`POST /api/admin/feedback/bulk/archive`

```typescript
// Request body
{
  ids: string[];
}

// Response
{
  success: true;
  archived: number;
}
```

### 3. Authorization

- All bulk endpoints require SuperAdmin role
- Return 403 Forbidden for non-SuperAdmins

### 4. Single Transaction

- All updates in a bulk operation should succeed or fail together
- Use database transaction if possible

---

## Implementation Notes

### Use Unified Handler (if PRD 04 complete)

```typescript
import { withApiHandler } from '@/lib/api/handler';

export const PATCH = withApiHandler({
  auth: 'superadmin',
  schema: bulkUpdateSchema,
}, async ({ body, adminClient }) => {
  // Bulk update logic
});
```

### Validation

- Reject if `ids` array is empty
- Reject if `ids` array > 100 items (prevent abuse)
- Validate all status/priority values

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/app/api/admin/feedback/bulk/route.ts` | CREATE or MODIFY |
| `src/lib/schemas/feedback.ts` | CREATE - Zod schemas for bulk operations |

---

## Success Criteria

- [ ] Bulk status update works for 50+ items
- [ ] Bulk priority update works
- [ ] Bulk archive works
- [ ] Proper error if non-SuperAdmin attempts
- [ ] Empty array rejected with helpful error
- [ ] Build passes (`npm run build`)

---

## Out of Scope

- UI for bulk actions (PRD 11)
- Undo functionality
- Bulk delete (archive only)

---

## Related PRDs

- **Uses if available:** PRD 04 (Unified API Handler)
- **Foundation for:** PRD 11 (Multi-Select UI)

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2025-12-28 | Implementation | Completed - Zod schemas, PATCH bulk update, POST archive |
| 2025-12-26 | Initial | Created PRD for bulk actions API |
