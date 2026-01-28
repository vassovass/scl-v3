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

## 🧪 Testing Requirements

> **Emphasis:** Modularity, Systems Thinking, Design System Consistency, Deep Thinking Framework

### Unit Tests (Vitest)

**File:** `src/lib/__tests__/menuConfig.test.ts`

Tests added for PRD-55:
```typescript
// PRD-55: Marketing pages must show public navigation
it('detects marketing pages as public (PRD-55)', () => {
    expect(detectMenuLocation('/how-to-share')).toBe('public_header');
    expect(detectMenuLocation('/compare')).toBe('public_header');
    expect(detectMenuLocation('/how-it-works')).toBe('public_header');
    expect(detectMenuLocation('/why-upload')).toBe('public_header');
});

it('detects legal pages as public', () => {
    expect(detectMenuLocation('/terms')).toBe('public_header');
    expect(detectMenuLocation('/security')).toBe('public_header');
});

it('defaults unknown routes to app_header', () => {
    expect(detectMenuLocation('/unknown-route')).toBe('app_header');
});
```

### E2E Tests (Playwright)

**File:** `e2e/sharing-marketing.spec.ts`

| Scenario | Test Coverage |
|----------|---------------|
| Guest sees public menu | `/how-to-share`, `/compare`, `/` |
| Mobile hamburger menu | Public menu accessible on 375px viewport |
| Navigation links work | Logo → home, Sign In → auth |
| CTA links to sign-up | Primary button href validation |

### Systems Thinking - Test Coverage Matrix

| Route | Unit Test | E2E Test | Auth State |
|-------|-----------|----------|------------|
| `/` | `detectMenuLocation` | `navigation.spec.ts` | Guest/Auth |
| `/how-to-share` | `menuConfig.test.ts` | `sharing-marketing.spec.ts` | Guest |
| `/compare` | `menuConfig.test.ts` | `sharing-marketing.spec.ts` | Guest |
| `/dashboard` | `menuConfig.test.ts` | `navigation.spec.ts` | Auth only |
| `/admin/*` | `menuConfig.test.ts` | `navigation.spec.ts` | SuperAdmin |

### Design System Consistency Tests

The navigation should follow design system patterns:

| Element | Token/Pattern | Verification |
|---------|---------------|--------------|
| Logo | Brand colors, consistent sizing | Visual regression |
| Nav links | Text color `--foreground`, hover state | E2E interaction |
| Sign In button | Button variant `outline` or `ghost` | Component test |
| Mobile menu | Drawer pattern, animation tokens | E2E viewport test |

---

## 🧠 Deep Thinking Framework

### Why (Problem Definition)
Navigation inconsistency creates user confusion and hurts SEO. Guest users landing on marketing pages couldn't discover other features (Pricing, Roadmap) because the public menu wasn't rendering.

### What (Solution Scope)
Add missing routes to `publicPages` array. This is a config fix, not an architectural change.

### How (Implementation Strategy)
1. Identify root cause via code analysis
2. Single-line fix in `menuConfig.ts`
3. Add unit tests to prevent regression
4. Add E2E tests for guest navigation flows

### Future-Proofing (Proactive Items)

**P-1: Dynamic Public Route Detection**
Instead of hardcoded array, detect public routes from Next.js route groups:
```typescript
// Future improvement: detect from (public) folder
const isPublicRoute = pathname.startsWith('/(public)') || staticPublicPages.includes(pathname);
```

**P-2: Navigation Audit Automation**
Create CI job that:
- Spins up preview deployment
- Runs navigation E2E tests for all user types
- Flags any route showing wrong menu

**P-3: Route-to-Menu Mapping Documentation**
Auto-generate documentation showing which routes map to which menus:
```bash
npm run docs:nav-matrix
# Outputs markdown table of route → menu mapping
```

---

## 🎨 Design System Integration

### Navigation Component Hierarchy

```
NavHeader (layout-level)
├── Logo (branded, links to /)
├── DesktopNav
│   ├── PublicMenu (guest only, public pages)
│   ├── AppMenu (authenticated)
│   └── AdminMenu (superadmin only)
├── MobileMenu (drawer pattern)
└── AuthButtons (Sign In / User Avatar)
```

### Accessibility Requirements

| Element | WCAG | Test |
|---------|------|------|
| Skip link | 2.4.1 | Hidden skip-to-content link |
| Focus management | 2.4.3 | Tab order in mobile menu |
| Landmarks | 1.3.1 | `<nav>` with aria-label |

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
