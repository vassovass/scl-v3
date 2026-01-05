# Design System Refactor Walkthrough

## Overview
We have transitioned the application from disjointed, hardcoded utility classes (e.g., `bg-slate-950`) to a **Unified Semantic Design System**. This ensures that the application respects the Light/Dark mode toggle while preserving the high-quality dark mode aesthetic you established.

## Key Changes

### 1. The System (`globals.css`)
We introduced "Semantic Variables" that abstract colors from their hex values to their *function*.
- **`--background` / `--foreground`**: Replaces `slate-950` / `slate-50`.
- **`--primary`**: Replaces various `sky-500` hardcodings for actions.
- **`--accent`**: Used for hover states and subtle interactions.
- **`--link-text` / `--link-hover`**: New standard for all text links to ensure visibility.

### 2. The "Date Picker" Fix
> [!NOTE]
> We heard you loud and clear. The Date Picker was customized heavily for Dark Mode.

Instead of overriding your work, we **extracted** your exact colors into specific variables:
- `--date-picker-bg`: Maps to `slate-900` (#0f172a) in Dark Mode (Your exact color).
- `--date-picker-accent`: Maps to `sky-500` (#0ea5e9).

**Result**:
- **Dark Mode**: 0% visual change. It looks exactly as you fixed it.
- **Light Mode**: Automatically swaps to a clean white/slate-200 theme.

### 3. Component Updates
All core components now consume these variables:
- **`Button.tsx`**: Uses `bg-primary`, `bg-destructive`, etc.
- **`NavHeader.tsx`**: Uses `bg-background/95` for the glass effect.
- **`GlobalFooter.tsx`**: Uses `bg-background` and `border-border`.
- **`MobileMenu.tsx`**: Fully themed to match the desktop navigation.

### 4. Home Page Refactor
The Home Page was using hardcoded gradients like `from-sky-900/20`. These are now `from-primary/20`, meaning if you ever decide to rebrand to "Green", changing *one* variable in `globals.css` will update the entire landing page.

## Verification
1.  **Toggle Theme**: Switch to Light Mode. You should see a clean, readable UI with no dark blocks.
2.  **Date Picker**: Open it in Dark Mode to verify it's unchanged. Open it in Light Mode to verify it's readable.
3.  **Home Page**: Verify the gradients look consistent.

## Next Steps
Some minor settings pages (`GeneralSettings`, `CompetitionSettings`) still use legacy hardcoded values. These can be updated progressively as you touch them, but the "App Shell" and "Landing Page" are now fully compliant.
