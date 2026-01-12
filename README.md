# StepLeague v3

> A step-tracking competition platform where friends form leagues and compete weekly.

## TL;DR

**For developers**: Clone → `npm install` → copy `.env.example` to `.env.local` → `npm run dev`

**For AI assistants**: Read **[AGENTS.md](./AGENTS.md)** for coding patterns and context.

**For upcoming features**: See **[ROADMAP.md](./ROADMAP.md)**.

---

## Version History

| Version | Stack | Status | Notes |
|---------|-------|--------|-------|
| **v1** | React + Firebase | Deprecated | Original prototype |
| **v2** | Next.js + Supabase + Cloudflare | Deprecated | Used as scaffold for v3, no longer active |
| **v3** | Next.js 14 + Supabase + Vercel | **Production** | This repo - current live version |

**v3 is the only production version** - hosted on Vercel with Supabase backend (database, Edge Functions, storage).

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/vassovass/scl-v3.git
cd scl-v3
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GEMINI_API_KEY=your-gemini-key
```

### 3. Run Locally

```bash
npm run dev
```

Open http://localhost:3000

> **Note**: For OAuth login to work locally, configure Supabase Auth redirect URLs (see [AGENTS.md](./AGENTS.md#local-development)).

### 4. Production

**Production URL**: [https://scl-v3.vercel.app/](https://scl-v3.vercel.app/)

The app is deployed on Vercel with auto-deploy from main branch.

---

## Deploy to Vercel

1. **Push to GitHub**: `git push origin main`
2. **Import to Vercel**: [vercel.com](https://vercel.com) → Add New → Project
3. **Add environment variables** (same as `.env.local`)
4. **Configure Supabase Auth**:
   - Dashboard → Authentication → URL Configuration
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/**`

---

## Project Structure

```
scl-v3/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Sign-in, sign-up
│   │   ├── (dashboard)/        # Protected routes
│   │   └── api/                # API routes
│   ├── components/
│   │   ├── analytics/          # CalendarHeatmap, DailyBreakdownTable
│   │   ├── forms/              # SubmissionForm, BatchSubmissionForm
│   │   ├── layout/             # GlobalFooter
│   │   ├── navigation/         # NavHeader (mobile hamburger)
│   │   └── ui/                 # Reusable components
│   └── lib/                    # Utilities, Supabase clients, adminPages.ts (admin nav config)
├── supabase/migrations/        # Database migrations
├── AGENTS.md                   # AI assistant context (universal)
├── CLAUDE.md                   # Claude-specific (references AGENTS.md)
├── ROADMAP.md                  # Upcoming features
└── README.md                   # This file
```

---

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Framework | Next.js 14 (App Router) | NOT v15 (avoids breaking changes) |
| Database | Supabase (PostgreSQL) | With RLS policies |
| Auth | Supabase Auth | Email/password |
| Styling | Tailwind CSS + CSS Variables | Mobile-first, dark theme (light mode ready via `data-theme`) |
| Design System | `globals.css` | CSS custom properties for theming, see `/admin/design-system` |
| AI Verification | Gemini 2.5 Flash | Via Supabase Edge Function |
| Deployment | Vercel | Auto-deploy from main |

---

## Current Features

- ✅ League creation/joining with invite codes
- ✅ Single + batch step submission with AI verification
- ✅ Leaderboard with filters (period, verified, custom dates)
- ✅ Analytics dashboard (calendar heatmap, daily breakdown)
- ✅ User nicknames and profile settings
- ✅ Module feedback system
- ✅ Social sharing (Web Share API)
- ✅ Mobile-responsive navigation
- ✅ Guided onboarding tours
- ✅ Footer with legal links
- ✅ SuperAdmin theme mode controls (default and allowed modes)

See **[ROADMAP.md](./ROADMAP.md)** for upcoming features.

---

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npx tsc --noEmit` | Type check |
| `npm run lint` | Run ESLint |

---

## Documentation

| File | Purpose |
|------|---------|
| **[README.md](./README.md)** | This file - setup, deployment, overview |
| **[AGENTS.md](./AGENTS.md)** | AI assistant context (coding patterns, architecture) |
| **[CHANGELOG.md](./CHANGELOG.md)** | All changes by date |
| **[ROADMAP.md](./ROADMAP.md)** | Upcoming features and enhancements |
| **[ System Docs](./docs/feedback-roadmap-system.md)** | **Architecture & API Reference** |
| **[CLAUDE.md](./CLAUDE.md)** | Claude-specific notes (references AGENTS.md) |

> **Tip**: Copy `README.md` + `AGENTS.md` into any LLM chat for instant project context.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Auth redirects to production (localhost) | Add `http://localhost:3000` to Supabase Auth → URL Configuration |
| Auth redirects incorrectly (production) | Update Site URL in Supabase Auth settings to `https://scl-v3.vercel.app` |
| `useSearchParams` error | Wrap component in `<Suspense>` |
| Type errors with Supabase | Use untyped client (see AGENTS.md) |
| Build fails | Run `npx tsc --noEmit` locally first |

---

## Contributing

1. Read **[AGENTS.md](./AGENTS.md)** for coding standards
2. Use mobile-first Tailwind (base = mobile, add `md:`, `lg:`)
3. Run `npx tsc --noEmit` before pushing
4. Conventional commits: `feat:`, `fix:`, `docs:`
