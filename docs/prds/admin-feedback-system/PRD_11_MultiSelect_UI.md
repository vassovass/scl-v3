# PRD 11: Multi-Select UI

> **Order:** 11 of 17  
> **Previous:** [PRD 10: Bulk Actions API](./PRD_10_Bulk_Actions_API.md)  
> **Next:** [PRD 12: Merge Items (AI)](./PRD_12_Merge_Items.md)

---

## ⚠️ Agent Instructions (MANDATORY)

Before starting work on this PRD, the implementing agent MUST:

1. **Read these files for context:**
   - `AGENTS.md` - Critical rules, patterns, and documentation requirements
   - `src/components/admin/FeedbackList.tsx` - Add selection to list view
   - `src/components/admin/KanbanBoard.tsx` - Add selection to kanban
   - `src/app/api/admin/feedback/bulk/route.ts` - Bulk API (PRD 10)

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

Admins can select multiple feedback items in the UI and perform bulk actions on all selected items at once.

---

## What is Needed

### 1. Selection Controls

- Checkbox on each item (list and kanban views)
- "Select All" checkbox in header
- "Clear Selection" button
- Visual indication of selected items (highlighted border)
- Selected count badge: "3 selected"

### 2. Bulk Actions Bar

When items are selected, show a floating action bar:

```
┌───────────────────────────────────────────────────────┐
│ 3 selected  │ Status ▼ │ Priority ▼ │ Archive │ Clear │
└───────────────────────────────────────────────────────┘
```

Actions:

- **Status dropdown** - Move all to selected status
- **Priority dropdown** - Set priority on all
- **Roadmap toggle** - Show/hide on roadmap
- **Archive button** - Archive all selected
- **Clear** - Clear selection

### 3. Keyboard Shortcuts (Nice to Have)

- `Cmd/Ctrl + A` - Select all visible
- `Escape` - Clear selection

### 4. State Management

- Selection state managed in component
- Preserve selection across filter changes (optional)
- Clear selection after successful bulk action

---

## Implementation Notes

### Selection State

```typescript
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

const toggleSelection = (id: string) => {
  setSelectedIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
};
```

### Calling Bulk API

```typescript
const handleBulkStatusChange = async (status: string) => {
  await fetch('/api/admin/feedback/bulk', {
    method: 'PATCH',
    body: JSON.stringify({
      ids: Array.from(selectedIds),
      updates: { board_status: status }
    })
  });
  setSelectedIds(new Set()); // Clear after success
  refetch(); // Refresh data
};
```

---

## Files to Modify

| File | Action |
|------|--------|
| `src/components/admin/FeedbackList.tsx` | MODIFY - Add selection |
| `src/components/admin/KanbanBoard.tsx` | MODIFY - Add selection |
| `src/components/admin/BulkActionsBar.tsx` | CREATE - Floating action bar |

---

## Success Criteria

- [ ] Can select individual items in list view
- [ ] Can select individual items in kanban view
- [ ] "Select All" works
- [ ] Selected count displays correctly
- [ ] Bulk status change updates all selected
- [ ] Selection clears after successful action
- [ ] Build passes (`npm run build`)

---

## Related PRDs

- **Depends on:** PRD 10 (Bulk Actions API)
- **Enables:** PRD 12 (Merge Items)

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2025-12-28 | Implementation | Completed - BulkActionsBar, checkboxes in list/kanban, keyboard shortcuts |
| 2025-12-26 | Initial | Created PRD for multi-select UI |
