# PRD 14: Page Layout System

> **Order:** 14 of 17  
> **Previous:** [PRD 13: Saved Views](./PRD_13_Saved_Views.md)  
> **Next:** [PRD 15: Export Utility](./PRD_15_Export_Utility.md)

---

## ⚠️ Agent Instructions (MANDATORY)

Before starting work on this PRD, the implementing agent MUST:

1. **Read these files for context:**
   - `AGENTS.md` - Critical rules, patterns, and documentation requirements
   - `src/app/admin/feedback/page.tsx` - Admin page structure
   - `src/app/admin/kanban/page.tsx` - Another admin page
   - `src/app/(dashboard)/dashboard/page.tsx` - Dashboard structure

2. **Follow documentation rules:**
   - Update `CHANGELOG.md` with all changes
   - Use date format `YYYY-MM-DD` (current year is 2025)
   - Store artifacts in `docs/artifacts/`
   - Update roadmap when complete
   - Update `/admin/design-system` with component examples

3. **After completion:**
   - Commit with message format: `feat(PRD-XX): Brief description`
   - Mark this PRD as done on the Kanban board

---

## Outcome

A reusable page layout component that provides consistent structure, loading states, and empty states across admin and dashboard pages.

---

## What is Needed

### 1. PageLayout Component

```tsx
<PageLayout
  title="Feedback"
  subtitle="Manage user feedback and roadmap items"
  actions={[
    { label: "Export", icon: "📤", onClick: handleExport },
    { label: "Settings", icon: "⚙️", href: "/settings" }
  ]}
  loading={isLoading}
  empty={items.length === 0 ? {
    icon: "📭",
    title: "No feedback yet",
    description: "User feedback will appear here",
    action: { label: "Learn More", href: "/docs" }
  } : undefined}
>
  {/* Page content */}
</PageLayout>
```

### 2. Features

| Feature | Description |
|---------|-------------|
| **Header** | Title, subtitle, action buttons |
| **Loading** | Skeleton or spinner overlay |
| **Empty State** | Icon, message, optional action button |
| **Breadcrumbs** | Optional breadcrumb trail |
| **Content Wrapper** | Consistent padding/max-width |

### 3. Visual Structure

```
┌─────────────────────────────────────────────────────────┐
│ 📊 Dashboard  ›  Feedback                    [Export] [+]│
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │           (Page Content Goes Here)              │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 4. Loading Skeleton

When `loading={true}`:

- Header remains visible
- Content area shows animated skeleton
- Actions are disabled

### 5. Empty State

When `empty` prop provided and triggered:

```
┌─────────────────────────────────────────────────────────┐
│                         📭                              │
│                  No feedback yet                        │
│          User feedback will appear here                 │
│                                                         │
│                   [ Learn More ]                        │
└─────────────────────────────────────────────────────────┘
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/layout/PageLayout.tsx` | CREATE |
| `src/components/layout/PageHeader.tsx` | CREATE - Header portion |
| `src/components/layout/EmptyState.tsx` | CREATE - Empty state |
| `src/components/layout/LoadingSkeleton.tsx` | CREATE - Skeleton |
| `src/app/admin/design-system/page.tsx` | MODIFY - Add examples |

---

## Migration Examples

After creating PageLayout, these pages can adopt it:

| Page | Current Lines | After Migration |
|------|--------------|-----------------|
| `/admin/feedback` | ~50 lines of layout | ~10 lines |
| `/admin/kanban` | ~40 lines of layout | ~8 lines |
| `/dashboard` | ~30 lines of layout | ~5 lines |

---

## Success Criteria

- [ ] `PageLayout` component created
- [ ] Loading state works with skeleton
- [ ] Empty state displays correctly
- [ ] At least 2 pages migrated as proof
- [ ] Design system page updated with examples
- [ ] Build passes (`npm run build`)

---

## Out of Scope

- Complex breadcrumb logic
- Tab navigation within pages
- Sidebar layouts

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2025-12-26 | Initial | Created PRD for page layout system |
