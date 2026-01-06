# UI/UX Research: Navigation & League Architecture

> **Purpose:** Document researched patterns from industry-leading competitive gaming platforms
> **Date:** 2026-01-06
> **Application:** SCL v3 Menu System & League Hub Design

---

## ⚠️ Copyright Notice

All patterns documented here are **inspired by common industry practices** in competitive gaming and fantasy sports applications. This research analyzes general UX patterns, not copyrighted assets. Visual designs for SCL should be original, using our existing shadcn/CSS variable design system.

---

## Executive Summary

This research identifies key UX patterns from leading sports platforms that can inform SCL's:
1. **Multi-tier navigation architecture**
2. **League section organization**
3. **Mobile-responsive menu systems**
4. **WordPress-style configurable backend**

---

## 1. Navigation Architecture

### Observed Pattern: 4-Tier Navigation Hierarchy

Industry-leading platforms use distinct navigation tiers for different content levels:

| Tier | Purpose | SCL Equivalent |
|------|---------|----------------|
| **Tier 1: Utility Bar** | Global links (account, help) | User menu in NavHeader |
| **Tier 2: Main Nav** | Primary sections | Main menu (Dashboard, League, Actions) |
| **Tier 3: Product Branding** | Visual identity + context | Hero/gradient banner |
| **Tier 4: Sub-Navigation** | Feature-specific tabs | League tabs (Submit, Rankings, Progress) |

### Screenshot Reference

````carousel
![Desktop Navigation - 4-tier layout](./fpl_desktop_nav_1767716407308.png)
<!-- slide -->
![Secondary Navigation Bar](./fpl_secondary_nav_1767716616363.png)
<!-- slide -->
![Menu Dropdown State](./fpl_menu_dropdown_1767716608581.png)
````

### Key Design Elements

| Element | Pattern | SCL Implementation |
|---------|---------|-------------------|
| **Active State** | Thick bottom border (accent color) | Use `border-b-2 border-primary` |
| **Dropdown Menus** | Rounded corners, shadow, clean list | shadcn `DropdownMenu` |
| **Color Scheme** | Dark background + gradient accents | Our existing mesh gradient |
| **Typography** | Bold sans-serif, ~14-16px | Tailwind `font-semibold text-sm` |

---

## 2. Mobile Navigation Pattern

### Observed Pattern: Hamburger + Horizontal Scroll

Mobile navigation uses two strategies:

1. **Hamburger menu** for Tier 1-2 (global + main sections)
2. **Horizontal scroll** for Tier 4 (sub-navigation tabs)

### Screenshot Reference

````carousel
![Mobile Hamburger Menu Closed](./fpl_mobile_hamburger_1767716702748.png)
<!-- slide -->
![Mobile Menu Expanded - Accordion sections](./fpl_mobile_menu_open_1767716719409.png)
<!-- slide -->
![User Uploaded Menu Reference](./uploaded_image_1767714721678.png)
````

### Mobile Design Recommendations

| Pattern | Implementation |
|---------|---------------|
| **Accordion Submenus** | Collapsible sections with chevron icons |
| **Touch-friendly** | Min 44px tap targets |
| **Horizontal Tab Scroll** | `overflow-x-auto snap-x` for sub-nav |
| **Sticky Headers** | Keep nav visible on scroll |

---

## 3. League Section Architecture

### Observed Pattern: Category-Based Grouping

Large platforms group leagues/competitions into clear categories with distinct headers:

| Category Type | Example |
|---------------|---------|
| **Invitational** | Private leagues joined via code |
| **Head-to-Head** | 1v1 competition format |
| **Global/General** | Platform-wide rankings |
| **Public** | Randomly assigned groups |

### Screenshot Reference

````carousel
![Leagues Overview - Section headers](./fpl_leagues_initial_1767716992584.png)
<!-- slide -->
![Classic Section](./fpl_leagues_classic_section_1767717045335.png)
<!-- slide -->
![Global Section](./fpl_leagues_global_section_1767717070890.png)
<!-- slide -->
![Cups Section - Tab-based categorization](./fpl_cups_section_1767717325923.png)
````

### Section Header Design

| Element | Pattern |
|---------|---------|
| **Header Text** | Large, bold, brand color |
| **Visual Separation** | Generous whitespace between sections |
| **Collapsible** | Optional expand/collapse per section |
| **Count Badge** | Show number of items "(3)" |

---

## 4. League Standings Table

### Observed Pattern: Clean Data Table with Highlights

### Screenshot Reference

````carousel
![Overall League Standings](./fpl_league_standings_overall_1767717105302.png)
<!-- slide -->
![Standings Rows](./fpl_league_standings_rows_1767717123280.png)
<!-- slide -->
![Pagination Controls](./fpl_league_standings_bottom_1767717157008.png)
````

### Table Design Elements

| Element | Pattern | SCL Implementation |
|---------|---------|-------------------|
| **User Highlight** | Light background on own row | `bg-muted/50` on current user |
| **Rank Indicators** | ↑↓ arrows with color | Green/red with icons |
| **Column Headers** | Fixed, sortable | Sticky header row |
| **Pagination** | Simple Next/Previous | Server-side pagination |

---

## 5. Join/Create League Flow

### Screenshot Reference

````carousel
![Join League Options](./fpl_join_league_options_1767717403334.png)
<!-- slide -->
![Public League Discovery](./fpl_join_public_leagues_1767717441230.png)
````

### Flow Design

| Step | Pattern |
|------|---------|
| **Entry Point** | Clear CTAs: "Join" vs "Create" |
| **Code Entry** | Single input, validate on blur |
| **Discovery** | Browsable list for public leagues |
| **Confirmation** | Preview league before joining |

---

## 6. WordPress-Style Backend Configuration

### Recommended Architecture for SCL

Our `menuConfig.ts` already implements a WordPress-style pattern. This should be extended to support:

1. **Admin UI for menu editing** (Superadmin only)
2. **Database-backed menu storage** (vs current hardcoded)
3. **Drag-and-drop reordering**
4. **Role-based visibility in UI**

### Current State: `src/lib/menuConfig.ts`

```typescript
// Already has:
- Menu definitions (MAIN_MENU, HELP_MENU, etc.)
- Role-based filtering (visibleTo, hiddenFrom)
- Unlimited nesting (children arrays)
- Context resolution ([id] placeholders)

// Needs:
- Database persistence
- Admin editing UI
- Dynamic section configuration
```

### Proposed Enhancement

| Feature | Description |
|---------|-------------|
| **Menu Editor UI** | `/admin/menu` - drag-drop editor |
| **Section Config** | Define dashboard sections dynamically |
| **Feature Flags** | Enable/disable features per environment |
| **A/B Testing** | Show different menus to user segments |

---

## 7. Captured Screenshots Index

All screenshots are stored in the artifacts directory:

### Navigation System
| File | Contents |
|------|----------|
| [fpl_desktop_nav](./fpl_desktop_nav_1767716407308.png) | Full desktop 4-tier navigation |
| [fpl_menu_dropdown](./fpl_menu_dropdown_1767716608581.png) | Dropdown menu open state |
| [fpl_secondary_nav](./fpl_secondary_nav_1767716616363.png) | Gradient sub-navigation bar |
| [fpl_mobile_hamburger](./fpl_mobile_hamburger_1767716702748.png) | Mobile hamburger closed |
| [fpl_mobile_menu_open](./fpl_mobile_menu_open_1767716719409.png) | Mobile menu expanded |
| [fpl_more_dropdown](./fpl_more_dropdown_1767716878468.png) | "More" overflow menu |

### League Architecture
| File | Contents |
|------|----------|
| [fpl_leagues_initial](./fpl_leagues_initial_1767716992584.png) | Main leagues overview |
| [fpl_leagues_classic_section](./fpl_leagues_classic_section_1767717045335.png) | Classic leagues section |
| [fpl_leagues_global_section](./fpl_leagues_global_section_1767717070890.png) | Global rankings section |
| [fpl_cups_section](./fpl_cups_section_1767717325923.png) | Cups category |
| [fpl_league_standings_overall](./fpl_league_standings_overall_1767717105302.png) | Standings table header |
| [fpl_league_standings_rows](./fpl_league_standings_rows_1767717123280.png) | Table rows with data |
| [fpl_league_standings_bottom](./fpl_league_standings_bottom_1767717157008.png) | Pagination controls |

### Other UI Elements
| File | Contents |
|------|----------|
| [fpl_join_league_options](./fpl_join_league_options_1767717403334.png) | Join league flow |
| [fpl_join_public_leagues](./fpl_join_public_leagues_1767717441230.png) | Public league discovery |
| [fpl_user_profile_area](./fpl_user_profile_area_1767716930586.png) | User profile section |
| [fpl_user_menu_search](./fpl_user_menu_search_1767716835547.png) | Account area |

---

## 8. Design System Application

### How to Apply These Patterns in SCL

All implementations should use our existing design system:

| Pattern | SCL Implementation |
|---------|-------------------|
| **Colors** | CSS variables from `globals.css` |
| **Components** | shadcn/ui primitives |
| **Typography** | Tailwind classes |
| **Icons** | Lucide React icons |
| **Animations** | CSS transitions, Framer Motion |
| **Responsive** | Mobile-first Tailwind breakpoints |

### Theme Compatibility

All new components MUST work in both light and dark modes:

```css
/* Use semantic variables, NOT hardcoded colors */
/* ✅ Correct */
background: hsl(var(--card));
color: hsl(var(--foreground));

/* ❌ Wrong */
background: #1e293b;
color: white;
```

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-01-06 | Initial | Created research document with 25+ screenshots and pattern analysis |
