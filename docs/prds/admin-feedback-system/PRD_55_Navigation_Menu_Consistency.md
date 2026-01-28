# PRD-55: Navigation Menu Consistency

> **Status:** Complete
> **Priority:** High
> **Effort:** Small (1-line fix)

---

## Problem

Public marketing pages like `/how-to-share` were not showing the public navigation menu (Features, How It Works, Pricing, Roadmap, Stage Info) for guest users. Only the logo and Sign In button were visible.

## Root Cause

The `detectMenuLocation()` function in `menuConfig.ts` has a hardcoded `publicPages` array that determines which routes show the public menu. `/how-to-share` and `/compare` were missing from this array.

**Before:**
```typescript
const publicPages = ['/', '/pricing', '/how-it-works', '/why-upload', '/privacy', '/terms', '/security', '/stage-info', '/beta', '/roadmap', '/feedback'];
```

**After:**
```typescript
const publicPages = ['/', '/pricing', '/how-it-works', '/how-to-share', '/why-upload', '/compare', '/privacy', '/terms', '/security', '/stage-info', '/beta', '/roadmap', '/feedback'];
```

## Solution

Added `/how-to-share` and `/compare` to the `publicPages` array in `src/lib/menuConfig.ts`.

## Navigation Matrix

| Route | Guest | Member | Admin | Owner | SuperAdmin |
|-------|-------|--------|-------|-------|------------|
| `/` | PUBLIC_MENU | APP_MENU | APP_MENU | APP_MENU | APP+ADMIN |
| `/how-to-share` | PUBLIC_MENU | APP_MENU | APP_MENU | APP_MENU | APP+ADMIN |
| `/pricing` | PUBLIC_MENU | APP_MENU | APP_MENU | APP_MENU | APP+ADMIN |
| `/compare/*` | PUBLIC_MENU | APP_MENU | APP_MENU | APP_MENU | APP+ADMIN |
| `/dashboard` | Redirect→SignIn | APP_MENU | APP_MENU | APP_MENU | APP+ADMIN |
| `/league/[id]` | Redirect→SignIn | APP+LEAGUE | APP+LEAGUE | APP+LEAGUE | APP+ADMIN+LEAGUE |
| `/admin/*` | Redirect→SignIn | 403 | 403 | 403 | APP+ADMIN |

## User Types

| Type | Source | Description |
|------|--------|-------------|
| Guest | No session | Unauthenticated visitor |
| Member | `memberships.role = 'member'` | Basic league member |
| Admin | `memberships.role = 'admin'` | League administrator |
| Owner | `memberships.role = 'owner'` | League creator |
| SuperAdmin | `users.is_superadmin = true` | Global administrator |

## Menu Locations

| Location | When | Menu Contents |
|----------|------|---------------|
| `public_header` | Guest on public pages | PUBLIC_MENU + Sign In |
| `app_header` | Authenticated on app pages | MAIN_MENU + USER_MENU |
| `admin_header` | SuperAdmin on /admin/* | MAIN_MENU + USER_MENU + ADMIN_MENU |

## Files Modified

- `src/lib/menuConfig.ts` - Added `/how-to-share` and `/compare` to `publicPages` array

## Testing

1. Open incognito browser
2. Navigate to `/how-to-share`
3. Verify PUBLIC_MENU items visible: Features | How It Works | Pricing | Roadmap | Stage Info
4. Verify Sign In button visible
5. Sign in → verify nav changes to APP_MENU
6. Sign out → verify nav reverts to PUBLIC_MENU

## Future Considerations

When adding new public marketing pages, remember to add them to the `publicPages` array in `menuConfig.ts`. Consider refactoring to use a more dynamic detection based on the `(public)` route group folder structure.

---

## Browser Agent Audit Prompt

For future page audits, use this prompt with Claude's browser agent extension:

```
TASK: Audit the StepLeague marketing page at [URL]

STEPS:
1. Navigate to the URL
2. Take full-page screenshot
3. Check for broken images (404s, failed loads)
4. Verify navigation shows correct menu items
5. Test interactive elements (buttons, forms)
6. Resize to 375px and check mobile layout
7. Output markdown report with:
   - Broken Images/Assets
   - Navigation Issues
   - UX/UI Improvements (with severity)
   - Mobile Issues
   - Recommended Fixes (priority order)
```
