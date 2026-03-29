# PRD 12: Merge Items & AI Chat

Implement AI-assisted merging of items plus an interactive AI chat for analyzing and managing feedback/kanban/roadmap items.

## User Review Required

> [!IMPORTANT]
> **Extended Scope (per user feedback)**
>
> - AI analyzes **all item types**: feedback, kanban, and roadmap items
> - **Attachments merge**: All images/attachments from secondary items transfer to primary
> - **AI Chat interface**: Interactive chat to query and execute actions (not just one-shot recommendations)

> [!WARNING]  
> **Image/Attachment Handling**
> Currently uses `screenshot_url` field. When PRD 19 adds `feedback_attachments` table, system will handle multiple attachments per item.

---

## Proposed Changes

### Database Migration

#### [NEW] [20251229_feedback_merge.sql](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/supabase/migrations/20251229000000_feedback_merge.sql)

```sql
ALTER TABLE feedback ADD COLUMN merged_into_id UUID REFERENCES feedback(id);
CREATE INDEX idx_feedback_merged_into ON feedback(merged_into_id) WHERE merged_into_id IS NOT NULL;
```

---

### API Endpoints

#### [NEW] [merge/route.ts](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/app/api/admin/feedback/merge/route.ts)

Merge API (superadmin only):

- **Input**: `{ primaryId, secondaryIds[], mergedDescription?, useAI? }`
- **Process**:
  1. If `useAI`: Call Gemini with all items' text + images
  2. Update primary with merged description
  3. **Transfer attachments**: Copy `screenshot_url` from secondary items to primary (join with semicolons or create attachment records)
  4. Archive secondary items, set `merged_into_id`
  5. Sum vote counts
- **Output**: `{ success, primary, mergedCount }`

#### [NEW] [chat/route.ts](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/app/api/ai/chat/route.ts)

**AI Chat endpoint** (superadmin only):

- **Input**: `{ message: string, conversationHistory?: Message[] }`
- **Process**:
  1. Fetch all non-done feedback/kanban items
  2. Send to Gemini with system prompt explaining available actions
  3. AI can respond with: text answers, recommendations, or executable actions
- **Output**: `{ reply: string, actions?: Action[], recommendations?: Recommendation[] }`

**Example interactions:**

- "Which items are duplicates?" → AI lists potential duplicates
- "Merge the login-related bugs" → AI returns merge action to confirm
- "What should I prioritize?" → AI suggests priorities with reasons
- "Summarize the backlog" → AI gives overview

---

### AI Integration

#### [MODIFY] [gemini.ts](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/lib/server/gemini.ts)

Add functions:

```typescript
// Generate merged description with image context
export async function generateMergedDescription(items: FeedbackItem[]): Promise<string>

// Chat with AI about items
export async function chatWithAI(
  message: string, 
  items: FeedbackItem[], 
  history: Message[]
): Promise<ChatResponse>
```

---

### UI Components

#### [NEW] [MergeModal.tsx](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/components/admin/MergeModal.tsx)

- Shows selected items with image thumbnails
- Select primary item
- Shows which attachments will be combined
- "Generate with AI" button
- Editable preview

#### [MODIFY] [BulkActionsBar.tsx](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/components/admin/BulkActionsBar.tsx)

Add merge button (visible when 2+ items selected)

#### [NEW] [AIChatPanel.tsx](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/components/admin/AIChatPanel.tsx)

Collapsible chat panel on admin feedback/kanban pages:

- Chat input field
- Message history
- AI responses with actionable buttons
- "Apply" buttons to execute AI suggestions

---

### Schemas

#### [MODIFY] [feedback.ts](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/lib/schemas/feedback.ts)

```typescript
export const mergeSchema = z.object({
    primaryId: z.string().uuid(),
    secondaryIds: z.array(z.string().uuid()).min(1).max(99),
    mergedDescription: z.string().optional(),
    useAI: z.boolean().optional(),
});

export const aiChatSchema = z.object({
    message: z.string().min(1),
    conversationHistory: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
    })).optional(),
});
```

---

## Verification Plan

### Automated Tests

- [ ] Run `npm run build` to ensure type safety.
- [ ] Browser test: Navigate to `/admin/feedback`, select multiple items, click "Merge".
- [ ] Browser test: Open "AI Assistant" from floating button, ask a question.

### Manual Verification

- **Merge Logic**:
  - Select 2 items, one with image.
  - Click Merge.
  - Verify modal shows "Select Primary".
  - Click "Generate with AI" (Preview mode).
  - Verify description is generated.
  - Confirm Merge.
  - Check if secondary item is archived ("done" status) and primary item has updated description and image reference.
- **AI Chat**:
  - Open panel.
  - Ask "What are the most urgent items?".
  - Verify AI responds with items from context.

---

## Changelog

| Date       | Section | Change                                                                 |
|------------|---------|------------------------------------------------------------------------|
| 2025-12-29 | Scope   | Added AI Chat, attachment transfer, feedback analysis per user feedback |
| 2025-12-28 | Initial | Created plan for PRD 12 + AI recommendations                          |
