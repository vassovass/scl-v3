# Cohesive Design System Refactor

## Goal Description
The current codebase relies on scattered, hardcoded hex values and specific Tailwind utility classes (e.g., `slate-900`), making the design system rigid and breaking light/dark mode toggling. The goal is to implement a **Unified Semantic Design System** where all colors are defined in `globals.css` as semantic variables (e.g., `--background`, `--primary`) and all components consumption uses these variables. This ensures modularity (changing one variable updates the whole app) and robust theming.

## User Review Required
> [!IMPORTANT]
> This is a major refactor of the visual layer. While I will aim to preserve the current "Dark Mode" aesthetic as the default, moving to a system means some slight color shifts may occur to ensure consistency. The "Date Picker" nightmare will be resolved by stripping its custom CSS injection and using the global system.

## Proposed Changes

### 1. The Foundation: Semantic Variables
#### [MODIFY] [globals.css](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/app/globals.css)
- **Objective**: Establish the "Single Source of Truth".
- Map all `slate-*` and `brand-*` raw values to semantic names:
    - `--background` / `--foreground` (Page base)
    - `--card` / `--card-foreground` (Surface contrast)
    - `--popover` / `--popover-foreground` (Dropdowns/Modals)
    - `--primary` / `--primary-foreground` (Brand actions - Main Buttons)
    - `--secondary` / `--secondary-foreground` (Muted actions)
    - `--muted` / `--muted-foreground` (Subtle text/bgs)
    - `--accent` / `--accent-foreground` (Interactive highlights: Hover states for lists, ghost buttons)
    - `--destructive` / `--destructive-foreground` (Error states)
    - `--border` (Dividers)
    - `--ring` (Focus states - crucial for accessibility)
    - `--link-text` / `--link-hover` (Explicit variables for text links to ensure visibility on all backgrounds)
- **Best Practice Implementation**:
    - **Interactive Accents**: Use `--accent` for subtle UI interaction (hovering a row), avoiding full saturation which distracts.
    - **Brand Accents**: Use `--primary` for "Call to Action" elements.
    - **Links**: Define `--link-text` (usually `primary` or `blue-500` equivalent) and `--link-hover` (slightly darker/lighter) in `globals.css` to allow global management of all text links without finding/replacing classes later.
- Ensure strictly defined Light vs Dark maps for all above variables.

### 2. Core Components (The "Nightmares")
#### [MODIFY] [DateRangePicker.tsx](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/components/ui/DateRangePicker.tsx)
- **Action**: Refactor the custom `const css` block to use Tailwind classes / CSS variables.
- **Critical Requirement**: Preserve the exact dark mode output the user currently loves.
    - Extract the specific hex codes (e.g., `#0ea5e9`) and ensure they are mapped to the `--primary` or specific `--date-picker-accent` variables in `globals.css`.
    - Replace the hardcoded hexes with these variables.
    - This ensures Dark Mode looks *identical* to what it is now, but Light Mode will actually work by swapping the underlying variable values.

#### [MODIFY] [button.tsx](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/components/ui/button.tsx)
- Use standard Shadcn usage: `bg-primary`, `bg-secondary`, `bg-destructive` instead of arbitrary slate values.

#### [MODIFY] [NavHeader.tsx](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/components/navigation/NavHeader.tsx) & [GlobalFooter.tsx](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/components/layout/GlobalFooter.tsx)
- Replace all `slate` references with `background`, `card`, `muted` semantic classes.

### 3. Feature Pages
#### [MODIFY] [Home Page](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/app/(home)/page.tsx)
- Audit for layout-specific hardcoding.
- Replace any inline gradients or hex codes with `bg-gradient-to...` using semantic colors (e.g. `from-primary/20 to-background`).

## Verification Plan

### Automated Checks
- `grep` search for `slate-950`, `slate-900` to ensure no UI components are left behind using raw values.

### Visual Verification (User)
- **Cohesion**: Does the Date Picker look like it belongs to the same app as the Navbar?
- **Modularity**: If I change `--primary` in `globals.css`, does the generic button AND the active date in the picker update? (Yes, it must).
- **Theming**: Does toggling to Light Mode instantly invert all these surfaces correctly?
