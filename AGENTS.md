# AGENTS.md - Universal AI Agent Context

> **Universal context file for AI coding assistants**
> Supported: Cursor, Claude Code, GitHub Copilot, OpenAI Codex, Google Jules, JetBrains AI, Windsurf, Aider

---

## Project Overview

**Step Counter League (SCL)** - A competitive step counting web app where users form leagues and compete weekly.

- **Framework**: Next.js 14 (App Router, NOT v15)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS (mobile-first)
- **Database**: Supabase (PostgreSQL + RLS)
- **AI Verification**: Gemini 2.5 Flash (via Supabase Edge Functions)
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

## Theme & Styling

- **Dark theme**: `bg-slate-950`, `text-slate-100`, `border-slate-800`
- **Primary**: `sky-500/600`
- **Success**: `emerald-500`
- **Error**: `rose-500`

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| `Parameter implicitly has 'any' type` | Add `CookieOptions[]` type to setAll |
| `useSearchParams should be wrapped in Suspense` | Wrap in `<Suspense>` |
| `Property 'id' does not exist on type 'never'` | Remove `<Database>` generic |
| Auth redirects to localhost | Update Site URL in Supabase Dashboard |

---

## Commands

```bash
npm run dev      # Dev server (localhost:3000)
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

*This file is the canonical source. Platform-specific files (CLAUDE.md, .cursor/rules) reference this.*
