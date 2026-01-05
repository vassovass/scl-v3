# PRD 12: Merge Items & AI Recommendations

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
   - `PRD_19_Expandable_Cards_Image_Paste.md` - Image/attachment context

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

1. **Merge Items**: Admins can combine multiple related/duplicate items into one, with AI-generated merged descriptions
2. **AI Recommendations**: AI can analyze all roadmap/kanban items and suggest duplicates, groupings, and priorities
3. **Image-Aware Merging**: When items have screenshots/images, AI understands their context and the merged description preserves image relevance

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
- **Attachments transferred**: All images/screenshots from secondary items are added to primary
- **Secondary items** are archived (not deleted)
- Secondary items get a `merged_into_id` reference
- Vote counts are summed to primary

### 4. AI Merge Assistance

Use Gemini to generate merged descriptions:

```typescript
// Prompt example for text-only merge
const prompt = `
Combine these feedback items into one clear description:

1. "${item1.description}"
2. "${item2.description}"
3. "${item3.description}"

Write a concise, clear merged description that captures all key points.
`;
```

### 5. AI Chat Feature

**Interactive chat interface** for analyzing and managing feedback/kanban/roadmap items.

**Endpoint**: `POST /api/ai/chat`

```typescript
{
  message: string;             // User's question or command
  conversationHistory?: [];    // Previous messages for context
}

// Response
{
  reply: string;               // AI's response
  recommendations?: [];        // Optional actionable suggestions
  actions?: [];                // Executable actions user can approve
}
```

**Example interactions:**

- "Which items are duplicates?" → Lists potential duplicates
- "Merge the login-related bugs" → Returns merge action to confirm
- "What should I prioritize?" → Suggests priorities with reasons
- "Summarize the backlog" → Overview of pending items

**UI**: Collapsible chat panel on admin feedback/kanban pages.

### 6. Image Handling (CRITICAL)

When items have `screenshot_url` or attachments:

1. **AI sees images**: Fetch image as base64 and include in Gemini prompt (multimodal)
2. **Context preserved**: AI describes what screenshots show in merged description
3. **Self-contained result**: Merged card makes complete sense without referencing originals
4. **Image references**: Merged description explicitly mentions "As shown in screenshot 1..." etc.

**Example prompt with images:**

```typescript
const prompt = `
Combine these feedback items. Some have screenshots - describe what's shown and incorporate into the merged description:

1. "Login button not working" [+ screenshot showing grayed-out button]
2. "Can't sign in on mobile" [no screenshot]

Write a merged description that:
- Captures all key points from text
- References what the screenshot shows (e.g., "Screenshot shows the login button appears grayed out...")
- Makes sense as a standalone item without needing to see the original items
`;
```

### 7. API Endpoint

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
- [ ] **AI handles images**: Items with screenshots produce descriptions that reference image content
- [ ] **AI Recommendations**: Can trigger analysis of all items and see recommendations
- [ ] **Standalone merged cards**: Merged descriptions are self-contained and complete
- [ ] Admin can edit merged description before confirming
- [ ] Preview shows result before executing
- [ ] Build passes (`npm run build`)

---

## Out of Scope

- Merge history UI (tracking historical merges)
- Undo button in UI (manual undo via DB is fine)
- Automated merge execution (AI recommends, human approves)

---

## Related PRDs

- **Depends on:** PRD 11 (Multi-Select UI)
- **Uses:** Existing Gemini integration (`src/lib/server/gemini.ts`)

---

## Changelog

| Date       | Section | Change                                                                         |
|------------|---------|--------------------------------------------------------------------------------|
| 2025-12-29 | Scope   | AI Chat interface, attachment transfer on merge, feedback analysis             |
| 2025-12-28 | Scope   | Extended with AI Recommendations, Image Handling, self-contained merged cards |
| 2025-12-26 | Initial | Created PRD for AI-assisted merge                                             |
