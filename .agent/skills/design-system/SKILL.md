---
name: design-system
description: Defines the theme system using CSS variables, dark/light mode configuration, badge color registry, and UI component patterns. Use when styling components, adding theme tokens, working with colors, or making any visual UI changes.
compatibility: Antigravity, Claude Code, Cursor
metadata:
  version: "1.1"
  project: "stepleague"
---

# Design System Skill

## Core Rule

**NEVER use hardcoded Tailwind colors. ALWAYS use semantic CSS variables.**

```tsx
// ❌ WRONG
<div className="bg-slate-900 text-slate-300 border-slate-700">

// ✅ CORRECT
<div className="bg-card text-foreground border-border">
```

---

## Full Documentation

**MUST READ:** [docs/THEME_SYSTEM.md](file:///docs/THEME_SYSTEM.md)

This skill is a quick reference. The full theme documentation contains:
- Complete CSS variable reference
- Light/dark mode implementation
- Accessibility requirements
- Common pitfalls and solutions

---

## Quick Reference: CSS Variables

### Backgrounds

| Variable | Usage |
|----------|-------|
| `bg-background` | Page background |
| `bg-card` | Card/container background |
| `bg-muted` | Muted/subtle background |
| `bg-primary` | Primary action background |
| `bg-secondary` | Secondary background |

### Text

| Variable | Usage |
|----------|-------|
| `text-foreground` | Primary text |
| `text-muted-foreground` | Secondary/muted text |
| `text-primary` | Emphasised text (brand color) |

### Status Colors

```tsx
// Use HSL syntax for status colors
className="text-[hsl(var(--success))]"  // Green
className="text-[hsl(var(--warning))]"  // Amber
className="text-[hsl(var(--info))]"     // Blue
className="text-destructive"             // Red
```

### With Opacity

```tsx
className="bg-primary/90"                    // 90% opacity
className="bg-[hsl(var(--success)/0.1)]"     // 10% opacity
```

---

## Badge Components

### Two Distinct Systems

| Component | Import | Use Case |
|-----------|--------|----------|
| `Badge` | `@/components/ui/badge` | General UI (variant prop) |
| `SystemBadge` | `@/components/ui/SystemBadge` | Category-based (Kanban, Roadmap) |

### shadcn Badge

```tsx
import { Badge } from "@/components/ui/badge";

<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outline</Badge>
```

### SystemBadge

```tsx
import { SystemBadge } from "@/components/ui/SystemBadge";

<SystemBadge category="status" value="verified" />
<SystemBadge category="type" value="bug" size="sm" />
<SystemBadge category="release" value="now" />
```

### Central Badge Configuration

All badge colors are in `src/lib/badges.ts`:

```typescript
import { getBadgeClass, getBadgeConfig } from '@/lib/badges';

const statusClass = getBadgeClass('status', 'verified');
const badgeConfig = getBadgeConfig('type', 'bug');
```

---

## Critical Patterns

### Text Truncation

**CRITICAL:** `truncate` won't work without `min-w-0`!

```tsx
// ✅ CORRECT
<div className="flex items-center gap-3">
  <Icon className="flex-shrink-0" />        // Prevent icon shrinking
  <div className="flex-1 min-w-0">          // Enable truncation
    <div className="truncate">Long text...</div>
  </div>
</div>

// ❌ WRONG - truncate won't work
<div className="flex-1">
  <div className="truncate">Long text...</div>
</div>
```

### Hover States

```tsx
className="hover:bg-secondary"
className="hover:border-primary/50"
className="hover:bg-[hsl(var(--success)/0.1)]"
```

### Focus States

```tsx
className="focus:outline-none focus:ring-1 focus:ring-primary"
```

---

## ⚠️ Light/Dark Mode (CRITICAL)

### The Rule

**Every color MUST work in BOTH light AND dark mode. No exceptions.**

### How It Works

| Property | Value |
|----------|-------|
| Framework | `next-themes` |
| Attribute | `data-theme="light"` (NOT class-based) |
| Default | Dark mode |
| Toggle | User preference via settings |

### CSS Variable Pattern

**ALWAYS define BOTH variants:**

```css
/* In globals.css */
:root {
  /* Dark mode (default) */
  --custom-color: 200 50% 50%;
}

[data-theme="light"] {
  /* Light mode - MUST be defined! */
  --custom-color: 200 60% 30%;  /* Darker for light bg */
}
```

### Common Mistakes

```tsx
// ❌ WRONG - Hardcoded, breaks in one theme
<div className="bg-slate-900 text-white">

// ❌ WRONG - Only works in dark mode
<div className="bg-gray-800">

// ❌ WRONG - Custom inline color
<div style={{ backgroundColor: '#1e293b' }}>

// ✅ CORRECT - Uses semantic variables
<div className="bg-card text-foreground">

// ✅ CORRECT - With opacity
<div className="bg-muted/50">
```

### Testing Requirement

> **ALWAYS test in BOTH themes before considering work complete.**
> Toggle to light mode via user settings or browser dev tools.

---

## ⚠️ Contrast Requirements (CRITICAL)

### WCAG 2.1 AA Standard

| Text Type | Minimum Ratio |
|-----------|---------------|
| Body text | **4.5:1** |
| Large text (18px+ or 14px bold) | **3:1** |
| UI components & borders | **3:1** |

### How to Check

1. Use browser DevTools color picker (Accessibility panel → Contrast ratio)
2. Or use [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Layered Contrast (MANDATORY)

Every visual element exists in a **layer stack**. Each layer must maintain contrast with the layer directly behind it. Check ALL of these:

| Layer | Check Against | Example |
|-------|---------------|---------|
| **Text** | Its direct background | Tooltip text vs tooltip bg |
| **Background** | Its parent background | Card bg vs page bg |
| **Shadow** | The surface it falls on | `shadow-lg` must be visible on both light and dark bg |
| **Border** | Both adjacent surfaces | Border between card and page must read on both sides |
| **Overlay content** | Overlay background | Modal text vs modal backdrop |
| **Icon/badge** | Its container background | Status icon on a card on a page |

#### Common Layering Scenarios (based on current codebase)

**Tooltips (shadcn `TooltipContent` — uses `bg-primary text-primary-foreground`):**
```tsx
// ✅ Current pattern — high contrast by default
<TooltipContent>Tooltip text</TooltipContent>
// Renders: bg-primary text-primary-foreground — works in both themes

// ❌ WRONG — hardcoded, invisible in light mode
<div className="bg-slate-800 text-slate-200">Tooltip</div>
```

**Popovers & Dropdowns (use `bg-popover text-popover-foreground`):**
```tsx
// ✅ Current pattern — semantic popover vars
<PopoverContent>  {/* bg-popover text-popover-foreground shadow-md */}
<DropdownMenuContent>  {/* bg-popover text-popover-foreground shadow-md */}
```

**Overlays & Modals (current Dialog pattern):**
```tsx
// Layer stack: page → DialogOverlay → DialogContent → text
// DialogOverlay: bg-background/80
// DialogContent: bg-background border shadow-lg
// Custom modals use: bg-black/50 or bg-black/60 backdrop

// ✅ Current pattern (submit-steps, ShareModal, etc.)
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
  <div className="bg-background border border-border shadow-lg rounded-lg">
    <p className="text-foreground">Content</p>
    <p className="text-muted-foreground">Secondary info</p>
  </div>
</div>
```

**Badges on Cards on Pages (3-deep stacking):**
```tsx
// Layer stack: page bg → card bg → badge bg → badge text
// ✅ Each layer is visually distinct (current badges.ts pattern)
<div className="bg-card">
  <SystemBadge category="status" value="verified" />
  {/* Badge: bg-[hsl(var(--success)/0.2)] on bg-card — distinct */}
  {/* Badge text: text-[hsl(var(--success))] on badge bg — readable */}
</div>
```

**Toasts (Sonner — uses `bg-background text-foreground border-border shadow-lg`):**
```tsx
// ✅ Already semantic — auto-contrasts in both themes
// Defined in sonner.tsx: group-[.toaster]:bg-background group-[.toaster]:text-foreground
```

**Shadows — use appropriate weight for the context:**
```tsx
// Current patterns in codebase:
className="shadow"        // Cards (card.tsx default)
className="shadow-sm"     // Subtle (inputs, switches)
className="shadow-md"     // Dropdowns, popovers
className="shadow-lg"     // Modals, nav elements, toasts
className="shadow-xl"     // Floating date pickers
// Tip: heavier shadows (lg, xl) are more visible on dark backgrounds
```

### Common Problem: Muted Text

```tsx
// ❌ RISKY - muted-foreground may have low contrast on muted backgrounds
<div className="bg-muted">
  <p className="text-muted-foreground text-sm">Low contrast stacking!</p>
</div>

// ✅ SAFER - use foreground text on muted backgrounds
<div className="bg-muted">
  <p className="text-foreground">Readable on muted bg</p>
  <p className="text-muted-foreground">Only for secondary info on card/background</p>
</div>
```

### Status Colors Must Have Contrast

```tsx
// ✅ Status text on card background — good contrast
<span className="text-[hsl(var(--success))]">Verified</span>

// ✅ Status as background — paired foreground defined
<Badge variant="success">Verified</Badge>

// ❌ WRONG — light green text on light blue background
<div className="bg-[hsl(var(--info)/0.2)]">
  <span className="text-[hsl(var(--success))]">Hard to read!</span>
</div>
```

---

## Hardcoded Colors = FORBIDDEN

### Zero Tolerance Policy

| Forbidden | Why |
|-----------|-----|
| `bg-slate-*` | Breaks light mode |
| `text-gray-*` | Inconsistent theming |
| `border-zinc-*` | Not semantic |
| `#1e293b`, `rgb(...)` | Hardcoded |
| `dark:` prefix | Use `data-theme` instead |

### Allowed Patterns

| Pattern | Example |
|---------|---------|
| Semantic variables | `bg-card`, `text-foreground` |
| Status colors (HSL) | `text-[hsl(var(--success))]` |
| With opacity | `bg-primary/90` |
| Custom vars in globals.css | After defining light/dark variants |

### Finding Violations

Search for hardcoded colors in codebase:

```bash
# Find Tailwind color classes (potential violations)
grep -r "bg-slate\|bg-gray\|text-slate\|text-gray" src/
grep -r "border-zinc\|bg-zinc" src/
```

---

## Accessibility

### Screen Reader Support

```tsx
<button aria-label="Close modal">
  <X className="h-5 w-5" />
</button>

// Always add aria-label for icon-only buttons
<button aria-label="Delete item" className="text-destructive">
  <Trash2 className="h-4 w-4" />
</button>
```

### Focus Indicators

All interactive elements must have visible focus:

```tsx
className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
```

---

## shadcn/ui Components

### Installed Components

| Component | Location |
|-----------|----------|
| `toast`, `toaster` | Notifications |
| `dialog` | Modals |
| `dropdown-menu` | Dropdowns |
| `input`, `label`, `textarea` | Form fields |
| `select`, `checkbox` | Form controls |
| `tooltip` | Tooltips |
| `confirm-dialog` | Confirmation prompts |

### Usage

```tsx
// Toasts
import { toast } from "@/hooks/use-toast";
toast({ title: "Success!", description: "Saved" });
toast({ title: "Error", variant: "destructive" });

// Confirmation
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
<ConfirmDialog
  open={showDelete}
  onOpenChange={setShowDelete}
  title="Delete?"
  variant="destructive"
  onConfirm={handleDelete}
/>
```

---

## Reference Files

| File | Purpose |
|------|---------|
| `docs/THEME_SYSTEM.md` | **Full documentation** |
| `src/app/globals.css` | CSS variable definitions |
| `src/lib/badges.ts` | Badge color configuration |
| `/admin/design-system` | Live component examples |

---

## Checklist

Before completing any UI work:

- [ ] Using semantic CSS variables (not hardcoded colors)
- [ ] Tested in BOTH light and dark themes
- [ ] **Layered contrast verified** — every text/bg/border/shadow layer readable against its parent layer
- [ ] No similar-hue stacking (e.g., light green text on light blue bg)
- [ ] Shadows visible in both light and dark themes
- [ ] Used `min-w-0` for flex containers needing truncation
- [ ] Used `flex-shrink-0` on icons in flex layouts
- [ ] Added focus indicators to interactive elements
- [ ] Text contrast meets 4.5:1 ratio (3:1 for large text/UI components)
- [ ] Updated design system page if adding new patterns

---

## Related Skills

- `form-components` - Form field styling
- `architecture-philosophy` - Use shadcn over custom components
