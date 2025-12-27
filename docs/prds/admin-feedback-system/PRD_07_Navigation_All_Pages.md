# PRD 07: Navigation & Menu Locations System

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

2. **Follow documentation rules:**
   - Update `CHANGELOG.md` with all changes
   - Use date format `YYYY-MM-DD` (current year is 2025)
   - Store artifacts in `docs/artifacts/`
   - Update roadmap when complete

3. **After completion:**
   - Mark this PRD as done on the Kanban board

---

## Outcome

1. Navigation header consistently available across all pages
2. **WordPress-style menu locations** - different menu configurations for different page contexts
3. Easy to configure which menu appears where

---

## Part A: Navigation Coverage ✅ COMPLETE

All pages now have navigation via layout files:

| Page/Route | Status |
|------------|--------|
| `/dashboard`, `/league/*` | ✅ Via `(dashboard)/layout.tsx` |
| `/admin/*` | ✅ Via `admin/layout.tsx` |
| `/roadmap` | ✅ Via `roadmap/layout.tsx` |
| `/feedback` | ✅ Via `feedback/layout.tsx` |
| `/settings/*` | ✅ Via `settings/layout.tsx` |
| `/beta`, `/privacy`, `/security`, `/terms` | ✅ Via individual layouts |

---

## Part B: Menu Locations System (NEW)

### Problem

Currently, `NavHeader` shows the same menu structure everywhere and only adapts via user role. There's no way to show **different menus for different page contexts** like WordPress allows.

### What is Needed

#### 1. Menu Location Types

Define distinct menu locations in `menuConfig.ts`:

```typescript
export type MenuLocation = 
  | 'public_header'    // Public/marketing pages (/, /privacy, /terms)
  | 'app_header'       // Authenticated app pages (/dashboard, /league/*)
  | 'admin_header'     // Admin pages (/admin/*)
  | 'footer'           // Global footer
  | 'mobile';          // Mobile drawer menu

export const MENU_LOCATIONS: Record<MenuLocation, MenuLocationConfig> = {
  public_header: {
    menus: ['public'],           // Show simplified public menu
    showLogo: true,
    showSignIn: true,            // Show sign-in CTA
    showUserMenu: false,         // Hide when logged out
  },
  app_header: {
    menus: ['main', 'help'],     // Full app navigation
    showLogo: true,
    showUserMenu: true,
    showAdminMenu: true,         // If superadmin
  },
  admin_header: {
    menus: ['main', 'help', 'admin'],
    showLogo: true,
    showUserMenu: true,
    highlight: 'admin',          // Highlight admin context
  },
  // ...
};
```

#### 2. Public Menu Definition

Add a simplified menu for public/marketing pages:

```typescript
export const PUBLIC_MENU: MenuDefinition = {
  id: 'public',
  items: [
    { id: 'features', label: 'Features', href: '/#features' },
    { id: 'roadmap', label: 'Roadmap', href: '/roadmap' },
    { id: 'beta', label: 'Beta Info', href: '/beta' },
  ]
};
```

#### 3. NavHeader Enhancement

Update `NavHeader` to accept a `location` prop:

```tsx
interface NavHeaderProps {
  location?: MenuLocation;  // Default: auto-detect from path
}

export function NavHeader({ location }: NavHeaderProps) {
  // Auto-detect location if not provided
  const detectedLocation = location ?? detectMenuLocation(pathname);
  const config = MENU_LOCATIONS[detectedLocation];
  
  // Render based on config
  return (
    <header>
      {config.showLogo && <Logo />}
      {config.menus.map(menuId => <MenuRenderer menuId={menuId} />)}
      {config.showSignIn && !session && <SignInButton />}
      {config.showUserMenu && session && <UserMenu />}
    </header>
  );
}
```

#### 4. Location Detection Helper

```typescript
export function detectMenuLocation(pathname: string): MenuLocation {
  if (pathname.startsWith('/admin')) return 'admin_header';
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/league')) return 'app_header';
  if (['/', '/privacy', '/terms', '/security', '/beta'].includes(pathname)) return 'public_header';
  // Default to app header for authenticated pages
  return 'app_header';
}
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/lib/menuConfig.ts` | MODIFY - Add MenuLocation types, PUBLIC_MENU, MENU_LOCATIONS config |
| `src/components/navigation/NavHeader.tsx` | MODIFY - Add location prop, use MENU_LOCATIONS config |
| `src/app/admin/design-system/page.tsx` | MODIFY - Document menu locations |

---

## Success Criteria

### Part A (Complete)

- [x] Navigation header appears on all pages
- [x] Admin dropdown visible for SuperAdmins everywhere
- [x] Mobile menu works on all pages
- [x] No duplicate navigation headers

### Part B (Menu Locations)

- [ ] `MenuLocation` type defined in `menuConfig.ts`
- [ ] `PUBLIC_MENU` created for marketing pages
- [ ] `MENU_LOCATIONS` config maps locations to menu sets
- [ ] `NavHeader` accepts optional `location` prop
- [ ] Auto-detection works based on pathname
- [ ] Public pages show simplified menu (Features, Roadmap, Beta Info)
- [ ] App pages show full navigation
- [ ] Admin pages highlight admin context
- [ ] Build passes (`npm run build`)

---

## Out of Scope

- Database-driven menu configuration (future enhancement)
- Drag-and-drop menu builder UI
- Per-page menu overrides (use location prop if needed)

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2025-12-27 | Part B | Added WordPress-style menu locations system |
| 2025-12-27 | Part A | Completed - 8 layout files created |
| 2025-12-26 | Initial | Created PRD for consistent navigation |
