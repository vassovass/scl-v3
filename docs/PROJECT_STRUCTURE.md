# Project Structure

```
scl-v3/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # Sign-in, sign-up, reset-password, update-password
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
│       ├── menuConfig.ts         # Centralized menu configuration (WordPress-style)
│       ├── adminPages.ts         # SuperAdmin pages config
│       ├── supabase/             # Server/client Supabase clients
│       └── utils/                # Date utilities
├── supabase/migrations/          # SQL migrations (numbered YYYYMMDDHHMMSS_name.sql)
├── supabase/templates/           # Branded HTML email templates (deploy via Supabase Dashboard)
├── docs/                         # Reference documentation
├── .claude/rules/                # Path-scoped rules (loaded conditionally)
├── .claude/skills/               # On-demand skill prompts
├── AGENTS.md                     # Universal agent context
└── CLAUDE.md                     # Entry point, references AGENTS.md
```

## Route Groups

| Group | Layout | Purpose |
|-------|--------|---------|
| `(auth)` | Minimal | Authentication pages, no nav |
| `(dashboard)` | Full nav + footer | All protected user-facing pages |
| `api/` | None | REST API endpoints |

## Key Lib Files

| File | Purpose |
|------|---------|
| `lib/api.ts` | Response helpers: `json()`, `badRequest()`, `unauthorized()` |
| `lib/menuConfig.ts` | WordPress-style nav config with role-based visibility |
| `lib/adminPages.ts` | SuperAdmin page registry |
| `lib/supabase/` | Server and client Supabase client factories |
| `lib/errors.ts` | AppError system with typed error codes |
| `lib/cache.ts` | Server-side caching with `CacheRegistry` tags |
| `lib/analytics.ts` | GTM dataLayer tracking functions |
