# PRD 72: Payment Provider Research & Selection

> **Order:** 72
> **Status:** ✅ Complete
> **Type:** Architecture (Research)
> **Dependencies:** None
> **Blocks:** PRD 74 (Pay Gate Schema), PRD 78 (Crowdfunding)

---

## 🎯 Objective

Research and evaluate payment providers that are viable for a developer based in Vietnam with a South African bank account. The platform needs recurring subscriptions with per-league billing, webhook notifications, and multi-currency support. The output is a research document with a clear recommendation and pros/cons matrix — not code.

This decision is foundational: it determines the payment architecture for StepLeague's freemium model (Free, Standard, Premium, Enterprise tiers) and directly blocks the pay gate schema design and crowdfunding features.

---

## ⚠️ Research-First Mandate

Before implementing this PRD, the agent MUST conduct intensive research into all relevant aspects — provider documentation, registration requirements by country, fee structures, API capabilities, MCP availability, community experiences (Reddit, HN, forums), and comparable indie/bootstrapped projects. This research phase should directly inform the recommendation and produce the best possible outcome. Do not skip or shortcut the research phase.

---

> **Session note**: This PRD runs in its own Claude Code session. Read the shared context file first. Do NOT update PRD_00_Index.md or CHANGELOG.md — the orchestrator session handles those to prevent conflicts.

## ⚠️ Agent Context

| File | Purpose |
|------|---------|
| docs/prds/SPRINT_EFG_CONTEXT.md | **READ FIRST** — Shared context for PRDs 70-80: business decisions, cross-PRD dependencies, architectural patterns, orchestration protocol |
| `src/app/(public)/pricing/page.tsx` | Current pricing page — shows tier structure |
| `src/lib/config.ts` | APP_CONFIG with domain, branding, pricing references |
| `docs/prds/admin-feedback-system/PRD_33_Pricing_HowItWorks.md` | Pricing tier definitions and freemium model |
| `.claude/skills/api-handler/SKILL.md` | withApiHandler pattern — webhook endpoints will use this |
| `.claude/skills/supabase-patterns/SKILL.md` | Database patterns for subscription schema |
| `.claude/skills/architecture-philosophy/SKILL.md` | Systems thinking, future-proofing principles |

### MCP Servers

_None required — this PRD produces a research document, not code._

### Task-Optimized Structure

| Phase | Mode | Task |
|-------|------|------|
| 1 | `[READ-ONLY]` | Review StepLeague pricing tiers and billing requirements `[PARALLEL with 2]` |
| 2 | `[READ-ONLY]` | Research each provider: registration, payouts, APIs, pricing `[PARALLEL with 1]` |
| 3 | `[READ-ONLY]` | Build comparison matrix across all criteria `[SEQUENTIAL]` |
| 4 | `[READ-ONLY]` | Evaluate MCP server availability per provider `[SEQUENTIAL]` |
| 5 | `[WRITE]` | Write recommendation document with pros/cons matrix `[SEQUENTIAL]` |

---

## 🏗️ Detailed Feature Requirements

### Section A: Provider Research — 6 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **A-1** | **Stripe evaluation** | Stripe is the industry standard but requires a business entity — evaluate via Stripe Atlas or Wise business account | Registration path documented, feasibility rated (easy/moderate/hard/impossible), timeline and cost estimated |
| **A-2** | **Paddle evaluation** | Paddle is a Merchant of Record handling tax compliance — evaluate Vietnam/SA compatibility | Registration feasibility, SA bank payout support, and tax compliance benefits documented |
| **A-3** | **Lemon Squeezy evaluation** | Lemon Squeezy is MoR with developer-friendly APIs — evaluate geographic restrictions | Registration feasibility, payout options, recurring billing capabilities documented |
| **A-4** | **PayPal evaluation** | PayPal has wide reach but high fees — evaluate Vietnam registration and SA payout | Vietnam account limitations, SA withdrawal options, fee structure documented |
| **A-5** | **Gumroad evaluation** | Gumroad is simple but may lack subscription flexibility — evaluate fit | Subscription support, per-entity billing capability, fee structure documented |
| **A-6** | **Paystack evaluation** | Paystack is African-focused and may have ideal SA bank support — evaluate Vietnam developer access | SA bank payout natively supported, Vietnam registration feasibility, African market advantages documented |

### Section B: Comparison Criteria — 10 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **B-1** | **Vietnam registration feasibility** rated per provider | Developer is based in Vietnam — some providers restrict onboarding | Each provider rated: native support / workaround available / not possible |
| **B-2** | **SA bank payout support** rated per provider | Revenue must reach a South African bank account | Each provider rated: direct payout / via intermediary / not possible |
| **B-3** | **MCP server availability** documented per provider | Agent workflow benefits from MCP integration for billing management | Each provider checked for existing MCP servers or API quality for building one |
| **B-4** | **Recurring subscription support** evaluated | StepLeague needs monthly and annual billing cycles | Each provider evaluated for subscription creation, upgrade/downgrade, cancellation, trial periods |
| **B-5** | **Per-entity billing** evaluated | Each league is billed independently — not a single account-level subscription | Each provider evaluated for per-resource/per-entity billing (multiple subscriptions per customer) |
| **B-6** | **Webhook support** evaluated | Payment events must trigger backend actions (activate league, expire access, etc.) | Each provider evaluated for webhook reliability, event types, retry policies |
| **B-7** | **Pricing and fees** documented per provider | Need to understand true cost per transaction at StepLeague's price points | Fee structure documented: transaction %, flat fee, currency conversion fees, payout fees |
| **B-8** | **Currency support** evaluated | Users may pay in USD; payouts in ZAR; local context may need VND | Each provider evaluated for USD acceptance, ZAR payout, multi-currency support |
| **B-9** | **Tax compliance handling** evaluated | VAT/GST obligations vary by customer country | Each provider evaluated: MoR (handles tax) / tax calculation API / manual responsibility |
| **B-10** | **Developer experience and documentation** assessed | Integration speed matters for a solo developer | Each provider assessed for API quality, SDK availability (Node.js/TypeScript), documentation clarity |

### Section C: Recommendation Deliverables — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **C-1** | **Comparison matrix** produced | Need a single-view comparison across all criteria | Table with all 6 providers as columns and all 10 criteria as rows, with clear ratings |
| **C-2** | **Pros/cons summary** per provider | Quick reference for decision-making | Each provider has 3-5 pros and 3-5 cons listed |
| **C-3** | **Primary recommendation with fallback** | Need a clear decision to unblock PRD 74 and PRD 78 | One recommended provider with rationale, one fallback provider, and migration risk assessment |

---

## ✅ Success Criteria

| Metric | Target | Verification Method |
|--------|--------|---------------------|
| Providers evaluated | All 6 (Stripe, Paddle, Lemon Squeezy, PayPal, Gumroad, Paystack) | Research document covers each provider |
| Comparison criteria covered | All 10 criteria in matrix | Matrix table has all rows filled |
| Vietnam feasibility assessed | Each provider has clear yes/no/workaround rating | Manual review of registration section |
| SA payout assessed | Each provider has payout path documented | Manual review of payout section |
| Recommendation made | Primary + fallback provider selected with rationale | Recommendation section exists with reasoning |
| Blockers unblocked | PRD 74 and PRD 78 can proceed using the recommendation | Recommendation specifies provider API patterns relevant to schema design |

---

## 📅 Implementation Plan Reference

### Phase 1: Requirements Gathering
1. Document StepLeague's exact billing needs (tiers, per-league model, webhook events)
2. List hard constraints (Vietnam residency, SA bank, solo developer)

### Phase 2: Provider Research
3. Research each of the 6 providers against all 10 criteria
4. Check MCP registry for existing payment provider MCP servers
5. Verify current registration policies (these change frequently)

### Phase 3: Analysis & Recommendation
6. Build the comparison matrix
7. Calculate effective fees at StepLeague price points ($4.99/mo and $9.99/mo)
8. Write pros/cons for each provider
9. Select primary and fallback recommendation

### Phase 4: Output
10. Save research document to `docs/artifacts/decisions_payment_provider.md`

---

## 🔍 Systems/Design Considerations

- **Per-league billing model:** Each league has its own subscription — a single user who owns 3 leagues has 3 independent billing relationships. The chosen provider must support multiple subscriptions per customer without friction.
- **Webhook-driven architecture:** StepLeague's API routes use `withApiHandler` — payment webhooks will follow this pattern. The provider must support reliable webhooks with signature verification and retry logic.
- **Supabase integration:** Subscription state will live in Supabase. The provider must support webhook payloads that map cleanly to database records (subscription ID, status, league ID, next billing date).

---

## 💡 Proactive Considerations

| # | Consideration | Why It Matters |
|---|---------------|----------------|
| 1 | **Tax compliance (VAT/GST)** | Merchant of Record providers (Paddle, Lemon Squeezy) handle tax remittance automatically. If choosing Stripe or Paystack, StepLeague becomes responsible for calculating and remitting VAT in every customer's jurisdiction. For a solo developer, MoR is a significant operational advantage. |
| 2 | **Chargeback handling** | Different providers handle disputes differently. MoR providers absorb chargeback risk. With Stripe/Paystack, chargebacks hit your account directly and can freeze funds. Evaluate chargeback policies and fraud protection per provider. |
| 3 | **Multi-currency complexity** | Users paying in USD, potential ZAR-denominated pricing for SA market, payouts to SA bank in ZAR, developer expenses in VND. Each currency conversion has fees. Evaluate whether the provider handles conversion or if Wise is needed as an intermediary. |
| 4 | **PCI compliance** | Handling card data directly is a non-starter for a solo developer on Vercel. All providers should offer hosted checkout or client-side tokenization. Verify that no provider requires server-side card handling. |
| 5 | **Testing and sandbox environments** | Integration development requires sandbox/test mode. Evaluate whether each provider offers test environments, test card numbers, and webhook testing tools. Poor sandbox = slow integration. |
| 6 | **Future provider migration** | If the chosen provider becomes unavailable or raises prices, how painful is migration? Design the subscription schema (PRD 74) with a provider-agnostic abstraction layer so switching providers does not require a database redesign. |
| 7 | **African market considerations** | Paystack is built for Africa and may offer the best ZAR payout experience, lower fees for African cards, and local payment methods (EFT, mobile money). If StepLeague's initial user base is SA-heavy, Paystack could reduce friction significantly. Evaluate whether Paystack can also handle international (non-African) payments. |
| 8 | **MCP integration for billing management** | An MCP server for the payment provider would let agents query subscription status, handle refunds, and debug billing issues directly. Check the MCP registry (`mcp__mcp-registry__search_mcp_registry`) for existing servers. If none exist, evaluate whether the provider's API is clean enough to build a lightweight MCP server later. |

---

## 📋 Documentation Update Checklist

- [ ] PRD_00_Index.md — Add PRD 72 as Proposed, update counts
- [ ] CHANGELOG.md — Log PRD creation
- [ ] No AGENTS.md changes needed (no new code patterns)
- [ ] No skill file changes needed
- [ ] **Git commit** — `docs(prd): PRD 72 — payment provider research and selection`

---

## 📚 Best Practice References

- **PCI DSS v4.0:** Never handle raw card data server-side; use hosted checkout or tokenization
- **Merchant of Record model:** Provider acts as legal seller, handling tax, compliance, and chargebacks on your behalf
- **Stripe Atlas:** US LLC formation service enabling international developers to access Stripe — evaluate cost ($500) vs benefit
- **Wise Business:** Multi-currency business account that can serve as intermediary for providers requiring a specific country's bank account
- **Webhook best practices:** Idempotent handlers, signature verification, async processing, retry-safe design

---

## 🔗 Related Documents

- [PRD 33: Pricing & How It Works](./PRD_33_Pricing_HowItWorks.md) — Defines the pricing tiers this provider must support
- PRD 74: Pay Gate Schema (future) — Blocked by this research; will design subscription tables based on chosen provider
- PRD 78: Crowdfunding (future) — Blocked by this research; payment infrastructure choice affects crowdfunding feasibility

---

## StepLeague Pricing Reference

| Tier | Monthly | Annual | User Limit | Per-League |
|------|---------|--------|------------|------------|
| Free | $0 | $0 | 3 members | Yes |
| Standard | $4.99/mo | $49/yr | 10 users | Yes |
| Premium | $9.99/mo | $99/yr | 25 users | Yes |
| Enterprise | Contact | Contact | Unlimited | Yes |

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-03-29 | Initial | Created PRD |
| 2026-03-30 | Complete | Research complete. Deliverable: `docs/artifacts/decisions_payment_provider.md`. Recommendation: Paystack (primary), Paddle (fallback). Revised based on zero-budget bootstrap constraint. |
