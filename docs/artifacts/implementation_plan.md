# Theme Toggle Fix Plan

## Goal Description
The light/dark mode toggle is physically functional (switching attributes) but visually ineffective because:
1.  Tailwind is configured to look for a `class="dark"` which `next-themes` is not setting (it sets `data-theme="dark"`).
2.  `src/app/layout.tsx` has hardcoded dark colors (`bg-slate-950 text-slate-50`) that override the theme variables.

This plan addresses both issues to ensure the toggle correctly switches modes and styles.

## Proposed Changes

### Configuration
#### [MODIFY] [tailwind.config.ts](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/tailwind.config.ts)
- Change `darkMode: ["class"]` to `darkMode: ["selector", '[data-theme="dark"]']` to align with the application's `data-theme` strategy.

### Layout
#### [MODIFY] [layout.tsx](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/src/app/layout.tsx)
- Remove `bg-slate-950` and `text-slate-50`.
- Replace with `bg-background` and `text-foreground` which use the CSS variables defined in `globals.css`.

### Documentation
#### [MODIFY] [CHANGELOG.md](file:///d:/Vasso/coding%20projects/SCL%20v3%20AG/scl-v3/CHANGELOG.md)
- Log the fix for the theme toggle.

## Verification Plan

### Automated Tests
- None (Visual change).

### Manual Verification
- **Toggle Check**:
    - Click the toggle button.
    - Verify `data-theme` attribute changes on `<html>`.
    - Verify background color changes from Dark (Slate 950) to Light (White/Slate 50).
    - Verify text color changes.
    - Verify Sun/Moon icon visibility toggles correctly.
