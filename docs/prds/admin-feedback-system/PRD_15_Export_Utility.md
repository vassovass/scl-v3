# PRD 15: Export Utility

> **Order:** 15 of 17  
> **Previous:** [PRD 14: Page Layout System](./PRD_14_Page_Layout_System.md)  
> **Next:** [PRD 16: Public Roadmap Polish](./PRD_16_Public_Roadmap_Polish.md)

---

## ⚠️ Agent Instructions (MANDATORY)

Before starting work on this PRD, the implementing agent MUST:

1. **Read these files for context:**
   - `AGENTS.md` - Critical rules, patterns, and documentation requirements
   - `src/components/admin/KanbanBoard.tsx` - Has `exportToCSV` function
   - `src/components/roadmap/RoadmapView.tsx` - Has duplicate `exportToCSV`

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

A reusable export utility that eliminates duplicated CSV export code and provides consistent export functionality across the app.

---

## Problem Statement

Currently, `exportToCSV` is duplicated in:

- `KanbanBoard.tsx` (~60 lines)
- `RoadmapView.tsx` (~55 lines)

Same logic, slightly different column configurations.

---

## What is Needed

### 1. useExport Hook

```typescript
const { exportCSV, exportJSON, isExporting } = useExport({
  filename: 'feedback-export',
  columns: [
    { key: 'subject', header: 'Title' },
    { key: 'type', header: 'Type' },
    { key: 'board_status', header: 'Status' },
    { key: 'description', header: 'Description' },
    { key: 'created_at', header: 'Created', format: formatDate },
  ]
});

// Usage
<button onClick={() => exportCSV(items)}>Export CSV</button>
```

### 2. Column Configuration

```typescript
interface ExportColumn<T> {
  key: keyof T | string;
  header: string;
  format?: (value: any, item: T) => string;
  include?: (item: T) => boolean;
}
```

### 3. Export Formats

- **CSV** - Comma-separated values
- **JSON** - Pretty-printed JSON (nice to have)

### 4. Presets

```typescript
export const EXPORT_PRESETS = {
  feedback: [
    { key: 'subject', header: 'Title' },
    { key: 'type', header: 'Type' },
    // ...
  ],
  roadmap: [
    { key: 'subject', header: 'Feature' },
    { key: 'target_release', header: 'Release' },
    // ...
  ],
};
```

---

## Implementation Notes

### CSV Escaping

```typescript
function escapeCSV(value: string | null): string {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}
```

### Download Trigger

```typescript
function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/hooks/useExport.ts` | CREATE |
| `src/lib/export/presets.ts` | CREATE - Column presets |
| `src/components/admin/KanbanBoard.tsx` | MODIFY - Use hook |
| `src/components/roadmap/RoadmapView.tsx` | MODIFY - Use hook |

---

## Success Criteria

- [ ] `useExport` hook created
- [ ] CSV export works with proper escaping
- [ ] At least 2 components migrated to use hook
- [ ] Duplicate export code eliminated
- [ ] Export includes proper date in filename
- [ ] Build passes (`npm run build`)

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2025-12-26 | Initial | Created PRD for export utility |
