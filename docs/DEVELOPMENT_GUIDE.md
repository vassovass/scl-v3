---
## Document Context
**What**: Developer setup guide with CLI commands, local environment configuration, production URLs, common error fixes, and coding conventions
**Why**: Onboarding reference for local dev setup and quick troubleshooting of common build/auth issues
**Status**: Current
**Last verified**: 2026-03-29
**Agent note**: This summary should be sufficient to assess relevance. Only read further if this document matches your current task.
---

# Development Guide

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npx tsc --noEmit` | Type-check without emitting |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run E2E tests (headless) |
| `npm run test:e2e:headed` | Run E2E tests (browser visible) |

## Local Dev Setup

1. Create `.env.local` in project root
2. Fill in credentials:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
3. Configure Supabase Auth for `localhost:3000` (Site URL + redirect URLs)
4. `npm run dev`
5. Open `http://localhost:3000`

## Production

- **Live URL**: https://scl-v3.vercel.app/
- **Deployment**: Auto-deploy from `main` branch via Vercel

## Common Issues

| Error | Fix |
|-------|-----|
| `Parameter implicitly has 'any' type` | Add `CookieOptions[]` type annotation |
| `useSearchParams should be wrapped in Suspense` | Wrap component in `<Suspense>` boundary |
| `Property 'id' does not exist on type 'never'` | Remove `<Database>` generic from Supabase client |
| Auth redirects not working | Update Site URL in Supabase Dashboard settings |

## Date Awareness

- Always use the actual current date (never placeholder dates)
- Use 2025+ dates in all contexts
- Migration naming: `YYYYMMDDHHMMSS_name.sql`

## DO NOT List

- **No `<Database>` generics** — always use untyped Supabase client
- **No placeholder images** — use real assets or CSS-only
- **No trademarked products** in mock data
- **Always mobile-first** — base styles = mobile, then `md:`, `lg:`
- **Use `adminClient`** in API routes, not RLS-scoped client
