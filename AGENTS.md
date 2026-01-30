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

## 🧠 Agent Skills

**Skills provide specialized knowledge for AI agents.** Located in `.agent/skills/`, each skill contains focused instructions for specific domains.

> **When a skill is relevant to your task, read its `SKILL.md` before proceeding.**
> **New skills require user approval** — see `skill-creation` skill for workflow.

| Skill | When to Use |
|-------|-------------|
| [`architecture-philosophy`](.agent/skills/architecture-philosophy/SKILL.md) | Designing new features, refactoring, architectural decisions |
| [`prd-creation`](.agent/skills/prd-creation/SKILL.md) | Writing PRDs, defining requirements (outcome-based) |
| [`api-handler`](.agent/skills/api-handler/SKILL.md) | Creating or modifying API routes |
| [`supabase-patterns`](.agent/skills/supabase-patterns/SKILL.md) | Database queries, MCP server usage *(see auth-patterns for auth)* |
| [`error-handling`](.agent/skills/error-handling/SKILL.md) | Implementing error handling, AppError usage |
| [`design-system`](.agent/skills/design-system/SKILL.md) | Colors, themes, **light/dark mode**, CSS variables, UI styling |
| [`form-components`](.agent/skills/form-components/SKILL.md) | Creating forms, input fields, accessibility |
| [`project-updates`](.agent/skills/project-updates/SKILL.md) | Updating roadmap, changelog, kanban after completion |
| [`skill-creation`](.agent/skills/skill-creation/SKILL.md) | Creating new skills, skill approval workflow |
| [`react-debugging`](.agent/skills/react-debugging/SKILL.md) | **NEW** Infinite loops, useMemo/useCallback, dependency arrays |
| [`typescript-debugging`](.agent/skills/typescript-debugging/SKILL.md) | **NEW** Build errors, tsc failures, type issues |
| [`testing-patterns`](.agent/skills/testing-patterns/SKILL.md) | **NEW** Adding tests, mocking Supabase, TDD |
| [`auth-patterns`](.agent/skills/auth-patterns/SKILL.md) | **NEW** getUser vs getSession, deadlocks, sessions |
| [`middleware-patterns`](.agent/skills/middleware-patterns/SKILL.md) | **NEW** Protected routes, auth redirects, URL handling |
| [`analytics-tracking`](.agent/skills/analytics-tracking/SKILL.md) | **NEW** Event tracking (GA4+PostHog), adding events, GTM config |
| [`social-sharing`](.agent/skills/social-sharing/SKILL.md) | Sharing features, OG images, WhatsApp, **multi-select message builder** (PRD-57) |

### Key Principles (from `architecture-philosophy`)

1. **Modular over monolithic** - Build systems, not one-off solutions
2. **Future-thinking** - Use settings over hardcoding
3. **Defensive programming** - Use AppError, graceful degradation
4. **Maintenance reduction** - Use shadcn/ui, central configuration
5. **Outcome-based PRDs** - Define WHAT to achieve, not HOW

---

## 🤝 Skills & MCPs: The Workflow

**Skills and MCPs work together.**

- **Skills** provide the **instructions and patterns** (the "how-to").
- **MCP Servers** provide the **tools and access** (the "capabilities").

**Example Workflow:**
1. **Read Skill**: You read `analytics-tracking` skill to know *how* to name an event and *where* to place the code.
2. **Use MCP**: You use the **GTM MCP** to actually create the tag in Google Tag Manager.

> **Always check `SKILL.md` files for instructions on which MCP tools to use for a specific task.**

---

## 🔌 MCP Servers (AI Tool Integrations)

**MCP servers extend AI agent capabilities** for analytics, tracking, and product management.

> **See `analytics-tracking` skill for detailed usage instructions.**

| Server | Access | Quick Reference | Use Cases |
|--------|--------|-----------------|-----------|
| **GTM MCP** | ✅ Write | Account: `6331302038` | Create/edit tags, triggers, variables, publish versions |
| **GA4 MCP** | 📊 Read | Property: `517956149` | Query reports, sessions, page views, realtime data |
| **PostHog MCP** | ✅ Full | API key in `.vscode/mcp.json` | Feature flags, experiments, insights, event analytics |
| **Perplexity MCP** | 📊 Read | N/A | Web search, research queries |

### Quick Commands

```
# GTM: List containers
"List my GTM containers"

# GA4: Get summaries
"Get my GA4 account summaries"

# PostHog: Feature flags
"Get all feature flags in the project"
```

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
4.  **PWA Features**:
    - **Install Prompt**: Use `InstallPrompt` (via `usePWA`) in Nav/Menu. Mobile-first (iOS instructions vs Android prompt).
    - **Service Worker**: `@ducanh2912/next-pwa` handles App Shell caching. Do not manually register SW.

---

### 7. Architecture Patterns (IMPORTANT)

**Follow these established patterns to avoid tech debt:**

#### 7.1 Step Submissions are League-Agnostic

Steps are submitted ONCE and apply to ALL leagues. Do NOT create league-specific submit pages.

```typescript
// ✅ CORRECT: Link to global submit page
<Link href="/submit-steps">Submit Steps</Link>

// ❌ WRONG: League-specific submit page
<Link href={`/league/${id}/submit`}>Submit Steps</Link>
```

**Why?** Steps are counted against the user, not the league. Same steps count in every league.

#### 7.2 Badge Components

Two distinct Badge components exist:

| Component | Import | Use Case |
|-----------|--------|----------|
| `Badge` (shadcn) | `@/components/ui/badge` | General UI badges with `variant` prop (default, secondary, destructive, outline) |
| `SystemBadge` | `@/components/ui/SystemBadge` | Category-based badges for Roadmap/Kanban (`category` + `value` props) |

```typescript
// General UI badge
import { Badge } from "@/components/ui/badge";
<Badge variant="outline">Label</Badge>

// System category badge
import { SystemBadge } from "@/components/ui/SystemBadge";
<SystemBadge category="type" value="bug" size="sm" />
```

#### 7.3 menuConfig for Navigation

All navigation should use the WordPress-style `menuConfig.ts`:

```typescript
import { MENUS, prepareMenuItems, UserRole } from "@/lib/menuConfig";

// Get role-filtered items with [id] resolved
const items = prepareMenuItems(MENUS.league_nav.items, userRole, leagueId);
```

**Available menus:** `main`, `help`, `user`, `admin`, `public`, `league_nav`, `footerNavigation`, `footerAccount`, `footerLegal`

#### 7.4 Redirect Pattern for Flexible Defaults

Use redirects for pages that may change their default over time:

```typescript
// /league/[id]/page.tsx
import { redirect } from "next/navigation";

export default function LeaguePage({ params }: { params: { id: string } }) {
  redirect(`/league/${params.id}/overview`);  // Easy to change later
}
```

#### 7.5 "Act As" Proxy Pattern (PRD 41)

The "Act As" system allows managers to create and manage **proxy users** (ghost profiles) and submit steps on their behalf.

**Key Concept:** A Proxy is just a `users` row where `managed_by IS NOT NULL`.

```typescript
// Check if current context is proxy
const { isActingAsProxy, activeProfile, switchProfile } = useAuth();

// Switch to proxy context
await switchProfile(proxyUserId);  // Now all submissions use proxyUserId

// Switch back to self
await switchProfile(null);  // Back to real user
```

**Reference Files for "Act As" Implementation:**

| File | Purpose |
|------|---------|
| `src/components/providers/AuthProvider.tsx` | Core `switchProfile()` and `activeProfile` state |
| `src/components/auth/ProfileSwitcher.tsx` | UI dropdown for switching contexts |
| `src/lib/api/handler.ts` | Extract `acting_as_id` from requests |
| `supabase/migrations/*_proxy_*.sql` | RLS policies for proxy visibility |

**Database Model:**

```sql
-- Proxy is a user with managed_by set
users WHERE managed_by IS NOT NULL  -- These are proxies

-- Query manager's proxies
SELECT * FROM users WHERE managed_by = :manager_id AND deleted_at IS NULL;
```

**Visibility Rules:**

- Proxies are ONLY visible to their `managed_by` manager
- SuperAdmins can see all proxies
- RLS enforces this at database level

#### 7.6 Server-Side Caching (SSR Performance)

Use `serverCache.ts` for SSR metadata and expensive DB calls to prevent timeouts (e.g., GTmetrix bots) and improve TTFB:

```typescript
import { createCachedFetcher, invalidateCache } from '@/lib/cache/serverCache';

// 1. Define cached fetcher with fallback and timeout
export const getCachedBranding = createCachedFetcher({
  tag: 'branding',
  fetcher: async () => { /* Expensive DB call */ },
  fallback: DEFAULT_BRANDING,
  timeoutMs: 3000, // Important for bot timeouts
});

// 2. Invalidate on admin update (API routes)
invalidateCache('branding');
```

**When to use:**
- `generateMetadata()` implementations
- Root layout data fetching (menus, settings)
- Expensive singleton DB calls that rarely change

**Adding new cache types:**
1. Add tag to `CacheTag` type in `src/lib/cache/serverCache.ts`
2. Implement fetcher using `createCachedFetcher`
3. Add invalidation hooks in relevant Admin Modification API routes

#### 7.7 Auth Recovery System

Users can get stuck on loading screens due to stale service worker cache or corrupted session state. The app includes an automatic recovery system:

**Components:**

| File | Purpose |
|------|---------|
| `/reset` page | Nuclear reset - clears all local state (SW, caches, storage, cookies) |
| `LoadingWatchdog` | Auto-detects stuck auth loading, shows toast after 15s |
| `clearAppState.ts` | Utility functions for clearing browser state |

**How it works:**

1. `LoadingWatchdog` (in root layout) monitors `AuthProvider.loading` state
2. If loading exceeds 15 seconds, shows shadcn toast with "Reset App" action
3. User can click to navigate to `/reset` which clears everything
4. Sign-out flow also calls `clearAllAppState()` to prevent stale state

**Service Worker Config:**

Auth routes use `NetworkOnly` strategy in `next.config.js`:
- `/sign-in`, `/sign-up`, `/reset`, `/api/auth/`, `/claim/`

**Usage:**

```typescript
// In sign-out flow (already integrated in AuthProvider)
import { clearAllAppState } from "@/lib/utils/clearAppState";
await clearAllAppState(); // Clears SW caches, browser caches, localStorage, cookies
```


### 8. Supabase Auth Deadlocks & Client-Side Hanging (CRITICAL)

**CRITICAL ISSUE:** The Supabase client SDK (`@supabase/supabase-js`) uses the Web Locks API for session synchronization. This can cause the client to **hang indefinitely** (deadlock) if a lock is held by a stale process or zombie callback.

**Symptoms:**
- `supabase.auth.getSession()` never returns (await hangs forever).
- `supabase.auth.getUser()` hangs.
- `supabase.from(...).select(...)` hangs if it tries to refresh a token.

**MANDATORY Fix Patterns:**

1.  **NEVER use `getSession()` for initial auth checks**:
    - The `INITIAL_SESSION` event in `onAuthStateChange` is the primary source of truth.
    - If you need a fallback, **DO NOT call `getSession()`**.
    - Instead, **parse the `sb-*-auth-token` cookie directly** from `document.cookie`.

2.  **Fallback Safe Pattern**:
    - If `onAuthStateChange` doesn't fire, read the cookie manually.
    - Use a **stateless, temporary client** to fetch initial data (e.g., user profile).
    - **DO NOT** use the singleton `supabase` client for recovery fetches, as it shares the deadlocked lock.

    ```typescript
    // ✅ CORRECT: Safe fallback pattern
    import { createClient as createArgsClient } from "@supabase/supabase-js";

    const tempClient = createArgsClient(url, key, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false } // No locks!
    });
    const { data } = await tempClient.from("users").select("*").single();
    ```

3.  **Always Validate Expiry**:
    - When parsing cookies manually, check `expires_at` vs `Date.now() / 1000`.
    - Do not restore expired sessions.



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
| `users` | id, display_name, `nickname`, units, is_superadmin, **`managed_by`** (proxy FK), **`is_proxy`**, **`invite_code`** |
| `leagues` | id, name, invite_code, owner_id, `deleted_at` (soft delete) |
| `memberships` | league_id, user_id, role |
| `submissions` | league_id, user_id, for_date, steps, verified, `flagged` |
| `feedback` | type, subject, description, screenshot_url, board_status, is_public |
| `module_feedback` | module_id, feedback_type, comment, screenshot_url |
| `user_records` | user_id, best_day_steps, best_day_date, current_streak, total_steps_lifetime |
| `app_settings` | key, value (jsonb), category, value_type, visible_to, editable_by |
| `menu_definitions` | id, label, description (PRD 24) |
| `menu_items` | id, menu_id, parent_id, item_key, label, href, icon, visible_to, requires_league, on_click, sort_order (PRD 24) |
| `menu_locations` | location, menu_ids[], show_logo, show_sign_in, show_user_menu, show_admin_menu (PRD 24) |

### Proxy User Model (PRD 41)

A "proxy" is simply a `users` row where `managed_by IS NOT NULL`:

```sql
-- Real user: managed_by = NULL, is_proxy = false
-- Proxy user: managed_by = manager_id, is_proxy = true
-- Claimed proxy: managed_by = NULL, is_proxy = false (converted to real user)
```

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
- ✅ Tour analytics dashboard (completion funnel + feedback insights)
- ✅ Footer with legal links
- ✅ Internal Kanban board (`/admin/kanban`)
- ✅ Public roadmap with voting (`/roadmap`)

---

## Theme, Styling & Branding

> ⚠️ **MUST READ: [Theme System Documentation](./docs/THEME_SYSTEM.md)**
>
> **All AI agents working with colors, styling, or UI MUST read the theme documentation first.**
> It contains comprehensive guidelines on:
> - CSS variable usage and semantic color system
> - Light/dark mode implementation patterns
> - Badge configuration and component patterns
> - Text overflow prevention patterns
> - Accessibility requirements (WCAG 2.1 AA)
> - Common pitfalls and solutions
>
> **Quick Rules:**
> - ❌ NEVER use hardcoded Tailwind colors (`bg-slate-900`, `text-sky-400`)
> - ✅ ALWAYS use semantic CSS variables (`bg-card`, `text-foreground`, `text-[hsl(var(--success))]`)
> - ✅ Test in BOTH light and dark modes before considering work complete
> - ✅ Ensure 4.5:1 minimum contrast ratio for all text

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

| Category | CSS Variables | Usage |
|----------|---------------|-------|
| **Primary** | `--primary`, `--primary-foreground` | Brand color (sky blue), buttons |
| **Backgrounds** | `--background`, `--card`, `--muted` | Page/card backgrounds |
| **Text** | `--foreground`, `--muted-foreground` | Primary/secondary text |
| **Status** | `--success`, `--warning`, `--info`, `--destructive` | Success/error states |
| **Interactive** | `--border`, `--input`, `--ring` | Borders, inputs, focus states |

### Utility Classes (from `globals.css`)

- `.btn-primary`, `.btn-ghost` - Buttons
- `.glass-card`, `.card-glow` - Card styles
- `.text-gradient`, `.glow-text` - Text effects
- `.bg-gradient-mesh`, `.bg-gradient-primary` - Backgrounds
- `.animate-float`, `.animate-pulse-glow` - Animations
- `.section-container`, `.stat-badge`, `.feature-icon` - Layout helpers

### Theme System

- **Framework**: `next-themes` for client-side management
- **Storage**: localStorage + `user_preferences` table (database-backed)
- **Attribute**: `data-theme="light"` (NOT class-based)
- **Variants**: Dark (default), Light, System (follows OS preference)
- **Future**: SuperAdmin-configurable custom theme variants

**Implementation:**
- Default: Dark theme (`:root` variables)
- Light theme: `[data-theme="light"]` selector overrides
- All theme-aware colors use CSS variables, no hardcoded values
- When adding new colors, add BOTH `:root` and `[data-theme="light"]` variants

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

## Tour System Architecture

### Universal Tour State Management

The tour system uses a centralized state management approach in `TourProvider.tsx` that ensures reliable, consistent behavior across all tours.

#### Key Features

**1. Tour Completion is Immediate**
- Tours complete the moment the last step is finished
- Feedback dialog is shown via effect AFTER state settles
- `isRunning` becomes `false` immediately on completion
- Users can start new tours even if feedback dialog is still open

**2. User-Friendly Tour Switching**
- Attempting to start a tour while another is running shows a confirmation dialog
- User chooses: "Switch to [new tour]" or "Continue Current Tour"
- No silent failures - clear user communication
- Works automatically for any tour combination

**3. Universal Application**
- All fixes apply to ALL tours automatically (no tour-specific code)
- Future tours added to registry inherit these behaviors
- Zero maintenance required when adding new tours

#### Implementation Details

**Race Condition Fix:**
```typescript
// Feedback dialog shown via effect (not synchronously)
useEffect(() => {
    if (lastCompletedTourId && !isRunning && !activeTour && !showFeedbackDialog) {
        setShowFeedbackDialog(true);
    }
}, [lastCompletedTourId, isRunning, activeTour, showFeedbackDialog]);
```

**Tour Switch Confirmation:**
```typescript
// Universal confirmation logic in hash handler
if (isRunning && activeTour) {
    setPendingTourSwitch({
        fromTourId: activeTour.id,
        fromTourName: t(activeTour.nameKey),
        toTourId: tour.id,
        toTourName: t(tour.nameKey)
    });
    return; // Shows confirmation dialog
}
```

#### Important Notes

- Feedback is NEVER part of the tour itself (for any tour)
- Tour switching uses i18n-translated tour names automatically
- All state management is in TourProvider.tsx only
- No changes to individual tour definitions or pages

### Submission Methods Priority

**Batch Upload**: Primary submission method (most important)
- Users can upload multiple days of step data at once using AI extraction from screenshots
- Main workflow for regular usage
- Tour content prioritizes this method

**Single Entry**: Legacy method (being deprecated)
- Individual day submission
- May be removed in future versions

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

## Reusable Form Components (MANDATORY)

> **⚠️ MUST READ: [Form System Documentation](./docs/FORM_SYSTEM.md)**
>
> **ALWAYS use `FormInput`, `FormSelect`, `FormCheckbox`, `FormTextarea`, `FormFileInput`** from `@/components/ui/form-fields` instead of raw HTML form elements.
>
> These components auto-generate `id`/`name` attributes and include accessibility features (aria-describedby, aria-invalid).
>
> **Quick Example:**
> ```tsx
> import { FormInput, FormSelect } from "@/components/ui/form-fields";
> 
> <FormInput fieldName="user-email" label="Email" type="email" required />
> <FormSelect fieldName="league" label="Select League">...</FormSelect>
> ```

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
# Development
npm run dev      # Local development server (http://localhost:3000)
npm run build    # Production build
npx tsc --noEmit # Type check

# Testing (see testing-patterns skill)
npm run test              # Vitest unit/integration
npm run test:e2e          # Playwright E2E (headless)
npm run test:e2e:headed   # Playwright with visible browser
```

---

## Development & Deployment

### Local Development

Local development is fully supported. To run locally:

1. **Create `.env.local`** from `.env.example`:
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in your credentials** in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` - From Supabase Dashboard → Settings → API
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - From Supabase Dashboard → Settings → API
   - `SUPABASE_SERVICE_ROLE_KEY` - From Supabase Dashboard → Settings → API
   - `GEMINI_API_KEY` - From [AI Studio](https://aistudio.google.com/app/apikey)

3. **Configure Supabase Auth** for localhost:
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add `http://localhost:3000` to **Site URL** or Redirect URLs
   - Add `http://localhost:3000/**` to **Redirect URLs**
   - For Google OAuth: Add `http://localhost:3000/api/auth/callback` in Google Cloud Console

4. **Start the dev server**:
   ```bash
   npm run dev
   ```

5. **Open** http://localhost:3000

### Production Deployment (Vercel)

- **Live URL**: https://scl-v3.vercel.app/
- **Deployment**: Auto-deploy from `main` branch
- **Environment**: All env vars configured in Vercel dashboard

### Making Changes

1. **Local testing**: Run `npm run dev` and test at http://localhost:3000
2. **Production**: Push to main: `git push origin main`
3. Vercel auto-builds and deploys (2-3 minutes)
4. Verify at https://scl-v3.vercel.app/

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

### 8. Performance & Caching Rules (NEW)
 
> **Refer to [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full technical guide.**
 
#### 8.1 Server vs Client Fetching
 
*   **Data Reading**: Use **Server Components** + `serverCache` wrapper.
    *   ❌ `useFetch('/api/data')` in Client Component (Waterfall risk)
    *   ✅ `await getData()` in Server Component (Instant HTML)
*   **Interactive/Live Data**: Use Client Components.
 
#### 8.2 Safe Script Loading
*   **Rule:** NEVER import heavy widgets (Feedback, Chat, Analytics) directly.
*   **Pattern:** Use `SafeLazy` wrapper.
*   **Offline:** Check `navigator.onLine` before loading non-essential scripts.
 
#### 8.3 The Registry Rule
*   **Rule:** Do not invent cache tags inline.
*   **Correct:** `tags: [CacheRegistry.BRANDING]`
*   **Incorrect:** `tags: ['branding']`
 
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

// Proxy Events (added Jan 2026)
analytics.proxyClaimed(proxyId, submissionCount, leagueCount);

// Engagement
analytics.highFiveSent(recipientId, isToggleOn);
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

## Recent Features

### 2026-01-16

- ✅ **Agent Skills Expansion** (5 NEW debugging/pattern skills)
  - `react-debugging` - Infinite loops, useMemo/useCallback, dependency arrays
  - `typescript-debugging` - Build errors, tsc failures, type issues
  - `testing-patterns` - Adding tests, mocking Supabase, TDD workflows
  - `auth-patterns` - getUser vs getSession, deadlock prevention, Web Locks
  - `middleware-patterns` - Protected routes, auth redirects, URL handling

- ✅ **PostHog SDK Integration**
  - Dual-tracking architecture: GA4 via GTM + PostHog SDK
  - `PostHogProvider` component with consent awareness
  - All events automatically sent to both systems
  - Feature flags, session replay, and A/B testing ready

- ✅ **Comprehensive Test Suite**
  - Vitest + React Testing Library setup
  - 276+ tests covering auth, proxy claims, API handlers, analytics
  - Mock factories in `src/__mocks__/supabase.ts`
  - 70% coverage threshold enforced

### 2026-01-10

- ✅ **SuperAdmin Settings & Feature Flags** (PRD 26 - Complete)
  - TypeScript settings registry with type-safe keys and categories
  - Full settings management: Limits, Features, Defaults, Display, General
  - Feature flags: `useFeatureFlag()` hook for gating features
  - Visibility controls: Configure who can see/edit each setting
  - Cascade to League Settings: `InheritedAppSettings` component
  - Environment presets: Development, Staging, Production profiles
  - Audit logging for all settings changes
  - Admin UI: Category tabs, setting editors, visibility controls, presets manager

### 2026-01-07

- ✅ **Development Stage System** (PRD 26 - Partial, now complete)
  - SuperAdmin-configurable development stage (Pre-Alpha, Alpha, Beta, Product Hunt, Production)
  - Dynamic stage badge in footer with color-coding and pulse animation
  - Public stage info page at `/stage-info` with database-driven content
  - `useAppSettings()` hook for reading/updating app-wide settings
  - SuperAdmin settings page at `/admin/settings`

- ✅ **User Preferences System** (PRD 25)
  - Modular settings architecture for user/league/admin contexts
  - Type-safe registry pattern following Slash Engineering best practices
  - Reusable settings components (SettingsLayout, SettingsSection, etc.)
  - `usePreferences()` hook with optimistic updates
  - User settings at `/settings/profile` and `/settings/preferences`
  - Default/override pattern for efficient storage

- ✅ **Menu Backend System** (PRD 24)
  - Database-backed menu configuration
  - Visual menu editor at `/admin/menus`
  - Drag-and-drop reordering with @dnd-kit
  - `useMenuConfig()` hook with static fallback
  - Full CRUD API routes for menu management
  - Pattern: Database-first with menuConfig.ts fallback

### 2026-01-04

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
| [**THEME_SYSTEM.md**](./docs/THEME_SYSTEM.md) | **⚠️ MUST READ** - Theme, color, and styling guidelines for all UI work |
| [docs/feedback-roadmap-system.md](./docs/feedback-roadmap-system.md) | **StepLeague System Docs** - Architecture & Component Reference |
| [globals.css](./src/app/globals.css) | Design tokens, CSS variables, utility classes |
| [badges.ts](./src/lib/badges.ts) | Central badge color configuration |
| [analytics.ts](./src/lib/analytics.ts) | **Analytics tracking methods** - All event tracking lives here |
| [/admin/design-system](./src/app/admin/design-system/page.tsx) | **Live component examples** (superadmin only) - UPDATE when adding/changing components |
| **AI Artifacts Folder** | `docs/artifacts/` - All AI-generated planning docs, decisions, task lists (version controlled) |

---

*Last updated: 2026-01-13. This file is the canonical source for AI agents.*
