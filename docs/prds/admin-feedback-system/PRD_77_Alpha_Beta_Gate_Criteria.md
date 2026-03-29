# PRD 77: Alpha-to-Beta Gate Criteria

> **Order:** 77
> **Status:** 📋 Proposed
> **Type:** Architecture (Strategy)
> **Dependencies:** PRD 71 (Alpha Verification Gate)
> **Blocks:** PRD 79 (Launch Marketing Content)
> **Sprint:** F, Track 2 (F2.1)

---

## 🎯 Objective

Define measurable, pass/fail criteria that must be met before StepLeague transitions from alpha (friends & family) to public beta (strangers via LinkedIn, Reddit, Product Hunt). The output is a criteria document with quantitative gates, qualitative gates, infrastructure readiness checks, and a feature completeness checklist — providing Vasso with a data-driven framework for making the go/no-go decision.

**Problem Solved:** Without explicit gate criteria, the alpha-to-beta transition becomes a gut feeling. This creates two risks: launching too early (strangers hit critical bugs, first impression is ruined, Product Hunt launch is wasted) or launching too late (perfectionism delays growth while motivation decays). Clear pass/fail metrics remove ambiguity and let the data speak.

---

## ⚠️ Research-First Mandate

Before implementing this PRD, the agent MUST conduct intensive research into all relevant aspects — industry benchmarks for alpha-to-beta transitions, indie app launch metrics, PostHog query capabilities for measuring gates, comparable fitness app retention benchmarks, and mobile performance thresholds for emerging markets. This research phase should directly inform the gate criteria and produce the best possible outcome. Do not skip or shortcut the research phase.

---

> **Session note**: This PRD runs in its own Claude Code session. Read the shared context file first. Do NOT update PRD_00_Index.md or CHANGELOG.md — the orchestrator session handles those to prevent conflicts.

## ⚠️ Agent Context

| File | Purpose |
|------|---------|
| docs/prds/SPRINT_EFG_CONTEXT.md | **READ FIRST** — Shared context for PRDs 70-80: business decisions, cross-PRD dependencies, architectural patterns, orchestration protocol |
| `docs/prds/admin-feedback-system/PRD_49_Alpha_Launch_Checklist.md` | Staged rollout gates (5 → 20 → 50 users), alpha metrics definitions, feedback triage categories |
| `docs/ALPHA_READINESS_AUDIT.md` | Feb 2026 audit — baseline of what was verified before alpha |
| `docs/prds/admin-feedback-system/PRD_71_Alpha_Verification_Gate.md` | Alpha verification pass — must be complete before this PRD applies |
| `docs/prds/admin-feedback-system/PRD_72_Payment_Provider_Research.md` | Payment provider selection — informs infrastructure readiness gate |
| `src/lib/analytics/posthog.ts` | PostHog client configuration — what events are trackable |
| `src/components/analytics/PageViewTracker.tsx` | Page view tracking — basis for DAU measurement |
| `.claude/skills/analytics-tracking/SKILL.md` | PostHog event patterns, proxy attribution |
| `.claude/skills/architecture-philosophy/SKILL.md` | Systems thinking, future-proofing principles |

### MCP Servers

| Server | Purpose |
|--------|---------|
| **PostHog MCP** | Query existing events, verify gate metrics are measurable, prototype gate-checking queries |

### Task-Optimized Structure

| Phase | Mode | Task |
|-------|------|------|
| 1 | `[READ-ONLY]` | Research industry benchmarks for alpha-to-beta transitions and indie app metrics `[PARALLEL with 2]` |
| 2 | `[READ-ONLY]` | Audit PostHog events and query capabilities to confirm each proposed gate is measurable `[PARALLEL with 1]` |
| 3 | `[READ-ONLY]` | Review PRD 49 staged rollout gates and alpha metrics definitions `[SEQUENTIAL]` |
| 4 | `[READ-ONLY]` | Research fitness/health app retention benchmarks and SA mobile performance data `[PARALLEL with 3]` |
| 5 | `[WRITE]` | Write criteria document with pass/fail gates, thresholds, and decision framework `[SEQUENTIAL]` |

---

## 🏗️ Detailed Feature Requirements

### Section A: Quantitative Gates — 6 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **A-1** | **Minimum DAU threshold defined** | Need a measurable signal that alpha has enough active usage to validate core loops | DAU threshold documented with measurement method (PostHog query), observation window, and rationale citing comparable indie app benchmarks |
| **A-2** | **Submission rate threshold defined** | Step submissions are the core action — low submission rate means the product is not sticky | Submissions-per-active-user-per-day threshold documented with minimum observation window and acceptable variance |
| **A-3** | **D1 retention threshold defined** | Day-1 retention signals whether first session is compelling enough for strangers | D1 retention percentage threshold documented with PostHog cohort query method and benchmark source |
| **A-4** | **D7 retention threshold defined** | Day-7 retention signals whether the weekly loop (leaderboard resets) drives return visits | D7 retention percentage threshold documented with PostHog cohort query method and benchmark source |
| **A-5** | **Bug count threshold defined** | Open critical/high bugs indicate the product is not stable enough for strangers | Maximum open P0 and P1 bug counts defined, with classification criteria and tracking method |
| **A-6** | **Error rate threshold defined** | Server-side and client-side error rates indicate systemic instability | Maximum acceptable error rates documented (API 5xx rate, client-side exception rate) with PostHog/monitoring query methods |

### Section B: Qualitative Gates — 4 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **B-1** | **User feedback sentiment criteria defined** | Need signal that alpha testers find core value, not just tolerating bugs | Minimum NPS or satisfaction threshold documented, with collection method (PostHog survey, feedback widget, or manual) |
| **B-2** | **Core flow completion rate defined** | Strangers must be able to complete signup-to-first-submission without help | Minimum unassisted completion rate threshold documented with funnel query method |
| **B-3** | **Feedback triage backlog criteria defined** | Unprocessed feedback signals a team that cannot keep up — dangerous before scaling | Maximum unprocessed feedback items threshold and triage SLA documented |
| **B-4** | **Alpha tester recommendation signal defined** | Would alpha testers recommend this to a stranger? Direct proxy for beta readiness | Collection method defined (survey question, informal poll), minimum positive response threshold set |

### Section C: Infrastructure Readiness — 5 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **C-1** | **Payment infrastructure status gate defined** | PRDs 74-76 cover payment — beta ideally needs at least basic payment working | Clear statement of payment readiness requirement: hard gate (must work) or soft gate (documented workaround acceptable) with rationale |
| **C-2** | **Monitoring and alerting gate defined** | Strangers will not report bugs — monitoring must catch issues proactively | Required monitoring coverage documented: uptime checks, error alerting, performance degradation alerts |
| **C-3** | **Error rate baseline gate defined** | Need a healthy baseline before inviting strangers who will increase load | Acceptable API error rate, p95 response time, and client exception rate documented with measurement method |
| **C-4** | **Database scalability gate defined** | Alpha at 50 users is different from beta at 500+ — schema and queries must handle growth | Load threshold validated (concurrent users, query performance at projected scale), RLS policy audit complete |
| **C-5** | **Security readiness gate defined** | Strangers are adversarial — GDPR consent, input validation, auth hardening all matter | Security checklist with pass/fail items: GDPR consent flow, HTTPS everywhere, auth token handling, RLS coverage |

### Section D: Feature Completeness — 5 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **D-1** | **Core feature checklist defined** | Which features MUST work before strangers use the app? | Enumerated list of features with pass/fail status requirement — each feature has a specific verification test |
| **D-2** | **Known limitations documented** | Beta users need to know what is not ready yet — transparency prevents frustration | List of intentional limitations with user-facing messaging strategy (in-app banner, beta badge, changelog link) |
| **D-3** | **Onboarding completeness gate defined** | Strangers have zero context — onboarding must work without Vasso explaining things | Onboarding flow covers: what StepLeague is, how to submit steps, how leaderboards work, what leagues are |
| **D-4** | **Mobile experience gate defined** | SA users on slower connections are the primary audience — mobile must be first-class | Performance budgets defined: LCP, FID/INP, CLS thresholds for mobile on 3G; tested with throttled connection |
| **D-5** | **Error UX gate defined** | Strangers who hit errors and see nothing will leave — error states must be handled | All critical paths have user-facing error messages, retry options, and no blank screens on failure |

### Section E: Decision Framework — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **E-1** | **Gate evaluation process documented** | Who checks the gates, how often, and what triggers a review? | Process documented: evaluation cadence, data pull method (PostHog dashboard or manual queries), reviewer (Vasso) |
| **E-2** | **Pass/fail aggregation rules defined** | Some gates are hard blockers, others are advisory — need clear rules | Each gate classified as HARD (must pass) or SOFT (can proceed with documented risk), overall pass rule defined (e.g., all hard gates pass + 80% soft gates) |
| **E-3** | **Rollback criteria defined** | If beta goes wrong, when do you pull back to alpha-only? | Rollback triggers documented: error rate spike threshold, critical bug count, user complaint volume that triggers pause |

---

## ✅ Success Criteria

| Metric | Target | Verification Method |
|--------|--------|---------------------|
| All quantitative gates have measurable thresholds | 6/6 gates defined with PostHog query methods | Each gate has a documented query that returns a number comparable to the threshold |
| All qualitative gates have collection methods | 4/4 gates defined with data source | Each gate references a specific survey, funnel, or feedback mechanism |
| Infrastructure readiness is checklistable | 5/5 items have pass/fail criteria | Each item can be verified by running a command, checking a dashboard, or querying an API |
| Feature completeness is enumerated | Every must-have feature listed | Checklist exists with no ambiguous items — each is testable |
| Decision framework is actionable | Vasso can evaluate gates without agent help | Process is documented clearly enough for a solo founder to run the evaluation |
| Gates reference industry benchmarks | Thresholds cite sources, not guesses | Each numeric threshold references a benchmark source (blog, report, comparable app data) |

---

## 🔍 Systems/Design Considerations

1. **Gate Criteria as Living Document** — The criteria document produced by this PRD should be a standalone file (e.g., `docs/BETA_GATE_CRITERIA.md`) that can be checked and updated independently of this PRD. Once the PRD is complete, the criteria doc becomes the operational artifact. Consider making it a checklist format similar to PRD 49.

2. **PostHog Query Feasibility** — Not all proposed gates may be measurable with current PostHog event instrumentation. The research phase must audit which events exist and flag any gaps requiring new tracking code before gates can be evaluated. Reference `analytics-tracking` skill for event naming conventions.

3. **Small Sample Size Reality** — With 5-50 alpha users, statistical significance is impossible. The criteria must account for this: thresholds should be expressed as "X out of Y users" rather than percentages, and qualitative signals carry more weight than quantitative ones at this scale.

4. **PRD 49 Continuity** — PRD 49 defines staged rollout gates (5 → 20 → 50 users). This PRD picks up where PRD 49 ends — the criteria here apply after the 50-user alpha gate is passed. Ensure no overlap or contradiction between PRD 49's gates and this PRD's gates.

---

## 💡 Proactive Considerations

1. **Automated Gate Checking via PostHog Queries** — Define each quantitative gate as a saved PostHog insight or dashboard. This allows Vasso to open a single dashboard and see green/red status for each gate rather than running manual queries. The PostHog MCP can be used to create these insights programmatically during implementation.

2. **Progressive Beta Expansion** — Beta should not be all-or-nothing. Define expansion tiers similar to PRD 49's alpha tiers: e.g., 50 → 200 → 1000 users, with re-evaluation at each tier. Each tier may have stricter gates (e.g., D7 retention threshold increases as sample size grows and statistical confidence improves).

3. **Rollback Criteria and Circuit Breakers** — Define specific thresholds that trigger an automatic pause on new beta invitations: e.g., if API error rate exceeds 5% for 1 hour, if 3+ users report the same critical bug within 24 hours, or if D1 retention drops below a floor. This prevents a bad launch from getting worse.

4. **Beta-Specific Feature Flags** — Plan for features that should only be visible to beta users (not alpha), or features that should be hidden during early beta. PostHog feature flags can gate these. Document which features are candidates for flag-gating so the implementation agent can set them up.

5. **Performance Budgets for SA Mobile** — South African users on MTN, Vodacom, or Cell C may experience 150-300ms RTT and 1-5 Mbps bandwidth. Define explicit performance budgets: LCP < 2.5s on 3G, total page weight < 500KB, no blocking requests over 1s. These are harder gates than generic web performance standards.

6. **Feedback Triage Process Scaling** — Alpha feedback from friends is casual (WhatsApp messages). Beta feedback from strangers needs structure: in-app feedback widget with categorization, PostHog survey for NPS, and a triage SLA (respond within 48h). Define the minimum feedback infrastructure that must exist before beta.

7. **GDPR/POPIA Readiness for Strangers** — Alpha with friends can defer GDPR consent (low risk). Beta with strangers cannot — South African users fall under POPIA, EU users under GDPR. Define the minimum privacy compliance gate: cookie consent banner, privacy policy updated for data processing, data deletion request mechanism.

8. **Monitoring Alert Configuration** — Define the minimum alert set that must be configured before beta: Vercel deployment failure, API error rate spike (PostHog or Vercel), database connection limit approaching, and Supabase storage quota approaching. Strangers generate unpredictable load patterns — monitoring must catch issues before users report them.

---

## 📋 Documentation Update Checklist

- [ ] PRD_00_Index.md — Add PRD 77 as Proposed in Sprint F Track 2
- [ ] CHANGELOG.md — Log PRD 77 creation
- [ ] ROADMAP.md — Reference beta gate criteria under launch planning
- [ ] `docs/BETA_GATE_CRITERIA.md` — The operational criteria document produced by this PRD
- [ ] **Git commit** — `docs(prd): PRD 77 — Alpha-to-beta gate criteria`

---

## 📚 Best Practice References

- **Staged launches:** Every gate should be re-evaluated at each expansion tier. What passes at 50 users may fail at 500 — set thresholds that scale with audience size.
- **Indie app benchmarks:** For solo-developer apps, 20-30% D1 retention and 10-15% D7 retention are realistic early targets. Do not use enterprise SaaS benchmarks (40%+ D7) — they reflect mature products with marketing budgets.
- **Measurement before optimization:** Every gate must be measurable with current tooling before it is set. An unmeasurable gate is worse than no gate — it creates false confidence.
- **Hard vs. soft gates:** Classify each criterion explicitly. Hard gates are non-negotiable (security, core flow works). Soft gates inform the decision but do not block (retention slightly below target, NPS borderline).
- **Rollback planning:** The best launch plans include a documented retreat path. Define what "pulling back" looks like: disable signup for new users, revert to invite-only, or pause marketing while fixing issues.
- **SA mobile context:** Emerging market mobile performance requires explicit budgeting. Generic "fast enough" is not sufficient — define specific thresholds for 3G connections with 200ms+ RTT.

---

## 🔗 Related Documents

- [PRD 49: Alpha Launch Checklist](./PRD_49_Alpha_Launch_Checklist.md) — Alpha staged rollout gates (5 → 20 → 50), predecessor to this PRD
- [PRD 71: Alpha Verification Gate](./PRD_71_Alpha_Verification_Gate.md) — Must be complete before this PRD applies
- [PRD 72: Payment Provider Research](./PRD_72_Payment_Provider_Research.md) — Informs infrastructure readiness gate
- PRD 74-76: Payment implementation PRDs — Payment infrastructure gates
- PRD 79: Launch Marketing Content — Blocked by this PRD
- [ALPHA_READINESS_AUDIT.md](../../../docs/ALPHA_READINESS_AUDIT.md) — Baseline audit for alpha readiness

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-03-29 | Initial | Created PRD — alpha-to-beta gate criteria with quantitative, qualitative, infrastructure, and feature completeness gates |
