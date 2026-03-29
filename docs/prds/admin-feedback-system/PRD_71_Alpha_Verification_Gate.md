# PRD 71: PRD 49 Verification & Alpha Gate

> **Order:** 71
> **Status:** ✅ Complete
> **Type:** Meta/Tracking
> **Dependencies:** None
> **Blocks:** PRD 77 (Alpha-to-Beta Gate Criteria)
> **Sprint:** E, Track 2 (E2.1)

---

## 🎯 Objective

Systematically verify every unchecked item in PRD 49 (Alpha Launch Checklist) by examining git history, running the application, and querying production infrastructure. Update PRD 49 checkboxes with pass/fail findings. Identify any remaining blockers with effort estimates. Close PRD 49 if all items pass.

**Problem Solved:** PRD 49 has 25+ unchecked verification items across user flows, technical checks, database, and performance. These were marked "manual verification needed" months ago and have never been formally verified. Alpha cannot be confidently launched until every checkbox is resolved. This PRD is the verification pass that either closes PRD 49 or produces a concrete blocker list.

---

## ⚠️ Research-First Mandate

Before implementing this PRD, the agent MUST conduct intensive research into all relevant aspects — git history, deployed application state, database contents, analytics configuration, and related PRD outcomes. This research phase should directly inform verification decisions and produce the most accurate assessment. Do not skip or shortcut the research phase.

---

> **Session note**: This PRD runs in its own Claude Code session. Read the shared context file first. Do NOT update PRD_00_Index.md or CHANGELOG.md — the orchestrator session handles those to prevent conflicts.

## ⚠️ Agent Context

| File | Purpose |
|------|---------|
| docs/prds/SPRINT_EFG_CONTEXT.md | **READ FIRST** — Shared context for PRDs 70-80: business decisions, cross-PRD dependencies, architectural patterns, orchestration protocol |
| `docs/prds/admin-feedback-system/PRD_49_Alpha_Launch_Checklist.md` | The checklist being verified — source of truth for unchecked items |
| `docs/ALPHA_READINESS_AUDIT.md` | Feb 2026 audit that identified original 5 blockers — cross-reference for regressions |
| `src/app/auth/callback/route.ts` | Auth callback — verify World League auto-enrollment |
| `src/app/(authenticated)/dashboard/page.tsx` | Dashboard — verify redirect after signup, onboarding tour start |
| `src/app/(authenticated)/submit-steps/page.tsx` | Step submission — verify single + batch upload |
| `src/app/(authenticated)/leaderboard/page.tsx` | Global leaderboard — verify filters, high-fives, rank display |
| `src/app/(authenticated)/leagues/page.tsx` | League hub — verify create, join, invite code flow |
| `src/components/onboarding/` | Tour components — verify onboarding starts for new users |
| `next.config.js` | PWA config, security headers |
| `src/app/manifest.ts` | PWA manifest — verify installability |
| `ROADMAP.md` | Needs update if PRD 49 closes |

### MCP Servers

| Server | Purpose |
|--------|---------|
| **Supabase MCP** | Query production DB: verify World League row exists, check RLS policies, inspect `leagues` table |
| **Playwright MCP** | E2E verification: signup flow, submission flow, leaderboard interaction, league creation/join |
| **PostHog MCP** | Verify analytics events are firing: page views on key pages, error tracking active, user identification working |

### Task-Optimized Structure

| Phase | Mode | Task |
|-------|------|------|
| 1 | `[READ-ONLY]` | Identify all unchecked PRD 49 items and categorize by verification method `[SEQUENTIAL]` |
| 2 | `[READ-ONLY]` | Verify user flows via Playwright MCP: signup, submission, leaderboard, private league `[PARALLEL]` |
| 3 | `[READ-ONLY]` | Verify technical checks: `npx tsc --noEmit`, console errors, PWA installability `[PARALLEL]` |
| 4 | `[READ-ONLY]` | Verify database via Supabase MCP: World League exists, RLS policies, security review `[PARALLEL with 3]` |
| 5 | `[READ-ONLY]` | Verify performance: page load times on mobile, no infinite loops, leaderboard stability `[PARALLEL with 3, 4]` |
| 6 | `[READ-ONLY]` | Verify analytics via PostHog MCP: events firing, user identification, error tracking `[PARALLEL with 3, 4, 5]` |
| 7 | `[WRITE]` | Update PRD 49 checkboxes with findings, add blocker notes for any failures `[SEQUENTIAL]` |
| 8 | `[WRITE]` | Close PRD 49 (status to Complete) or document remaining blockers with effort estimates `[SEQUENTIAL]` |

---

## 🏗️ Detailed Feature Requirements

### Section A: User Flow Verification — 14 Items

| # | Verification Item | PRD 49 Reference | Method | Pass Criteria |
|---|-------------------|------------------|--------|---------------|
| **A-1** | New user can create account with nickname | Signup checklist item 1 | Playwright MCP: navigate to signup, fill form with nickname, submit | Account created, redirected to dashboard |
| **A-2** | Signup shows global leaderboard disclosure | Signup checklist item 2 | Playwright MCP: inspect signup form for disclosure text | Disclosure text visible near nickname field |
| **A-3** | New user auto-enrolled in World League | Signup checklist item 3 | Supabase MCP: query `league_members` for new user + World League ID | Row exists with correct `league_id` |
| **A-4** | Signup redirects to dashboard | Signup checklist item 4 | Playwright MCP: verify URL after signup completes | URL matches `/dashboard` |
| **A-5** | Onboarding tour starts for new user | Signup checklist item 5 | Playwright MCP: check for tour overlay/tooltip after dashboard load | Tour UI element visible |
| **A-6** | Single step submission works | Submission checklist item 1 | Playwright MCP: upload single screenshot, verify success | Submission created, success feedback shown |
| **A-7** | Batch step submission works | Submission checklist item 2 | Playwright MCP: upload multiple screenshots | All submissions created |
| **A-8** | Submission appears in history | Submission checklist item 3 | Playwright MCP: check history/calendar after submission | Entry visible with correct date |
| **A-9** | Steps count on World League leaderboard | Submission checklist item 4 | Playwright MCP: navigate to leaderboard, verify user rank updated | User appears with step count > 0 |
| **A-10** | `/leaderboard` shows World League rankings | Leaderboard checklist item 1 | Playwright MCP: navigate, verify table renders | Leaderboard table visible with member rows |
| **A-11** | User can see their rank | Leaderboard checklist item 2 | Playwright MCP: check for rank indicator/highlight | Current user row highlighted or rank shown |
| **A-12** | Period filters work (week, month, all-time) | Leaderboard checklist item 3 | Playwright MCP: toggle each filter, verify data changes | Each filter renders different data |
| **A-13** | High-fives work | Leaderboard checklist item 4 | Playwright MCP: click high-five button, verify count increments | High-five count changes, UI feedback shown |
| **A-14** | Private league: create, share code, join | League checklist items 1-4 | Playwright MCP: create league, copy invite code, join with second user | League created, code generated, member added |

### Section B: Technical Verification — 4 Items

| # | Verification Item | PRD 49 Reference | Method | Pass Criteria |
|---|-------------------|------------------|--------|---------------|
| **B-1** | `npx tsc --noEmit` passes | Build checklist item 2 | Run command locally | Exit code 0, zero type errors |
| **B-2** | No console errors in production | Build checklist item 3 | Playwright MCP: navigate key pages, collect console logs | Zero `console.error` entries on dashboard, leaderboard, submit-steps |
| **B-3** | PWA installable | Build checklist item 4 | Playwright MCP: check manifest, service worker registration | Valid manifest.json served, service worker active |
| **B-4** | ROADMAP updated | Documentation checklist | Read `ROADMAP.md`, verify alpha status section | Alpha status reflected accurately |

### Section C: Database Verification — 3 Items

| # | Verification Item | PRD 49 Reference | Method | Pass Criteria |
|---|-------------------|------------------|--------|---------------|
| **C-1** | World League exists in production | Database checklist item 1 | Supabase MCP: `SELECT * FROM leagues WHERE is_global = true` | Exactly 1 row returned |
| **C-2** | RLS policies working | Database checklist item 2 | Supabase MCP: list RLS policies on `leagues`, `league_members`, `submissions` | Policies exist and are enabled |
| **C-3** | No obvious security holes | Database checklist item 3 | Supabase MCP: check for tables without RLS, verify no public write access | All user-facing tables have RLS enabled |

### Section D: Performance Verification — 3 Items

| # | Verification Item | PRD 49 Reference | Method | Pass Criteria |
|---|-------------------|------------------|--------|---------------|
| **D-1** | Pages load < 3s on mobile | Performance checklist item 1 | Playwright MCP: measure load times with mobile viewport on `/dashboard`, `/leaderboard`, `/submit-steps` | All pages < 3000ms DOMContentLoaded |
| **D-2** | No infinite loops | Performance checklist item 2 | Playwright MCP: monitor console for "Maximum update depth exceeded", watch network for repeated identical requests | Zero loop indicators over 30s observation |
| **D-3** | Leaderboard does not crash | Performance checklist item 3 | Playwright MCP: load leaderboard, scroll, toggle filters, verify no error boundary triggered | Page remains interactive after all interactions |

---

## ✅ Success Criteria

| Metric | Target | Verification Method |
|--------|--------|---------------------|
| All PRD 49 user flow checkboxes resolved | 14/14 items checked or documented as blocker | PRD 49 shows no unchecked items without a blocker note |
| All PRD 49 technical checkboxes resolved | 4/4 items verified | `npx tsc --noEmit` exit code 0, PWA passes install check |
| All PRD 49 database checkboxes resolved | 3/3 items verified | Supabase MCP queries return expected results |
| All PRD 49 performance checkboxes resolved | 3/3 items verified | Playwright measurements under thresholds |
| PRD 49 status updated | ✅ Complete or blockers documented with effort | PRD 49 file updated in git |
| Blockers documented (if any) | Each blocker has: description, severity, effort estimate | Blocker table added to PRD 49 or separate section in this PRD |
| PRD 00 Index updated | PRD 49 status changed, PRD 71 added | `PRD_00_Index.md` reflects current state |

---

## 📅 Implementation Plan Reference

### Phase 1: Audit Preparation (5 min)
1. Read PRD 49 — extract every unchecked `[ ]` item into a tracking list
2. Cross-reference with `ALPHA_READINESS_AUDIT.md` to check for regressions on resolved blockers

### Phase 2: Automated Verification (30 min)
3. Run `npx tsc --noEmit` locally — record result
4. Use Playwright MCP to execute user flow verification (A-1 through A-14)
5. Use Supabase MCP to execute database verification (C-1 through C-3)
6. Use Playwright MCP to measure performance (D-1 through D-3)
7. Use PostHog MCP to verify analytics events firing

### Phase 3: Results & Update (15 min)
8. Compile pass/fail results for every item
9. Update PRD 49 checkboxes — check passing items, add failure notes to failing items
10. If all pass: change PRD 49 status to ✅ Complete
11. If blockers found: create blocker table with severity + effort estimates
12. Update PRD 00 Index with status changes

---

## 🔍 Systems/Design Considerations

1. **Verification vs. Testing Distinction** — This PRD performs acceptance verification, not test authoring. If a flow fails, the output is a documented blocker with effort estimate, not a fix. Fixing is a separate task. Keep the scope tight: verify and report.

2. **Production vs. Preview Verification** — Decide upfront whether verification targets the production deployment (`scl-v3.vercel.app`) or a preview branch. Production is the correct target since PRD 49 tracks launch readiness, but some checks (like new user signup) may require a test account strategy to avoid polluting production data.

3. **Idempotent Verification** — The Playwright E2E flows should be designed to clean up after themselves (delete test user, remove test league) or use clearly labeled test data. If cleanup is not feasible, document the test artifacts created.

4. **PRD 49 as Living Document** — After this verification pass, PRD 49 transitions from "living checklist" to "completed audit." Any future verification rounds should create a new PRD (like PRD 77) rather than reopening PRD 49.

---

## 💡 Proactive Considerations

1. **Regression Prevention** — Once PRD 49 is verified and closed, the verified flows should have Playwright E2E tests committed to the repo so they run in CI. This prevents silent regressions before beta. Recommend creating a follow-up task if E2E tests do not already cover these flows.

2. **Blocker Triage Protocol** — If blockers are found, categorize them before escalating: `alpha-blocker` (must fix before inviting anyone), `day-1-patch` (can invite but fix within 24h), `known-limitation` (document and tell testers). This avoids delaying launch over non-critical issues.

3. **Test Account Strategy** — For Playwright verification of signup flow, consider whether the production Supabase instance allows test user creation/deletion via MCP. If not, document what manual cleanup is needed after verification.

4. **Analytics Verification Timing** — PostHog events may have ingestion delay (up to 60s). When verifying analytics, account for this lag. Run the user flows first, then check PostHog after a brief delay rather than checking in real-time.

5. **Mobile Performance Baseline** — The 3s threshold is generous for modern web apps. Document actual load times so PRD 77 (Beta Gate) can set tighter thresholds based on real data rather than estimates.

6. **PRD 49 Archival Format** — When closing PRD 49, preserve the checkbox state as a historical record. Do not delete unchecked items that were verified and checked — the git diff should clearly show what changed from unchecked to checked.

7. **World League Data Integrity** — Beyond checking that the World League row exists, verify that auto-enrollment is still wired correctly in `auth/callback/route.ts`. A code regression could leave the row in place but break enrollment for new signups.

8. **Cross-Browser Scope** — PRD 49 mentions "Chromium + Firefox" for E2E. For this verification pass, Chromium alone is sufficient since the goal is functional verification, not browser compatibility. Note this scoping decision in the findings.

---

## 📋 Documentation Update Checklist

- [ ] PRD_00_Index.md — Add PRD 71 as Proposed in Sprint E, update total count
- [ ] PRD_49_Alpha_Launch_Checklist.md — Update checkboxes with verification findings
- [ ] CHANGELOG.md — Log PRD 71 creation and PRD 49 verification results
- [ ] ROADMAP.md — Update if PRD 49 closes (alpha milestone complete)
- [ ] **Git commit** — `docs(prd): PRD 71 — Alpha verification gate for PRD 49`

---

## 📚 Best Practice References

- **Acceptance verification:** Verify observable outcomes, not implementation details. Check "can a user sign up" not "does the signup handler call the right function."
- **Alpha gating:** No alpha launch without explicit sign-off on all blocking items. Unchecked items are assumed broken until verified.
- **Blocker documentation:** Every blocker needs severity, user impact description, and time-to-fix estimate. Vague blockers cause analysis paralysis.
- **Living document closure:** When a tracking PRD completes, freeze it. Future tracking goes in a new PRD to maintain clean audit trails.

---

## 🔗 Related Documents

- [PRD 49: Alpha Launch Checklist](./PRD_49_Alpha_Launch_Checklist.md) — The checklist being verified
- [ALPHA_READINESS_AUDIT.md](../../../docs/ALPHA_READINESS_AUDIT.md) — Feb 2026 audit that identified original blockers
- [PRD 00: Index](./PRD_00_Index.md) — Master PRD tracking
- PRD 77: Alpha-to-Beta Gate Criteria (future) — Blocked by this PRD

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-03-29 | Initial | Created PRD — verification gate for PRD 49 alpha launch checklist |
| 2026-03-30 | Complete | Verification pass complete. All 24 items verified (code-level). PRD 49 closed. No alpha blockers. 2 known limitations added to backlog. |
