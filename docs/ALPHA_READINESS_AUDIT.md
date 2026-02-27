# StepLeague Alpha Readiness Audit

> **Date:** 2026-02-27
> **Auditor:** Claude Code (Opus 4.6) - Full codebase audit
> **Scope:** 370+ TypeScript files, 75 API routes, 179 components, 124 lib modules, 75 test files
> **Purpose:** Brutal, honest assessment of alpha launch readiness for friends & family testing
> **Users:** South Africa (primary), Vietnam (developer)

---

## EXECUTIVE VERDICT

**StepLeague is 70% ready for alpha.** The architecture is genuinely impressive for a bootstrapped product — dual analytics, modular tour system, proxy user model, AI step verification. But there are **5 blockers** that will cause the exact same user-facing errors you saw in January if not fixed before inviting people.

The January incident (React Error #310, "The operation is insecure", login failures) was fixed at the symptom level. The **systemic causes** still have gaps.

---

## THE 5 ALPHA BLOCKERS

### BLOCKER 1: No Password Reset Flow
- **Severity:** CRITICAL
- **Impact:** Any user who forgets their password is permanently locked out
- **Evidence:** Searched entire codebase for `resetPasswordForEmail`, `forgotPassword`, `sendMagicLink` — **ZERO results**
- **Real scenario:** You invite 20 friends. 3 of them forget their password next week. They message you. You can't help them.
- **Fix effort:** 2-4 hours (sign-in page link + Supabase `resetPasswordForEmail` + update password page)

### BLOCKER 2: Agent API Routes Have ZERO Authentication
- **Severity:** HIGH (security)
- **Impact:** Anyone on the internet can POST/PATCH/DELETE to `/api/agent/current-work`
- **Evidence:** `src/app/api/agent/current-work/route.ts` — no `withApiHandler`, no auth check
- **Real scenario:** A curious friend opens DevTools, finds the endpoint, and writes garbage to your feedback table
- **Fix effort:** 30 minutes (add `auth: 'superadmin'` to withApiHandler wrapper)

### BLOCKER 3: GDPR Consent is Fake
- **Severity:** HIGH (legal/trust)
- **Impact:** Tracking fires regardless of user consent choice. Cookie banner is decorative.
- **Evidence:**
  - `PostHogProvider.tsx`: Comment says "Tracking is FORCED regardless of user consent"
  - `GoogleTagManager.tsx`: `analytics_storage: 'granted'` hardcoded in consent defaults
  - `CookieConsent.tsx`: "Consent banner is kept visible but tracking is FORCED"
- **Real scenario:** You have South African users. POPIA (SA's data protection law) requires real consent. If a user clicks "Reject" and you track anyway, that's a violation.
- **Fix effort:** 4-6 hours (defer PostHog init until consent granted, update GTM consent defaults to `denied`)

### BLOCKER 4: User Identification Never Called
- **Severity:** HIGH (analytics useless without it)
- **Impact:** PostHog and GA4 cannot tie events to users. You literally cannot see user journeys.
- **Evidence:** `identifyUser()` is defined in `analytics.ts` but **never called** after login in AuthProvider
- **Real scenario:** 15 friends sign up. You open PostHog. You see 15 anonymous sessions. You can't tell who did what. Your analytics are useless for understanding user behavior.
- **Fix effort:** 1 hour (call `identifyUser()` in AuthProvider after successful auth)

### BLOCKER 5: No Rate Limiting on Any Endpoint
- **Severity:** MEDIUM-HIGH
- **Impact:** Any endpoint can be hammered. Submission spam, feedback spam, leaderboard DoS.
- **Evidence:** Zero rate limiting across all 75 API routes
- **Real scenario:** Alpha user accidentally double-submits (or intentionally spam-tests). No protection.
- **Fix effort:** 2-4 hours for basic implementation (Upstash Redis rate limiter or simple in-memory counter)

---

## INFRASTRUCTURE: SERVER LOCATIONS

This matters because your users are in South Africa.

| Component | Location | Distance to SA | Latency |
|-----------|----------|----------------|---------|
| **Vercel (frontend)** | iad1 Virginia, USA | 12,000 km | 200-350ms |
| **Supabase (database)** | ap-southeast-1 Singapore | 9,500 km | 150-250ms |
| **PostHog** | us.i.posthog.com USA | 12,000 km | 200-300ms |

**The problem:** Every page load does: SA → Virginia (frontend) → Singapore (database) → Virginia → SA. That's a triangle route adding 400-600ms to every request.

**Quick win:** Add `lhr1` (London) to your Vercel regions. London is ~9,000 km from SA vs 12,000 for Virginia. Create a `vercel.json`:
```json
{ "regions": ["iad1", "lhr1"] }
```

**Medium-term:** Contact Supabase about `eu-west-1` (Dublin) read replicas. Cuts DB latency by ~100ms.

**Impact:** SA users on mobile 4G will experience 2-4s page loads. That's tolerable for alpha but noticeable.

---

## WHAT WORKS WELL (Genuinely Impressive)

1. **Auth flow is robust** — Cookie parsing fallback, 2-second deadlock prevention, LoadingWatchdog, `/reset` recovery page. Multiple layers of protection.

2. **API handler pattern** — `withApiHandler()` is excellent. Unified auth, Zod validation, consistent error responses across 75 routes. This is production-grade.

3. **Proxy user model** — Self-referential `users` table, "Act As" context switching, claim flow with merge strategies. Clever architecture.

4. **Analytics infrastructure** — Dual GA4+PostHog, first-party proxy bypass for ad blockers, comprehensive event definitions (70+ event types). The plumbing is there.

5. **Tour system** — 7 modular tours, A/B testing ready, analytics integrated, mobile-responsive. Overkill for alpha but sets you up well.

6. **Error boundaries** — Every route group has `error.tsx`. Global error with `sendBeacon` crash reporting. Error IDs for user support.

7. **Safe storage utility** — Created in January fix. `safeStorage.ts` wraps all localStorage/sessionStorage access. Good pattern.

8. **Test coverage** — 1,100+ unit tests, 63 E2E tests. Better than most startups at this stage.

---

## WHAT DOESN'T WORK (Honest Assessment)

### Analytics: Infrastructure Without Implementation
- 70+ events **defined**, only ~20 **actually called** in code
- Page views not tracked on most pages (only share modal and forms)
- Error events defined but **never called** — crashes go to console, not analytics
- `identifyUser()` never called — all users are anonymous in PostHog
- A/B testing infrastructure ready but zero experiments running
- **Bottom line:** You built a Ferrari analytics engine and forgot to put gas in it

### Error Handling: Good Boundaries, Weak Interior
- Error boundaries catch crashes ✅
- But most Supabase queries have **no timeout** — can hang indefinitely
- No `AbortController` on any `fetch()` call
- AuthProvider init has no hard timeout (relies on 2s fallback + 15s watchdog)
- Cookie setting errors silently swallowed in `server.ts`
- World League auto-enrollment has **zero error handling** in callback
- **Bottom line:** Errors at the edges are handled, errors in the middle are not

### UX: Beautiful Shell, Empty Interior
- Homepage is polished ("Motivate. Connect. Thrive." is good copy)
- Dashboard empty state is just 2 lines of text — no guidance, no images, no tutorial
- "Submit Steps" is the core action but there's no beginner guidance on how to take a screenshot
- Welcome toast says "Welcome to World League!" but doesn't explain what that means
- Proof thumbnails show "—" when images fail — no retry, no explanation
- Homepage stats are hardcoded ("10K+ Steps Tracked", "50+ Active Leagues") — not real numbers
- **Bottom line:** First impression is good, first 5 minutes are confusing

### Testing: Coverage Without Confidence
- 1,100+ unit tests but **zero tests for the exact errors that took down production in January**
- No test for `localStorage.getItem()` throwing SecurityError
- No test for React Error #310 propagation
- No test for sign-in API failures (500, timeout, network)
- E2E only runs in Chromium — Firefox/Safari untested (January errors hit Firefox users)
- `error-handling.spec.ts` allows up to 2 "critical" errors to pass
- **Bottom line:** Tests validate features work, not that failures are handled

### Security: Good Patterns, Gaps in Coverage
- `/api/agent/current-work` has zero authentication (4 methods exposed)
- `/api/debug/logs` uses manual email-based superadmin check instead of `withApiHandler`
- 6 routes bypass `withApiHandler` entirely (`/api/me`, `/api/profile`, `/api/attachments` GET/DELETE, `/api/invite/join`, `/api/proofs/sign-upload`)
- Share card short codes have no rate limiting or expiration — enumerable
- No CORS headers (fine for now, but document the decision)
- **Bottom line:** Core API security is solid, edges are porous

---

## STABILITY RISK MATRIX

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| User forgets password, can't recover | **Very High** | User permanently lost | Add password reset |
| Storage SecurityError in private browser | **Medium** | White screen crash | safeStorage.ts already wraps most calls — verify coverage |
| Slow page loads in South Africa | **High** | User frustration | Add London Vercel region |
| Analytics useless without user ID | **Certain** | Can't analyze alpha feedback | Call identifyUser() |
| Consent violation (POPIA/GDPR) | **Medium** | Legal/trust risk | Fix consent flow |
| Auth loading hangs on slow network | **Medium** | User stuck on spinner | Add hard timeout to AuthProvider |
| Supabase query hangs | **Low** | Page never loads | Add query timeouts |
| Double submission | **Medium** | Duplicate data | Add optimistic locking or debounce |

---

## TESTING GAPS: WHAT WOULD HAVE CAUGHT JANUARY 2026

The January production errors were:
1. **React Error #310** — Objects rendered as React children
2. **"The operation is insecure"** — Storage SecurityError in private/restricted browsers
3. **Login failures** — Cascading from storage errors crashing providers

### Tests That Would Have Caught It:

| Missing Test | Type | Would Catch |
|-------------|------|-------------|
| Storage SecurityError simulation | E2E | SecurityError in private mode |
| React error boundary verification | E2E | React Error #310 propagation |
| Sign-in with storage blocked | E2E | Login failure cascade |
| Firefox browser testing | E2E config | Browser-specific errors |
| Safari/WebKit browser testing | E2E config | iOS-specific errors |
| PostHog init failure | Unit | Provider crash from blocked scripts |
| safeStorage fallback | Unit | Storage wrapper correctness |
| AuthProvider with broken storage | Unit | Auth cascade failure |
| Global error boundary render | Unit | Root layout crash recovery |

---

## NEW USER JOURNEY: HONEST WALKTHROUGH

Here's what actually happens when your friend in South Africa clicks your link:

1. **Landing page** (2-4s load from SA) — Looks great. "Motivate. Connect. Thrive." Clean hero. CTAs work.

2. **Sign up** — Form works. Google OAuth works. Email confirmation works (but no intermediate page — just redirects).

3. **Auth callback** — Auto-enrolls in World League (silently, no error handling if it fails).

4. **Dashboard** — Welcome toast "Welcome to World League! 🌍" appears. User sees:
   - "You haven't joined any leagues yet"
   - Two lines of text. No images. No tutorial.
   - **User thinks:** "What do I do now?"

5. **Submit steps** — If they find the button, they see a complex batch upload form. No tutorial on:
   - How to take a screenshot of Apple Health / Google Fit / Samsung Health
   - What apps are supported
   - What "AI verification" means

6. **Leaderboard** — They see themselves on World League. One person. No context on what's normal.

7. **Share** — They try to share. The sharing system is comprehensive. But they need to have submitted first.

**Time from signup to "aha moment":** 5-10 minutes (should be 2-3).

---

## RECOMMENDED PRIORITY ORDER FOR ALPHA

### Week 1: Must-Fix Before Inviting Anyone
1. Add password reset flow
2. Add `auth: 'superadmin'` to `/api/agent/current-work`
3. Call `identifyUser()` after login in AuthProvider
4. Add `vercel.json` with `lhr1` region
5. Add hard timeout to AuthProvider initialization (10s max)

### Week 2: Should-Fix for Good Alpha Experience
6. Fix GDPR consent (defer tracking until real consent)
7. Add page view tracking to key pages (dashboard, submit, leaderboard)
8. Improve dashboard empty state (guidance, images, "Start here" card)
9. Add basic rate limiting on `/api/submissions` and `/api/feedback`
10. Enable Firefox in Playwright config

### Week 3: Nice-to-Fix for Polish
11. Add error event tracking (connect AppError to analytics)
12. Add `AbortController` timeouts to fetch calls
13. Replace hardcoded homepage stats with real numbers
14. Improve Submit Steps beginner guidance
15. Add Suspense fallback UI (not just `null`)

---

## TRACKING RECOMMENDATIONS FOR ALPHA

For alpha testing with friends, you need to know:

1. **Who signed up and when** → `identifyUser()` fix covers this
2. **Where they drop off** → Add page views to: dashboard, submit-steps, leaderboard, settings
3. **What errors they hit** → Connect `AppError` to `analytics.error.occurred()`
4. **Whether they submit steps** → Already tracked ✅
5. **Whether they share** → Already tracked ✅ (comprehensive share funnel)
6. **Page load times from SA** → `analytics.performance.apiCall()` is defined but never called
7. **Whether tours help** → Already tracked ✅

### Minimum Viable Tracking for Alpha:
```
identifyUser()           — WHO
page_view on 5 pages     — WHERE they go
error_occurred           — WHAT breaks
steps_submitted          — DID they use it
share_completed          — DID they share
```

---

## FILES AUDITED

| Category | Files | Lines (est.) |
|----------|-------|-------------|
| App routes & layouts | 62 | 8,000 |
| API routes | 75 | 15,000 |
| Components | 179 | 25,000 |
| Lib modules | 124 | 18,000 |
| Tests | 75 | 12,000 |
| Config & docs | 30+ | 5,000 |
| **Total** | **545+** | **83,000+** |

---

## CONCLUSION

StepLeague has a **strong technical foundation** — better than most products at this stage. The architecture decisions (unified API handler, proxy model, dual analytics, modular tours) show genuine systems thinking.

But **architecture isn't stability.** The January errors proved that. The fixes addressed symptoms. For alpha:

1. **Fix the 5 blockers** (especially password reset — this will bite you on day 1)
2. **Wire up the analytics** you already built (identifyUser, page views, errors)
3. **Add the missing tests** that would catch the errors your users actually hit
4. **Accept the latency** for now (London region helps, but SA users will notice)

The good news: none of this requires architectural changes. It's wiring, not rewiring.

---

*This audit was conducted by reading every relevant file in the codebase, not by running the application. Findings are based on static analysis of 545+ files across the full stack.*
