---
## Document Context
**What**: Shared context document for PRDs 70-80 (Sprints E, F, G) — the revenue and launch strategy.
**Why**: Each PRD runs in its own Claude Code session without shared context. This document provides the common knowledge every implementing agent needs so they don't have to read all 11 PRDs.
**Status**: Current
**Last verified**: 2026-03-29
**Agent note**: READ THIS FIRST if you're implementing any PRD in the 70-80 range. It contains decisions, constraints, and cross-PRD context you won't find elsewhere.
---

# Sprint E/F/G Shared Context

> **Purpose**: Common context for agents implementing PRDs 70-80.
> **Read this before starting any PRD in this range.**

---

## Project State (as of 2026-03-29)

- **Stage**: Pre-alpha (not yet usable by real users daily)
- **Tech stack**: Next.js 14, TypeScript, Supabase (untyped — NEVER use `<Database>` generics), Tailwind CSS, shadcn/ui
- **Deployment**: Vercel (London region `lhr1` for SA latency)
- **Primary users**: South Africa (slower mobile connections), developer in Vietnam
- **PRD count**: 69 complete + PRDs 70-80 proposed
- **Sprints A-C**: Complete (security, UX, growth prep)
- **Key completed features**: PWA, AI step verification, analytics (PostHog + GA4), onboarding tours, social sharing, admin dashboard, public roadmap, feedback system

---

## Business Decisions (Locked In)

| Decision | Value | Source |
|----------|-------|--------|
| Free tier | ≤3 members per league | User decision 2026-03-29 |
| Paid tiers | Standard ($4.99/mo), Premium ($9.99/mo), Enterprise (contact) | Business analysis + user refinement |
| Annual pricing | $49/yr Standard, $99/yr Premium | Business analysis |
| Grandfathering | Existing subscribers keep their price when tiers change | User requirement |
| Pay gate toggle | SuperAdmin can toggle globally AND per-league | User requirement |
| All tier values | Configurable by SuperAdmin, NOT hardcoded | User requirement |
| Launch order | Alpha (F&F) → polish → crowdfunding/Product Hunt | Recommended and accepted |
| Crowdfunding Stage 1 | $3-5K goal: Early Bird $29 (50), Supporter $49 (75), Team Pack $99 (30) | Business analysis |
| Developer location | Vietnam (affects payment provider registration) | User constraint |
| Bank account | South African | User constraint |
| Payment needs | MCP integration preferred, recurring subscriptions, per-league billing | User requirement |

---

## Cross-PRD Dependencies

```
Sprint E (all parallel, no deps):
  PRD 70: Docs Cleanup
  PRD 71: Alpha Verification → blocks PRD 77
  PRD 72: Payment Research → blocks PRD 74, PRD 78
  PRD 73: Business Refresh → blocks PRD 78

Sprint F:
  Track 1 (sequential):
    PRD 74: Pay Gate Schema (needs PRD 72) → blocks PRD 75
    PRD 75: Pay Gate UI (needs PRD 74) → blocks PRD 76
    PRD 76: Subscriptions (needs PRD 74, 75)
  Track 2 (sequential):
    PRD 77: Alpha→Beta Gate (needs PRD 71) → blocks PRD 79
    PRD 78: Crowdfunding (needs PRD 72, 73) → blocks PRD 79

Sprint G:
  PRD 79: Marketing Content (needs PRD 77, 78) → blocks PRD 80
  PRD 80: Product Hunt Launch (needs PRD 79)
```

---

## Key Architectural Patterns (Must Follow)

| Pattern | Convention | Reference |
|---------|-----------|-----------|
| API routes | `withApiHandler` from `@/lib/api/handler` | `api-handler` skill |
| DB access | `adminClient` (bypasses RLS) in API routes | `supabase-patterns` skill |
| Auth | Never call `getSession()` (deadlocks). Use `getUser()` | `auth-patterns` skill |
| Styling | Mobile-first. CSS variables. shadcn/ui. Dark + light mode. | `design-system` skill |
| Errors | `AppError` class from `@/lib/errors` | `error-handling` skill |
| Forms | `FormInput`, `FormSelect`, etc. | `form-components` skill |
| Feature flags | `useFeatureFlag()` hook | PRD 26 |
| Settings | `useAppSettings()` hook | PRD 25 |
| Admin auth | `auth: 'superadmin'` in `withApiHandler` | PRD 26 |
| Analytics | PostHog + GA4 via `analytics-tracking` skill | PRD 59 |
| Offline | `useOfflineQueue` for mutations | PRD 22 |

---

## Key Files to Know

| File/Path | What It Does |
|-----------|-------------|
| `AGENTS.md` | Universal rules, design philosophy, skills reference |
| `docs/prds/admin-feedback-system/PRD_00_Index.md` | PRD master index with sprint structure |
| `docs/prds/PRD_BACKLOG.md` | Emergent PRD tracking — add rows when you discover new PRD-worthy items |
| `docs/artifacts/stepleague_business_analysis.md` | Business strategy, pricing, marketing (Dec 2025 — being refreshed by PRD 73) |
| `docs/prds/admin-feedback-system/PRD_49_Alpha_Launch_Checklist.md` | Alpha readiness checklist (being verified by PRD 71) |
| `src/app/(public)/pricing/page.tsx` | Current pricing page |
| `src/lib/config.ts` | APP_CONFIG with domain, branding |
| `src/hooks/useAppSettings.ts` | SuperAdmin settings hook |
| `src/hooks/useFeatureFlag.ts` | Feature flag hook |
| `src/lib/api/handler.ts` | withApiHandler implementation |
| `src/lib/errors.ts` | AppError class |
| `CHANGELOG.md` | Version history |
| `ROADMAP.md` | Feature roadmap |

---

## Sprint Execution Protocol

### Session Structure
Each sprint runs as follows:
1. **Orchestrator session** (Vasso's main Claude Code session) manages the sprint
2. **Worker sessions** (parallel Claude Code sessions or subagents) execute individual PRDs
3. **Consolidation** happens in the orchestrator session after workers complete

### Orchestrator Role (Main Session)
The orchestrator session is responsible for:
1. **Pre-flight**: Confirm which tracks to run in parallel. Ask Vasso before launching.
2. **Launch**: Start parallel agents/sessions for independent PRDs in the current sprint
3. **Monitor**: Check that PRD files are being created correctly
4. **Quality gate**: After each batch completes:
   - Verify all PRD files exist and follow the template
   - Check for conflicts in shared files (PRD_00_Index.md, CHANGELOG.md)
   - Verify cross-references between dependent PRDs are consistent
   - Ensure no PRD contradicts decisions in this context document
5. **Consolidate**:
   - Merge any conflicting index updates into a single coherent PRD_00_Index.md
   - Update the dependency graph
   - Update sprint gate status
   - Add any emergent items from PRD_BACKLOG.md
6. **Gate check**: Before starting next sprint, verify current sprint's gate criteria are met
7. **Handoff**: Prepare context for next sprint's worker sessions

### Worker Role (PRD Sessions)
Each PRD worker session must:
1. Read `AGENTS.md` first
2. Read this file (`docs/prds/SPRINT_EFG_CONTEXT.md`) for shared context
3. Read the specific PRD file for task details
4. Read all files/skills referenced in the PRD's Agent Context section
5. Execute the PRD's task-optimized phases
6. Add emergent items to `docs/prds/PRD_BACKLOG.md`
7. Do NOT update PRD_00_Index.md — the orchestrator handles that to avoid conflicts
8. Do NOT update CHANGELOG.md — the orchestrator consolidates changes

### Conflict Prevention
- **PRD_00_Index.md**: Only updated by the orchestrator, never by workers
- **CHANGELOG.md**: Only updated by the orchestrator after consolidation
- **PRD_BACKLOG.md**: Workers CAN append rows (append-only, no conflicts)
- **Individual PRD files**: Each worker owns its own PRD file (no shared writes)
- **Source code**: Workers in the same sprint MUST NOT edit the same files. If overlap is detected, the orchestrator resolves it.
- **Commit immediately**: Workers MUST commit their own files with a PRD-specific commit message (e.g., `docs(prd): PRD 73 — business analysis refresh`) BEFORE finishing their session. Do NOT leave changes unstaged — a parallel session's broad `git add` will sweep them into the wrong commit, breaking audit traceability. If this happens, use `git notes add <sha>` to annotate the commit with the correct PRD attribution.

### Emergent PRDs
Any time during work you discover something that needs its own PRD, add a row to `docs/prds/PRD_BACKLOG.md` immediately. Do NOT wait until the session ends.

---

## What Each PRD Produces (for downstream PRDs)

| PRD | Output That Others Need |
|-----|------------------------|
| **72** | Recommendation doc naming the chosen payment provider, its API patterns, and webhook format |
| **73** | Updated business analysis with revised pricing, channels, and crowdfunding platform recommendation |
| **74** | Database schema (subscription_tiers, league_subscriptions, payment_history tables), SuperAdmin config API |
| **75** | Payment UI components, webhook endpoint, league flow integration points |
| **76** | Subscription lifecycle management, grandfathering logic, billing views |
| **71** | Updated PRD 49 with verified checkboxes, blocker list if any |
| **77** | Pass/fail gate criteria document with specific metrics and thresholds |
| **78** | Crowdfunding campaign plan with platform, tiers, timeline, and content outline |
| **79** | Content calendar, platform-specific post templates, DM outreach playbook |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-03-29 | Created shared context for Sprints E-G (PRDs 70-80) |
