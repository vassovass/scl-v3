# PRD 12: Merge Items (AI-Assisted)

> **Order:** 12 of 17  
> **Previous:** [PRD 11: Multi-Select UI](./PRD_11_MultiSelect_UI.md)  
> **Next:** [PRD 13: Saved Views](./PRD_13_Saved_Views.md)

---

## ⚠️ Agent Instructions (MANDATORY)

Before starting work on this PRD, the implementing agent MUST:

1. **Read these files for context:**
   - `AGENTS.md` - Critical rules, patterns, and documentation requirements
   - `src/lib/server/gemini.ts` - Existing Gemini AI integration
   - `src/components/admin/KanbanBoard.tsx` - Where merge would be triggered
   - `src/components/admin/FeedbackList.tsx` - Alternative trigger point

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

Admins can combine multiple related or duplicate feedback/task items into a single consolidated item, with optional AI assistance to generate a merged description.

---

## What is Needed

### 1. Merge Workflow

1. Select 2+ items (using Multi-Select from PRD 11)
2. Click "Merge" button in bulk actions bar
3. Merge modal opens showing:
   - All selected items
   - Option to choose "primary" item
   - Preview of merged result
4. Confirm to execute merge

### 2. Merge Modal UI

```
┌─────────────────────────────────────────────────────────┐
│ Merge 3 Items                                           │
├─────────────────────────────────────────────────────────┤
│ Primary item (will be kept):                            │
│ ○ "Login button not working" (Bug)                      │
│ ● "Auth issues on mobile" (Bug)        ← Selected       │
│ ○ "Can't sign in with Google" (Bug)                     │
├─────────────────────────────────────────────────────────┤
│ Merged description:                                     │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Users are experiencing authentication issues...     │ │
│ │ [AI-generated or editable]                          │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ [🤖 Generate with AI]  [Cancel]  [Merge Items]          │
└─────────────────────────────────────────────────────────┘
```

### 3. What Happens on Merge

- **Primary item** is updated with merged description
- **Secondary items** are archived (not deleted)
- Secondary items get a `merged_into_id` reference
- Vote counts are summed to primary

### 4. AI Assistance

Use Gemini to:

- **Generate merged description** from multiple items
- **Suggest duplicates** (future enhancement)

```typescript
// Prompt example
const prompt = `
Combine these feedback items into one clear description:

1. "${item1.description}"
2. "${item2.description}"
3. "${item3.description}"

Write a concise, clear merged description that captures all key points.
`;
```

### 5. API Endpoint

`POST /api/admin/feedback/merge`

```typescript
{
  primaryId: string;
  secondaryIds: string[];
  mergedDescription?: string;  // If provided, use this; else keep primary's
  useAI?: boolean;  // Generate description with AI
}
```

---

## Implementation Notes

### Database Changes

May need to add column to `feedback` table:

```sql
ALTER TABLE feedback ADD COLUMN merged_into_id UUID REFERENCES feedback(id);
```

### Undo Capability

Merged items are archived, not deleted. To undo:

1. Find items with `merged_into_id = primaryId`
2. Clear their `merged_into_id`
3. Restore their `board_status`

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/app/api/admin/feedback/merge/route.ts` | CREATE - Merge API |
| `src/components/admin/MergeModal.tsx` | CREATE - Merge dialog |
| `src/components/admin/BulkActionsBar.tsx` | MODIFY - Add merge button |
| `supabase/migrations/YYYYMMDD_feedback_merge.sql` | CREATE if needed |

---

## Success Criteria

- [ ] Can merge 2+ items into one
- [ ] Primary item shows combined information
- [ ] Secondary items are archived (not deleted)
- [ ] AI generates reasonable merged description
- [ ] Admin can edit merged description before confirming
- [ ] Preview shows result before executing
- [ ] Build passes (`npm run build`)

---

## Out of Scope

- Auto-detecting duplicates (future AI feature)
- Merge history UI
- Undo button in UI (manual undo via DB is fine)

---

## Related PRDs

- **Depends on:** PRD 11 (Multi-Select UI)
- **Uses:** Existing Gemini integration (`src/lib/server/gemini.ts`)

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2025-12-26 | Initial | Created PRD for AI-assisted merge |
