# PRD 76: Subscription Management & Grandfathering

> **Order:** 76
> **Status:** 📋 Proposed
> **Type:** Feature
> **Dependencies:** PRD 74 (Pay Gate Schema & Config), PRD 75 (Pay Gate UI & Payment Flow)
> **Blocks:** None
> **Sprint:** F, Track 1 (F1.3)

---

## 🎯 Objective

Deliver the full subscription lifecycle for StepLeague's per-league billing model — from first checkout through renewal, upgrade, downgrade, cancellation, and reactivation. Critically, implement grandfathering so that when SuperAdmin raises a tier's price, every existing subscriber retains their locked-in rate until they voluntarily change tiers. The output is a subscription state machine enforced server-side, grandfathered pricing logic, pro-rated billing on tier changes, dunning (failed-payment recovery) with configurable grace periods, billing history visible to both league owners and SuperAdmin, and cancellation flows that preserve league access through the paid period.

**Problem Solved:** PRD 74 created the schema (`subscription_tiers`, `league_subscriptions`, `payment_history`) and PRD 75 renders the pay gate UI and checkout flow. But no logic exists to manage what happens *after* a league subscribes: renewals, tier changes, price increases, payment failures, or cancellations. Without this PRD, subscribers who experience a payment failure lose access immediately, league owners who want to upgrade or downgrade have no path to do so, and a SuperAdmin price increase retroactively raises costs for loyal early adopters — destroying trust and increasing churn.

---

## ⚠️ Research-First Mandate
Before implementing this PRD, the agent MUST conduct intensive research into all relevant aspects — SaaS subscription management patterns, grandfathering implementations in billing systems, pro-rating algorithms, churn prevention through grace periods, subscription lifecycle state machines, and comparable indie SaaS billing architectures. This research phase should directly inform the implementation and produce the best possible outcome. Do not skip or shortcut the research phase.

---

> **Session note**: This PRD runs in its own Claude Code session. Read the shared context file first. Do NOT update PRD_00_Index.md or CHANGELOG.md — the orchestrator session handles those to prevent conflicts.

## ⚠️ Agent Context

| File | Purpose |
|------|---------|
| docs/prds/SPRINT_EFG_CONTEXT.md | **READ FIRST** — Shared context for PRDs 70-80: business decisions, cross-PRD dependencies, architectural patterns, orchestration protocol |
| `docs/prds/admin-feedback-system/PRD_74_Pay_Gate_Schema_Config.md` | Schema definitions for `subscription_tiers`, `league_subscriptions`, `payment_history` — the tables this PRD writes to |
| `docs/prds/admin-feedback-system/PRD_72_Payment_Provider_Research.md` | Selected payment provider — determines webhook format, API shape, and pro-ration support |
| `src/lib/api/handler.ts` | `withApiHandler` — all API routes use this; subscription endpoints use `auth: 'authenticated'` or `auth: 'superadmin'` |
| `src/lib/supabase/admin.ts` | `adminClient` — server-side DB access bypassing RLS for webhook handlers and cron jobs |
| `src/hooks/useAppSettings.ts` | `useAppSettings()` — reads SuperAdmin-configurable values (grace period days, pay gate toggle) |
| `src/hooks/useFeatureFlag.ts` | `useFeatureFlag()` — feature flag consumption pattern |
| `src/app/(authenticated)/admin/` | Existing SuperAdmin pages — billing admin views follow this layout |
| `src/lib/adminPages.ts` | Admin nav registry — new admin billing pages must be added here |
| `.claude/skills/api-handler/SKILL.md` | `withApiHandler` pattern reference |
| `.claude/skills/supabase-patterns/SKILL.md` | Database patterns, migrations, RLS policies |
| `.claude/skills/error-handling/SKILL.md` | AppError class, error codes, `normalizeError` |
| `.claude/skills/design-system/SKILL.md` | CSS variables, dark/light mode, shadcn/ui component patterns |
| `.claude/skills/architecture-philosophy/SKILL.md` | Systems thinking, modularity, future-proofing |

### MCP Servers

| Server | Purpose |
|--------|---------|
| **Supabase MCP** | Run migrations, verify data integrity, test RLS policies |

### Task-Optimized Structure

| Phase | Mode | Task |
|-------|------|------|
| 1 | `[READ-ONLY]` | Research SaaS subscription state machines, grandfathering patterns, pro-ration algorithms, dunning best practices `[PARALLEL with 2]` |
| 2 | `[READ-ONLY]` | Review PRD 74 schema, PRD 72 provider selection, existing admin UI patterns, and `withApiHandler` conventions `[PARALLEL with 1]` |
| 3 | `[WRITE]` | Create migration: add `price_locked_at_cents`, `grandfathered_from_tier_version`, and `canceled_at` columns to `league_subscriptions`; add `subscription_events` table for lifecycle audit log `[SEQUENTIAL]` |
| 4 | `[WRITE]` | Implement subscription state machine service with valid transitions and server-side enforcement `[SEQUENTIAL]` |
| 5 | `[WRITE]` | Build grandfathering logic: lock price on subscription creation, honor locked price on renewal, release lock on voluntary tier change `[PARALLEL with 6]` |
| 6 | `[WRITE]` | Build pro-ration calculator for mid-cycle upgrade/downgrade `[PARALLEL with 5]` |
| 7 | `[WRITE]` | Build API routes: upgrade, downgrade, cancel, reactivate, billing history `[SEQUENTIAL]` |
| 8 | `[WRITE]` | Build webhook handler for payment provider events (payment succeeded, failed, subscription updated) `[SEQUENTIAL]` |
| 9 | `[WRITE]` | Build dunning/grace period logic: payment failure → grace period → auto-downgrade `[SEQUENTIAL]` |
| 10 | `[WRITE]` | Build league owner billing history UI and SuperAdmin billing admin views `[PARALLEL with 11]` |
| 11 | `[WRITE]` | Build cancellation flow UI with retention prompts and end-of-period access `[PARALLEL with 10]` |
| 12 | `[READ-ONLY]` | Verify: `npx tsc --noEmit`, `npx vitest run`, dark/light mode, mobile responsiveness, state machine edge cases `[SEQUENTIAL]` |

---

## 🏗️ Detailed Feature Requirements

### Section A: Subscription State Machine — 6 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **A-1** | **Subscription lifecycle modeled as a finite state machine** with states: `trialing`, `active`, `past_due`, `paused`, `canceled`, `expired` | No formal lifecycle — subscription status is a free-text field with no enforced transitions | State machine defines valid transitions (e.g., `active → past_due`, `active → canceled`, `past_due → active`, `past_due → expired`); invalid transitions are rejected server-side with a descriptive error |
| **A-2** | **Every state transition is logged** in a `subscription_events` table (`id`, `league_subscription_id`, `from_status`, `to_status`, `reason`, `metadata` JSONB, `triggered_by` user/system, `created_at`) | No audit trail for why a subscription changed state — debugging billing issues is impossible | Every transition produces an event row; SuperAdmin can view the full event timeline for any subscription |
| **A-3** | **Transition side effects are defined and enforced** — e.g., `active → canceled` sets `canceled_at` and schedules access revocation at `current_period_end`; `past_due → expired` triggers access revocation immediately | Side effects happen inconsistently or are forgotten in some code paths | Each transition has a documented side-effect handler; no state change occurs without its side effects executing |
| **A-4** | **Renewal transitions are automated** — on `current_period_end`, if payment succeeds: extend period, remain `active`; if payment fails: transition to `past_due` | Manual renewal handling is error-prone and unscalable | Automated renewal logic (triggered by payment provider webhook or scheduled job) correctly extends or downgrades subscriptions |
| **A-5** | **Reactivation path exists** — a `canceled` subscription can be reactivated before `current_period_end` (resumes as `active` with no billing change); after expiry, a new subscription must be created | Users who cancel impulsively have no way to undo without re-subscribing | Reactivation API endpoint restores `active` status if called before period end; returns error after expiry |
| **A-6** | **Idempotent webhook processing** — duplicate webhook events from the payment provider do not cause duplicate state transitions or double charges | Payment providers send duplicate webhooks regularly; without idempotency, double-processing corrupts state | Webhook handler checks `external_payment_id` for duplicates before processing; duplicate events are logged but not actioned |

### Section B: Grandfathering & Price Locking — 5 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **B-1** | **Price locked at subscription creation** — when a league subscribes, the current tier price is copied to `league_subscriptions.price_locked_at_cents` | If SuperAdmin raises tier prices, existing subscribers would see their next renewal at the new price | `price_locked_at_cents` is set on subscription creation and used for all renewals; it does not change when `subscription_tiers.monthly_price_cents` changes |
| **B-2** | **Renewals honor the locked price** — the amount charged at renewal equals `price_locked_at_cents`, not the current tier price | Loyal subscribers are penalized for staying subscribed when prices increase | Renewal charge amount matches `price_locked_at_cents`; SuperAdmin can verify by comparing tier price vs. subscription locked price in admin UI |
| **B-3** | **Voluntary tier change resets the price lock** — upgrading or downgrading sets a new `price_locked_at_cents` at the current price of the new tier | Subscribers who change tiers should get the current price of the new tier, not carry over an irrelevant locked price from the old tier | After upgrade/downgrade, `price_locked_at_cents` reflects the new tier's current price at time of change |
| **B-4** | **SuperAdmin visibility into grandfathered subscribers** — admin billing view shows which subscriptions are paying below current tier price, with the locked price and current tier price side-by-side | SuperAdmin has no way to assess revenue impact of grandfathering or identify grandfathered cohorts | Admin view includes a filter/flag for "grandfathered" subscriptions (where `price_locked_at_cents < current tier price`); summary shows total monthly revenue lost to grandfathering |
| **B-5** | **Grandfathering is opt-in by default for price increases** — when SuperAdmin updates a tier price, a confirmation dialog explains that existing subscribers keep their locked price and only new subscribers pay the new price | SuperAdmin might not realize that changing a price does not retroactively affect existing subscribers, leading to incorrect revenue expectations | Price-change confirmation in SuperAdmin UI explicitly states: "X existing subscribers will continue paying $Y/mo. New subscribers will pay $Z/mo." |

### Section C: Tier Upgrade & Downgrade — 5 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **C-1** | **Upgrade is immediate** — when a league owner upgrades (e.g., Standard → Premium), the new tier's features and member limits take effect immediately | League owners expect immediate access to higher-tier features after paying | Tier change takes effect within seconds of successful payment; member limit increases immediately |
| **C-2** | **Upgrade is pro-rated** — the league owner is charged only the price difference for the remainder of the current billing period | Charging full price for a partial period is unfair and generates support requests | Pro-rated amount calculated as: `(new_price - old_price) * (days_remaining / days_in_period)`; displayed to user before confirmation |
| **C-3** | **Downgrade takes effect at period end** — when a league owner downgrades (e.g., Premium → Standard), they retain Premium features until `current_period_end`, then Standard applies | Immediate downgrade feels punitive — the user already paid for the full period | Downgrade is scheduled; features remain at current tier until period ends; next renewal is at the new (lower) tier price |
| **C-4** | **Downgrade member limit enforcement** — if the league has more members than the new tier allows, the league owner is warned before confirming and must reduce membership before the downgrade takes effect | Downgrade could leave a league over its member limit, creating an inconsistent state | Warning message shows current member count vs. new tier limit; downgrade is blocked if members exceed new limit at period end (with reminder notifications) |
| **C-5** | **Tier change history preserved** — every upgrade and downgrade is recorded in `subscription_events` with the old tier, new tier, pro-rated amount, and reason | No record of tier changes makes billing disputes unresolvable | `subscription_events` row created for every tier change with full context in `metadata` JSONB |

### Section D: Billing History — 4 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **D-1** | **League owner billing history page** — accessible from league settings, shows all transactions (charges, refunds, credits) with date, amount, status, and payment method summary | League owners have no visibility into their payment history | Billing history page renders a paginated table of `payment_history` rows for the league; accessible at league settings path |
| **D-2** | **Invoice/receipt generation** — each successful payment produces a downloadable receipt (PDF or formatted HTML) with league name, tier, amount, date, and payment method | League owners (especially B2B) need receipts for expense reporting | "Download receipt" link on each billing history row; receipt includes all required fields |
| **D-3** | **SuperAdmin billing dashboard** — shows all subscriptions across all leagues with filtering by status, tier, and grandfathered flag | SuperAdmin cannot see billing status across the platform | Admin page at `/admin/billing` with filterable, sortable table of all `league_subscriptions` joined with tier and payment data; registered in `adminPages.ts` |
| **D-4** | **Failed payment visibility** — both league owner and SuperAdmin can see failed payments with failure reason and retry status | Failed payments are invisible, leading to unexpected access loss | Failed payments appear in billing history with `failure_reason` displayed; SuperAdmin view highlights leagues in `past_due` status |

### Section E: Cancellation Handling — 5 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **E-1** | **Cancellation is end-of-period** — canceling a subscription sets `canceled_at` but does not revoke access until `current_period_end` | Immediate cancellation wastes the user's remaining paid time and feels hostile | After cancellation, league retains all paid features until period end; UI shows "Your plan will end on [date]" |
| **E-2** | **Cancellation flow includes retention prompt** — before confirming, the user sees what they will lose (member limit drop, feature removal) and is offered alternatives (downgrade, pause) | Users cancel impulsively without understanding consequences; no attempt is made to retain them | Cancellation modal shows: current benefits, what changes after cancellation, and alternative actions (downgrade to Standard, pause subscription) |
| **E-3** | **Post-cancellation league behavior** — after `current_period_end`, league reverts to Free tier behavior (3-member limit enforced, premium features disabled) | No defined behavior for what happens to a league after cancellation creates ambiguity | League treated as Free tier after expiry; if over 3 members, league is in read-only mode (no new members, existing members can still participate) until membership is reduced or a new subscription is created |
| **E-4** | **Cancellation reason collection** — optional exit survey (dropdown + free text) stored in `subscription_events.metadata` | No data on why users cancel — cannot improve retention without understanding churn reasons | Exit survey modal appears after cancellation confirmation; responses stored in event metadata; SuperAdmin can view aggregated cancellation reasons |
| **E-5** | **Win-back window** — within 30 days of cancellation, a returning user can resubscribe at their grandfathered price (if applicable) | Users who cancel and return within a short window lose their locked price, punishing loyalty | If resubscription occurs within 30 days and the user was previously grandfathered, `price_locked_at_cents` is restored to the original locked value |

### Section F: Grace Period & Dunning — 5 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **F-1** | **Configurable grace period** — `subscription_tiers.grace_period_days` (default: 7, SuperAdmin-editable) defines how long a league retains access after a payment fails | Payment failures are common (expired cards, insufficient funds) and should not cause immediate access loss | Grace period value is read from tier config; league retains full access during grace period; banner shown to league owner: "Payment failed — update payment method by [date]" |
| **F-2** | **Dunning sequence triggered on payment failure** — subscription moves to `past_due`; automated notifications sent at configurable intervals (day 1, day 3, day 5 of grace period) | Users are unaware their payment failed until they lose access | Notifications (in-app and/or email) sent at defined intervals during grace period; each notification logged in `subscription_events` |
| **F-3** | **Automatic retry logic** — payment is retried automatically (day 1, day 3, day 5) before grace period expires | Single payment failure should not require manual intervention when the issue is transient (bank timeout, temporary insufficient funds) | Payment retried at configured intervals; successful retry transitions subscription back to `active`; retry attempts logged |
| **F-4** | **Grace period expiry triggers downgrade** — after grace period ends without successful payment, subscription transitions to `expired` and league reverts to Free tier | Indefinite `past_due` status leaves the system in an ambiguous state | Automated job (cron or scheduled function) checks for expired grace periods and transitions subscriptions; league behavior matches post-cancellation (Section E-3) |
| **F-5** | **Payment method update prompt** — during grace period, league owner sees a persistent banner with a direct link to update their payment method | Users need a clear, low-friction path to fix failed payments | Banner component appears on all league pages during `past_due` status; links directly to payment method update flow |

---

## ✅ Success Criteria

| Metric | Target | Verification Method |
|--------|--------|---------------------|
| State machine enforced | All 6 states and valid transitions work; invalid transitions rejected with error | Unit tests for every valid and invalid transition |
| Grandfathering works | Existing subscriber retains locked price after SuperAdmin raises tier price | Integration test: create subscription, raise price, trigger renewal, verify charge amount |
| Pro-ration calculated correctly | Upgrade mid-cycle charges proportional amount | Unit test: 15 days into 30-day period, upgrade from $4.99 to $9.99, verify charge of ~$2.50 |
| Downgrade deferred | Features retained until period end, then new tier applies | Integration test: downgrade mid-cycle, verify features until period end, verify new limits after |
| Grace period respected | League retains access for configured grace days after payment failure | Integration test: fail payment, verify access during grace period, verify downgrade after expiry |
| Billing history renders | League owner sees all transactions; SuperAdmin sees all leagues | Manual test: verify paginated table, filters, receipt download |
| Cancellation end-of-period | Access maintained until period end after cancellation | Integration test: cancel mid-cycle, verify access until period end |
| Win-back pricing | Resubscription within 30 days restores grandfathered price | Integration test: cancel, resubscribe within 30 days, verify locked price restored |
| Webhook idempotency | Duplicate webhooks do not cause duplicate transactions | Unit test: send same webhook twice, verify single state transition |
| TypeScript passes | Zero type errors | `npx tsc --noEmit` exit code 0 |
| Tests pass | All existing + new tests pass | `npx vitest run` exit code 0 |
| Dark/light mode | All new UI renders correctly in both themes | Visual inspection in both modes |
| Mobile responsive | Billing history and cancellation flow usable on 375px viewport | Visual inspection on mobile viewport |

---

## 🔍 Systems/Design Considerations

1. **Grandfathering as a Trust Mechanism** — Grandfathering is not just a billing feature; it is a trust contract with early adopters. StepLeague's indie positioning makes this especially important — early users who pay $4.99/mo when prices later rise to $6.99/mo are brand advocates. Breaking that trust by retroactively raising their price would cause disproportionate churn and negative word-of-mouth. The `price_locked_at_cents` column is the system-of-record for this contract.

2. **Provider Abstraction Continuity** — PRD 74 established `external_*` column naming to remain provider-agnostic. This PRD must continue that pattern: subscription lifecycle logic calls a provider abstraction layer (not Stripe/Paddle/LemonSqueezy directly). If the provider changes, only the adapter changes — the state machine, grandfathering, and dunning logic remain untouched.

3. **State Machine as Single Source of Truth** — All subscription behavior flows from the state machine. No API endpoint, webhook handler, or UI component should directly mutate `league_subscriptions.status` — all changes go through the state machine service, which validates the transition and executes side effects. This eliminates inconsistent state from concurrent mutations.

4. **Pro-Ration Simplicity** — Pro-ration is calculated as a day-based fraction of the billing period. For a 30-day month: `pro_rated_amount = (new_price - old_price) * (days_remaining / total_days_in_period)`. Rounding follows the "round in the customer's favor" principle (round down on charges, round up on credits). All amounts are in cents to avoid floating-point issues.

5. **Cancellation as Deferred, Not Immediate** — Cancellation sets intent (`canceled_at`) but does not revoke access. This is the SaaS industry standard and reduces support burden. The distinction between "canceled" (intent to leave, still has access) and "expired" (access revoked) is critical and must be clear in both code and UI.

---

## 💡 Proactive Considerations

| # | Consideration | Why It Matters |
|---|---------------|----------------|
| 1 | **Subscription state machine as a reusable service** — Extract the state machine into a standalone module (`src/lib/subscriptions/stateMachine.ts`) with pure transition functions, separate from side effects. This enables unit testing without database dependencies and makes the logic portable if StepLeague ever extracts billing into a microservice. The state machine should define: valid states, valid transitions, guard conditions (e.g., "can only cancel if active or past_due"), and side-effect hooks per transition. |
| 2 | **Dunning email sequence** — Beyond in-app notifications, failed payments should trigger email notifications. Design the dunning sequence as a configurable pipeline: Day 0 (immediate in-app banner), Day 1 (email: "Your payment failed"), Day 3 (email: "Action required — update payment method"), Day 5 (email: "Last chance — access will be downgraded tomorrow"). Email templates should be stored as configurable content (not hardcoded) so SuperAdmin can adjust messaging. Consider integrating with the transactional email provider selected in the platform's email infrastructure. |
| 3 | **Annual vs. monthly billing switch** — PRD 74 schema includes both `monthly_price_cents` and `annual_price_cents`. This PRD should define what happens when a subscriber switches between billing intervals mid-subscription. Recommended approach: switching from monthly to annual applies the annual price immediately (pro-rated credit for remaining monthly period applied as discount); switching from annual to monthly takes effect at annual period end (no mid-year refund, but user can choose monthly at renewal). The annual discount (typically ~17%, e.g., $49/yr vs. $4.99/mo) should be prominently displayed during the switch flow to incentivize annual commitments. |
| 4 | **Refund policy definition** — The system must have a clear, documented refund policy. Recommended: full refund within 48 hours of initial subscription, pro-rated refund within the first 14 days, no refund after 14 days (but cancellation is always end-of-period). Refunds are recorded in `payment_history` with `status: 'refunded'` and the original payment linked via `metadata`. SuperAdmin should be able to issue manual refunds from the admin billing dashboard. Define whether refunds restore the grandfathered price lock or if the user must resubscribe at current prices. |
| 5 | **Subscription pause** — Some users want to temporarily stop paying without fully canceling (e.g., during off-season, vacation, budget constraints). The `paused` state in the state machine supports this. Recommended: max pause duration of 90 days, no charge during pause, league access reduced to read-only (members can view history but not log new steps), grandfathered price is preserved through pause. Pause is a retention tool — users who would otherwise cancel may pause instead, and reactivation from pause is frictionless (no re-checkout required). |
| 6 | **Team billing (league owner pays for all members)** — In the current model, the league owner (creator) is the billing entity. Consider whether future iterations should support: (a) a designated "billing admin" who is not the league owner, (b) a company/organization entity that pays for multiple leagues (B2B use case from PRD 34), or (c) shared payment responsibility. For now, enforce "one payer per league" but design the `league_subscriptions` schema to accept a `billing_user_id` (FK to users) separate from the league owner, so this can be extended later without migration. |
| 7 | **Subscription analytics for MRR, churn, and LTV** — Build foundation for key SaaS metrics: Monthly Recurring Revenue (MRR) = sum of all active `price_locked_at_cents` values, Churn Rate = cancellations / active subscriptions per period, Lifetime Value (LTV) = average revenue per subscriber * average subscription duration. These metrics should be queryable from `league_subscriptions` and `payment_history` without additional tables. Consider adding a SuperAdmin analytics widget (or dedicated page) that displays MRR trend, churn rate, and top-tier breakdown. This data is critical for the business analysis (PRD 73) and crowdfunding campaign (PRD 78). |
| 8 | **Data export for accounting** — League owners (especially B2B) and the StepLeague operator both need billing data exports. Provide: (a) CSV export of billing history per league (for league owners), (b) CSV/JSON export of all transactions across all leagues (for SuperAdmin/accounting), (c) Date range filtering on exports. Exports must include: transaction date, amount, currency, tier name, payment method summary, and status. This supports tax reporting, expense reconciliation, and financial auditing. Consider whether exports should include grandfathered vs. current price columns for revenue analysis. |

---

## 📋 Documentation Update Checklist

- [ ] PRD_00_Index.md — Add PRD 76 as Proposed in Sprint F, update total count
- [ ] CHANGELOG.md — Log PRD 76 creation
- [ ] docs/DATABASE_SCHEMA.md — Document `subscription_events` table and new columns on `league_subscriptions`
- [ ] `src/lib/adminPages.ts` — Register `/admin/billing` in admin nav
- [ ] No AGENTS.md changes needed (no new code patterns beyond existing conventions)
- [ ] **Git commit** — `docs(prd): PRD 76 — subscription management and grandfathering`

---

## 📚 Best Practice References

- **Subscription state machines:** Model subscription lifecycle as a finite state machine with explicit transitions. This pattern (used by Stripe Billing, Recurly, Chargebee) prevents invalid states and makes behavior predictable. Define guard conditions on transitions (e.g., "cannot pause if past_due") and side effects (e.g., "on cancel, set canceled_at").
- **Grandfathering:** Lock the price at subscription creation, not at tier creation. The locked price travels with the subscription, not the tier. This is how Basecamp, Netflix (historically), and most SaaS platforms handle legacy pricing — the tier's current price is for new subscribers only.
- **Pro-ration:** Calculate using day-based fractions, rounding in the customer's favor. Stripe's pro-ration algorithm is a good reference: `credit = old_price * (days_remaining / days_in_period)`, `charge = new_price * (days_remaining / days_in_period)`, `net = charge - credit`. Always show the pro-rated amount before the user confirms.
- **Dunning best practices:** The SaaS industry standard is a 3-5 touch dunning sequence over 7-14 days. Baremetrics and ProfitWell research shows that dunning recovery rates peak at 3 retry attempts. In-app banners convert better than email alone — use both.
- **Cancellation UX:** Avoid dark patterns (hiding the cancel button, requiring phone calls). A clear cancellation flow with a retention offer (downgrade or pause) is more effective at reducing churn than making cancellation difficult. Collect cancellation reasons to inform product improvements.
- **Cents-based arithmetic:** Continue PRD 74's convention of integer cents for all monetary calculations. Never convert to floating-point dollars for math — only for display. This eliminates rounding errors in pro-ration, refunds, and grandfathering comparisons.

---

## 🔗 Related Documents

- [PRD 74: Pay Gate Schema & Config](./PRD_74_Pay_Gate_Schema_Config.md) — Schema this PRD writes to; defines `subscription_tiers`, `league_subscriptions`, `payment_history`
- [PRD 72: Payment Provider Research](./PRD_72_Payment_Provider_Research.md) — Provider selection determines webhook format and API shape
- PRD 75: Pay Gate UI & Payment Flow (future) — Renders checkout flow that creates the initial subscription this PRD manages
- [PRD 73: Business Analysis Refresh](./PRD_73_Business_Analysis_Refresh.md) — Revenue projections depend on subscription metrics (MRR, churn, LTV) this PRD enables
- [PRD 33: Pricing & How It Works](./PRD_33_Pricing_HowItWorks.md) — Tier definitions and freemium model
- [PRD 34: B2B Landing](./PRD_34_B2B_Landing.md) — B2B use case informs team billing considerations (Proactive #6)

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-03-29 | Initial | Created PRD — subscription lifecycle, grandfathering, pro-ration, dunning, billing history, and cancellation flows |
