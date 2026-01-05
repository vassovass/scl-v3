# PRD 20: Expandable Cards with Image Paste

> **Order:** 20 of 21  
> **Previous:** [PRD 19: League Start Date](./PRD_19_League_Start_Date.md)  
> **Next:** [PRD 21: shadcn/ui Integration](./PRD_21_shadcn_Integration.md)
> **Status:** ✅ Complete
> **Implemented:** 2026-01-05

---

## ⚠️ Agent Instructions (MANDATORY)

Before starting work on this PRD, the implementing agent MUST:

1. **Read these files for context:**
   - `AGENTS.md` - Critical rules, patterns, and documentation requirements
   - `src/components/admin/KanbanBoard.tsx` - Kanban card implementation
   - `src/components/admin/FeedbackList.tsx` - Feedback list implementation
   - `src/components/RoadmapView.tsx` - Roadmap card implementation
   - Existing image upload patterns in the codebase

2. **Follow documentation rules:**
   - Update `CHANGELOG.md` with all changes
   - Use date format `YYYY-MM-DD` (current year is 2026)
   - Store artifacts in `docs/artifacts/`
   - Update roadmap when complete

3. **After completion:**
   - Commit with message format: `feat(PRD-XX): Brief description`
   - Mark this PRD as done on the Kanban board
   - Update `AGENTS.md` if adding new patterns

---

## Outcome

Users can click any card/item in the Task Management System (Kanban), Feedback System, or Roadmap to expand it into a detailed view. Within this expanded view, users can:

1. See full details of the item
2. Paste screenshots/images directly (Ctrl+V / Cmd+V)
3. View any previously attached images
4. Add/edit descriptions and notes

---

## Problem Statement

Currently:

- Cards in Kanban, Feedback List, and Roadmap show only summary information
- There's no way to expand a card to see/edit more details
- Users cannot attach screenshots or images to feedback items
- Reporting bugs or feature requests lacks visual context

**Issue:**

- Users must describe UI issues in words rather than showing them
- Admins can't see what users are actually experiencing
- Context is lost between feedback submission and admin review

---

## What is Needed

### 1. Expandable Card Component

Create a reusable `ExpandableCard` modal/drawer that can be triggered from:

- Kanban board cards
- Feedback list rows
- Roadmap cards

**Expanded view should display:**

| Field | Display |
|-------|---------|
| Title | Editable text |
| Description | Rich text area |
| Status | Dropdown (same as current) |
| Category | Badge |
| Priority | Dropdown |
| Created date | Read-only |
| Attached images | Gallery grid |
| Paste zone | Visual indicator |

### 2. Image Paste Functionality

Allow users to paste images directly into the expanded card:

- Support `Ctrl+V` / `Cmd+V` clipboard paste
- Support drag-and-drop for image files
- Show paste preview before saving
- Store images in Supabase Storage
- Link images to feedback item via `feedback_attachments` table

### 3. Database: Attachments Table

Create a new table for attachments:

```sql
CREATE TABLE feedback_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,  -- 'image/png', 'image/jpeg', etc.
  file_size INTEGER,        -- bytes
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feedback_attachments_feedback_id ON feedback_attachments(feedback_id);
```

### 4. Image Display Component

Create an `AttachmentGallery` component to display attached images:

- Thumbnail grid view
- Click to expand/lightbox
- Delete button (for admin/owner)
- Image count badge on card

### 5. Storage Setup

Use Supabase Storage for image uploads:

- Bucket: `feedback-attachments`
- Path pattern: `{feedback_id}/{uuid}.{ext}`
- Max file size: 5MB (configurable)
- Allowed types: image/png, image/jpeg, image/gif, image/webp

---

## Visual Reference

**Collapsed Card (Kanban):**

```
┌──────────────────────────────────────┐
│ Fix login button not working    🖼️ 2 │
│ #BUG  ⚡high                         │
└──────────────────────────────────────┘
        ↑ Click to expand
```

**Expanded Card Modal:**

```
┌─────────────────────────────────────────────────────────────┐
│ ✕                                                           │
├─────────────────────────────────────────────────────────────┤
│ Fix login button not working                                │
│ ─────────────────────────────────────────────────────────── │
│                                                             │
│ Description:                                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ The login button stops responding after 2 clicks.       │ │
│ │ This happens on Chrome and Firefox.                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Status: [In Progress ▼]    Priority: [High ▼]               │
│                                                             │
│ ─────────────────────────────────────────────────────────── │
│ Attachments (2)                                             │
│ ┌─────────┐ ┌─────────┐                                     │
│ │ [IMG 1] │ │ [IMG 2] │                                     │
│ └─────────┘ └─────────┘                                     │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  📋 Paste an image here or drag & drop                  │ │
│ │     Ctrl+V / Cmd+V to paste from clipboard              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│                                    [Cancel]  [Save Changes] │
└─────────────────────────────────────────────────────────────┘
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/migrations/YYYYMMDD_add_feedback_attachments.sql` | CREATE - Attachments table |
| `src/components/admin/ExpandableCard.tsx` | CREATE - Modal/drawer component |
| `src/components/admin/AttachmentGallery.tsx` | CREATE - Image gallery component |
| `src/components/admin/ImagePasteZone.tsx` | CREATE - Paste/drop zone |
| `src/app/api/feedback/[id]/attachments/route.ts` | CREATE - Upload/delete API |
| `src/components/admin/KanbanBoard.tsx` | MODIFY - Add expand trigger |
| `src/components/admin/FeedbackList.tsx` | MODIFY - Add expand trigger |
| `src/components/RoadmapView.tsx` | MODIFY - Add expand trigger |
| `src/types/database.ts` | MODIFY - Add feedback_attachments type |

---

## Implementation Notes

### Clipboard Paste Handler

```typescript
const handlePaste = async (e: ClipboardEvent) => {
  const items = e.clipboardData?.items;
  for (const item of items || []) {
    if (item.type.startsWith('image/')) {
      const blob = item.getAsFile();
      if (blob) {
        await uploadImage(blob);
      }
    }
  }
};

useEffect(() => {
  document.addEventListener('paste', handlePaste);
  return () => document.removeEventListener('paste', handlePaste);
}, []);
```

### Supabase Storage Upload

```typescript
const uploadImage = async (file: File) => {
  const ext = file.name.split('.').pop() || 'png';
  const path = `${feedbackId}/${crypto.randomUUID()}.${ext}`;
  
  const { error } = await supabase.storage
    .from('feedback-attachments')
    .upload(path, file);
  
  if (!error) {
    const { data: { publicUrl } } = supabase.storage
      .from('feedback-attachments')
      .getPublicUrl(path);
    
    // Save to feedback_attachments table
    await saveAttachmentRecord(feedbackId, publicUrl, file.name, file.type, file.size);
  }
};
```

---

## Success Criteria

- [ ] Can click any Kanban card to expand it
- [ ] Can click any Feedback list row to expand it  
- [ ] Can click any Roadmap card to expand it
- [ ] Expanded view shows all item details
- [ ] Can paste images with Ctrl+V / Cmd+V
- [ ] Can drag and drop images
- [ ] Pasted images appear in gallery
- [ ] Images persist after closing/reopening
- [ ] Image count badge shows on collapsed cards
- [ ] Can delete attached images (admin only)
- [ ] `feedback_attachments` table migrated
- [ ] Supabase Storage bucket configured
- [ ] Build passes (`npm run build`)

---

## Out of Scope

- Video/file attachments (future enhancement)
- Image editing/annotation
- Comments/threaded discussions on items
- Real-time collaboration
- Version history of edits

---

## Security Considerations

- Validate file types server-side before upload
- Enforce max file size limits
- RLS policies on `feedback_attachments` table:
  - Users can upload to their own feedback
  - Admins can view/delete any attachment
- Storage bucket policies match RLS

---

## Related PRDs

- **Builds on:** PRD 09 (Admin Feedback Page)
- **Uses:** PRD 11 (Multi-Select UI patterns)
- **Enhances:** All card-based views in the system

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2025-12-28 | Initial | Created PRD for expandable cards with image paste |
