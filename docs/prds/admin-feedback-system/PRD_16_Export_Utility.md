# PRD 16: Import/Export System

> **Order:** 16 of 20  
> **Previous:** [PRD 15: Page Layout System](./PRD_15_Page_Layout_System.md)  
> **Next:** [PRD 17: Public Roadmap Polish](./PRD_17_Public_Roadmap_Polish.md)

---

## ⚠️ Agent Instructions (MANDATORY)

Before starting work on this PRD, the implementing agent MUST:

1. **Read these files for context:**
   - `AGENTS.md` - Critical rules, patterns, and documentation requirements
   - `src/components/admin/KanbanBoard.tsx` - Has `exportToCSV` function
   - `src/components/roadmap/RoadmapView.tsx` - Has duplicate `exportToCSV`

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

A complete import/export system that:
- Eliminates duplicated CSV export code
- Enables round-trip editing (export → modify → import)
- Supports ID-based updates/overwrites on import

---

## Problem Statement

Currently:
1. `exportToCSV` is duplicated in `KanbanBoard.tsx` (~60 lines) and `RoadmapView.tsx` (~55 lines)
2. No import functionality exists
3. Cannot bulk edit items via spreadsheet and re-import

---

## What is Needed

### 1. Export System

#### useExport Hook

```typescript
const { exportCSV, exportJSON, isExporting } = useExport({
  filename: 'kanban-export',
  columns: EXPORT_PRESETS.kanban
});

// Usage
<button onClick={() => exportCSV(items)}>Export CSV</button>
```

#### Export Requirements

| Requirement | Description |
|-------------|-------------|
| **Include ID** | Every export MUST include the `id` column as first column |
| **All columns** | Export should include ALL database columns for round-trip support |
| **Date in filename** | `StepLeague-{type}-Export-2026-01-02.csv` |
| **Proper escaping** | Handle commas, quotes, newlines in data |

---

### 2. Import System

#### useImport Hook

```typescript
const { importCSV, isImporting, errors, preview } = useImport({
  endpoint: '/api/admin/feedback/import',
  columns: EXPORT_PRESETS.kanban,
  onSuccess: () => refreshData()
});

// Usage
<input type="file" accept=".csv" onChange={(e) => importCSV(e.target.files[0])} />
```

#### Import Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Import Flow                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. User selects CSV file                                   │
│  2. Frontend parses CSV, shows preview                      │
│  3. User confirms import                                     │
│  4. Frontend sends to API                                    │
│  5. API processes:                                           │
│     - If ID exists → UPDATE existing item                   │
│     - If ID empty/new → INSERT new item                     │
│  6. Return success/error summary                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Import Behavior

| Scenario | ID Column | Behavior |
|----------|-----------|----------|
| **Update existing** | Has valid ID | Update that item with new values |
| **Create new** | Empty or missing | Insert as new item |
| **ID not found** | ID doesn't exist in DB | Error for that row |

---

### 3. Column Presets (Full Schema)

```typescript
export const EXPORT_PRESETS = {
  kanban: [
    { key: 'id', header: 'ID', required: true },
    { key: 'type', header: 'Type' },
    { key: 'subject', header: 'Subject' },
    { key: 'description', header: 'Description' },
    { key: 'board_status', header: 'Status' },
    { key: 'is_public', header: 'Is Public', format: (v) => v ? 'Yes' : 'No', parse: (v) => v === 'Yes' },
    { key: 'priority_order', header: 'Priority Order' },
    { key: 'created_at', header: 'Created At', readonly: true },
    { key: 'completed_at', header: 'Completed At' },
    { key: 'target_release', header: 'Target Release' },
    { key: 'user_id', header: 'User ID', readonly: true },
    { key: 'nickname', header: 'Submitter', readonly: true },
  ],
  roadmap: [
    { key: 'id', header: 'ID', required: true },
    { key: 'type', header: 'Type' },
    { key: 'subject', header: 'Subject' },
    { key: 'description', header: 'Description' },
    { key: 'target_release', header: 'Release' },
    { key: 'board_status', header: 'Status' },
    { key: 'is_public', header: 'Is Public', format: (v) => v ? 'Yes' : 'No', parse: (v) => v === 'Yes' },
    { key: 'avg_priority', header: 'Avg Priority', readonly: true },
    { key: 'vote_count', header: 'Votes', readonly: true },
    { key: 'created_at', header: 'Created At', readonly: true },
    { key: 'completed_at', header: 'Completed At' },
  ],
};
```

**Column Flags:**
- `required: true` - Must be present (ID)
- `readonly: true` - Exported but ignored on import (computed fields like vote_count)
- `format()` - Transform for export (boolean → "Yes"/"No")
- `parse()` - Transform for import ("Yes"/"No" → boolean)

---

### 4. Import API Endpoint

#### POST `/api/admin/feedback/import`

```typescript
// Request
{
  items: [
    { id: "abc123", subject: "Updated title", board_status: "done", ... },
    { id: "", subject: "New item", type: "feature", ... }  // New item (empty ID)
  ]
}

// Response
{
  success: true,
  summary: {
    updated: 5,
    created: 2,
    errors: 1
  },
  errors: [
    { row: 4, message: "Invalid status 'foo'" }
  ]
}
```

---

### 5. UI Components

#### Import Modal

```
┌─────────────────────────────────────────────────────────────┐
│  📥 Import from CSV                               [✕]       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Drop CSV file here or [Browse...]                          │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Preview (first 5 rows)                                  ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ ID      | Subject        | Status      | Type          ││
│  │ abc123  | Fix login bug  | done ✓      | bug           ││
│  │ (new)   | Add dark mode  | backlog     | feature       ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ⚠️ 1 item will be updated, 1 will be created              │
│                                                              │
│                          [Cancel]  [Import 2 items]          │
└─────────────────────────────────────────────────────────────┘
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/hooks/useExport.ts` | CREATE - Export hook |
| `src/hooks/useImport.ts` | CREATE - Import hook with CSV parsing |
| `src/lib/export/presets.ts` | CREATE - Column presets with format/parse |
| `src/lib/export/csvParser.ts` | CREATE - CSV parsing utility |
| `src/components/admin/ImportModal.tsx` | CREATE - Import UI with preview |
| `src/app/api/admin/feedback/import/route.ts` | CREATE - Import API |
| `src/components/admin/KanbanBoard.tsx` | MODIFY - Use hooks, add import button |
| `src/components/roadmap/RoadmapView.tsx` | MODIFY - Use export hook |

---

## Success Criteria

- [ ] `useExport` hook created with all columns including ID
- [ ] `useImport` hook created with CSV parsing
- [ ] Import API supports upsert (update or insert based on ID)
- [ ] Preview modal shows what will be updated vs created
- [ ] Round-trip works: Export → Edit in Excel → Import updates correctly
- [ ] Duplicate export code eliminated
- [ ] Build passes (`npm run build`)

---

## Out of Scope

- Excel (.xlsx) format (CSV only for now)
- Import for non-feedback tables (submissions, leagues)
- Undo/rollback after import

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-01-02 | Expanded | Added import system with ID-based updates, full column presets |
| 2025-12-26 | Initial | Created PRD for export utility |
