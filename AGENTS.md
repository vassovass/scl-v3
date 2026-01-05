# AGENTS.md - Universal AI Agent Context

> **Universal context file for AI coding assistants**
> Supported: Cursor, Claude Code, GitHub Copilot, OpenAI Codex, Google Jules, JetBrains AI, Windsurf, Aider

> ⚠️ **BEFORE COMPLETING ANY TASK - READ THIS:**
>
> 1. **CHECK THE CURRENT DATE** - Use format `YYYY-MM-DD` for all timestamps!
> 2. **UPDATE THE ROADMAP** - Add completed features to `/admin/kanban` as "Done" ⬇️
> 3. Check the **"Documentation Update Rule"** section below
> 4. Update `CHANGELOG.md` with your changes
> 5. Update design system page (`/admin/design-system`) if adding UI/components
> 6. Update config files (e.g., `adminPages.ts` for new admin pages)
> 7. This is **REQUIRED** - do not skip!

> 🗺️ **ROADMAP UPDATE RULE (MANDATORY - DO NOT SKIP!)**
>
> **Every feature you complete MUST be added to the roadmap.** This is industry best practice.
>
> **When to update:** After completing ANY feature, improvement, or bug fix that users would care about.
>
> **Step 1: Mark as "Currently Working On" (at task start):**
>
> ```typescript
> await fetch("/api/agent/current-work", {
>   method: "POST",
>   headers: { "Content-Type": "application/json" },
>   body: JSON.stringify({
>     subject: "Feature Name",
>     description: "What you are building",
>     type: "feature"  // or "improvement", "bug"
>   })
> });
> ```
>
> This shows the item with a blue glow in the "Now" column on `/roadmap`.
>
> **Step 2: Mark as "Done" (when complete):**
>
> ```typescript
> // First clear the "working on" flag
> await fetch("/api/agent/current-work", { method: "DELETE" });
>
> // Then mark as done via kanban API
> await fetch("/api/admin/kanban", {
>   method: "PUT",
>   headers: { "Content-Type": "application/json" },
>   body: JSON.stringify({
>     id: "<existing-id>",
>     board_status: "done",
>     completed_at: "2026-01-05"  // Current date YYYY-MM-DD
>   })
> });
> ```
>
> **Roadmap Columns:**
>
> - **Now** = Actively being built this sprint (agent work shows at top with glow)
> - **Next** = Coming in 1-2 releases  
> - **Later** = Planned for 3+ months out
> - **Future** = Ideas/backlog
>
> **Why this matters:** Users see completed features at `/roadmap`. This builds trust and shows progress!

---

## Project Overview

**StepLeague** - A competitive step counting web app where users form leagues and compete weekly.

- **Framework**: Next.js 14 (App Router, NOT v15)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS (mobile-first)
- **Database**: Supabase (PostgreSQL + RLS)
- **AI Verification**: Gemini 2.0 Flash (via Supabase Edge Functions)
- **Hosting**: Vercel

---

## Critical Rules

### 0. Check Existing Patterns (MANDATORY)

Before implementing any feature or refactoring:

1. **Search implementation**: Check how similar features are implemented (e.g., auth, data fetching, error handling).
2. **Check data models**: Look at `schema.sql` or existing types to understand relationships (e.g., `role` vs `is_superadmin`).
3. **Don't assume**: Verify assumptions about auth levels, database columns, and existing utilities.

### 1. Mobile-First Design (MANDATORY)

All UI must be designed mobile-first using Tailwind's responsive prefixes:

```tsx
// ✅ CORRECT: Mobile-first (base = mobile)
<div className="flex flex-col p-4 md:flex-row md:p-6">
<nav className="hidden md:flex">  // Desktop-only elements

// ❌ WRONG: Hiding mobile by default
<div className="flex md:hidden">
```

### 2. Untyped Supabase Client

Don't use `<Database>` generics - use untyped clients to avoid build failures:

```typescript
// ✅ CORRECT - untyped
const { data } = await supabase.from("leagues").select("*");
const leagues = (data || []).map((l: any) => ({ ... }));

// ❌ WRONG - causes cascading 'never' type errors
const supabase = createServerClient<Database>(...);
```

### 3. API Route Pattern

**NEW: Use `withApiHandler` for new routes** (eliminates boilerplate):

> **Usage Rule:** Use this new pattern for ALL new routes. Migrate legacy routes only when you are already modifying them for other reasons.

```typescript
import { withApiHandler } from "@/lib/api/handler";
import { z } from "zod";

const mySchema = z.object({ name: z.string() });

export const POST = withApiHandler({
  auth: 'required',  // or 'none', 'superadmin', 'league_member', 'league_admin', 'league_owner'
  schema: mySchema,
}, async ({ user, body, adminClient }) => {
  const { data } = await adminClient.from("table").insert({ ...body, user_id: user.id });
  return { success: true, data };
});
```

**Auth levels:**

| Level | Description |
|-------|-------------|
| `none` | No auth required |
| `required` | Must be logged in |
| `superadmin` | Site-wide superadmin |
| `league_member` | Must be member of the league |
| `league_admin` | Must be admin or owner |
| `league_owner` | Must be owner |

**Legacy pattern** (still works, for existing routes):

```typescript
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { json, badRequest, unauthorized } from "@/lib/api";

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const adminClient = createAdminClient();
  const { data } = await adminClient.from("table").select("*");
  return json({ data });
}
```

### 4. Suspense for useSearchParams

Next.js 14 requires Suspense boundary:

```tsx
function MyForm() {
  const searchParams = useSearchParams();
  return <form>...</form>;
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MyForm />
    </Suspense>
  );
}
```

### 5. Error Handling (NEW)

**MANDATORY:** Use the new `AppError` system for all error handling.

1.  **Throwing Errors:**

    ```typescript
    import { AppError, ErrorCode } from "@/lib/errors";

    // Throw specific error code
    throw new AppError({
      code: ErrorCode.UPLOAD_TOO_LARGE,
      message: "File exceeds 5MB limit",
      context: { size: file.size },
      recoverable: true,
    });
    ```

2.  **Catching & Reporting:**

    ```typescript
    import { normalizeError, reportErrorClient } from "@/lib/errors";

    try {
      await doSomething();
    } catch (err) {
      // 1. Normalize to AppError
      const appError = normalizeError(err, ErrorCode.UNKNOWN_ERROR);

      // 2. Report (logs to console/server)
      reportErrorClient(appError);

      // 3. Show user-friendly message
      toast.error(appError.toUserMessage());
    }
    ```

---

### 6. Offline First & PWA

**StepLeague is an Offline-First Application.**
Users often track steps in gyms or areas with poor signal.

1.  **Submission Queue**: All critical user actions (like submitting steps) MUST support offline queuing.
    - Use `useOfflineQueue` hook.
    - Store in IndexedDB (via `src/lib/offline`).
    - Auto-sync via `useOfflineSync` when online.
2.  **UI Feedback**:
    - Show "Offline" badge/indicator (`OfflineIndicator.tsx`).
    - Change button text to "Save Offline" (amber/yellow) when offline.
    - NEVER block the user from "submitting" just because they are offline.
3.  **Storage Security**:
    - **NO Auth Tokens** in IndexedDB/localStorage.
    - Queue limit: Max 10 items.
    - Auto-cleanup: Items >7 days.
    - Clear offline data on logout.

---

## Project Structure

```
scl-v3/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # Sign-in, sign-up
│   │   ├── (dashboard)/          # Protected routes (auto NavHeader + Footer)
│   │   │   ├── dashboard/        # User dashboard
│   │   │   ├── league/[id]/      # League detail, leaderboard, analytics
│   │   │   └── join/             # Join via invite code
│   │   ├── api/                  # API routes
│   │   │   ├── leagues/          # League CRUD + calendar + daily-breakdown
│   │   │   ├── leaderboard/      # Leaderboard with filters
│   │   │   ├── submissions/      # Step submissions + batch + extract
│   │   │   ├── feedback/         # General + module feedback
│   │   │   └── profile/          # User profile settings
│   │   └── [static pages]        # privacy, security, beta, feedback
│   ├── components/
│   │   ├── analytics/            # CalendarHeatmap, DailyBreakdownTable
│   │   ├── forms/                # SubmissionForm, BatchSubmissionForm
│   │   ├── layout/               # GlobalFooter
│   │   ├── navigation/           # NavHeader, MenuRenderer, MobileMenu
│   │   ├── providers/            # AuthProvider
│   │   └── ui/                   # DatePicker, ShareButton, ModuleFeedback
│   └── lib/
│       ├── api.ts                # json(), badRequest(), unauthorized(), etc.
│       ├── menuConfig.ts         # ⭐ Centralized menu configuration (WordPress-style)
│       ├── adminPages.ts         # SuperAdmin pages config
│       ├── supabase/             # Server/client Supabase clients
│       └── utils/                # Date utilities
├── supabase/migrations/          # SQL migrations (numbered)
├── AGENTS.md                     # This file (universal context)
└── CLAUDE.md                     # References this file
```

---

## Database Schema

| Table | Key Columns |
|-------|------------|
| `users` | id, display_name, `nickname`, units, is_superadmin |
| `leagues` | id, name, invite_code, owner_id, `deleted_at` (soft delete) |
| `memberships` | league_id, user_id, role |
| `submissions` | league_id, user_id, for_date, steps, verified, `flagged` |
| `feedback` | type, subject, description, screenshot_url |
| `module_feedback` | module_id, feedback_type, comment, screenshot_url |
| `user_records` | user_id, best_day_steps, best_day_date, current_streak, total_steps_lifetime |

---

## Key Features

- ✅ League creation/joining with invite codes
- ✅ Single + batch step submission with AI verification
- ✅ Leaderboard (period filters, verified filter, custom dates)
- ✅ Analytics dashboard (calendar heatmap, daily breakdown with 3/5/7-day grouping)
- ✅ User nicknames and profile settings
- ✅ Global feedback system (floating 💬 widget with screenshot)
- ✅ Social sharing (Web Share API + WhatsApp/X)
- ✅ **Modular menu system** (role-based, unlimited nesting, feedback integration)
- ✅ Mobile-responsive navigation (hamburger menu, accordion submenus)
- ✅ Guided onboarding system (Joyride)
- ✅ Footer with legal links
- ✅ Internal Kanban board (`/admin/kanban`)
- ✅ Public roadmap with voting (`/roadmap`)

---

## Theme, Styling & Branding

### Brand Logo Treatment

The StepLeague logo uses two-tone text with a color-swap hover effect:

- **Default**: "Step" (white/slate-50) + "League" (sky-500)
- **Hover**: Colors swap → "Step" (sky-400) + "League" (white)
- **Icon**: 👟 sneaker emoji

**Logo locations to keep in sync:**

- `src/components/navigation/NavHeader.tsx` - Main header logo
- `src/components/layout/GlobalFooter.tsx` - Footer logo
- `src/app/admin/design-system/page.tsx` - Design system documentation

### Design Tokens

All defined in `src/app/globals.css` using CSS custom properties.

| Category | Examples | CSS Variable |
|----------|----------|-------------|
| **Primary** | `sky-500/600` | `--brand-primary` |
| **Backgrounds** | `bg-gradient-mesh`, `.glass-card` | `--bg-base`, `--bg-card` |
| **Text** | `slate-50/400/500` | `--text-primary`, `--text-secondary` |
| **Status** | `green-500`, `amber-400`, `red-500` | `--success`, `--warning`, `--error` |

### Utility Classes (from `globals.css`)

- `.btn-primary`, `.btn-ghost` - Buttons
- `.glass-card`, `.card-glow` - Card styles
- `.text-gradient`, `.glow-text` - Text effects
- `.bg-gradient-mesh`, `.bg-gradient-primary` - Backgrounds
- `.animate-float`, `.animate-pulse-glow` - Animations
- `.section-container`, `.stat-badge`, `.feature-icon` - Layout helpers

### Theme System (future-proofed for light/dark mode)

- Default: Dark theme (`:root` variables)
- Light theme: Add `data-theme="light"` to `<html>` element
- All theme-aware colors use CSS variables, no hardcoded values
- When adding new colors, add both dark `:root` and `[data-theme="light"]` variants

> **Superadmins**: See `/admin/design-system` for live examples of all design tokens and branding.

---

## shadcn/ui Components

**Status**: ✅ Fully integrated (PRD 21 complete)

- **Location**: `src/components/ui/`
- **Config**: `components.json` (New York style, neutral base)
- **Styling**: Tailwind + CSS variables (dark-first, light via `data-theme="light"`)

### Installed Components

| Component | Purpose |
|-----------|---------|
| `toast.tsx` + `use-toast.ts` | Notification toasts |
| `toaster.tsx` | Toast container (in layout.tsx) |
| `dialog.tsx` | Modal dialogs |
| `confirm-dialog.tsx` | Reusable confirmation dialogs |
| `dropdown-menu.tsx` | Dropdown menus |
| `input.tsx`, `label.tsx`, `textarea.tsx` | Form inputs |
| `select.tsx`, `checkbox.tsx` | Form controls |
| `tooltip.tsx` | Tooltips |

### Usage Patterns

```tsx
// ✅ Toast notifications (replace alert())
import { toast } from "@/hooks/use-toast";
toast({ title: "Success!", description: "Steps submitted" });
toast({ title: "Error", variant: "destructive" }); // Red error toast

// ✅ Confirmation dialogs (replace confirm())
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
<ConfirmDialog
  open={showDelete}
  onOpenChange={setShowDelete}
  title="Delete Item?"
  description="This action cannot be undone."
  variant="destructive"
  onConfirm={handleDelete}
  isLoading={isDeleting}
/>
```

### Theme Toggle

The theme system uses `next-themes` with `data-theme` attribute:

- **Provider**: `ThemeProvider` in `layout.tsx`
- **Toggle**: `ModeToggle` component in NavHeader
- **Options**: Light / Dark / System (auto-detects OS preference)

### Joyride CSS Variables (Guided Tours)

Joyride tour styling uses CSS variables for theme-aware colors:

| Variable | Purpose | Dark Theme Value |
|----------|---------|------------------|
| `--joyride-bg` | Tooltip background | slate-800 |
| `--joyride-text` | Tooltip text | slate-100 |
| `--joyride-primary` | Primary buttons | sky-500 |
| `--joyride-primary-text` | Primary button text | slate-900 |
| `--joyride-secondary-text` | Back/skip buttons | slate-400 |
| `--joyride-beacon` | Beacon pulse color | sky-500 |
| `--joyride-overlay` | Overlay color | black (with alpha) |

Both dark and light theme values are defined in `globals.css`.

### When to Use shadcn vs Existing Components

> **Decision Record (PRD 21 Part C)**: We are migrating the navigation system to shadcn `DropdownMenu` to ensure accessibility, consistent behavior, and eliminate INP blocking issues found in the custom implementation.

| Use Case | Use This |
|----------|----------|
| Toast notifications | `toast()` from `@/hooks/use-toast` |
| Confirmation prompts | `ConfirmDialog` component |
| Navigation dropdowns | shadcn `DropdownMenu` (via new renderer) |
| Modal dialogs | `Dialog` from shadcn |
| Form inputs (new forms) | shadcn form components |
| Theme toggle | `ModeToggle` component |

**Rule**: Only migrate existing components to shadcn if you're already modifying them for other reasons and the migration provides clear benefit.

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| `Parameter implicitly has 'any' type` | Add `CookieOptions[]` type to setAll |
| `useSearchParams should be wrapped in Suspense` | Wrap in `<Suspense>` |
| `Property 'id' does not exist on type 'never'` | Remove `<Database>` generic |
| Auth redirects incorrectly | Update Site URL in Supabase Dashboard to `https://scl-v3.vercel.app` |

---

## Commands

```bash
npm run build    # Production build
npx tsc --noEmit # Type check
```

---

## Deployment (Vercel Only)

**IMPORTANT**: This project has NO local development. All testing happens on Vercel.

- **Live URL**: https://scl-v3.vercel.app/
- **Deployment**: Auto-deploy from `main` branch
- **Testing**: Always test on deployed URL, NOT localhost
- **Environment**: All env vars configured in Vercel dashboard
- **Build errors**: Expected locally without .env.local (ignored)

### Making Changes

1. Push to main: `git push origin main`
2. Vercel auto-builds and deploys (2-3 minutes)
3. Test at https://scl-v3.vercel.app/
4. Check Vercel dashboard for build logs if issues

---

## Date Awareness (CRITICAL)

> [!CAUTION]
> **AI agents often default to training data dates (2023-2024). Always use the ACTUAL current date!**

### Rules for Dates

1. **Check the context** - The current date/time is provided in every request
2. **Use 2025 dates** - We are in late 2025, not 2024!
3. **Migration file naming** - Use format `YYYYMMDDHHMMSS_name.sql` with CORRECT year
4. **Timestamps in docs** - Use ISO format: `2025-MM-DD`

### Date Sources (Priority Order)

1. `current local time` in request metadata (most accurate)
2. Git commit timestamps
3. File modification dates

### Common Mistakes to Avoid

- ❌ Using `2024` for new files (we're in 2025!)
- ❌ Hardcoding dates without checking context
- ❌ Assuming the year from training data

---

## DO NOT

- ❌ Use `<Database>` generics on Supabase clients
- ❌ Use placeholder images - generate with AI
- ❌ Reference trademarked products in code/commits
- ❌ Skip mobile styling - always mobile-first
- ❌ Use RLS-based queries in API routes - use `adminClient`

---

## Documentation Update Rule (REQUIRED)

**AI agents MUST update documentation on every commit/push:**

1. **CHANGELOG.md** - Add entry for every change (date, category, description)
2. **README.md** - Update features list if adding new features
3. **ROADMAP.md** - Move completed items to "Completed", update "In Progress"
4. **AGENTS.md** - Update "Key Features" section if structure changes
5. **Design System Page** (`/admin/design-system`) - **CRITICAL**: Update this page when:
   - Adding new design tokens or utility classes to `globals.css`
   - Changing logo styling, branding, or hover effects
   - Introducing new UI patterns, components, or section types
   - Creating new reusable modules or elements
   - Modifying color schemes or typography

### UI/Styling Change Checklist

When making ANY UI, branding, or component changes:

**Branding Changes:**

- [ ] `src/components/navigation/NavHeader.tsx` - Header logo
- [ ] `src/components/layout/GlobalFooter.tsx` - Footer logo  
- [ ] `src/app/admin/design-system/page.tsx` - Design system docs
- [ ] This file (`AGENTS.md`) - If changing brand guidelines

**New Components/Modules/Sections:**

- [ ] Add to design system page (`/admin/design-system`) with live examples
- [ ] Document usage patterns in this file if reusable
- [ ] Add CSS classes to `globals.css` if creating new patterns

**New CSS Tokens/Classes:**

- [ ] Add to `src/app/globals.css` with both light AND dark mode variants
- [ ] Document in design system page with examples

**New SuperAdmin Pages:**

- [ ] Create page in `src/app/admin/[page-name]/page.tsx`
- [ ] Add entry to `src/lib/adminPages.ts` - menu auto-updates!
- [ ] No need to manually edit NavHeader

### ⚠️ Light/Dark Mode Requirement (MANDATORY)

**ALL new UI work MUST consider both light and dark mode:**

- Use CSS variables from `globals.css` instead of hardcoded colors
- When adding new color tokens, add BOTH `:root` (dark) AND `[data-theme="light"]` variants
- Test visual appearance in both themes before considering work complete
- Never use hardcoded colors like `bg-slate-900` - use theme-aware variables

### 🔄 Modularization Rule

**Extract repeated patterns into reusable components:**

- If the same UI pattern is used **3+ times**, extract it into a component in `src/components/ui/`
- Examples: Input, Select, Alert, Card, Badge
- Reference the "Common UI Patterns" section in `/admin/design-system` for standard patterns
- When creating new shared components, add them to the Component Library in the design system page

### 📋 Artifact Changelog Rule

**All artifact documents (.md files in artifacts directory) MUST have a changelog at the end:**

```markdown
---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2025-12-24 | Launch Strategy | Added bootstrap/crowdfunding context |
| 2025-12-24 | Initial | Document created with research findings |
```

**Format requirements:**

- Place at the very end of the document after a horizontal rule
- Use table format: Date | Section | Change
- Most recent changes at top
- "Section" should name the heading/area modified
- "Change" should be a brief summary (one line)
- Use correct current date (check context!)

This ensures artifact history is traceable across AI sessions.

### 📁 Artifact Storage Rule (IMPORTANT)

**All AI-generated planning documents MUST be stored in the repository:**

```
docs/artifacts/
├── task.md                      # Current task checklist
├── implementation_plan.md       # Technical implementation plan
├── decisions_*.md               # Decision documents with rationale
└── [other planning docs]
```

**Rules:**

1. **Store in repo** - Artifacts go in `docs/artifacts/`, NOT the hidden `.gemini` folder
2. **Version controlled** - All planning docs should be committed to git
3. **Naming convention** - Use descriptive names: `decisions_[topic].md`, `plan_[feature].md`
4. **Copy to repo** - If you create artifacts elsewhere, copy them to `docs/artifacts/`

This ensures all planning documents are:

- Part of the repo history
- Easy to find for developers
- Reviewed in PRs
- Accessible across AI sessions

This ensures documentation stays current for future sessions and developers.

---

## 📊 Analytics & Tracking (MANDATORY)

> **Architecture:** All analytics runs through GTM dataLayer → GTM forwards to GA4, Hotjar, PostHog, etc.
> **No direct SDK integrations** = no frontend performance impact.

### Core Principle

**EVERY user interaction should be trackable.** When building new components:

1. Import the analytics utility
2. Add tracking calls for key user actions
3. Follow the naming conventions below

### How to Add Tracking

```typescript
import { analytics, trackInteraction, trackComponentView } from '@/lib/analytics';

// For conversions/key actions - use typed methods
analytics.signUp('google');
analytics.leagueCreated(leagueId, leagueName);
analytics.ai.verificationCompleted('approved', 0.95, 1200);

// For component interactions - use generic helpers
trackComponentView('LeaderboardCard', 'league_page');
trackInteraction('SubmitButton', 'click', 'submit_steps_btn');
```

### 🏷️ Event Naming Conventions (MANDATORY)

| Rule | Format | Examples |
|------|--------|----------|
| **Event names** | `snake_case`, lowercase | `sign_up`, `league_created`, `steps_submitted` |
| **Category** | Noun, lowercase | `conversion`, `engagement`, `ai`, `support`, `error` |
| **Action** | Verb, lowercase | `view`, `click`, `submit`, `complete`, `error` |
| **Component** | PascalCase (React component name) | `LeaderboardCard`, `KanbanBoard`, `FeedbackForm` |
| **Parameters** | `snake_case` | `league_id`, `step_count`, `error_type` |

### 🏷️ Data Attribute Conventions (for GTM auto-tracking)

When you need GTM to auto-track clicks without code:

```html
<!-- Format: data-track-[action]="[event_name]" -->
<button data-track-click="cta_get_started" data-track-location="hero">
  Get Started
</button>

<!-- For forms -->
<form data-track-submit="feedback_submitted" data-track-type="bug">
```

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `data-track-click` | Track click events | `data-track-click="cta_signup"` |
| `data-track-submit` | Track form submissions | `data-track-submit="feedback_submitted"` |
| `data-track-view` | Track element visibility | `data-track-view="pricing_section"` |
| `data-track-*` | Additional parameters | `data-track-location="header"` |

### Event Categories

| Category | When to Use | Example Events |
|----------|-------------|----------------|
| `conversion` | User completes key goal | `sign_up`, `league_created`, `steps_submitted` |
| `engagement` | User interacts meaningfully | `cta_clicked`, `page_view`, `roadmap_voted` |
| `navigation` | User moves between pages | `page_view`, `menu_opened` |
| `filter` | User filters/searches | `filter_applied`, `saved_view_loaded` |
| `ai` | AI features used | `ai_verification_completed`, `ai_chatbot_query` |
| `support` | Support/help interactions | `support_chat_opened`, `article_viewed` |
| `experiment` | A/B test tracking | `experiment_viewed`, `experiment_converted` |
| `performance` | Technical metrics | `page_performance`, `api_performance` |
| `error` | Errors occurred | `error_occurred` |

### Module-Specific Tracking

Each major module has its own namespace in `analytics`:

```typescript
// Leaderboard
analytics.leaderboard.viewed(leagueId, 'weekly');
analytics.leaderboard.periodChanged(leagueId, 'daily');

// Kanban
analytics.kanban.cardMoved(itemId, 'backlog', 'in_progress');
analytics.kanban.cardClicked(itemId, 'bug');

// Filters
analytics.filters.applied('status', 'in_progress', 'feedback_page');
analytics.filters.savedViewLoaded('Urgent Bugs');

// AI Features
analytics.ai.verificationStarted(imageSize, leagueId);
analytics.ai.verificationCompleted('approved', 0.95, 1200, leagueId);

// Support/Chat
analytics.support.chatOpened('widget');
analytics.support.messageSent('question');
```

### User Identity (CRITICAL for per-user analytics)

```typescript
import { identifyUser, clearUser } from '@/lib/analytics';

// After login/signup - enables per-user tracking across all tools
identifyUser(user.id, {
  email: user.email,
  created_at: user.created_at,
  // Add any traits useful for segmentation
});

// On logout
clearUser();
```

### Adding New Tracking

When adding a new trackable feature:

1. **Check if method exists** in `src/lib/analytics.ts`
2. **If not, add it** following the existing pattern
3. **Add to correct namespace** (create new namespace if needed)
4. **Follow naming conventions** above
5. **Document in this section** if it's a new category

### Files Reference

| File | Purpose |
|------|---------|
| `src/lib/analytics.ts` | All tracking methods live here |
| `src/components/analytics/GoogleTagManager.tsx` | GTM script with consent defaults |
| `src/components/analytics/CookieConsent.tsx` | Cookie consent banner (GDPR) |
| `.env.example` | Environment variables for GTM/GA4 IDs |

### Future Tools (add in GTM, no code changes needed)

- **Heatmaps:** Hotjar, FullStory, Microsoft Clarity
- **A/B Testing:** GrowthBook, PostHog, Optimizely
- **Session Recording:** LogRocket, Sentry
- **Support:** Intercom, Crisp, Zendesk
- **Product Analytics:** Amplitude, Mixpanel

> **Key insight:** Because everything goes through dataLayer, adding new tools is a GTM config change - no code deployment needed.

---

## Recent Features (2026-01-04)

- ✅ **League Settings System** (PRD 19)
  - League owners can set start date
  - Modular settings components pattern
  - Enforcement in submissions API
  
- ✅ **DateRangePicker Component**
  - Replaced dual date inputs
  - Standard pattern for all date selection
  - Location: `src/components/ui/DateRangePicker.tsx`
  
- ✅ **shadcn/ui Foundation**
  - Toast, Dialog, Dropdown components
  - Theme-aware CSS variables
  - Ready for integration (PRD 21)

---

## Related Files

| File | Purpose |
|------|---------|
| [README.md](./README.md) | Setup, deployment, overview for developers |
| [CHANGELOG.md](./CHANGELOG.md) | All changes by date (must update every commit) |
| [ROADMAP.md](./ROADMAP.md) | Upcoming features and planned work |
| [CLAUDE.md](./CLAUDE.md) | Claude-specific notes (references this file) |
| [.cursor/rules/](./cursor/rules/) | Cursor IDE rules |
| [docs/feedback-roadmap-system.md](./docs/feedback-roadmap-system.md) | **StepLeague System Docs** - Architecture & Component Reference |
| [globals.css](./src/app/globals.css) | Design tokens, CSS variables, utility classes |
| [analytics.ts](./src/lib/analytics.ts) | **Analytics tracking methods** - All event tracking lives here |
| [/admin/design-system](./src/app/admin/design-system/page.tsx) | **Live component examples** (superadmin only) - UPDATE when adding/changing components |
| **AI Artifacts Folder** | `docs/artifacts/` - All AI-generated planning docs, decisions, task lists (version controlled) |

---

*Last updated: 2026-01-04. This file is the canonical source for AI agents.*
