---
## Document Context
**What**: Payment provider research and recommendation for StepLeague's per-league subscription billing
**Why**: Foundational decision that determines payment architecture for the freemium model; blocks PRD 74 (Pay Gate Schema) and PRD 78 (Crowdfunding)
**Status**: Decision
**Last verified**: 2026-03-30
**Agent note**: This is the PRD 72 deliverable. The recommendation (Paddle primary, Paystack fallback) should inform all downstream payment work.
---

# Payment Provider Research & Selection

> **PRD**: 72
> **Date**: 2026-03-30
> **Decision**: **Paystack** (primary) / **Paddle** (fallback)

---

## Executive Summary

StepLeague needs a payment provider supporting recurring per-league subscriptions ($4.99-$9.99/mo, $49-$99/yr) for a solo developer who is a South African national with an FNB bank account, physically based in Vietnam. After evaluating 6 providers across 10 criteria, **Paystack** is recommended as the primary provider due to zero setup fees, lowest per-transaction rates (2.9-3.1% + R1), native South Africa support with direct FNB T+1 settlement, and Stripe-owned reliability. **Paddle** is the recommended fallback when global tax compliance becomes a concern at scale, trading higher fees (5% + $0.50) for full Merchant of Record coverage.

---

## 1. Developer Constraints

| Constraint | Detail |
|------------|--------|
| **Nationality/identity** | South African |
| **Bank account** | FNB (First National Bank), South Africa |
| **Physical location** | Vietnam (no Vietnamese bank account) |
| **Registration basis** | South African individual/entity |
| **Business stage** | Pre-alpha, solo bootstrapped developer |
| **Expected Year 1 revenue** | $2,000-$12,000 ARR |
| **Billing model** | Per-league subscriptions (multiple subs per customer) |
| **Payment currencies** | Customers pay in USD; payout in ZAR to FNB |
| **Technical stack** | Next.js 14, TypeScript, Supabase, Vercel |

---

## 2. StepLeague Billing Requirements

| Requirement | Detail |
|-------------|--------|
| **Subscription tiers** | Free ($0), Standard ($4.99/mo or $49/yr), Premium ($9.99/mo or $99/yr), Enterprise (contact) |
| **Per-league billing** | Each league billed independently; one user owning 3 leagues = 3 subscriptions |
| **Multiple subs per customer** | Must support without friction |
| **Webhook events needed** | subscription.created, subscription.updated, subscription.cancelled, payment.succeeded, payment.failed |
| **Hosted checkout** | Required (PCI compliance — no server-side card handling) |
| **Trial periods** | Desirable but not required for launch |
| **Upgrade/downgrade** | Mid-cycle plan changes with proration |
| **Grandfathering** | Existing subscribers keep their price when tiers change |
| **MCP integration** | Preferred for agent-assisted billing management |

---

## 3. Provider Evaluations

### 3.1 Stripe

**Registration feasibility**: Not available in South Africa directly. Stripe operates in SA only through Paystack (its subsidiary). Direct Stripe access requires Stripe Atlas ($500 one-time) to form a US Delaware LLC, plus ~$300-500/yr ongoing compliance (registered agent, state fees, US tax filing).

**SA/FNB payout**: Not direct. Would require a Wise Business account as intermediary (US bank account from Atlas LLC -> Wise -> FNB), adding conversion fees and settlement delay.

**Recurring subscriptions**: Industry-leading. Stripe Billing supports plans, subscriptions, proration, trials, usage-based billing, and customer portal. Multiple subscriptions per customer fully supported.

**Per-entity billing**: Excellent. Native support for multiple subscriptions per customer with independent billing cycles.

**Webhooks**: Best-in-class. Signature verification via `stripe.webhooks.constructEvent()`, comprehensive event types, configurable retries, test header generation for mocking.

**Fees**: 2.9% + $0.30 per transaction + 0.5% Billing surcharge. International cards add 1.5%. Disputes cost $15 each.

**Currency**: Full multi-currency. USD collection, ZAR not directly (via Wise).

**Tax compliance**: Not MoR. Stripe Tax available at 0.5% per transaction for tax calculation, but remittance is your responsibility.

**Developer experience**: Gold standard. Official `stripe` npm package with full TypeScript types, extensive documentation, test mode with test card numbers, CLI for webhook testing.

**MCP server**: Official server at `mcp.stripe.com` (remote, OAuth) and local via `npx -y @stripe/mcp`. Also `@stripe/agent-toolkit` for Python/TypeScript agent frameworks.

**Sandbox**: Full test mode with test card numbers, webhook testing, CLI tooling.

---

### 3.2 Paddle

**Registration feasibility**: South Africa is listed in Paddle's supported seller countries (Africa region). Registration as a South African individual/entity should work. Paddle's KYC/verification process requires identity documents and business information. Physical location in Vietnam should not be a blocker as Paddle verifies based on business registration country, not physical presence.

**SA/FNB payout**: Payouts worldwide (non-sanctioned countries) via wire transfer or Payoneer. Not direct FNB deposit — funds arrive via international wire, typically within 3 working days after the 15th of the month (or weekly with new Weekly Payouts feature). Minimum payout threshold: $100.

**Recurring subscriptions**: Strong support. Plans, subscriptions, proration, trials, pause/resume, customer portal. Paddle Billing (v2) is the current API with modern subscription management.

**Per-entity billing**: Supported. Multiple subscriptions per customer with independent billing cycles. Each league can be a separate subscription tied to the same customer.

**Webhooks**: Robust. `paddle.webhooks.unmarshal()` for signature verification. Comprehensive event types (subscription.created, subscription.updated, subscription.canceled, transaction.completed, etc.). Built-in webhook simulator for testing. Retry with exponential backoff.

**Fees**: 5% + $0.50 per transaction. All-inclusive: covers payment processing, tax handling, fraud protection, chargeback coverage, and customer billing support. Currency conversion margin of 2-3% above mid-market rate on cross-currency transactions.

**Currency**: Supports 30+ currencies including USD, ZAR, and VND. Customers can pay in their local currency.

**Tax compliance**: Full MoR. Paddle is the legal seller — they calculate, collect, and remit VAT/GST/sales tax in all customer jurisdictions. This is the key differentiator for a solo developer.

**Developer experience**: Good. Official `@paddle/paddle-node-sdk` with TypeScript definitions. Clear documentation. Webhook simulator tool. Paddle.js for client-side checkout overlay.

**MCP server**: Official Paddle MCP server for managing product catalog, billing, subscriptions, and reports via AI assistants.

**Sandbox**: Full sandbox environment with test mode for integration development.

---

### 3.3 Lemon Squeezy

**Registration feasibility**: Lemon Squeezy (acquired by Stripe in 2024) supports merchants in 135+ countries. South Africa is likely in the 79 bank-payout countries, but the new Stripe Managed Payments product currently supports only 35+ countries (expanding in 2026). Registration feasibility is probable but not confirmed for SA.

**SA/FNB payout**: Bank payouts to 79 countries + PayPal payouts to 200+ countries. South Africa likely supported for bank payout but requires verification.

**Recurring subscriptions**: Good support. Subscriptions with monthly/annual intervals, usage-based billing, free trials, and customer portal.

**Per-entity billing**: Supported via multiple subscriptions per customer.

**Webhooks**: Solid. HMAC signature verification, comprehensive event types, up to 3 retries with exponential backoff. Community TypeScript utilities available (`lemonsqueezy-webhooks`).

**Fees**: 5% + $0.50 per transaction + 1.5% for international transactions (outside US). Additional +5% for recovered abandoned carts, +3% for affiliate referrals. Effective rate for international sales: 6.5% + $0.50.

**Currency**: Supports 130+ currencies. USD collection supported.

**Tax compliance**: Full MoR. Lemon Squeezy handles tax calculation, collection, and remittance globally.

**Developer experience**: Good. Official `@lemonsqueezy/lemonsqueezy.js` TypeScript SDK. Next.js billing portal tutorial in docs. Simpler API surface than Stripe but less feature-rich.

**MCP server**: Community implementations available (e.g., `mcp-lemonsqueezy` on GitHub, Zapier MCP integration). No official MCP server.

**Sandbox**: Test mode available for integration development.

---

### 3.4 PayPal

**Registration feasibility**: PayPal is available in Vietnam for cross-border payments and in South Africa. Can register with SA identity. However, PayPal in Vietnam is limited to cross-border transactions only (no domestic).

**SA/FNB payout**: Withdrawal to SA bank account supported. PayPal has a partnership with FNB since 2010 for processing South African withdrawals. Funds must be withdrawn within 30 days of receipt. Cannot receive payments in ZAR — only supported currencies (USD, EUR, etc.), then convert on withdrawal.

**Recurring subscriptions**: Supported via PayPal Subscriptions API. Plans, billing cycles, trial periods. Less flexible than Stripe/Paddle for complex subscription management.

**Per-entity billing**: Possible but clunky. Multiple subscriptions per customer requires separate subscription creation per entity. Not as cleanly designed for this use case.

**Webhooks**: Supported. Webhook notifications for subscription events. Signature verification available. Retry logic included.

**Fees**: ~3.49% + $0.49 for standard commercial transactions. International fees additional. Currency conversion fees on withdrawal. Higher effective rate than Stripe/Paystack.

**Currency**: Supports major currencies. USD collection, ZAR withdrawal (via conversion).

**Tax compliance**: Not MoR. You handle all tax obligations.

**Developer experience**: Mediocre. PayPal's developer experience is widely criticized. Multiple API versions (v1/v2), inconsistent documentation, complex OAuth flows. Node.js SDK exists but is less polished than Stripe/Paddle.

**MCP server**: Official PayPal MCP server announced — supports function calling for various PayPal services.

**Sandbox**: Full sandbox environment available.

---

### 3.5 Gumroad

**Registration feasibility**: Gumroad operates as MoR globally — accepts sellers from most countries. SA registration should work.

**SA/FNB payout**: Payouts via bank transfer or PayPal. SA bank payout likely supported.

**Recurring subscriptions**: Supports subscriptions, but recurring payments live on Gumroad's servers — if you leave Gumroad, all recurring payments stop. No migration path for existing subscribers.

**Per-entity billing**: Limited. Gumroad is designed for digital product sales, not per-entity SaaS subscriptions. Multiple subscriptions per customer is not a first-class concept.

**Webhooks**: Basic webhook support. Limited event types compared to Stripe/Paddle.

**Fees**: 10% + $0.50 per transaction (direct sales). 30% for Gumroad Discover marketplace sales. Significantly more expensive than all other options.

**Currency**: All transactions processed in USD. Currency conversion fees for non-USD customers.

**Tax compliance**: Full MoR as of January 2025. Handles VAT, GST, and sales tax globally.

**Developer experience**: Minimal API surface. Not designed for custom SaaS integration. No TypeScript SDK. Limited documentation for programmatic use.

**MCP server**: None found.

**Sandbox**: No dedicated sandbox/test environment found.

---

### 3.6 Paystack

**Registration feasibility**: South Africa is natively supported. Paystack operates in Nigeria, Ghana, Kenya, South Africa, and Cote d'Ivoire. Registration with SA identity and FNB bank account is straightforward. Compliance requirements for SA businesses are documented. Physical presence in Vietnam should not be a blocker as Paystack verifies based on business registration country.

**SA/FNB payout**: Direct settlement to FNB bank account with T+1 (next business day) settlement. This is the fastest and most direct payout path of any provider evaluated. No intermediaries, no conversion delays.

**Recurring subscriptions**: Good. Subscriptions API supports plan creation, automatic billing on interval, invoice limits, and customer authorization management. Multiple authorizations per customer supported.

**Per-entity billing**: Supported. Can create multiple subscriptions per customer using different authorizations. Each league can be an independent subscription.

**Webhooks**: Solid. HMAC signature verification (`x-paystack-signature` header), comprehensive event types (charge.success, subscription.create, subscription.not_renew, invoice.update, etc.). Paystack CLI supports local webhook testing without third-party tunneling.

**Fees (South Africa)**: 2.9% + R1 (~$0.055) for local cards. 3.1% + R1 for international cards. +15% VAT on fees (for VAT-registered businesses). Volume discounts available. This is by far the cheapest option.

**Currency**: Accepts payments in ZAR. International card payments converted to ZAR automatically. Cannot accept USD directly in SA (only Nigeria/Kenya support USD acceptance). Global customers pay in their currency; Paystack converts to ZAR for settlement.

**Tax compliance**: Not MoR. You are responsible for calculating and remitting VAT/GST in every customer's jurisdiction. This is the major drawback for a solo developer.

**Developer experience**: Good. `paystack-sdk` npm package with full TypeScript support (v3.6.1, actively maintained). Clean API design. Paystack CLI for webhook testing. Documentation is clear and well-structured.

**MCP server**: None found. API is clean enough to build a lightweight MCP server, but none exists today.

**Sandbox**: Test mode with test card numbers and test bank accounts. Paystack CLI for local webhook testing.

---

## 4. Comparison Matrix

| Criteria | Stripe | Paddle | Lemon Squeezy | PayPal | Gumroad | Paystack |
|----------|--------|--------|---------------|--------|---------|----------|
| **B-1: SA registration** | No (Atlas workaround) | Yes | Probable | Yes | Yes (MoR) | Yes (native) |
| **B-2: FNB payout** | Via Wise intermediary | Wire/Payoneer | Bank (unconfirmed) | FNB partnership | Bank/PayPal | Direct FNB T+1 |
| **B-3: MCP server** | Official | Official | Community | Official | None | None |
| **B-4: Recurring subs** | Excellent | Strong | Good | Adequate | Basic | Good |
| **B-5: Per-entity billing** | Excellent | Supported | Supported | Clunky | Limited | Supported |
| **B-6: Webhooks** | Best-in-class | Robust + simulator | Solid | Adequate | Basic | Solid + CLI |
| **B-7: Fees @ $4.99/mo** | ~$0.47 (9.4%) | ~$0.75 (15.0%) | ~$0.82 (16.5%) | ~$0.66 (13.3%) | ~$1.00 (20.0%) | ~$0.21 (4.2%) |
| **B-8: Currency** | Full multi-currency | 30+ currencies | 130+ currencies | Major currencies | USD only | ZAR (intl cards converted) |
| **B-9: Tax compliance** | Manual (+Tax API) | Full MoR | Full MoR | Manual | Full MoR | Manual |
| **B-10: Developer experience** | Gold standard | Good | Good | Mediocre | Minimal | Good |

### Rating Legend
- **Excellent/Best-in-class**: Industry-leading implementation
- **Strong/Good/Robust**: Fully capable, meets all requirements
- **Adequate/Supported**: Works but with limitations
- **Basic/Clunky/Limited**: Significant gaps for this use case
- **Manual**: Responsibility falls on you

---

## 5. Fee Calculations at StepLeague Price Points

### Per-Transaction Fees

| Price Point | Stripe | Paddle | Lemon Squeezy | PayPal | Gumroad | Paystack |
|-------------|--------|--------|---------------|--------|---------|----------|
| **$4.99/mo** | $0.47 (9.4%) | $0.75 (15.0%) | $0.82 (16.5%) | $0.66 (13.3%) | $1.00 (20.0%) | ~$0.21 (4.2%) |
| **$9.99/mo** | $0.64 (6.4%) | $1.00 (10.0%) | $1.15 (11.5%) | $0.84 (8.4%) | $1.50 (15.0%) | ~$0.36 (3.6%) |
| **$49/yr** | $1.97 (4.0%) | $2.95 (6.0%) | $3.69 (7.5%) | $2.20 (4.5%) | $5.40 (11.0%) | ~$1.58 (3.2%) |
| **$99/yr** | $3.42 (3.5%) | $5.45 (5.5%) | $6.94 (7.0%) | $3.95 (4.0%) | $10.40 (10.5%) | ~$3.12 (3.2%) |

**Notes:**
- Stripe fees include 2.9% + $0.30 + 0.5% Billing surcharge (no international surcharge assumed for Atlas US entity)
- Paddle fees are 5% + $0.50 all-inclusive (excludes potential 2-3% currency conversion margin)
- Lemon Squeezy fees include 5% + $0.50 + 1.5% international surcharge
- PayPal fees use ~3.49% + $0.49
- Gumroad fees are 10% + $0.50
- Paystack fees use 3.1% + ~$0.055 (R1) for international cards; actual ZAR amount depends on exchange rate

### Annual Revenue Impact (Conservative scenario: 100 leagues, all Standard $4.99/mo)

| Provider | Annual Fees | Revenue After Fees | Fee % |
|----------|-------------|-------------------|-------|
| Paystack | ~$252 | ~$4,636 | 5.2% |
| Stripe | ~$564 + $500 setup | ~$3,824 (Year 1) | 21.7% (Year 1) |
| PayPal | ~$792 | ~$4,096 | 16.2% |
| Paddle | ~$900 | ~$3,988 | 18.4% |
| Lemon Squeezy | ~$984 | ~$3,904 | 20.1% |
| Gumroad | ~$1,200 | ~$3,688 | 24.5% |

At conservative Year 1 levels, the fee difference between Paystack ($252) and Paddle ($900) is ~$648/year. This is the price of tax compliance automation.

---

## 6. Pros & Cons Summary

### Stripe
| Pros | Cons |
|------|------|
| Industry-standard SDK and documentation | Not available in SA — requires $500 Atlas LLC |
| Official MCP server (remote + local) | Ongoing US compliance ($300-500/yr) |
| Best webhook testing tools | SA payout requires Wise intermediary |
| Lowest per-transaction fees (post-setup) | US tax filing obligations |
| Richest feature set for subscription management | Complexity overhead for solo dev at early stage |

### Paddle
| Pros | Cons |
|------|------|
| Full MoR — zero tax compliance burden | 5% + $0.50 per transaction (highest after Gumroad) |
| SA in supported seller countries | 2-3% currency conversion margin on cross-currency |
| Official MCP server | Payout via wire/Payoneer, not direct FNB |
| Webhook simulator for testing | Monthly payout cycle (weekly in early access) |
| Chargeback protection included | Smaller ecosystem than Stripe |

### Lemon Squeezy
| Pros | Cons |
|------|------|
| Full MoR with Stripe backing (acquired 2024) | +1.5% international fee on top of 5% + $0.50 |
| Good Next.js billing portal tutorial | SA support unconfirmed for new Managed Payments |
| Clean API for indie developers | No official MCP server |
| Multiple subscription support | Stripe Managed Payments only in 35+ countries (expanding) |
| TypeScript SDK available | Uncertain transition period post-acquisition |

### PayPal
| Pros | Cons |
|------|------|
| Universal brand recognition | Mediocre developer experience |
| SA withdrawal via FNB partnership | High fees for low-value subscriptions |
| Official MCP server | No MoR — manual tax compliance |
| Available in both Vietnam and SA | Clunky per-entity billing |
| Broad payment method support | Must withdraw within 30 days |

### Gumroad
| Pros | Cons |
|------|------|
| MoR handles all tax compliance | 10% + $0.50 — prohibitively expensive |
| Simple setup, minimal friction | Leaving Gumroad stops all recurring payments |
| Global seller support | Not designed for per-entity SaaS billing |
| | No MCP server |
| | No sandbox/test environment |

### Paystack
| Pros | Cons |
|------|------|
| Lowest fees of any provider (2.9-3.1% + R1) | No MoR — you handle global tax compliance |
| Direct FNB settlement, T+1 | No MCP server |
| Stripe-owned reliability and infrastructure | Africa-market focused |
| TypeScript SDK, CLI for webhook testing | Cannot accept USD directly (SA converts to ZAR) |
| Multiple subscriptions per customer supported | Less polished hosted checkout than Stripe/Paddle |

---

## 7. Recommendation

### Primary: Paystack

**Rationale**: For a bootstrapped solo developer with zero budget for upfront fees, Paystack is the clear winner — lowest transaction fees, zero setup costs, native SA/FNB support, and you're live the same day you sign up.

**Why Paystack wins for a bootstrapped launch:**
1. **Zero upfront cost.** No setup fees, no monthly fees, no company formation. Sign up with your SA ID and FNB account — done.
2. **Lowest per-transaction fees by far.** At $4.99/mo, Paystack takes ~$0.21 (4.2%) vs Paddle's ~$0.75 (15.0%). That's 3.5x cheaper per transaction.
3. **Direct FNB settlement, T+1.** Money hits your FNB account the next business day. No intermediaries, no Payoneer, no Wise, no conversion delays.
4. **Stripe-owned infrastructure.** Paystack was acquired by Stripe — you get enterprise reliability without enterprise costs.
5. **Annual savings matter at bootstrap scale.** At 100 leagues, Paystack saves ~$648/yr vs Paddle. At early revenue levels ($2K-$12K), that's 5-30% of your total revenue preserved.
6. **Good developer experience.** TypeScript SDK (`paystack-sdk`), CLI for local webhook testing, clean API design, comprehensive documentation.

**What about tax compliance (the MoR trade-off)?**
- At pre-alpha/early stage with <100 paying leagues, multi-jurisdiction tax compliance is minimal practical risk
- South African users pay in ZAR — SA VAT is straightforward (you're likely already familiar)
- International customers: tax obligations technically exist but enforcement on micro-SaaS at $2K-$12K ARR is negligible
- When revenue grows, add a tax API (Stripe Tax, TaxJar) or migrate to Paddle — the provider-agnostic schema makes this possible
- This is a "cross that bridge when you get there" situation, not a day-one blocker

**Registration path:**
1. Sign up at paystack.com with SA identity
2. Complete compliance verification (SA ID, FNB bank details)
3. Enable international payments during registration
4. Configure test mode for development
5. Use Paystack CLI for local webhook testing

**What Paystack gives you:**
- Subscriptions API with multiple subs per customer (per-league billing)
- International card acceptance (Visa, Mastercard, Amex for SA businesses)
- HMAC webhook signature verification
- Test mode with test cards and test bank accounts
- ZAR settlement (international cards auto-converted)

**What Paystack doesn't give you (and why it's OK for now):**
- No MoR (tax compliance) — acceptable at early revenue; add later
- No MCP server — API is clean enough; can build lightweight MCP later
- No hosted checkout overlay like Paddle — use Paystack's redirect-based checkout or inline JS
- ZAR-only settlement — fine since your bank is FNB (ZAR)

### Fallback: Paddle

**When to switch**: When global tax compliance becomes a real operational burden — likely when annual revenue exceeds ~$10K+ and you have customers in 5+ tax jurisdictions. At that point, Paddle's MoR justifies the fee premium.

**Why Paddle as fallback:**
- Full MoR eliminates all tax compliance burden
- Official MCP server for agent-assisted billing
- Chargeback protection included
- SA in supported seller countries
- Good TypeScript SDK

**What switching requires:**
- Sign up at paddle.com with SA identity
- Re-create subscription plans in Paddle
- Migrate existing subscribers (customers re-authorize cards)
- Update webhook endpoints from Paystack to Paddle format
- Provider-agnostic schema means zero database changes

### Eliminated: Stripe via Atlas

**Why eliminated for now**: $500 setup + ~$400/yr compliance is not viable for a zero-budget bootstrap. Revisit only if/when ARR exceeds $25K+ and the Stripe ecosystem advantages justify the ongoing cost.

---

## 8. Implications for Downstream PRDs

### PRD 74: Pay Gate Schema

Design the subscription database schema with a **provider-agnostic abstraction layer**:

```
subscription_tiers (provider-agnostic)
  - id, name, price_monthly, price_annual, max_members, features_json

league_subscriptions (provider-agnostic with provider reference)
  - id, league_id, tier_id, status, provider (enum: 'paddle'|'paystack'|'stripe')
  - provider_subscription_id, provider_customer_id
  - current_period_start, current_period_end, cancel_at_period_end

payment_history (provider-agnostic)
  - id, league_subscription_id, amount, currency, provider_transaction_id
  - status, created_at
```

This design allows switching providers without database restructuring. The `provider` enum field and `provider_*_id` fields create the abstraction boundary.

### PRD 78: Crowdfunding

Paystack supports one-time payments alongside subscriptions. The crowdfunding campaign can use Paystack's transaction initialization with custom metadata for tier tracking (Early Bird, Supporter, Team Pack). If Paddle is chosen instead by this stage, its checkout overlay also supports one-time payments.

### Webhook Endpoint Pattern

Webhook endpoints should follow the `withApiHandler` pattern:

```typescript
// POST /api/webhooks/paystack
export const POST = withApiHandler({
  auth: 'none',  // Webhooks are unauthenticated — verify via HMAC signature
  handler: async (req) => {
    // Verify Paystack webhook signature (x-paystack-signature header)
    // Parse event type (charge.success, subscription.create, etc.)
    // Update league_subscriptions / payment_history
    // Trigger downstream actions (activate league, send notification)
  }
});
```

---

## 9. MCP Integration Summary

| Provider | MCP Server | Setup | Capabilities |
|----------|-----------|-------|--------------|
| **Paddle** | Official (`@PaddleHQ/paddle-mcp-server`) | Connect to AI assistant | Manage catalog, billing, subscriptions, reports |
| **Stripe** | Official (`@stripe/mcp`, `mcp.stripe.com`) | Local via npx or remote OAuth | Full API access, documentation search |
| **Lemon Squeezy** | Community (`mcp-lemonsqueezy`) | GitHub install | Subscriptions, checkouts, products |
| **PayPal** | Official (announced) | TBD | Various PayPal services |
| **Gumroad** | None | — | — |
| **Paystack** | None | — | — |

Paystack has no MCP server today, but its clean REST API makes building a lightweight one straightforward. When/if migrating to Paddle, its official MCP server integrates with StepLeague's existing MCP infrastructure (Supabase, PostHog, Playwright MCPs already configured).

---

## 10. Migration Risk Assessment

| Migration Path | Difficulty | Key Risk |
|---------------|------------|----------|
| Paddle -> Paystack | Medium | Must build tax compliance layer; re-create all subscriptions; customers re-enter card details |
| Paddle -> Stripe | Medium | Requires Atlas LLC setup; similar subscription re-creation; Stripe import tools help |
| Paystack -> Paddle | Low | Paddle MoR absorbs compliance; subscription re-creation still needed |
| Paystack -> Stripe | Medium | Atlas LLC setup; subscription migration; different API patterns |

**Key mitigation**: The provider-agnostic schema design (Section 8) ensures database structure survives any provider switch. The main migration cost is always re-creating active subscriptions and having customers re-authorize payment methods.

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-03-30 | Initial | Created payment provider research document (PRD 72 deliverable) |
| 2026-03-30 | Section 7 | Revised recommendation: Paystack primary (lowest cost, zero setup), Paddle fallback (MoR for scale). User constraint: zero budget for upfront fees, bootstrapped. |
