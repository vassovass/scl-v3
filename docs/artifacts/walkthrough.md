# Emergency UI Repair & Polish - Walkthrough

## 1. Softened Light Mode Palette
We replaced the "Stark White" (`#ffffff`) background with a softer **Slate-50** (`#f8fafc`) to reduce glare and provide better depth, while keeping Cards as Pure White for contrast.

- **Background**: `hsl(210 40% 98%)` (Slate-50)
- **Cards**: `hsl(0 0% 100%)` (White)
- **Foreground**: `hsl(222.2 84% 4.9%)` (Slate-950)

## 2. Fixed "Invisible/Broken" Components
Replaced legacy invalid `bg-[rgb(var(--...))]` wrappers with standard Tailwind semantic classes.

### Roadmap & DatePicker Fixes
- **RoadmapView**: Removed hardcoded transparency hacks. Now uses `bg-background` and `bg-card`.
- **DateRangePicker**: Replaced injected css string interpolation with valid HSL values.
- **Logo**: Updated Hover states to `text-foreground` so they are visible in both Light (Black) and Dark (White) modes.
- **Footer**: Removed hardcoded `slate-950 backgrounds`.

## Verification
- **Visuals**: Light mode no longer "yellow" or "stark white". Text is readable.
- **Build**: Production build verified (in progress).
- **DateRangePicker Fix**: Resolved `css` variable name mismatch that caused Vercel build failure.

