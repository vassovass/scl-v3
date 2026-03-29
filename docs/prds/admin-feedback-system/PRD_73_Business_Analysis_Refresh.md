# PRD 73: Business Analysis Refresh

> **Order:** 73
> **Status:** 📋 Proposed
> **Type:** Architecture (Strategy)
> **Dependencies:** None
> **Blocks:** PRD 78 (Crowdfunding Campaign Prep)

---

## 🎯 Objective

Refresh the StepLeague business analysis document (`docs/artifacts/stepleague_business_analysis.md`), which was written in December 2025 and is now 3 months stale. Since that document was authored, 68+ PRDs of development have been completed, the free tier has been revised (from 5 to 3 members per league), and the marketing and crowdfunding strategy needs expansion. The output is an updated version of the existing business analysis document — not code.

The refresh must produce a document that accurately reflects StepLeague's current state, revised pricing, expanded marketing channels (adding LinkedIn), a specific crowdfunding platform recommendation, updated revenue projections, and a refreshed competitor landscape — so that downstream decisions (especially PRD 78: Crowdfunding Campaign Prep) are based on current data rather than stale assumptions.

---

## ⚠️ Research-First Mandate

Before implementing this PRD, the agent MUST conduct intensive research into all relevant aspects — current competitor landscape, indie app revenue benchmarks (2025-2026 data), crowdfunding platform success rates for software products, LinkedIn growth strategies for solo devs, and updated pricing psychology. This research phase should directly inform updates and produce the best possible outcome. Do not skip or shortcut the research phase.

---

> **Session note**: This PRD runs in its own Claude Code session. Read the shared context file first. Do NOT update PRD_00_Index.md or CHANGELOG.md — the orchestrator session handles those to prevent conflicts.

## ⚠️ Agent Context

| File | Purpose |
|------|---------|
| docs/prds/SPRINT_EFG_CONTEXT.md | **READ FIRST** — Shared context for PRDs 70-80: business decisions, cross-PRD dependencies, architectural patterns, orchestration protocol |
| `docs/artifacts/stepleague_business_analysis.md` | The document being updated — read thoroughly before making any changes |
| `docs/ROADMAP.md` | Current development progress — informs updated projections |
| `src/app/(public)/pricing/page.tsx` | Live pricing page — verify current tier structure matches document |
| `docs/prds/admin-feedback-system/PRD_33_Pricing_HowItWorks.md` | Pricing tier definitions and freemium model design |
| `docs/prds/admin-feedback-system/PRD_34_B2B_Landing.md` | B2B landing page — informs enterprise/corporate wellness positioning |
| `docs/prds/admin-feedback-system/PRD_72_Payment_Provider_Research.md` | Payment provider research — pricing tiers and billing model context |
| `.claude/skills/architecture-philosophy/SKILL.md` | Systems thinking, future-proofing principles |

### MCP Servers

_None required — this PRD produces an updated document, not code._

### Task-Optimized Structure

| Phase | Mode | Task |
|-------|------|------|
| 1 | `[READ-ONLY]` | Read the existing `stepleague_business_analysis.md` thoroughly `[PARALLEL with 2, 3]` |
| 2 | `[READ-ONLY]` | Review ROADMAP.md, pricing page, PRD 33, PRD 34 for current state `[PARALLEL with 1, 3]` |
| 3 | `[READ-ONLY]` | Research competitors, crowdfunding platforms, LinkedIn strategies, pricing benchmarks `[PARALLEL with 1, 2]` |
| 4 | `[READ-ONLY]` | Synthesize research findings and identify all sections requiring updates `[SEQUENTIAL]` |
| 5 | `[WRITE]` | Update `docs/artifacts/stepleague_business_analysis.md` with all revisions `[SEQUENTIAL]` |

---

## 🏗️ Detailed Feature Requirements

### Section A: Pricing Update — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **A-1** | **Free tier limit corrected to 3 members** | Original document states 5 members per league on the free tier; this has been revised to 3 | Free tier section shows 3-member limit with rationale for the change |
| **A-2** | **Pricing psychology refreshed** | Original pricing rationale may not reflect current indie SaaS benchmarks (2025-2026) | Pricing section references current market data and explains why $4.99/$9.99 price points remain valid (or recommends adjustment) |
| **A-3** | **Tier comparison updated** | Tier features may have evolved across 68+ PRDs of development | All tier features match the actual implemented feature set, not the original plan |

### Section B: Marketing Channels — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **B-1** | **LinkedIn added as a marketing channel** | Original document only covers Twitter, Reddit, and Product Hunt — LinkedIn is missing entirely | LinkedIn section includes target audience (corporate wellness, HR, team leads), content strategy, and expected reach |
| **B-2** | **Existing channels refreshed** | Twitter/Reddit/Product Hunt strategies may be outdated after 3 months of platform changes | Each existing channel has updated tactics reflecting current best practices and algorithm changes |
| **B-3** | **Channel priority matrix created** | No clear prioritization of marketing channels exists | A ranked list of channels by effort-to-impact ratio with recommended time allocation per week |

### Section C: Competitor Refresh — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **C-1** | **Competitor landscape updated** | Competitor data is 3 months stale — new entrants, pivots, or shutdowns may have occurred | Each competitor has current pricing, feature set, and market position as of March 2026 |
| **C-2** | **Differentiation sharpened** | StepLeague's unique positioning may need refinement after 68+ PRDs of feature development | Clear differentiation matrix showing what StepLeague does that competitors do not |
| **C-3** | **Competitive risk assessment updated** | Original risk assessment may underestimate or overestimate threats | Each competitor risk rated (low/medium/high) with specific mitigation strategies |

### Section D: Revenue Projections — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **D-1** | **Projections recalculated with 3-member free tier** | Lowering free tier from 5 to 3 members changes conversion funnel assumptions | Revenue model shows updated conversion rates reflecting tighter free tier constraints |
| **D-2** | **Development velocity factored in** | 68+ PRDs completed since original projections — feature completeness affects adoption timeline | Projections reflect actual development progress and realistic launch timeline |
| **D-3** | **Scenario modeling updated** | Original scenarios may not account for crowdfunding revenue or LinkedIn-driven B2B leads | At least 3 scenarios (conservative, moderate, optimistic) with crowdfunding and B2B revenue streams included |

### Section E: Crowdfunding Strategy — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **E-1** | **Specific crowdfunding platform recommended** | Original document mentions "crowdfunding" generically but does not name a platform | One recommended platform (e.g., Kickstarter, Indiegogo, Open Collective, or other) with rationale |
| **E-2** | **Platform comparison for software products** | Not all crowdfunding platforms are equally suited for SaaS/software products | Comparison of 3-4 platforms with success rates for software products, fee structures, and audience fit |
| **E-3** | **Crowdfunding timeline and goal aligned** | Crowdfunding campaign must align with StepLeague's development timeline and PRD 78 | Recommended campaign timing, funding goal range, and reward tier suggestions that feed directly into PRD 78 |

---

## ✅ Success Criteria

| Metric | Target | Verification Method |
|--------|--------|---------------------|
| Free tier pricing corrected | Document shows 3 members (not 5) | Manual review of pricing section |
| LinkedIn channel added | Dedicated LinkedIn marketing subsection exists | Manual review of marketing section |
| Crowdfunding platform named | Specific platform recommended with rationale | Manual review of crowdfunding section |
| Competitor data current | All competitor entries reflect March 2026 data | Manual review with web research verification |
| Revenue projections updated | 3 scenarios with revised free tier and new channels | Manual review of projections section |
| Development progress reflected | 68+ PRDs of progress acknowledged in timeline and feature set | Manual review of product status sections |
| PRD 78 unblocked | Crowdfunding section provides enough detail for campaign prep | PRD 78 can reference this document for platform choice and timing |
| Document changelog updated | Changelog table at end of document records all changes made | Changelog table exists with March 2026 entries |

---

## 🔍 Systems/Design Considerations

- **Single source of truth:** The business analysis document is referenced by multiple PRDs and strategic decisions. Updates must be internally consistent — changing the free tier limit in one section but not another creates confusion.
- **Downstream dependencies:** PRD 78 (Crowdfunding Campaign Prep) directly depends on the crowdfunding platform recommendation and timeline produced by this refresh. The recommendation must be specific enough to act on.
- **Pricing page alignment:** The updated document must match what the live pricing page (`/pricing`) actually shows. If there are discrepancies between the document, PRD 33, and the live page, flag them for resolution.

---

## 💡 Proactive Considerations

| # | Consideration | Why It Matters |
|---|---------------|----------------|
| 1 | **Free tier conversion psychology** | Reducing from 5 to 3 members per league creates earlier friction, which should increase conversion to paid tiers — but could also increase churn if the limit feels too restrictive. The analysis should model both outcomes and recommend whether 3 is optimal or if 4 is a better sweet spot. |
| 2 | **LinkedIn B2B pipeline** | LinkedIn is the strongest channel for corporate wellness and HR decision-makers. The marketing section should outline a specific content cadence (posts/week), content themes (team health, remote work challenges, step competitions), and whether LinkedIn Ads are worth the spend at StepLeague's budget level. |
| 3 | **Crowdfunding timing relative to alpha launch** | Launching a crowdfunding campaign too early (before alpha validation) risks low credibility. Launching too late (after full launch) misses the "support an indie project" window. The analysis should recommend the optimal timing relative to PRD 71 (Alpha Verification Gate). |
| 4 | **Competitor acquisitions and pivots** | The fitness/wellness app space sees frequent acquisitions (e.g., Google acquiring Fitbit). Any competitor changes in the last 3 months could materially affect StepLeague's positioning. The refresh must explicitly check for M&A activity. |
| 5 | **Revenue model sensitivity to payment provider** | The payment provider choice (PRD 72) affects transaction fees, which affect net revenue per subscription. Projections should show sensitivity analysis: how do margins change between a 2.9% + $0.30 provider vs a 5% MoR fee? |
| 6 | **LinkedIn vs Twitter algorithm shifts** | Twitter/X has undergone significant algorithm and policy changes in 2025-2026. The refresh should honestly assess whether Twitter is still a viable channel for indie SaaS marketing or if effort should shift to LinkedIn and Reddit. |
| 7 | **Crowdfunding as validation, not just funding** | A crowdfunding campaign serves dual purposes: raising funds and validating market demand. The analysis should frame the campaign goal in terms of both dollars raised and backers acquired (backers = validated demand signal for investors or future fundraising). |
| 8 | **International pricing considerations** | With a global user base, the analysis should consider whether single USD pricing is optimal or if purchasing power parity (PPP) pricing would increase adoption in key markets (South Africa, Southeast Asia, Latin America). This affects both revenue projections and the payment provider requirements. |

---

## 📋 Documentation Update Checklist

- [ ] PRD_00_Index.md — Add PRD 73 as Proposed, update counts
- [ ] CHANGELOG.md — Log PRD creation
- [ ] No AGENTS.md changes needed (no new code patterns)
- [ ] No skill file changes needed
- [ ] **Git commit** — `docs(prd): PRD 73 — business analysis refresh`

---

## 📚 Best Practice References

- **Indie SaaS pricing:** Base pricing on value delivered, not cost. $4.99/mo is in the "impulse buy" range; $9.99/mo requires demonstrated value. Research current benchmarks from sources like IndieHackers, MicroConf, and Baremetrics Open Startups.
- **Crowdfunding for software:** Software products on Kickstarter/Indiegogo historically have lower success rates than hardware. Evaluate platforms like Open Collective (recurring), Kickstarter (one-time), and Indiegogo InDemand (flexible) for fit.
- **LinkedIn organic reach:** Solo dev accounts with consistent posting (3-5x/week) can reach 10K-50K impressions/month within 3 months. Content should focus on building-in-public narratives, not product pitches.
- **Competitive analysis frameworks:** Use Porter's Five Forces or SWOT for structured competitor assessment. Include indirect competitors (generic fitness apps) alongside direct competitors (step challenge platforms).
- **Freemium conversion benchmarks:** Typical SaaS freemium conversion rates are 2-5%. A tighter free tier (3 members) should push this higher, potentially 5-8%, but only if the upgrade path is frictionless.

---

## 🔗 Related Documents

- [PRD 33: Pricing & How It Works](./PRD_33_Pricing_HowItWorks.md) — Pricing tier definitions and freemium model
- [PRD 34: B2B Landing](./PRD_34_B2B_Landing.md) — Corporate wellness positioning, relevant to LinkedIn strategy
- [PRD 72: Payment Provider Research](./PRD_72_Payment_Provider_Research.md) — Payment infrastructure affects revenue projections
- PRD 78: Crowdfunding Campaign Prep (future) — Blocked by this PRD; will use platform recommendation and timeline
- [Business Analysis (current)](../../artifacts/stepleague_business_analysis.md) — The document being updated

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-03-29 | Initial | Created PRD |
