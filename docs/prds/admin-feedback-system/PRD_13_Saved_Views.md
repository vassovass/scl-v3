# PRD 13: Saved Views

> **Order:** 13 of 20  
> **Previous:** [PRD 12: Merge Items](./PRD_12_Merge_Items.md)  
> **Next:** [PRD 14: Analytics GTM & GA4](./PRD_14_Analytics_GTM_GA4.md)

---

## ⚠️ Agent Instructions (MANDATORY)

Before starting work on this PRD, the implementing agent MUST:

1. **Read these files for context:**
   - `AGENTS.md` - Critical rules, patterns, and documentation requirements
   - `src/components/shared/UniversalFilters.tsx` - Filter component
   - `src/lib/filters/feedbackFilters.ts` - Filter state interface
   - `src/app/admin/feedback/page.tsx` - Where saved views would appear

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

Admins can save commonly-used filter combinations and restore them with one click.

---

## What is Needed

### 1. Save Current Filters

- After setting filters, click "Save View"
- Enter a name (e.g., "Urgent Bugs", "This Week's Features")
- View is saved to localStorage (or database for cross-device)

### 2. Saved Views Dropdown

```
┌────────────────────────────┐
│ 📁 Saved Views        ▼   │
├────────────────────────────┤
│ ⭐ Urgent Bugs             │
│ 📅 This Week's Features    │
│ 🐛 Bugs to Triage          │
│ 🌐 Roadmap Items           │
├────────────────────────────┤
│ + Save Current View...     │
└────────────────────────────┘
```

### 3. View Management

- Click trash icon to delete a view
- Rename views
- Reorder views (drag or arrows)

### 4. Preset Views (Built-in)

Include some preset views that can't be deleted:

- "All Items" - No filters
- "New This Week" - Status = New, Date = Last 7 days
- "Public Roadmap" - is_public = true

---

## Implementation Notes

### Storage Options

**Option A: localStorage (Simpler)**

```typescript
const savedViews = JSON.parse(localStorage.getItem('feedbackViews') || '[]');
```

**Option B: Database (Cross-device)**

```typescript
// New table: saved_views
{
  id, user_id, name, filters (JSONB), created_at
}
```

Recommend starting with localStorage.

### Filter State Serialization

```typescript
interface SavedView {
  id: string;
  name: string;
  filters: FeedbackFilterState;
  createdAt: string;
  isPreset?: boolean;  // Built-in views
}
```

### Implementation Best Practices (2024-2025 Research)

**Architecture:**

- Use custom hook (`useSavedViews()`) for logic reusability
- Separate presentational components from container logic
- Implement error handling with try-catch for `QuotaExceededError`

**Accessibility (WCAG 2.2):**

- Full keyboard navigation: Tab, Enter, Space, Arrow keys, Escape
- ARIA attributes: `aria-haspopup="menu"`, `aria-expanded`, `role="menu"`
- Focus management: trap focus in menu, return to trigger on close
- Visual focus indicators using `:focus-visible`
- Minimum 24x24px touch targets for mobile

**Theming:**

- Use CSS variables exclusively (no hardcoded colors)
- Leverage existing `--menu-*` variables from `globals.css`
- Support both dark (default) and light themes via `data-theme` attribute

**Performance:**

- Use `useMemo` for filtered/sorted views
- Use `useCallback` for event handlers
- Lazy load views (only on mount)

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/admin/SavedViewsDropdown.tsx` | CREATE |
| `src/components/shared/UniversalFilters.tsx` | MODIFY - Add save button |
| `src/lib/filters/savedViews.ts` | CREATE - Storage utilities |

---

## Success Criteria

- [ ] Admin can save current filter state with a name
- [ ] Saved views appear in dropdown
- [ ] Clicking a view restores those filters
- [ ] Views persist after browser refresh
- [ ] Admin can delete saved views
- [ ] Build passes (`npm run build`)

---

## Out of Scope

- Sharing views between users
- View usage analytics
- View folders/categories

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2025-12-26 | Initial | Created PRD for saved views |
