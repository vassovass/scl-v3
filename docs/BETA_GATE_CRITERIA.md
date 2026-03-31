---
## Document Context
**What**: Measurable pass/fail criteria for transitioning StepLeague from alpha (friends & family) to public beta
**Why**: Removes gut-feeling from the go/no-go decision; prevents launching too early (ruined first impressions) or too late (motivation decay)
**Status**: Active
**Last verified**: 2026-03-31
**Agent note**: This is the PRD 77 deliverable. Evaluate gates before any beta expansion. Re-evaluate thresholds as sample size grows.
---

# Alpha-to-Beta Gate Criteria

> **Purpose**: Data-driven go/no-go framework for transitioning StepLeague from alpha (friends & family, ~5-50 users) to public beta (strangers via LinkedIn, Reddit, Product Hunt).
>
> **How to use**: Evaluate all gates weekly during alpha. All HARD gates must pass. At least 80% of SOFT gates must pass. See Section E for the full decision framework.
>
> **Predecessor**: PRD 49 (Alpha Launch Checklist) covers the 5 -> 20 -> 50 user rollout. This document picks up after PRD 49's 50-user gate is passed.

---

## A. Quantitative Gates

### A-1. Minimum Daily Active Users (DAU)

| Field | Value |
|-------|-------|
| **Classification** | SOFT |
| **Threshold** | At least 5 unique users performing any tracked action per day, averaged over a 7-day window |
| **Observation window** | 7 consecutive days (to smooth weekend/weekday variation) |
| **Measurement method** | PostHog Trends insight: count unique users performing any event, grouped by day. Use the `$pageview` or `page_view` event as the broadest signal. |
| **Rationale** | With 5-50 alpha users, absolute numbers matter more than percentages. 5 DAU out of 20 total users (25%) indicates healthy daily engagement. Industry median DAU/MAU for consumer apps is ~13% (PostHog blog, "How to calculate DAU/MAU ratio"). For a small alpha cohort, 25% daily return rate exceeds this benchmark. |
| **PostHog query** | Trends > Event: `page_view` > Count unique users > Date range: Last 7 days > Breakdown: Day |
| **Why SOFT** | At very small alpha sizes (5-10 total users), a single person on vacation drops DAU significantly. Use alongside retention metrics for a fuller picture. |

### A-2. Submission Rate Per Active User Per Day

| Field | Value |
|-------|-------|
| **Classification** | HARD |
| **Threshold** | At least 0.5 submissions per active user per day (i.e., at least half of active users submit steps on any given day) |
| **Observation window** | 14 days minimum |
| **Measurement method** | PostHog Trends insight: count `steps_submitted` events / count unique users with any event, per day. |
| **Rationale** | Step submission is the core action. If active users are not submitting, the product loop is broken. 0.5 means that on average every user submits every other day, which aligns with a daily step-tracking habit that tolerates occasional misses. |
| **PostHog query** | Trends > Formula mode: `A / B` where A = total `steps_submitted` events, B = unique users with any event, per day |
| **Why HARD** | If the core action is not happening, beta will fail regardless of other metrics. |

### A-3. Day-1 Retention

| Field | Value |
|-------|-------|
| **Classification** | SOFT |
| **Threshold** | At least 4 out of every 10 new users return on Day 1 (40%) |
| **Observation window** | Measure after at least 10 new users have been onboarded (to have a minimally meaningful sample) |
| **Measurement method** | PostHog Retention insight: start event = `sign_up`, return event = any event, period = Day, look at Day 1 column. |
| **Rationale** | Health & fitness app D1 retention benchmarks average 20-27% (Plotline, "Retention Rates for Mobile Apps by Industry"; Business of Apps, "Health & Fitness App Benchmarks 2026"). The 40% target is deliberately higher because alpha testers are friends/family with personal motivation. If even motivated users do not return on Day 1, strangers certainly will not. |
| **PostHog query** | Retention > Start event: `sign_up` > Return event: Any event > Period: Day > Read Day 1 percentage |
| **Why SOFT** | Small sample size makes individual D1 numbers volatile. A single user not returning on Day 1 with 10 users swings retention by 10 percentage points. Evaluate trend direction alongside the number. |

### A-4. Day-7 Retention

| Field | Value |
|-------|-------|
| **Classification** | SOFT |
| **Threshold** | At least 3 out of every 10 new users return in the Day-7 window (30%) |
| **Observation window** | Requires at least 7 days since the first alpha user signed up, with at least 10 users in the cohort |
| **Measurement method** | PostHog Retention insight: start event = `sign_up`, return event = any event, period = Day, look at Day 7 column. |
| **Rationale** | Health & fitness app D7 retention benchmarks average 7-13% (Plotline; UXCam, "Mobile App Retention Benchmarks By Industries 2025"; growth-onomics, "Mobile App Retention Benchmarks by Industry 2025"). The 30% target is 2-3x industry average, justified because alpha testers have a personal relationship with the developer and intrinsic social motivation (competing with friends). StepLeague's weekly leaderboard reset is designed to drive the Day-7 return. If this gate fails, the weekly loop needs work before exposing strangers to it. |
| **PostHog query** | Retention > Start event: `sign_up` > Return event: Any event > Period: Day > Read Day 7 percentage |
| **Why SOFT** | Same small-sample volatility as D1. Also, 7-day retention requires patience to measure. Do not delay beta solely because the observation window has not elapsed -- use D1 as the leading indicator. |

### A-5. Bug Count Threshold

| Field | Value |
|-------|-------|
| **Classification** | HARD |
| **Threshold** | 0 open P0 (app-breaking) bugs, maximum 2 open P1 (flow-blocking) bugs |
| **Observation window** | Point-in-time check at gate evaluation |
| **Measurement method** | Manual review of GitHub Issues (label: `bug`, priority labels: `P0`, `P1`). If no formal issue tracker, review the feedback widget submissions tagged `bug-critical` and `bug-minor`. |
| **Bug classification** | P0 = app crashes, data loss, authentication failure, blank screen on critical path. P1 = a core flow is blocked but workaround exists (e.g., batch upload fails but single upload works). P2+ = cosmetic, minor UX issues. |
| **Rationale** | Industry standard for alpha-to-beta transition: zero critical/showstopper bugs (HeadSpin, "Beta Testing: Everything You Need to Know in 2026"; GoCodeo, "Alpha Testing Best Practices"). P1 tolerance of 2 accounts for the reality that a solo developer cannot fix everything before expanding, provided workarounds exist. |
| **Why HARD** | Strangers will not tolerate app-breaking bugs. A single P0 in beta destroys first impressions and wastes the Product Hunt launch opportunity. |

### A-6. Error Rate Threshold

| Field | Value |
|-------|-------|
| **Classification** | HARD |
| **Threshold** | API 5xx error rate < 1% of total API requests over 7 days. Client-side exception rate < 5 unique exceptions per day. |
| **Observation window** | 7 consecutive days |
| **Measurement method** | API errors: Vercel Analytics or PostHog `api_performance` events filtered by status >= 500. Client exceptions: PostHog error tracking (if configured) or Vercel deployment logs. |
| **Rationale** | A 1% API error rate is a standard reliability threshold for production web apps. For a small alpha (50 users, ~200 API calls/day), 1% = 2 errors/day, which is the upper acceptable bound. Client exceptions at 5/day cap ensures no recurring crash is ignored. |
| **PostHog query** | Trends > Event: `api_performance` > Filter: `status_code >= 500` > Compare against total `api_performance` events. Or use Vercel Analytics > Functions tab > Error rate. |
| **Why HARD** | Systemic errors indicate infrastructure instability. Inviting strangers to an unstable app causes reputation damage that is hard to recover from. |

---

## B. Qualitative Gates

### B-1. User Feedback Sentiment

| Field | Value |
|-------|-------|
| **Classification** | SOFT |
| **Threshold** | At least 60% of polled alpha testers rate their experience as "Good" or "Great" (on a 4-point scale: Poor / Fair / Good / Great) |
| **Collection method** | Option A (preferred): PostHog in-app survey with a single question: "How would you rate your StepLeague experience so far?" Option B (fallback): WhatsApp/Signal poll to alpha testers with the same question. |
| **Minimum responses** | At least 5 responses required for the gate to be evaluable. If fewer than 5, mark as INCONCLUSIVE and rely on other gates. |
| **Rationale** | NPS requires 30+ responses for statistical validity, which is unrealistic at alpha scale. A simple 4-point satisfaction scale is more actionable. 60% positive (Good + Great) from friends/family is a moderate bar -- these users are biased toward positive feedback, so 60% actually indicates genuine satisfaction. |
| **Why SOFT** | Qualitative sentiment is inherently subjective and biased at small scale. It informs the decision but should not single-handedly block beta. |

### B-2. Core Flow Unassisted Completion Rate

| Field | Value |
|-------|-------|
| **Classification** | HARD |
| **Threshold** | At least 7 out of 10 new users complete the signup-to-first-submission flow without asking Vasso for help |
| **Collection method** | Track via PostHog funnel: `sign_up` -> `page_view (dashboard)` -> `steps_submitted`. Cross-reference with WhatsApp messages asking "how do I...?" or "it's not working". |
| **Observation window** | After at least 10 users have attempted the flow |
| **Rationale** | Strangers will have zero context and zero help channel. If 30%+ of alpha testers (who know Vasso personally) need help, strangers will abandon. This is the single most important signal for beta readiness because it tests whether the product is self-explanatory. |
| **PostHog query** | Funnels > Step 1: `sign_up` > Step 2: `page_view` (filter: `page_name = dashboard`) > Step 3: `steps_submitted` > Conversion window: 24 hours |
| **Why HARD** | An onboarding flow that requires human explanation will not scale. This is non-negotiable before inviting strangers. |

### B-3. Feedback Triage Backlog

| Field | Value |
|-------|-------|
| **Classification** | SOFT |
| **Threshold** | Maximum 5 unprocessed feedback items at any point. Triage SLA: every feedback item categorized within 48 hours of receipt. |
| **Collection method** | Count untriaged items in the feedback widget submissions (admin dashboard) or WhatsApp thread. |
| **Rationale** | An unmanageable feedback backlog signals that the developer cannot keep up with the current user base. Scaling to beta while drowning in alpha feedback leads to ignored issues and frustrated users. 5 items is a reasonable ceiling for a solo developer. |
| **Why SOFT** | Temporary spikes (e.g., a bug affecting multiple users) may briefly exceed the threshold. The spirit of this gate is about sustained overwhelm, not momentary peaks. |

### B-4. Alpha Tester Recommendation Signal

| Field | Value |
|-------|-------|
| **Classification** | SOFT |
| **Threshold** | At least 50% of polled alpha testers answer "Yes" to: "Would you recommend StepLeague to a friend who is NOT in our friend group?" |
| **Collection method** | PostHog survey or informal WhatsApp/Signal poll. The question deliberately excludes social obligation ("not in our friend group") to test genuine product value. |
| **Minimum responses** | At least 5 responses required. If fewer, mark INCONCLUSIVE. |
| **Rationale** | This is a simplified proxy for NPS's "likelihood to recommend" question, adapted for tiny sample sizes. 50% is the bar because alpha testers are positively biased; if fewer than half would recommend to a stranger, the product is not ready for strangers. |
| **Why SOFT** | Subjective and biased at small scale. A useful signal but not a blocker on its own. |

---

## C. Infrastructure Readiness

### C-1. Payment Infrastructure

| Field | Value |
|-------|-------|
| **Classification** | SOFT |
| **Pass criteria** | At least one of: (a) Paystack test-mode integration working end-to-end (signup -> checkout -> webhook -> subscription created), OR (b) payment infrastructure explicitly deferred with a documented plan and timeline, plus the free tier fully functional without payment. |
| **Verification method** | If (a): trigger a test-mode payment via Paystack dashboard or API, verify webhook fires and `payment_history` row is created. If (b): verify `docs/artifacts/` contains a payment deferral plan and the app works fully on the free tier (<=3 members per league). |
| **Rationale** | Beta does not require payment to be live -- many successful launches start free and add payment later. However, the payment schema (PRD 74) should be in place so that enabling payment is a configuration change, not a code rewrite. The free tier (<=3 members) is functional without payment. |
| **Why SOFT** | Early beta users can use the free tier. Payment is required before scaling beyond early adopters, not before the first beta invite. |

### C-2. Monitoring and Alerting

| Field | Value |
|-------|-------|
| **Classification** | HARD |
| **Pass criteria** | All of the following are configured: (1) Vercel deployment failure notifications (email or Slack), (2) PostHog error tracking active (client exceptions captured), (3) Ability to check API error rates within 5 minutes (Vercel Analytics or PostHog dashboard). |
| **Verification method** | (1) Trigger a build failure on a preview branch, verify notification arrives. (2) Open PostHog > Error Tracking, verify recent errors are listed. (3) Open Vercel Analytics > Functions tab OR PostHog dashboard, verify error rate data is visible. |
| **Rationale** | Strangers will not report bugs proactively. The developer must detect issues through monitoring before users churn silently. Alpha testers text Vasso directly; beta users just leave. |
| **Why HARD** | Without monitoring, beta issues go undetected until users leave. This is foundational infrastructure. |

### C-3. Error Rate Baseline

| Field | Value |
|-------|-------|
| **Classification** | HARD |
| **Pass criteria** | A documented "healthy baseline" exists: (1) API p95 response time < 2 seconds for key endpoints (leaderboard, submit-steps, dashboard data), (2) API 5xx rate < 1% (same as gate A-6), (3) No recurring client-side exceptions (same error appearing 3+ times in 7 days). |
| **Verification method** | Run key flows (dashboard load, submit steps, view leaderboard) 10 times each and record p95 response time. Check PostHog/Vercel for 5xx rate over last 7 days. Check PostHog error tracking for recurring exceptions. |
| **Rationale** | Establishing a healthy baseline before beta lets you detect degradation when strangers increase load. Without a baseline, you cannot distinguish "normal" from "broken." |
| **Why HARD** | A baseline is prerequisite for meaningful monitoring. Without it, alerts are either too noisy or too silent. |

### C-4. Database Scalability

| Field | Value |
|-------|-------|
| **Classification** | SOFT |
| **Pass criteria** | (1) Key queries (leaderboard aggregation, user submissions, league members) execute in < 500ms at projected beta scale (500 users, 50 concurrent). (2) No N+1 query patterns in core flows. (3) Supabase connection pool not exhausted during peak alpha usage. |
| **Verification method** | (1) Review Supabase query performance via dashboard or `EXPLAIN ANALYZE` on key queries. (2) Grep codebase for loops containing Supabase queries. (3) Check Supabase dashboard for connection pool usage during peak hours. |
| **Rationale** | Alpha at 50 users generates minimal DB load. Beta at 200-500 users could expose query performance issues, especially on the leaderboard aggregation which joins submissions across all league members. Testing at projected scale prevents surprise slowdowns. |
| **Why SOFT** | Supabase free tier handles 500 users comfortably for most query patterns. This becomes HARD at the 1000-user expansion tier. |

### C-5. Security Readiness

| Field | Value |
|-------|-------|
| **Classification** | HARD |
| **Pass criteria** | All of: (1) HTTPS enforced on all routes (Vercel handles this by default). (2) Cookie consent banner functional and respects user choice (POPIA/GDPR compliance for strangers). (3) Privacy policy and Terms of Service pages exist and are linked from signup flow. (4) Auth tokens stored only in cookies, never localStorage/sessionStorage. (5) No API routes accessible without authentication (except public pages). (6) Data deletion request mechanism documented (even if manual email process). |
| **Verification method** | (1) Attempt HTTP access, verify redirect to HTTPS. (2) Click "Reject" on cookie banner, verify PostHog/GA4 events stop firing. (3) Navigate to /privacy and /terms, verify content exists. (4) Grep codebase for `localStorage.setItem` with auth-related keys. (5) Review API routes for missing auth checks. (6) Privacy policy mentions data deletion process. |
| **Current status** | Items 1, 3, 4, 5 verified in PRD 71. Item 2 (consent) was deferred for F&F alpha (GDPR consent is currently forced/decorative per ALPHA_READINESS_AUDIT.md) -- this MUST be fixed before beta. Item 6 needs documentation. |
| **Rationale** | Alpha with known friends can defer privacy compliance (low risk). Beta with strangers cannot. South African users fall under POPIA, which requires real consent for data processing. EU users (possible via Product Hunt) fall under GDPR. Non-compliance is a legal and trust risk. |
| **Why HARD** | Legal compliance is non-negotiable when serving strangers. A consent violation with beta users could result in regulatory complaints or negative press that undermines the Product Hunt launch. |

---

## D. Feature Completeness

### D-1. Core Features Must-Work Checklist

| Field | Value |
|-------|-------|
| **Classification** | HARD |
| **Pass criteria** | Every item below returns PASS when tested manually: |

| Feature | Test |
|---------|------|
| Email signup + Google OAuth | Create account with both methods, verify redirect to dashboard |
| Password reset | Request reset email, click link, set new password, log in |
| World League auto-enrollment | New user appears on global leaderboard after signup |
| Single step submission | Upload screenshot, verify steps appear in history and on leaderboard |
| Batch step submission | Upload 3+ screenshots at once, verify all processed |
| Leaderboard with period filters | View today, this week, this month, all-time -- data changes appropriately |
| Private league creation | Create league, verify invite code generated |
| Join league via invite code | Enter code, verify membership and leaderboard access |
| High-fives | Send and receive high-fives on leaderboard |
| Settings / profile update | Change display name, verify reflected on leaderboard |

| **Verification method** | Manual walkthrough or Playwright E2E test suite. Each feature is a binary pass/fail. |
| **Rationale** | These are the features that define StepLeague's core value proposition. If any one fails, the product cannot deliver on its promise to beta users. |
| **Why HARD** | A broken core feature means the product is not functional. Non-negotiable. |

### D-2. Known Limitations Documented

| Field | Value |
|-------|-------|
| **Classification** | SOFT |
| **Pass criteria** | (1) An in-app "Beta" badge or banner is visible to all users, setting expectations. (2) A public changelog or "What's New" page exists (e.g., /roadmap or /changelog). (3) Known limitations are listed somewhere accessible (in-app or linked from the beta badge). |
| **Verification method** | Visual check: see beta badge on dashboard. Navigate to changelog/roadmap page. Verify limitations are listed. |
| **Rationale** | Beta users expect rough edges if they know it is a beta. Transparency prevents frustration and builds trust. Users who know something is a known limitation are more forgiving than users who think they found a bug. |
| **Why SOFT** | Important for user experience but not technically blocking. The product works without a badge; the badge just manages expectations. |

### D-3. Onboarding Completeness for Strangers

| Field | Value |
|-------|-------|
| **Classification** | HARD |
| **Pass criteria** | A zero-context user (someone who has never heard of StepLeague) can understand all of the following within their first session without external help: (1) What StepLeague is (competitive step tracking). (2) How to submit steps (screenshot upload). (3) How leaderboards work (weekly reset, ranking). (4) What leagues are (private groups, invite codes). |
| **Verification method** | Review the onboarding flow (dashboard OnboardingSection, tour steps, "Why Upload" page). Verify each of the 4 concepts is explicitly explained in the first-session experience. Ideally, have 1-2 people outside the friend group attempt signup-to-first-submission without help. |
| **Rationale** | The ALPHA_READINESS_AUDIT identified that the "time from signup to aha moment" is 5-10 minutes (should be 2-3). Strangers have lower patience than friends. If the onboarding does not explain the product, strangers will bounce before submitting their first steps. |
| **Why HARD** | This is the difference between a product that grows and one that churns every new user. Strangers will not ask Vasso for help. |

### D-4. Mobile Experience

| Field | Value |
|-------|-------|
| **Classification** | HARD |
| **Pass criteria** | On a mobile device (or Chrome DevTools mobile emulation with "Slow 3G" throttling): (1) LCP (Largest Contentful Paint) < 2.5 seconds. (2) Total page weight < 500KB for initial load. (3) INP (Interaction to Next Paint) < 200ms for core interactions (submit button, leaderboard filter). (4) No horizontal scrolling or layout breakage on 375px-width screens. |
| **Verification method** | Chrome DevTools > Lighthouse > Mobile > Performance audit with throttled 3G. Check Network tab for total transfer size. Test on actual mobile device if available. |
| **Rationale** | South African users are the primary audience. MTN, Vodacom, and Cell C connections range from 150-300ms RTT and 1-5 Mbps bandwidth. The GSMA Mobile Economy Africa 2025 report confirms that 3G/4G connections have only recently overtaken 2G in Sub-Saharan Africa. Google Core Web Vitals standards (2025/2026) define "good" as LCP < 2.5s, INP < 200ms, CLS < 0.1. These are the minimum thresholds, not aspirational targets. |
| **Why HARD** | A slow mobile experience in South Africa means the product is unusable for the primary audience. This is not a nice-to-have; it is the core platform requirement. |

### D-5. Error UX

| Field | Value |
|-------|-------|
| **Classification** | HARD |
| **Pass criteria** | All critical paths handle errors gracefully: (1) Step submission failure shows a user-facing error message with retry option. (2) Leaderboard data fetch failure shows error state (not blank screen). (3) Auth failure redirects to login with a message. (4) Offline state shows appropriate messaging (PWA offline page or toast). (5) No blank/white screens on any error path. |
| **Verification method** | For each critical path: disable network in DevTools, trigger the action, verify error UI appears. Check that error boundaries exist on all route groups (`error.tsx` files). |
| **Current status** | PRD 71 verified error boundaries exist on all route groups. Runtime error UX needs manual testing on a deployed instance. |
| **Rationale** | Strangers who hit a blank screen will never return. Error states must communicate what happened and what to do next. The ALPHA_READINESS_AUDIT noted that error boundaries exist but interior error handling has gaps. |
| **Why HARD** | A blank screen is the worst possible user experience. It signals a broken product and destroys trust instantly. |

---

## E. Decision Framework

### E-1. Gate Evaluation Process

| Field | Value |
|-------|-------|
| **Evaluator** | Vasso (solo founder) |
| **Cadence** | Weekly during active alpha testing. More frequently (every 3 days) when approaching a target gate evaluation date. |
| **Data pull method** | Open the "Beta Gate" PostHog dashboard (see Section G). Review each insight. Cross-reference with manual checks (bug count, feedback backlog, security items). Record results in a simple table (copy the template below). |
| **Trigger for evaluation** | (1) At least 10 alpha users have been active for 7+ days, OR (2) 4 weeks have elapsed since alpha launch, whichever comes first. |

**Weekly Evaluation Template** (copy into a note/doc each week):

```
## Beta Gate Evaluation — [DATE]

### Quantitative Gates
- [ ] A-1 DAU >= 5 avg/day (7d): ___
- [ ] A-2 Submission rate >= 0.5/user/day (14d): ___
- [ ] A-3 D1 retention >= 40%: ___
- [ ] A-4 D7 retention >= 30%: ___
- [ ] A-5 P0 bugs = 0, P1 bugs <= 2: P0=___ P1=___
- [ ] A-6 API 5xx < 1%, client exceptions < 5/day: ___

### Qualitative Gates
- [ ] B-1 Satisfaction >= 60% Good/Great: ___
- [ ] B-2 Unassisted completion >= 70%: ___
- [ ] B-3 Feedback backlog <= 5: ___
- [ ] B-4 Recommendation >= 50% Yes: ___

### Infrastructure
- [ ] C-1 Payment: test mode or documented deferral: ___
- [ ] C-2 Monitoring active: ___
- [ ] C-3 Error baseline documented: ___
- [ ] C-4 DB scalability reviewed: ___
- [ ] C-5 Security/POPIA ready: ___

### Feature Completeness
- [ ] D-1 Core features all PASS: ___
- [ ] D-2 Beta badge + known limitations: ___
- [ ] D-3 Onboarding for strangers: ___
- [ ] D-4 Mobile perf (LCP < 2.5s, INP < 200ms): ___
- [ ] D-5 Error UX (no blank screens): ___

### Result
HARD gates passed: ___/10
SOFT gates passed: ___/10
Overall: PASS / FAIL / INCONCLUSIVE
Notes: ___
```

### E-2. Pass/Fail Aggregation Rules

**Gate classifications summary:**

| Gate | Classification |
|------|---------------|
| A-1 DAU | SOFT |
| A-2 Submission rate | HARD |
| A-3 D1 retention | SOFT |
| A-4 D7 retention | SOFT |
| A-5 Bug count | HARD |
| A-6 Error rate | HARD |
| B-1 Sentiment | SOFT |
| B-2 Core flow completion | HARD |
| B-3 Feedback backlog | SOFT |
| B-4 Recommendation | SOFT |
| C-1 Payment | SOFT |
| C-2 Monitoring | HARD |
| C-3 Error baseline | HARD |
| C-4 DB scalability | SOFT |
| C-5 Security | HARD |
| D-1 Core features | HARD |
| D-2 Known limitations | SOFT |
| D-3 Onboarding | HARD |
| D-4 Mobile perf | HARD |
| D-5 Error UX | HARD |

**Totals**: 10 HARD gates, 10 SOFT gates.

**Overall pass rule**:
- All 10 HARD gates must pass. No exceptions.
- At least 8 of 10 SOFT gates must pass (80%).
- Gates marked INCONCLUSIVE (insufficient data) count as neither pass nor fail -- adjust the denominator.

**If a HARD gate fails**: Do not proceed to beta. Fix the issue, wait for the next evaluation cycle, re-evaluate.

**If SOFT gates are borderline**: Use judgment. If 7/10 SOFT gates pass and the 3 failures are trending in the right direction, consider proceeding with documented risks.

### E-3. Rollback Criteria

If beta is launched and conditions deteriorate, these triggers pause new beta invitations:

| Trigger | Threshold | Action |
|---------|-----------|--------|
| API error rate spike | 5xx rate exceeds 5% for 1 hour | Pause new invites. Investigate. Fix before resuming. |
| Critical bug reported | 3+ users report the same P0 bug within 24 hours | Pause new invites. Hotfix. Notify affected users. |
| D1 retention collapse | D1 retention drops below 15% for a cohort of 10+ new users | Pause new invites. Investigate onboarding/first-session experience. |
| Complaint volume | 5+ negative feedback items in 48 hours (distinct users) | Pause new invites. Triage feedback. Address top issues. |
| Monitoring blind spot | Any monitoring tool goes offline for 24+ hours | Pause new invites until monitoring is restored. |

**Rollback actions** (in order of severity):
1. **Pause**: Stop sending new invite links. Existing beta users continue using the app.
2. **Restrict**: Re-enable invite-only mode. New signups require an invite code.
3. **Revert**: If a specific deployment caused the issue, revert to the previous Vercel deployment.
4. **Freeze**: Disable non-essential features via feature flags while fixing critical issues.

---

## F. Progressive Beta Expansion

Beta is not all-or-nothing. Expand in tiers with re-evaluation at each stage:

| Tier | Users | Source | Gate Re-evaluation |
|------|-------|--------|-------------------|
| **Tier 0 (Alpha)** | 5-50 | Friends & family | All gates in this document |
| **Tier 1 (Closed Beta)** | 50-200 | LinkedIn connections, Reddit communities, direct outreach | Re-evaluate all gates. D1/D7 retention thresholds stay the same but become more statistically meaningful. Submission rate threshold increases to 0.6/user/day. |
| **Tier 2 (Open Beta)** | 200-1000 | Product Hunt launch, organic growth, content marketing | Re-evaluate with stricter thresholds: D1 retention >= 30% (strangers have less motivation), D7 retention >= 15%, DAU >= 20. Add payment gate as HARD (Paystack live mode working). |
| **Tier 3 (General Availability)** | 1000+ | Paid acquisition, partnerships, App Store | Full production gates: 99.9% uptime SLA, < 500ms p95 API response, payment fully operational, GDPR data export, support SLA. |

**Key principle**: Thresholds for D1 and D7 retention decrease at Tier 2 because strangers have lower intrinsic motivation than friends/family. But the absolute DAU threshold increases because you need enough active users to validate the product-market fit signal.

**At each tier boundary**:
1. Run the full gate evaluation (Section E template).
2. Review feedback themes -- are the same issues recurring?
3. Check infrastructure headroom -- is Supabase connection pool or Vercel function concurrency approaching limits?
4. Update this document with revised thresholds if data warrants it.

---

## G. PostHog Dashboard Recommendation

Create a PostHog dashboard called **"Beta Gate Metrics"** with the following saved insights:

| Insight Name | Type | Configuration | Maps to Gate |
|--------------|------|--------------|-------------|
| DAU (7-day rolling) | Trends | Event: `page_view`, unique users, daily, last 7 days | A-1 |
| Submission Rate | Trends (Formula) | A: count `steps_submitted` / B: unique users (any event), daily | A-2 |
| D1 Retention | Retention | Start: `sign_up`, Return: any event, Day 1 | A-3 |
| D7 Retention | Retention | Start: `sign_up`, Return: any event, Day 7 | A-4 |
| Signup-to-Submission Funnel | Funnel | `sign_up` -> `page_view` (dashboard) -> `steps_submitted`, 24h window | B-2 |
| Error Rate (API 5xx) | Trends | Event: `api_performance`, filter: status >= 500, daily | A-6 |
| Active Pages | Trends | Event: `page_view`, breakdown by `page_name`, last 7 days | General |
| Core Event Volume | Trends | Events: `steps_submitted`, `league_created`, `league_joined`, `high_five_sent`, daily | General |

### Currently Tracked Events (Codebase Audit, 2026-03-31)

Events actively called in source code (not just defined):

| Event | Where Called | Gate Relevance |
|-------|-------------|---------------|
| `page_view` | PageViewTracker on: dashboard, submit-steps, leaderboard, progress, settings | A-1 (DAU) |
| `sign_up` | sign-up/page.tsx (email signup) | A-3, A-4 (retention start event) |
| `login` | AuthProvider (SIGNED_IN event) | General |
| `logout` | AuthProvider (SIGNED_OUT event) | General |
| `steps_submitted` | SubmissionForm (single + pending) | A-2 (submission rate) |
| `league_created` | league/create/page.tsx | D-1 verification |
| `league_joined` | JoinLeagueForm | D-1 verification |
| `high_five_sent` | HighFiveButton | D-1 verification |
| `share` | useShare hook | General |
| `proxy_claimed` | claim/[code]/page.tsx | General |
| `password_reset_requested` | reset-password/page.tsx | General |
| `password_reset_completed` | update-password/page.tsx | General |
| `password_recovery_started` | AuthProvider | General |
| `cta_clicked` | ShareCTAButtons | General |
| `feedback_submitted` | (defined, usage not confirmed in grep) | B-3 |
| `import_completed` | useImport hook | General |
| `export_completed` | useExport hook | General |
| `onboarding_card_viewed` | OnboardingSection | B-2 |
| `screenshot_guide_expanded` | ScreenshotGuide | B-2 |
| `progress_tab_switched` | ProgressToggle | General |
| `share_date_preset_selected` | ShareDateRangePicker | General |

### Instrumentation Gaps

Events needed for gate evaluation but not currently tracked or needing verification:

| Gap | Required For | Effort to Add |
|-----|-------------|--------------|
| Client-side exception tracking | A-6 (error rate) | Medium -- PostHog autocaptures some; may need explicit `reportErrorClient` wiring to PostHog |
| API 5xx tracking in PostHog | A-6 (error rate) | Low -- `api_performance` event exists in analytics.ts but verify it fires on errors |
| `feedback_submitted` event call site | B-3 (feedback backlog) | Low -- verify the feedback widget calls this event |
| Survey infrastructure (NPS/satisfaction) | B-1, B-4 | Low -- create PostHog survey via dashboard, no code needed |

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-03-31 | Initial | Created beta gate criteria document (PRD 77 deliverable). 20 gates across 5 categories. PostHog event audit complete. Benchmark sources cited. |
