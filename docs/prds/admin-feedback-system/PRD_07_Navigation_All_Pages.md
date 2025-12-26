# PRD 07: Navigation Across All Pages

> **Order:** 7 of 17  
> **Previous:** [PRD 6: Badge & Color System](./PRD_06_Badge_Color_System.md)  
> **Next:** [PRD 8: Homepage Swap](./PRD_08_Homepage_Swap.md)

---

## ⚠️ Agent Instructions (MANDATORY)

Before starting work on this PRD, the implementing agent MUST:

1. **Read these files for context:**
   - `AGENTS.md` - Critical rules, patterns, and documentation requirements
   - `src/lib/menuConfig.ts` - The existing modular menu system
   - `src/components/navigation/NavHeader.tsx` - Current navigation header
   - `src/app/(dashboard)/layout.tsx` - Dashboard layout with navigation
   - `src/app/roadmap/page.tsx` - Roadmap page (may lack navigation)
   - `src/app/admin/kanban/page.tsx` - Kanban page

2. **Follow documentation rules:**
   - Update `CHANGELOG.md` with all changes
   - Use date format `YYYY-MM-DD` (current year is 2025)
   - Store artifacts in `docs/artifacts/`
   - Update roadmap when complete

3. **After completion:**
   - Mark this PRD as done on the Kanban board

---

## Outcome

The navigation header (with admin dropdown menu) is consistently available across all pages of the site, including:

- Public roadmap page (`/roadmap`)
- Admin feedback page (`/admin/feedback`)
- Admin kanban page (`/admin/kanban`)
- All other pages

---

## Problem Statement

Currently, some pages may not have the full navigation system:

- The `(dashboard)` route group includes `NavHeader` in its layout
- But standalone pages like `/roadmap`, `/admin/*` might not have it
- Users navigating to these pages lose access to the menu system

---

## What is Needed

### 1. Audit Navigation Coverage

Check which pages currently have `NavHeader`:

| Page/Route | Has Navigation? |
|------------|-----------------|
| `/dashboard` | ✅ Yes (via layout) |
| `/league/[id]/*` | ✅ Yes (via layout) |
| `/roadmap` | ❓ Check |
| `/admin/kanban` | ❓ Check |
| `/admin/feedback` | ❓ Check |
| `/admin/design-system` | ❓ Check |
| `/feedback` | ❓ Check |
| `/settings/profile` | ❓ Check |

### 2. Ensure Consistent Navigation

Options:

1. **Move pages into `(dashboard)` route group** - if they need auth
2. **Add NavHeader directly** - for public pages
3. **Create a shared layout** - for admin pages

### 3. Admin Dropdown Always Available

When logged in as SuperAdmin:

- The admin dropdown should appear in navigation on ALL pages
- Uses the existing `ADMIN_MENU` from `menuConfig.ts`

---

## Implementation Notes

### Existing System (DO NOT REBUILD)

The menu system already exists in `src/lib/menuConfig.ts`:

- Role-based visibility
- Admin menu configuration
- Just ensure it's rendered everywhere

### Route Groups

```
src/app/
├── (dashboard)/         # Has NavHeader in layout ✅
│   ├── dashboard/
│   ├── league/
│   └── ...
├── admin/               # May need NavHeader added
│   ├── kanban/
│   ├── feedback/
│   └── design-system/
└── roadmap/             # May need NavHeader added
```

---

## Files to Check/Modify

| File | Action |
|------|--------|
| `src/app/(dashboard)/layout.tsx` | REFERENCE - See how NavHeader is used |
| `src/app/admin/layout.tsx` | CREATE or MODIFY - Add NavHeader for admin pages |
| `src/app/roadmap/layout.tsx` | CREATE or MODIFY - Add NavHeader |
| `src/app/feedback/layout.tsx` | CHECK - May need NavHeader |

---

## Success Criteria

- [ ] Navigation header appears on `/roadmap` page
- [ ] Navigation header appears on all `/admin/*` pages
- [ ] Admin dropdown menu visible for SuperAdmins on all pages
- [ ] Mobile menu works on all pages
- [ ] No duplicate navigation headers
- [ ] Build passes (`npm run build`)

---

## Out of Scope

- Changing navigation design/styling
- Adding new menu items
- Changing menu behavior

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2025-12-26 | Initial | Created PRD for consistent navigation |
