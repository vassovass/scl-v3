# PRD 75: Pay Gate UI & Enforcement

> **Order:** 75
> **Status:** 📋 Proposed
> **Type:** Feature
> **Dependencies:** PRD 74 (Pay Gate Schema & Config)
> **Blocks:** PRD 76 (Subscription Management)
> **Sprint:** F, Track 1 (F1.2)

---

## 🎯 Objective

Deliver the user-facing paywall experience that activates when a league exceeds the free member limit (3 members). This includes the paywall UI shown during league creation and league join flows, the payment checkout integration with the provider chosen in PRD 72, webhook handling for payment lifecycle events, and the enforcement logic that gates league membership based on subscription status. The output is a set of UI components, API routes, and webhook handlers that convert free users to paying customers without disrupting existing free-tier leagues.

**Problem Solved:** PRD 74 created the billing schema and SuperAdmin controls, but no user-facing paywall exists. League owners can add unlimited members with no payment prompt. There is no checkout flow, no payment processing, and no webhook handling. Without this PRD, the freemium model exists only in the database — users never encounter it.

---

## ⚠️ Research-First Mandate

Before implementing this PRD, the agent MUST conduct intensive research into all relevant aspects — existing league join/create flows, payment UX best practices for freemium apps, paywall conversion patterns, mobile payment form design, webhook security patterns, and idempotency requirements. This research phase should directly inform the implementation and produce the best possible outcome. Do not skip or shortcut the research phase.

---

> **Session note**: This PRD runs in its own Claude Code session. Read the shared context file first. Do NOT update PRD_00_Index.md or CHANGELOG.md — the orchestrator session handles those to prevent conflicts.

## ⚠️ Agent Context

| File | Purpose |
|------|---------|
| docs/prds/SPRINT_EFG_CONTEXT.md | **READ FIRST** — Shared context for PRDs 70-80: business decisions, cross-PRD dependencies, architectural patterns, orchestration protocol |
| `src/app/(authenticated)/leagues/create/page.tsx` | League creation page — must integrate upgrade prompt when relevant |
| `src/app/(authenticated)/leagues/[id]/page.tsx` | League detail page — join flow lives here or is triggered from here |
| `src/app/(authenticated)/leagues/[id]/join/` | League join flow — must check member count against tier limit |
| `src/app/(public)/pricing/page.tsx` | Static pricing page (PRD 33) — should fetch tiers from DB after PRD 74 |
| `src/hooks/useAppSettings.ts` | `useAppSettings()` — reads `pay_gate_global` and `free_tier_member_limit` |
| `src/hooks/useFeatureFlag.ts` | `useFeatureFlag('pay_gate_enabled')` — global pay gate toggle |
| `src/lib/api/handler.ts` | `withApiHandler` — all API routes including webhook endpoints |
| `src/lib/errors.ts` | `AppError` class — standardized error handling |
| `src/lib/supabase/admin.ts` | `adminClient` — server-side DB access bypassing RLS |
| `src/hooks/useOfflineQueue.ts` | `useOfflineQueue` — offline-first mutation queuing |
| `src/components/ui/` | shadcn/ui components — use for all paywall UI |
| `globals.css` | CSS variables for design system tokens (dark/light mode) |
| `docs/prds/admin-feedback-system/PRD_74_Pay_Gate_Schema_Config.md` | Schema this PRD consumes: `subscription_tiers`, `league_subscriptions`, `payment_history` |
| `docs/prds/admin-feedback-system/PRD_72_Payment_Provider_Research.md` | Payment provider selection — determines which SDK/API to integrate |
| `docs/prds/admin-feedback-system/PRD_33_Pricing_HowItWorks.md` | Pricing tier definitions and freemium model |

### Skills

| Skill | Purpose |
|-------|---------|
| `design-system` | CSS variables, dark/light mode, shadcn/ui component patterns |
| `form-components` | FormInput, FormSelect — use for payment form fields if applicable |
| `api-handler` | `withApiHandler` pattern for webhook and checkout API routes |
| `error-handling` | `AppError` class, error codes, `normalizeError`, `CopyableError` |
| `analytics-tracking` | PostHog event patterns for conversion funnel tracking |
| `architecture-philosophy` | Systems thinking, modularity, future-proofing |

### MCP Servers

| Server | Purpose |
|--------|---------|
| **Supabase MCP** | Query subscription tables, verify RLS, test webhook data persistence |
| **PostHog MCP** | Verify analytics events fire correctly for conversion funnel |

### Task-Optimized Structure

| Phase | Mode | Task |
|-------|------|------|
| 1 | `[READ-ONLY]` | Research existing league create/join flows, member count logic, and invite patterns `[PARALLEL with 2]` |
| 2 | `[READ-ONLY]` | Research payment UX best practices: paywall conversion patterns, mobile checkout design, webhook security `[PARALLEL with 1]` |
| 3 | `[READ-ONLY]` | Audit PRD 74 schema to understand tier data shape, subscription status values, and pay gate override logic `[SEQUENTIAL]` |
| 4 | `[WRITE]` | Build paywall UI components: `PaywallBanner`, `UpgradePrompt`, `PricingCard`, `CheckoutModal` `[PARALLEL with 5]` |
| 5 | `[WRITE]` | Build API routes: `/api/checkout/create-session`, `/api/webhooks/payment` `[PARALLEL with 4]` |
| 6 | `[WRITE]` | Integrate paywall into league creation flow (show pricing when 4th member would be added) `[SEQUENTIAL]` |
| 7 | `[WRITE]` | Integrate paywall into league join flow (block join if at free tier capacity, show upgrade prompt) `[SEQUENTIAL]` |
| 8 | `[WRITE]` | Build `useLeagueSubscription` hook and `usePayGate` hook for consuming subscription state `[SEQUENTIAL]` |
| 9 | `[WRITE]` | Add analytics events for conversion funnel (paywall_shown, checkout_started, payment_completed, payment_failed) `[SEQUENTIAL]` |
| 10 | `[READ-ONLY]` | Verify: `npx tsc --noEmit`, `npx vitest run`, dark/light mode, mobile responsiveness, webhook idempotency `[SEQUENTIAL]` |

---

## 🏗️ Detailed Feature Requirements

### Section A: Paywall UI — 7 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **A-1** | **`PaywallBanner` component** displays inline when a league is at free tier capacity — shows member count, tier limit, and upgrade CTA | Users have no visual signal that they have reached the free limit | Banner renders when `currentMembers >= freeTierLimit`, uses design system tokens, responsive on mobile, hidden when `pay_gate_enabled` is false |
| **A-2** | **`UpgradePrompt` component** renders as a modal or sheet when a user attempts an action blocked by the free tier (invite 4th member, join full league) | Blocked actions give no explanation or path forward | Prompt explains why the action is blocked, shows available paid tiers with pricing, provides a clear CTA to start checkout |
| **A-3** | **`PricingCard` component** renders a single tier with name, price (monthly/annual toggle), member limit, features list, and select button | No reusable component for displaying tier information in context | Card fetches tier data from `subscription_tiers` table, supports dark/light mode, shows annual savings percentage, handles loading and error states |
| **A-4** | **Billing interval toggle** (monthly/annual) on upgrade prompts shows price difference and savings | Users cannot compare billing options at the decision point | Toggle switches all displayed prices simultaneously, annual savings shown as percentage or dollar amount, selection persists into checkout |
| **A-5** | **Loading states** for all payment UI — skeleton loaders while fetching tier data, spinner during checkout redirect | Blank or frozen UI during async operations destroys trust | Every async boundary has a visible loading indicator; no layout shift when data loads |
| **A-6** | **Error states** for payment UI — network failures, expired sessions, declined cards, provider errors | Payment errors with no user feedback cause abandonment and support tickets | All error paths render user-friendly messages via `AppError` patterns, with retry options where applicable and `CopyableError` for unrecoverable failures |
| **A-7** | **Mobile-first layout** — paywall components are designed for 375px viewport first, enhanced for tablet/desktop | Majority of StepLeague users are on mobile; payment UX must not require horizontal scrolling or tiny tap targets | All paywall components pass visual inspection on 375px viewport; tap targets are minimum 44x44px; no horizontal overflow |

### Section B: Payment Flow — 6 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **B-1** | **Checkout session creation** via `/api/checkout/create-session` — accepts `league_id`, `tier_id`, `billing_interval`, returns provider checkout URL or client secret | No server-side endpoint to initiate payment | API route uses `withApiHandler` with `auth: 'user'`, validates league ownership, checks tier exists and is active, returns checkout data; rejects if pay gate is disabled |
| **B-2** | **Checkout redirect or embedded form** — user is sent to provider-hosted checkout or sees an embedded payment form | No mechanism to collect payment information | Checkout experience follows provider's recommended integration (hosted checkout preferred for PCI compliance); league_id passed as metadata so webhooks can associate payment with league |
| **B-3** | **Post-checkout success page** — user returns from checkout and sees confirmation with subscription details | Users have no feedback after completing payment | Success page shows: tier name, billing interval, next billing date, member limit change; league page reflects upgraded status immediately or within seconds |
| **B-4** | **Post-checkout cancellation handling** — user abandons checkout and returns to the app | Abandoned checkouts leave the app in an ambiguous state | Return URL brings user back to the league page with no state corruption; paywall remains visible since no payment was completed |
| **B-5** | **Duplicate checkout prevention** — if a league already has an active subscription, the checkout endpoint rejects the request | Double-charging a league owner erodes trust and creates refund overhead | API route checks `league_subscriptions` for active/trialing status before creating a session; returns appropriate error if subscription exists |
| **B-6** | **Currency display** matches the tier's configured currency, formatted with proper locale conventions | Displaying raw cents or wrong currency symbols confuses users | Prices display as `$4.99/mo` (not `499 cents`), using `Intl.NumberFormat` with currency from tier data |

### Section C: Webhook Handling — 6 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **C-1** | **Webhook endpoint** at `/api/webhooks/payment` receives provider payment events | No server-side handler for payment lifecycle events | Route uses `withApiHandler` with `auth: 'none'` (webhooks are unauthenticated but signature-verified), accepts POST requests |
| **C-2** | **Signature verification** validates every incoming webhook against the provider's signing secret | Unverified webhooks allow attackers to fake payment confirmations | Every request is verified using the provider's signature mechanism before processing; invalid signatures return 400 and are logged |
| **C-3** | **Idempotent event processing** — duplicate webhook deliveries do not create duplicate records or state changes | Providers retry webhooks on timeout; non-idempotent handlers cause double-activations or double-charges in the database | Each event is checked against `payment_history.external_payment_id` or a dedicated idempotency key before processing; duplicate events return 200 without side effects |
| **C-4** | **Subscription activation on payment success** — webhook updates `league_subscriptions` to `active` status with period dates | Paying does not activate the subscription without webhook processing | `checkout.session.completed` (or equivalent) event sets `league_subscriptions.status = 'active'`, populates `current_period_start/end`, stores `external_subscription_id` |
| **C-5** | **Payment failure handling** — webhook updates subscription to `past_due`, records failure in `payment_history` | Failed renewals silently degrade without notifying the system | `payment_intent.payment_failed` (or equivalent) event sets status to `past_due`, writes failure reason to `payment_history.failure_reason`, league retains access during grace period (from `subscription_tiers.grace_period_days`) |
| **C-6** | **Raw event logging** — every webhook payload is stored for debugging and reconciliation | Webhook events are ephemeral; if processing fails, the original data is lost | Raw payload stored in `payment_history.metadata` JSONB or a dedicated webhook log; queryable by `external_payment_id` for support investigations |

### Section D: League Flow Integration — 6 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **D-1** | **League creation flow** shows pricing context when a league would start on the free tier | League creators have no awareness of the freemium model until they hit the wall | Creation flow includes a note about the free tier limit (e.g., "Free for up to 3 members — upgrade anytime"); does not block creation |
| **D-2** | **League invite flow** blocks the 4th member invite with an upgrade prompt if the league is on the free tier | League owners can invite unlimited members with no payment | When `currentMembers >= freeTierMemberLimit` and no active paid subscription, the invite action triggers `UpgradePrompt` instead of sending the invite |
| **D-3** | **League join flow** blocks joining if the league is at free tier capacity | Users accept a join link but the league is full on the free tier | Join endpoint checks member count against tier limit; if at capacity, user sees `UpgradePrompt` explaining that the league owner needs to upgrade; join is queued (not rejected) so it completes automatically after upgrade |
| **D-4** | **`useLeagueSubscription` hook** provides subscription state for any league — tier, status, member limit, capacity remaining | Multiple components need subscription data but each fetches independently | Hook returns `{ tier, status, memberLimit, currentMembers, capacityRemaining, isAtCapacity, isPayGateActive }`, caches via SWR or React Query, revalidates on subscription change |
| **D-5** | **`usePayGate` hook** combines feature flag, app settings, and per-league override into a single boolean | Pay gate logic is scattered — feature flag, global setting, and per-league override must all be checked | Hook returns `{ isPayGateActive, freeTierLimit, reason }` by evaluating: `pay_gate_enabled` flag AND (`pay_gate_global` setting OR `league.pay_gate_override === true`), with `false` override taking precedence |
| **D-6** | **Existing leagues without subscriptions remain free** — absence of a `league_subscriptions` row means free tier, not blocked | Activating the pay gate could accidentally lock out all existing leagues | When `usePayGate` is active and a league has no subscription row, it is treated as free tier with the default member limit; no backfill migration required |

---

## ✅ Success Criteria

| Metric | Target | Verification Method |
|--------|--------|---------------------|
| Paywall appears at capacity | `PaywallBanner` visible when league has 3+ members on free tier | Manual test: create league, add 3 members, verify banner |
| Upgrade prompt blocks correctly | 4th member invite triggers `UpgradePrompt`, not a silent failure | Manual test: attempt 4th invite on free tier |
| Checkout completes | Full round-trip: CTA click -> checkout -> payment -> subscription active | End-to-end test with provider test mode |
| Webhook processes payment | Webhook receipt creates `payment_history` row and activates subscription | Trigger test webhook, verify DB state via Supabase MCP |
| Idempotency holds | Duplicate webhook does not create duplicate records | Send same webhook twice, verify single `payment_history` row |
| Signature verification rejects forgeries | Invalid webhook signature returns 400 | Send unsigned POST to webhook endpoint |
| Pay gate toggle works | Disabling `pay_gate_enabled` hides all paywall UI | Toggle flag off, verify no paywall components render |
| Per-league override works | League with `pay_gate_override = false` is free regardless of global setting | Set override, verify league bypasses paywall |
| Existing leagues unaffected | Leagues without subscription rows treated as free tier | Activate pay gate, verify no existing leagues are blocked |
| TypeScript passes | Zero type errors | `npx tsc --noEmit` exit code 0 |
| Tests pass | All existing + new tests pass | `npx vitest run` exit code 0 |
| Dark/light mode | All paywall UI renders correctly in both themes | Visual inspection in both modes |
| Mobile responsive | All paywall UI usable on 375px viewport | Visual inspection on mobile viewport |

---

## 🔍 Systems/Design Considerations

1. **Provider Abstraction** — The payment integration should use an abstraction layer (e.g., `src/lib/payments/provider.ts`) so the checkout session creation and webhook parsing are isolated behind an interface. If the provider changes (per PRD 72 fallback recommendation), only the adapter changes — not the hooks, UI components, or API routes. This mirrors PRD 74's provider-agnostic schema design.

2. **Pay Gate Cascade Logic** — The pay gate decision follows a cascade: (1) `pay_gate_enabled` feature flag must be true, (2) global `pay_gate_global` app setting must be true OR per-league `pay_gate_override` must be true, (3) per-league `pay_gate_override = false` always wins (force-free). This three-layer approach gives SuperAdmin granular control. The `usePayGate` hook encapsulates this logic so no component implements it independently.

3. **Pricing Page Transition** — After this PRD, the static pricing page (PRD 33) should fetch tier data from the `subscription_tiers` table established in PRD 74. This ensures SuperAdmin pricing changes reflect immediately on the public page and in the paywall UI. A single data source eliminates drift between what users see on the pricing page and what they are charged.

4. **Offline Considerations** — Payment initiation requires connectivity, but the paywall UI state (whether to show the banner) should work offline using cached subscription data. `useOfflineQueue` is not appropriate for payment mutations (cannot queue a credit card charge), but the decision to show/hide paywall components should not break when offline.

---

## 💡 Proactive Considerations

| # | Consideration | Why It Matters |
|---|---------------|----------------|
| 1 | **Offline payment queuing is intentionally excluded** — Payment mutations require real-time connectivity and cannot be queued offline. However, the *decision* to show paywall UI should use cached subscription data so the UX does not break when offline. If a user is offline and tries to pay, show a clear "You need an internet connection to complete payment" message rather than silently failing. |
| 2 | **Failed payment UX requires a dedicated recovery flow** — When a renewal fails (`past_due` status), the league owner needs: (a) a banner explaining the issue, (b) a link to update their payment method, (c) a clear grace period countdown ("X days remaining before access is restricted"). Do not simply block the league — the grace period from `subscription_tiers.grace_period_days` (PRD 74) gives owners time to fix payment issues without disrupting their league members. |
| 3 | **Loading states prevent payment trust erosion** — Payment UI is uniquely sensitive to perceived lag. Every async boundary (fetching tiers, creating checkout session, waiting for redirect, processing webhook) needs a visible loading indicator. Use skeleton loaders for tier cards and a full-screen overlay spinner during checkout redirect. Never show a blank screen during a payment flow. |
| 4 | **Currency display must use `Intl.NumberFormat`** — Hard-coding `$` symbols or decimal formatting will break for non-USD currencies if multi-currency is added later (PRD 74 proactive consideration #2). Use `Intl.NumberFormat` with the currency code from the tier data so formatting is locale-aware from day one. Store and calculate in cents, display in formatted currency. |
| 5 | **Receipt emails are the provider's responsibility** — The chosen provider (PRD 72) should handle receipt and invoice emails automatically. Do not build a custom email system for payment receipts. Verify during implementation that the provider's receipt emails include: amount, date, league name (via metadata), and a link to manage the subscription. If the provider does not send receipts, add this as a PRD 76 requirement. |
| 6 | **Payment retry logic lives in the provider, not the app** — Most payment providers handle automatic retry for failed renewals (dunning). The app's responsibility is to reflect the current status (`past_due`) and provide a manual retry CTA ("Retry payment now"). Do not build custom retry scheduling — rely on the provider's dunning configuration and reflect status via webhooks. |
| 7 | **A/B testing paywall copy via feature flags** — The paywall banner text, CTA wording, and upgrade prompt messaging significantly impact conversion. Plan for A/B testing by externalizing copy strings (not hardcoding in components) and using PostHog feature flags to serve variants. Track `paywall_shown`, `upgrade_cta_clicked`, and `checkout_completed` events to measure conversion rate per variant. |
| 8 | **Analytics events for the full conversion funnel** — Instrument every stage: `paywall_banner_shown` (impression), `upgrade_prompt_opened` (intent), `checkout_session_created` (commitment), `checkout_completed` (conversion), `checkout_abandoned` (drop-off), `payment_failed` (friction). These events power the PostHog funnel that measures paywall effectiveness and identifies where users drop off. Without these events, optimization is guesswork. |

---

## 📋 Documentation Update Checklist

- [ ] PRD_00_Index.md — Add PRD 75 as Proposed in Sprint F Track 1
- [ ] CHANGELOG.md — Log PRD 75 creation
- [ ] docs/DATABASE_SCHEMA.md — No schema changes (consumes PRD 74 tables), but document webhook event flow
- [ ] `src/lib/payments/` — New directory; document provider abstraction pattern in code comments
- [ ] No AGENTS.md changes needed (no new code patterns beyond existing conventions)
- [ ] **Git commit** — `docs(prd): PRD 75 — pay gate UI and enforcement`

---

## 📚 Best Practice References

- **Hosted checkout over embedded forms:** Use the provider's hosted checkout page rather than embedding card fields. This eliminates PCI compliance scope, handles 3D Secure automatically, and lets the provider optimize the payment form for conversion. Stripe Checkout, Paddle Checkout, and Lemon Squeezy all recommend hosted flows for SaaS.
- **Webhook idempotency via external ID:** Use the provider's unique event ID (e.g., `evt_xxx`) as an idempotency key. Check if the event has already been processed before executing side effects. This is the standard pattern recommended by Stripe, Paddle, and every major provider.
- **Signature verification is non-negotiable:** Every webhook endpoint must verify the provider's signature before processing. Skipping verification allows attackers to send fake payment confirmations and activate subscriptions without paying. Use the provider's SDK verification function, not custom HMAC logic.
- **Soft paywall over hard block:** Show the paywall as an upgrade prompt rather than a blocking error. Users should understand what they get by upgrading, not just what they cannot do. Frame the paywall positively ("Unlock more members") rather than negatively ("You've hit your limit").
- **Grace periods for failed payments:** Never instantly downgrade a paying customer on first payment failure. Industry standard is 3-14 days of grace period with increasingly urgent notifications. This reduces involuntary churn by 20-40% compared to immediate lockout.
- **Conversion funnel instrumentation:** Every paywall interaction should emit an analytics event. The standard funnel stages are: impression -> engagement -> intent -> conversion -> retention. Without instrumentation, you cannot optimize the paywall and are leaving revenue on the table.

---

## 🔗 Related Documents

- [PRD 33: Pricing & How It Works](./PRD_33_Pricing_HowItWorks.md) — Pricing tier definitions and freemium model
- [PRD 72: Payment Provider Research](./PRD_72_Payment_Provider_Research.md) — Payment provider selection (determines integration SDK)
- [PRD 74: Pay Gate Schema & Config](./PRD_74_Pay_Gate_Schema_Config.md) — Database schema and SuperAdmin controls consumed by this PRD
- PRD 76: Subscription Management (future) — Blocked by this PRD; handles upgrades, downgrades, cancellations, and subscription lifecycle
- [PRD 25: User Preferences](./PRD_25_User_Preferences.md) — `useAppSettings` pattern
- [PRD 26: SuperAdmin Settings](./PRD_26_SuperAdmin_Settings.md) — Feature flag and settings cascade patterns

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-03-29 | Initial | Created PRD — pay gate UI, payment flow, webhook handling, and league flow integration |
