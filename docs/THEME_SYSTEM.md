---
## Document Context
**What**: Canonical theme system reference covering CSS variables, dark/light mode architecture, color system (HSL), component patterns, accessibility rules, and common pitfalls
**Why**: Required reading before making any styling or color changes; defines how themes work end-to-end via next-themes and CSS custom properties
**Status**: Current
**Last verified**: 2026-03-29
**Agent note**: This summary should be sufficient to assess relevance. Only read further if this document matches your current task.
---

# Theme System Documentation

> **MUST READ for AI Agents**
> This document is the canonical reference for all theme, color, and styling decisions in StepLeague.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Theme Variants](#theme-variants)
3. [Color System](#color-system)
4. [CSS Variables Reference](#css-variables-reference)
5. [Component Patterns](#component-patterns)
6. [Accessibility](#accessibility)
7. [Common Pitfalls](#common-pitfalls)
8. [User Preferences](#user-preferences)

---

## Architecture Overview

### Technology Stack

- **Theme Framework**: `next-themes` for client-side theme management
- **Storage**: localStorage (client) + `user_preferences` table (database)
- **Attribute System**: `data-theme="light"` attribute (NOT class-based)
- **Color Format**: HSL (Hue, Saturation, Lightness)
- **CSS Variables**: Semantic naming via CSS custom properties

### How It Works

```
User clicks theme toggle
    ↓
next-themes updates data-theme attribute
    ↓
CSS variables switch based on [data-theme="light"] selector
    ↓
useUserTheme hook syncs to database
    ↓
Theme preference persisted for next login
```

### File Locations

| File | Purpose |
|------|---------|
| `src/app/globals.css` | All CSS variables (`:root` for dark, `[data-theme="light"]` for light) |
| `src/components/mode-toggle.tsx` | Theme switcher dropdown component |
| `src/lib/badges.ts` | Central badge color configuration |
| `supabase/migrations/20260107010000_create_user_preferences.sql` | Database schema for theme storage |

---

## Theme Variants

### Current Variants

**Only two variants exist:**

1. **Dark Mode** (default) - Defined in `:root`
2. **Light Mode** - Defined in `[data-theme="light"]`

### Future-Proofing: SuperAdmin Theme Variants

The system is **designed to support unlimited custom themes** managed by SuperAdmins:

- **Storage**: Future theme definitions will be stored in `app_settings` table
- **Application**: SuperAdmin can create variants like "high-contrast", "colorblind-friendly", "midnight", etc.
- **Implementation**: Each variant would add a new `[data-theme="variant-name"]` selector in CSS
- **UI**: Theme selector would dynamically populate from database

**Current Status**: Infrastructure exists, but only light/dark modes are implemented.

---

## Color System

### Semantic Color Philosophy

**NEVER use hardcoded Tailwind colors.** All colors MUST use semantic CSS variables.

#### ❌ WRONG
```tsx
<div className="bg-slate-900 text-slate-300">
<button className="bg-sky-500 hover:bg-sky-400">
<span className="text-amber-400">
```

#### ✅ CORRECT
```tsx
<div className="bg-card text-foreground">
<button className="bg-primary hover:bg-primary/90">
<span className="text-[hsl(var(--warning))]">
```

### Why Semantic Variables?

1. **Theme-aware**: Automatically adapts to light/dark mode
2. **Maintainable**: Change once in `globals.css`, affects entire app
3. **Accessible**: Ensures WCAG 2.1 AA contrast ratios (4.5:1 minimum)
4. **Future-proof**: Easy to add new theme variants

---

## CSS Variables Reference

### Core Variables

| Variable | Purpose | Dark Value | Light Value |
|----------|---------|------------|-------------|
| `--background` | Page background | `222.2 84% 4.9%` | `0 0% 100%` |
| `--foreground` | Primary text | `210 40% 98%` | `222.2 84% 4.9%` |
| `--card` | Card backgrounds | `222.2 84% 4.9%` | `0 0% 100%` |
| `--card-foreground` | Card text | `210 40% 98%` | `222.2 84% 4.9%` |
| `--muted` | Muted backgrounds (recedes) | `217.2 32.6% 15.5%` | `192 10% 90%` |
| `--muted-foreground` | Secondary text | `215 20.2% 65.1%` | `215.4 16.3% 46.9%` |
| `--border` | Borders | `217.2 32.6% 17.5%` | `214.3 31.8% 91.4%` |
| `--input` | Input borders | `217.2 32.6% 17.5%` | `214.3 31.8% 91.4%` |

### Brand Variables

| Variable | Purpose | Dark Value | Light Value |
|----------|---------|------------|-------------|
| `--primary` | Brand color (sky) | `199 89% 48%` | `200 98% 39%` |
| `--primary-foreground` | Text on primary | `222.2 47.4% 11.2%` | `210 40% 98%` |
| `--secondary` | Secondary actions | `217.2 32.6% 17.5%` | `210 40% 96.1%` |
| `--secondary-foreground` | Text on secondary | `210 40% 98%` | `222.2 47.4% 11.2%` |
| `--accent` | Accent/hover (highlights) | `217.2 32.6% 22%` | `192 10% 88%` |
| `--accent-foreground` | Text on accent | `210 40% 98%` | `222.2 47.4% 11.2%` |

### Status Variables

| Variable | Purpose | Dark Value | Light Value |
|----------|---------|------------|-------------|
| `--success` | Success states | `142 76% 36%` | `142 71% 45%` |
| `--warning` | Warning states | `38 92% 50%` | `43 96% 56%` |
| `--info` | Informational | `199 89% 48%` | `200 98% 39%` |
| `--success-foreground` | Text on success bg | `0 0% 100%` | `0 0% 100%` |
| `--warning-foreground` | Text on warning bg | `222.2 84% 4.9%` | `0 0% 100%` |
| `--info-foreground` | Text on info bg | `222.2 47.4% 11.2%` | `0 0% 100%` |
| `--destructive` | Destructive actions | `0 62.8% 30.6%` | `0 84.2% 60.2%` |
| `--destructive-foreground` | Text on destructive | `210 40% 98%` | `210 40% 98%` |

### Chart Variables (Analytics)

| Variable | Purpose | Value (both themes) |
|----------|---------|---------------------|
| `--chart-1` | Primary chart color | `199 89% 48%` |
| `--chart-2` | Secondary chart color | `142 76% 36%` |
| `--chart-3` | Tertiary chart color | `38 92% 50%` |
| `--chart-4` | Quaternary chart color | `280 65% 60%` |
| `--chart-5` | Quinary chart color | `340 75% 55%` |

### Sidebar Variables

| Variable | Purpose | Dark Value | Light Value |
|----------|---------|------------|-------------|
| `--sidebar` | Sidebar background | `222.2 47.4% 11.2%` | `0 0% 100%` |
| `--sidebar-foreground` | Sidebar text | `210 40% 98%` | `189 30% 20%` |
| `--sidebar-primary` | Sidebar primary | `199 89% 48%` | `189 42% 32%` |
| `--sidebar-accent` | Sidebar hover | `217.2 32.6% 22%` | `192 10% 90%` |
| `--sidebar-border` | Sidebar border | `215 25% 27%` | `192 12% 70%` |

### Other Variables

| Variable | Purpose | Value |
|----------|---------|-------|
| `--radius` | Border radius | `0.5rem` (8px) |
| `--popover` | Popover background | Darker than `--card` (depth) |
| `--popover-foreground` | Popover text | Same as `--card-foreground` |
| `--ring` | Focus ring color | Same as `--primary` |

---

## Component Patterns

### Using CSS Variables in Tailwind

#### Solid Colors
```tsx
className="bg-card text-foreground"
className="border-border hover:bg-secondary"
```

#### With Opacity
```tsx
className="bg-primary/90"  // 90% opacity
className="bg-destructive/10"  // 10% opacity for subtle backgrounds
```

#### Status Colors (First-Class Tailwind Tokens)
```tsx
// Preferred — registered as Tailwind colors
className="text-success"
className="bg-warning/10"
className="text-info"
className="bg-destructive/20 text-destructive"

// Also valid — HSL syntax for edge cases
className="text-[hsl(var(--success))]"
className="bg-[hsl(var(--warning)/0.1)]"  // 10% opacity warning background
```

### Badge Components

**Two distinct badge systems exist:**

#### 1. shadcn Badge (General UI)
```tsx
import { Badge } from "@/components/ui/badge";

<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outline</Badge>
```

#### 2. SystemBadge (Category-based)
```tsx
import { SystemBadge } from "@/components/ui/SystemBadge";

<SystemBadge category="status" value="verified" size="sm" />
<SystemBadge category="type" value="bug" />
<SystemBadge category="release" value="now" />
```

### Central Badge Configuration

**File**: `src/lib/badges.ts`

All badge colors are centrally managed:

```typescript
export const BADGE_CONFIG: Record<string, Record<string, BadgeConfig>> = {
  status: {
    verified: {
      label: '✓ Verified',
      icon: '✓',
      className: 'bg-[hsl(var(--success)/0.2)] text-[hsl(var(--success))]',
    },
    pending: {
      label: '⏳ Pending',
      icon: '⏳',
      className: 'bg-[hsl(var(--warning)/0.2)] text-[hsl(var(--warning))]',
    },
    failed: {
      label: '✗ Failed',
      icon: '✗',
      className: 'bg-destructive/20 text-destructive',
    },
  },
  // ... more categories
};
```

**Usage**:
```typescript
import { getBadgeClass, getBadgeConfig } from '@/lib/badges';

const statusClass = getBadgeClass('status', 'verified');
const badgeConfig = getBadgeConfig('type', 'bug');
```

### Text Overflow Prevention Pattern

**CRITICAL for dropdowns and menus:**

```tsx
<div className="flex items-center gap-3">
  <Icon className="flex-shrink-0" />      // Prevents icon shrinking
  <div className="flex-1 min-w-0">        // min-w-0 enables truncation (CRITICAL)
    <div className="truncate">Long text that will be truncated...</div>
  </div>
</div>
```

**Why `min-w-0` is required:**
- Flex items have implicit `min-width: auto` by default
- This prevents them from shrinking below content width
- Without `min-w-0`, `truncate` class won't work
- This pattern is documented in `LeagueInviteControl.tsx:7-22`

### Hover States

```tsx
// Semantic hover
className="hover:bg-secondary"
className="hover:border-primary/50"

// Status-specific hover
className="hover:bg-[hsl(var(--success)/0.1)]"
className="hover:text-[hsl(var(--warning))]"
```

### Focus States

All interactive elements should have visible focus indicators:

```tsx
className="focus:outline-none focus:ring-1 focus:ring-primary"
className="focus:border-primary"
```

---

## Accessibility

### WCAG 2.1 AA Compliance

**All color combinations MUST meet 4.5:1 contrast ratio (3:1 for large text and UI components).**

#### Layered Contrast Principle

Every UI element exists in a visual layer stack. Each layer must maintain readable contrast with the layer directly behind it. This applies to ALL visual properties:

| Check | Minimum Ratio | Example |
|-------|---------------|---------|
| Text vs its background | 4.5:1 (body), 3:1 (large) | Card text on card bg |
| Element bg vs parent bg | Visually distinct | Card on page, modal on backdrop |
| Border vs both adjacent surfaces | 3:1 | Border between card and page |
| Shadow vs surface it falls on | Visible in both themes | `shadow-lg` on light and dark bg |
| Overlay content vs overlay bg | 4.5:1 | Tooltip text on tooltip bg |

**Critical scenarios (current codebase patterns):**
- **Tooltips** (`bg-primary text-primary-foreground`) — high contrast by default in both themes
- **Popovers/Dropdowns** (`bg-popover text-popover-foreground shadow-md`) — semantic vars handle both themes
- **Dialog modals** — overlay uses `bg-background/80`, content uses `bg-background border shadow-lg`
- **Custom modals** — backdrop uses `bg-black/50`–`bg-black/80 backdrop-blur-sm`, content uses `bg-background border-border`
- **Toasts** (Sonner) — `bg-background text-foreground border-border shadow-lg`
- **Badges on cards** — badge bg (e.g., `bg-[hsl(var(--success)/0.2)]`) on `bg-card`, badge text on badge bg — 3-deep stacking
- **Never stack similar hues** — light green text on light blue bg, pastel on pastel = unreadable
- **Shadows** — use appropriate weight for context: `shadow-sm` (inputs), `shadow-md` (dropdowns), `shadow-lg` (modals/toasts), `shadow-xl` (floating pickers)

#### Light Mode Contrast Enhancements

The light theme was specifically tuned for accessibility:

| Element | Dark Mode | Light Mode | Reason |
|---------|-----------|------------|--------|
| `--foreground` | `210 40% 98%` | `222.2 84% 4.9%` | Inverted for contrast |
| `--muted-foreground` | `215 20.2% 65.1%` | `215.4 16.3% 46.9%` | Darker for readability |
| `--primary` | `199 89% 48%` | `200 98% 39%` | Darker for contrast on white |
| `--success` | `142 76% 36%` | `142 71% 45%` | Lighter for better visibility |
| `--warning` | `38 92% 50%` | `43 96% 56%` | More vibrant for attention |

#### Testing Contrast

Use browser DevTools or online tools:
- Chrome DevTools: Inspect element → Accessibility panel → Contrast ratio
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- Ensure all text passes **AA** standard (4.5:1 minimum)

### Screen Reader Support

All interactive elements should have proper ARIA labels:

```tsx
<button aria-label="Switch to light mode">
  <Sun className="h-5 w-5" />
</button>
```

---

## Common Pitfalls

### ❌ Pitfall 1: Hardcoded Colors

**Problem**: Using Tailwind color classes directly
```tsx
<div className="bg-slate-900 text-slate-300">
```

**Solution**: Use semantic variables
```tsx
<div className="bg-card text-foreground">
```

### ❌ Pitfall 2: Forgetting Light Mode

**Problem**: Adding new CSS variable only to `:root`
```css
:root {
  --new-color: 200 50% 50%;
}
```

**Solution**: Add BOTH dark and light variants
```css
:root {
  --new-color: 200 50% 50%;  /* Dark mode */
}

[data-theme="light"] {
  --new-color: 200 60% 40%;  /* Light mode */
}
```

### ❌ Pitfall 3: Text Truncation Not Working

**Problem**: Using `truncate` without `min-w-0`
```tsx
<div className="flex-1">
  <div className="truncate">Long text...</div>
</div>
```

**Solution**: Add `min-w-0` to parent
```tsx
<div className="flex-1 min-w-0">
  <div className="truncate">Long text...</div>
</div>
```

### ❌ Pitfall 4: Poor Dropdown Contrast

**Problem**: Using hardcoded dark colors in dropdowns
```tsx
<div className="bg-slate-800 border-slate-700">
```

**Solution**: Use theme-aware variables
```tsx
<div className="bg-card border-border">
```

See `LeagueInviteControl.tsx` for complete example.

### ❌ Pitfall 5: Badge Color Drift

**Problem**: Creating badge colors inline
```tsx
<span className="bg-green-500/20 text-green-400">Verified</span>
```

**Solution**: Use central badge configuration
```tsx
import { SystemBadge } from "@/components/ui/SystemBadge";
<SystemBadge category="status" value="verified" />
```

---

## User Preferences

### Database Schema

**Table**: `user_preferences`

```sql
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'system')),
  -- ... other preferences
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### Theme Options

| Value | Behavior |
|-------|----------|
| `'dark'` | Always use dark mode |
| `'light'` | Always use light mode |
| `'system'` | Follow OS/browser preference |

### Hook Pattern (Future Implementation)

```tsx
import { useUserTheme } from '@/hooks/useUserTheme';

function MyComponent() {
  const { theme, updateTheme } = useUserTheme();

  return (
    <button onClick={() => updateTheme('light')}>
      Switch to light mode
    </button>
  );
}
```

**How it works**:
1. `next-themes` manages client-side theme state
2. `useUserTheme` hook syncs changes to database
3. On login, user's saved theme is loaded from database
4. Fallback to localStorage if user is not logged in

---

## Related Documentation

| Document | Purpose |
|----------|---------|
| [AGENTS.md](../AGENTS.md) | Universal AI agent context (references this file) |
| [globals.css](../src/app/globals.css) | All CSS variable definitions |
| [badges.ts](../src/lib/badges.ts) | Central badge configuration |
| [/admin/design-system](../src/app/admin/design-system/page.tsx) | Live component examples |
| [CHANGELOG.md](../CHANGELOG.md) | Complete change history |

---

## Quick Reference Checklist

When working with colors/themes, ensure:

- [ ] Using semantic CSS variables (NOT hardcoded Tailwind colors)
- [ ] Added both `:root` AND `[data-theme="light"]` variants for new variables
- [ ] Tested visual appearance in BOTH light and dark modes
- [ ] Text contrast meets WCAG 2.1 AA (4.5:1 body, 3:1 large text/UI)
- [ ] **Layered contrast verified** — each layer readable against its parent (text→bg→parent bg→page)
- [ ] No similar-hue stacking (pastel on pastel, light green on light blue, etc.)
- [ ] Shadows visible in both light and dark themes
- [ ] Using central badge configuration from `badges.ts`
- [ ] Added `min-w-0` to flex containers that need truncation
- [ ] Used `flex-shrink-0` on icons in flex layouts
- [ ] Added focus indicators to interactive elements
- [ ] Updated design system page if adding new patterns

---

*Last updated: 2026-04-03*
*This is the canonical theme documentation. All AI agents MUST read and follow these guidelines.*
