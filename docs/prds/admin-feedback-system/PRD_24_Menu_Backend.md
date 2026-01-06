# PRD 24: WordPress-Style Menu Backend System

> **Order:** 24 of 36
> **Previous:** [PRD 23: Global Leaderboard](./PRD_23_Global_Leaderboard.md)
> **Next:** [PRD 25: User Preferences](./PRD_25_User_Preferences.md)
> **Status:** 📋 Proposed
> **Priority:** Alpha Stage A-0 (Foundation)

> [!IMPORTANT]
> **Foundation PRD**: This PRD extends the existing menu system (PRD 7) with database-backed configuration. The frontend menu rendering already uses shadcn components.

---

## ⚠️ Agent Instructions (MANDATORY)

Before starting work on this PRD, the implementing agent MUST:

1. **Read these files for context:**
   - `AGENTS.md` - Critical rules, patterns, and documentation requirements
   - `src/lib/menuConfig.ts` - **Existing menu definitions** (reference implementation)
   - `src/components/navigation/ShadcnMenuRenderer.tsx` - **Existing shadcn renderer**
   - `src/components/navigation/MobileMenu.tsx` - Mobile menu implementation
   - PRD 07 - Navigation & Menu Locations System (foundation)

2. **Follow documentation rules:**
   - Update `CHANGELOG.md` with all changes
   - Use date format `YYYY-MM-DD` (current year is 2026)
   - Update ROADMAP.md when complete

3. **After completion:**
   - Commit with message format: `feat(PRD-24): Brief description`
   - Mark this PRD as done on the Kanban board

---

## Problem Statement

**Current:**
- Menu configuration is hardcoded in `menuConfig.ts`
- Any menu changes require code deployment
- SuperAdmin cannot reorder or modify menus without developer assistance

**Existing Infrastructure (PRD 7 ✅ Complete):**
- `menuConfig.ts` - Menu definitions, role filtering, location config
- `ShadcnMenuRenderer.tsx` - shadcn dropdown rendering
- `MenuLocation` types - `public_header`, `app_header`, `admin_header`, `footer`
- `prepareMenuItems()` - Role filtering + league ID resolution
- `detectMenuLocation()` - Auto-detects appropriate menu

**Goal:**
- Database-backed menu storage
- Admin UI for menu management
- Drag-and-drop reordering
- Fallback to static config if database empty

---

## Outcome

A SuperAdmin menu management system that provides:

1. **Admin UI** at `/admin/menus` - Visual menu editor
2. **Database Storage** - Menus stored in PostgreSQL
3. **Drag-Drop Reordering** - Intuitive item organization
4. **Role Visibility Controls** - Per-item role toggles
5. **Static Fallback** - Uses `menuConfig.ts` if database empty

---

## Research Reference

> This design draws from common patterns in content management systems, inspired by industry-leading CMS menu management interfaces.

### Design Patterns Applied

| Pattern | Application in SCL |
|---------|-------------------|
| WordPress-style menu locations | Already in `MENU_LOCATIONS` config |
| Nested menu items with drag-drop | `@dnd-kit/core` for reordering |
| Role-based visibility toggles | Extend existing `visibleTo`/`hiddenFrom` |
| Live preview panel | Show real-time menu appearance |

See [research_navigation_patterns.md](../../artifacts/research_navigation_patterns.md) for additional reference.

---

## What is Needed

### 1. Database Schema

```sql
-- Menu definitions (replaces hardcoded MENUS object)
CREATE TABLE menu_definitions (
  id TEXT PRIMARY KEY,  -- e.g., 'main', 'help', 'user', 'admin'
  label TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu items (mirrors MenuItem interface from menuConfig.ts)
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id TEXT NOT NULL REFERENCES menu_definitions(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  
  -- Core properties (match MenuItem interface)
  item_key TEXT NOT NULL,  -- Unique within menu, e.g., 'dashboard', 'league-submit'
  label TEXT NOT NULL,
  href TEXT,
  icon TEXT,  -- Emoji or icon name
  description TEXT,
  
  -- Visibility
  visible_to TEXT[] DEFAULT '{}',  -- Empty = all authenticated
  hidden_from TEXT[] DEFAULT '{}',
  requires_league BOOLEAN DEFAULT false,
  
  -- Behavior
  on_click TEXT,  -- Named action, e.g., 'signOut', 'startTour'
  external BOOLEAN DEFAULT false,
  divider_before BOOLEAN DEFAULT false,
  
  -- Ordering
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu location assignments (which menus show where)
CREATE TABLE menu_locations (
  location TEXT PRIMARY KEY,  -- 'public_header', 'app_header', etc.
  menu_ids TEXT[] NOT NULL,  -- Array of menu_definitions.id
  show_logo BOOLEAN DEFAULT true,
  show_sign_in BOOLEAN DEFAULT true,
  show_user_menu BOOLEAN DEFAULT true,
  show_admin_menu BOOLEAN DEFAULT true,
  class_name TEXT
);

-- RLS Policies
ALTER TABLE menu_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_locations ENABLE ROW LEVEL SECURITY;

-- SuperAdmin full access
CREATE POLICY "SuperAdmin manages menus" ON menu_definitions
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_superadmin = true));

CREATE POLICY "SuperAdmin manages menu items" ON menu_items
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_superadmin = true));

CREATE POLICY "SuperAdmin manages locations" ON menu_locations
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_superadmin = true));

-- All users can read (menus are public)
CREATE POLICY "Everyone reads menus" ON menu_definitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Everyone reads menu items" ON menu_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Everyone reads locations" ON menu_locations FOR SELECT TO authenticated USING (true);

-- Indexes
CREATE INDEX idx_menu_items_menu ON menu_items(menu_id);
CREATE INDEX idx_menu_items_parent ON menu_items(parent_id);
CREATE INDEX idx_menu_items_sort ON menu_items(menu_id, sort_order);
```

### 2. Data Seeding Migration

Convert existing `menuConfig.ts` items to database records:

```sql
-- Seed from existing menuConfig.ts
INSERT INTO menu_definitions (id, label) VALUES
('main', 'Main Navigation'),
('help', 'Help'),
('user', 'User Account'),
('admin', 'Admin'),
('public', 'Public Pages'),
('footerNavigation', 'Footer Navigation'),
('footerAccount', 'Footer Account'),
('footerLegal', 'Footer Legal');

-- Insert items (example for main menu)
INSERT INTO menu_items (menu_id, item_key, label, href, icon, sort_order) VALUES
('main', 'dashboard', 'Dashboard', '/dashboard', '📊', 0),
('main', 'league', 'League', NULL, '🏆', 1),
('main', 'actions', 'Actions', NULL, '⚡', 2),
('main', 'roadmap', 'Roadmap', '/roadmap', '🗺️', 3);

-- Insert nested items for 'league' submenu
INSERT INTO menu_items (menu_id, parent_id, item_key, label, href, icon, requires_league, sort_order)
SELECT 'main', id, 'league-submit', 'Submit Steps', '/submit-steps', '📝', true, 0
FROM menu_items WHERE item_key = 'league';
-- ... etc for other nested items
```

### 3. API Endpoints

```typescript
// GET /api/admin/menus
// Returns all menu definitions with items

// GET /api/admin/menus/:menuId
// Returns single menu with nested items

// PUT /api/admin/menus/:menuId/items
// Batch update items (for drag-drop reordering)

// POST /api/admin/menus/:menuId/items
// Add new menu item

// PATCH /api/admin/menus/:menuId/items/:itemId
// Update single item

// DELETE /api/admin/menus/:menuId/items/:itemId
// Remove menu item
```

### 4. Hook: `useMenuConfig`

```typescript
// src/hooks/useMenuConfig.ts
export function useMenuConfig() {
  const { data, isLoading, error } = useSWR('/api/menus');
  
  // Fallback to static config if no data or error
  const menus = data?.menus ?? MENUS;  // MENUS from menuConfig.ts
  
  return {
    menus,
    isLoading,
    error,
    // Helper functions remain the same
    filterMenuByRole,
    prepareMenuItems,
  };
}
```

### 5. Admin UI: `/admin/menus`

**Visual Design:**

```
┌─────────────────────────────────────────────────────────────────────┐
│ Menu Editor                                                          │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────────────────────────────────────────┐ │
│ │ Menus       │ │ Main Navigation                                 │ │
│ │ ──────────  │ │ ───────────────                                 │ │
│ │ • Main ◄    │ │                                                 │ │
│ │ • Help      │ │ ┌───┐ Dashboard          📊  /dashboard    ⋮   │ │
│ │ • User      │ │ │ ≡ │────────────────────────────────────────   │ │
│ │ • Admin     │ │ └───┘                                           │ │
│ │ • Public    │ │                                                 │ │
│ │ • Footer... │ │ ┌───┐ League             🏆  (submenu)     ⋮   │ │
│ │             │ │ │ ≡ │────────────────────────────────────────   │ │
│ │             │ │ └───┘  ├─ Submit Steps   📝  /submit-steps      │ │
│ │             │ │        ├─ Leaderboard    🏆  /league/[id]...    │ │
│ │             │ │        └─ Analytics      📊  /league/[id]...    │ │
│ │             │ │                                                 │ │
│ │             │ │ ┌───┐ Actions            ⚡  (submenu)     ⋮   │ │
│ │             │ │ │ ≡ │────────────────────────────────────────   │ │
│ │             │ │ └───┘  ├─ Create League  ➕  /league/create     │ │
│ │             │ │        └─ Join League    🔗  /join              │ │
│ │             │ │                                                 │ │
│ │             │ │               [+ Add Item]                      │ │
│ └─────────────┘ └─────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Preview                                               [Desktop] │ │
│ │ ┌─────────────────────────────────────────────────────────────┐ │ │
│ │ │ 👟 StepLeague  [ Dashboard ▼ ] [ League ▼ ] [ Actions ▼ ]   │ │ │
│ │ └─────────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

**Key UI Elements:**
- Left sidebar: Menu selector
- Center: Drag-drop item list with nesting
- Bottom: Live preview panel
- Item row: Drag handle, label, icon, href, actions menu (edit, visibility, delete)

### 6. Components

```
src/components/admin/menus/
├── MenuEditor.tsx           # Main editor container
├── MenuList.tsx             # Left sidebar menu selector
├── MenuItemList.tsx         # Drag-drop item list
├── MenuItemRow.tsx          # Single item with actions
├── MenuItemForm.tsx         # Add/edit item modal
├── MenuPreview.tsx          # Live preview panel
├── VisibilityToggles.tsx    # Role visibility checkboxes
└── index.ts
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/migrations/YYYYMMDD_create_menu_tables.sql` | **NEW** - Schema |
| `supabase/migrations/YYYYMMDD_seed_menu_data.sql` | **NEW** - Initial data |
| `src/hooks/useMenuConfig.ts` | **NEW** - Database-aware hook |
| `src/app/api/admin/menus/route.ts` | **NEW** - List menus |
| `src/app/api/admin/menus/[menuId]/route.ts` | **NEW** - Single menu |
| `src/app/api/admin/menus/[menuId]/items/route.ts` | **NEW** - Manage items |
| `src/app/admin/menus/page.tsx` | **NEW** - Admin UI |
| `src/components/admin/menus/*.tsx` | **NEW** - Editor components |
| `src/lib/adminPages.ts` | **MODIFY** - Add menus page |
| `src/components/navigation/NavHeader.tsx` | **MODIFY** - Use `useMenuConfig` |
| `src/components/navigation/MobileMenu.tsx` | **MODIFY** - Use `useMenuConfig` |

---

## Dependencies

- **Uses:** `@dnd-kit/core`, `@dnd-kit/sortable` for drag-drop
- **Uses:** shadcn `Dialog`, `DropdownMenu`, `Button`, `Input`
- **Builds on:** PRD 7 (Menu Locations System)
- **Required by:** All future menu changes via admin UI

---

## Success Criteria

- [ ] Database tables created with proper RLS
- [ ] Existing `menuConfig.ts` data seeded to database
- [ ] Admin UI at `/admin/menus` accessible by SuperAdmin
- [ ] Drag-drop reordering works with visual feedback
- [ ] Role visibility toggles work per item
- [ ] Live preview updates in real-time
- [ ] Menus load from database on frontend
- [ ] Fallback to static config when database empty/error
- [ ] No regression in existing menu functionality
- [ ] Mobile-responsive admin UI
- [ ] Build passes (`npm run build`)

---

## Verification Checklist

> **IMPORTANT:** After implementation, verify at these specific locations.

### Frontend Checks

| Check | URL/Location | Expected Result |
|-------|--------------|-----------------|
| Admin page loads | `/admin/menus` | Editor UI renders |
| Menu list shows | `/admin/menus` | Left sidebar shows all menus |
| Drag-drop works | Drag item in editor | Item reorders with animation |
| Preview updates | Edit item | Preview reflects changes |
| SuperAdmin only | Login as non-admin | 404 or redirect |

### Backend Checks

| Check | Method | Expected Result |
|-------|--------|-----------------|
| Tables exist | Query `menu_definitions`, `menu_items` | Data returned |
| RLS works | Query as non-admin | Only SELECT allowed |
| API returns data | `GET /api/admin/menus` | JSON with menus |
| Save persists | Edit + save item | Database updated |

### Code Checks

| Check | Command | Expected Result |
|-------|---------|-----------------|
| Build passes | `npm run build` | No errors |
| No type errors | `npx tsc --noEmit` | No errors |
| Fallback works | Delete DB data | Static menus load |

### Documentation Checks

- [ ] CHANGELOG.md updated
- [ ] AGENTS.md updated with menu config pattern
- [ ] adminPages.ts includes `/admin/menus`

---

## Theme Awareness

All UI components must:
- Use CSS variables (`--background`, `--foreground`, etc.) from PRD 21
- Work in both light and dark modes
- Use shadcn components for consistency

---

## Out of Scope

- Menu icons from library (keep emoji for now)
- MenuItem-level analytics tracking
- Versioning/rollback of menu changes
- Scheduled menu changes

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-01-06 | Initial | Created PRD for Menu Backend System extending PRD 7 |
