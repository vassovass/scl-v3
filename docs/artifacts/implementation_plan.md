# Implementation Plan - Refactor Menu System to Shadcn

This plan addresses the user request to refactor the menu system to be "modular, scalable, and similar to WordPress" by migrating from the custom `MenuRenderer` to shadcn/ui `DropdownMenu`. This fixes existing navigation and accessibility issues.

## User Review Required

> [!IMPORTANT]
> This refactor completely replaces `src/components/navigation/MenuRenderer.tsx` with a new `ShadcnMenuRenderer.tsx` for Desktop navigation. Mobile navigation (`MobileMenu.tsx`) is independent and will function as before (it implements its own accordion logic).

## Proposed Changes

### Navigation Components

#### [NEW] [ShadcnMenuRenderer.tsx](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/components/navigation/ShadcnMenuRenderer.tsx)
- Implements `MenuRendererProps` interface.
- Uses `DropdownMenu` (Root, Trigger, Content, Item, Sub, SubTrigger, SubContent) from `@/components/ui`.
- Recursively renders `MenuItem` tree.
- Handles `requiresLeague` and role filtering via existing schema.
- Uses `userRole` and `leagueId` for context.
- Maintains `data-module-id` attributes for analytics.

#### [MODIFY] [NavHeader.tsx](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/components/navigation/NavHeader.tsx)
- Import `ShadcnMenuRenderer`.
- Replace all `<MenuRenderer ... />` instances with `<ShadcnMenuRenderer ... />`.
- Ensure props match (especially `onAction`, `isOpen` control).

#### [MODIFY] [MobileMenu.tsx](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/components/navigation/MobileMenu.tsx)
- Remove unused import of `MenuRenderer`.

#### [DELETE] [MenuRenderer.tsx](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/components/navigation/MenuRenderer.tsx)
- Remove the legacy component once migration is verified.

## Verification Plan

### Automated Tests
- Build verification: `npm run build` to ensure no type errors.

### Manual Verification
1. **Desktop Navigation**:
   - Open "League" dropdown.
   - Verify sub-items (Submit, Leaderboard) render correctly.
   - Click "Submit Steps" -> upgrades to `/submit`.
   - Click "Leaderboard" -> navigates to leaderboard.
   - Verify keyboard navigation (Enter to open, Arrow keys to move, Enter to select).
   - Verify clicking outside closes the menu.

2. **Actions Menu**:
   - Open "Actions" dropdown.
   - Click "Join League".

3. **Responsiveness**:
   - Resize to mobile.
   - Open hamburger menu.
   - Verify Mobile Menu still works (since it uses separate logic).

4. **Analytics**:
   - Verify `data-module-id` attributes exist in DOM.
