# Task: PRD 12 - Merge Items & AI Chat

## Extended Requirements

- AI analyzes feedback, kanban, and roadmap items
- Attachments from secondary items transfer to primary on merge
- AI Chat interface for interactive queries and actions

---

## Checklist

### Database

- [x] Add `merged_into_id` column to `feedback` table (Migration created)

### Schemas

- [x] Update `src/lib/schemas/feedback.ts` with `mergeSchema` and `aiChatSchema`

### API Endpoints

- [x] Create `POST /api/admin/feedback/merge` - merge with attachment transfer
- [x] Create `POST /api/ai/chat` - interactive AI chat endpoint

### UI Components

- [x] Create `MergeModal.tsx` - merge dialog with AI + attachment preview
- [x] Create `AIChatPanel.tsx` - collapsible chat panel
- [x] Add merge button to `BulkActionsBar.tsx`

### AI Integration

- [x] Add `generateMergedDescription()` to gemini.ts
- [x] Add `chatWithAI()` to gemini.ts
- [x] Handle images in prompts (multimodal)

### Verification

- [x] Build passes
- [x] Test merge with attachments
- [x] Test AI chat interactions

### Documentation

- [x] Update CHANGELOG.md
- [x] Update PRD 12 if needed
- [/] Mark as done on Kanban
