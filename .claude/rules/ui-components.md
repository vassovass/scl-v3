---
description: Theme system, shadcn/ui, form components, design tokens, tours
paths:
  - src/components/**
  - src/app/(dashboard)/**
  - src/styles/**
---

# UI Component Patterns

## Theme System
- Uses `next-themes` with `data-theme="light"` attribute (NOT class-based)
- **Dark is the default theme**
- Full reference: `docs/THEME_SYSTEM.md`

### Color Rules
- **NEVER** hardcode Tailwind colors (no `bg-slate-800`, `text-gray-200`)
- **ALWAYS** use semantic CSS variables: `bg-card`, `text-foreground`, `border-border`
- Brand: "Step" (white) + "League" (sky-500), hover swaps colors

### Design Tokens
Utility classes available globally:
- `.btn-primary`, `.btn-secondary`, `.btn-ghost`
- `.glass-card` — frosted glass effect
- `.text-gradient` — brand gradient text

## shadcn/ui
- **NY style** variant
- Components in `src/components/ui/`
- Import from `@/components/ui/{component}`

### Toast Pattern
```typescript
import { toast } from "sonner";
toast.success("Saved!");
toast.error("Something went wrong");
```

### ConfirmDialog Pattern
```typescript
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
<ConfirmDialog
  title="Delete league?"
  description="This cannot be undone."
  onConfirm={handleDelete}
  variant="destructive"
/>
```

## MANDATORY Form Components
All forms MUST use these — never raw `<input>`:

```typescript
import { FormInput, FormSelect, FormCheckbox, FormTextarea, FormFileInput }
  from "@/components/ui/form-fields";
```

These provide consistent styling, error states, labels, and accessibility.

## Badge Components
- `Badge` — shadcn base badge, generic use
- `SystemBadge` — category-based badges with semantic colors (achievement, rank, etc.)

## Tour System

### CSS Variables (in `globals.css`, both dark/light)
`--joyride-bg`, `--joyride-text`, `--joyride-primary`, etc.

### State Management (`TourProvider.tsx`)
- Tour completion is **immediate** — feedback dialog shown via `useEffect` AFTER state settles
- Tour switching shows confirmation dialog ("Switch to [new tour]" or "Continue Current Tour")
- **Universal application** — all fixes apply to ALL tours automatically

### Race Condition Fix
```tsx
useEffect(() => {
  if (lastCompletedTourId && !isRunning && !activeTour && !showFeedbackDialog) {
    setShowFeedbackDialog(true);
  }
}, [lastCompletedTourId, isRunning, activeTour, showFeedbackDialog]);
```

### Tour Switch Confirmation
```tsx
if (isRunning && activeTour) {
  setPendingTourSwitch({ fromTourId, fromTourName, toTourId, toTourName });
  return; // Shows confirmation dialog
}
```

## Mobile-First
All component styling: base = mobile, then `md:` and `lg:` for larger screens. Never write desktop-first styles.
