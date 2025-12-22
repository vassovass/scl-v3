# AGENTS.md - Universal AI Agent Context

> **Universal context file for AI coding assistants**
> Supported: Cursor, Claude Code, GitHub Copilot, OpenAI Codex, Google Jules, JetBrains AI, Windsurf, Aider

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
Always use `adminClient` for database operations (bypasses RLS):
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
│   │   ├── navigation/           # NavHeader (with mobile hamburger)
│   │   ├── providers/            # AuthProvider
│   │   └── ui/                   # DatePicker, ShareButton, ModuleFeedback
│   └── lib/
│       ├── api.ts                # json(), badRequest(), unauthorized(), etc.
│       ├── adminPages.ts         # SuperAdmin pages config (auto-populates nav menu)
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
- ✅ Module feedback system (floating 💬 icon)
- ✅ Social sharing (Web Share API + WhatsApp/Twitter)
- ✅ Mobile-responsive navigation (hamburger menu)
- ✅ Footer with legal links

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

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| `Parameter implicitly has 'any' type` | Add `CookieOptions[]` type to setAll |
| `useSearchParams should be wrapped in Suspense` | Wrap in `<Suspense>` |
| `Property 'id' does not exist on type 'never'` | Remove `<Database>` generic |
| Auth redirects incorrectly | Update Site URL in Supabase Dashboard to `https://scl-v3.vercel.app` |

---

## Commands

**Live URL**: [https://scl-v3.vercel.app/](https://scl-v3.vercel.app/) (auto-deploys from main)

```bash
npm run build    # Production build
npx tsc --noEmit # Type check
```

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

This ensures documentation stays current for future sessions and developers.

---

## Related Files

| File | Purpose |
|------|---------|
| [README.md](./README.md) | Setup, deployment, overview for developers |
| [CHANGELOG.md](./CHANGELOG.md) | All changes by date (must update every commit) |
| [ROADMAP.md](./ROADMAP.md) | Upcoming features and planned work |
| [CLAUDE.md](./CLAUDE.md) | Claude-specific notes (references this file) |
| [.cursor/rules/](./cursor/rules/) | Cursor IDE rules |
| [globals.css](./src/app/globals.css) | Design tokens, CSS variables, utility classes |
| [/admin/design-system](./src/app/admin/design-system/page.tsx) | **Live component examples** (superadmin only) - UPDATE when adding/changing components |

---

*Last updated: 2025-12-23. This file is the canonical source for AI agents.*

