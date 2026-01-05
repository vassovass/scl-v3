# PRD 21: shadcn/ui Integration & Menu Refactor

## Key Tasks
- [x] Initial setup: install shadcn/ui, config, globals.css <!-- id: 0 -->
- [x] Part A: Toast System (`toast()` + `Toaster`) <!-- id: 1 -->
- [x] Part B: Confirm Dialog (`ConfirmDialog`) <!-- id: 2 -->
- [x] Part C: Navigation Refactor (`ShadcnMenuRenderer` + `DropdownMenu`) <!-- id: 3 -->
    - [x] Create `ShadcnMenuRenderer` component
    - [x] Update `NavHeader` to use new component
    - [x] Fix Theme Toggle INP issue
    - [x] Verify Mobile implementation independence
- [x] Part D: Form Components (Input, Select, etc.) <!-- id: 4 -->
- [x] Part E: Theme Toggle (`ModeToggle` + `ThemeProvider`) <!-- id: 5 -->
- [x] Fixes: Navigation click issue, SVG animation block <!-- id: 6 -->

## Verification
- [x] Verify Toast notifications work <!-- id: 7 -->
- [x] Verify Menu Navigation works (click -> navigate) <!-- id: 8 -->
- [x] Verify Theme switching is performant <!-- id: 9 -->
- [x] Build check (`npm run build`) <!-- id: 10 -->
