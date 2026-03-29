# PRD 78: Crowdfunding Campaign Prep

> **Order:** 78
> **Status:** 📋 Proposed
> **Type:** Architecture (Strategy)
> **Sprint:** F, Track 2 (F2.2)
> **Dependencies:** PRD 72 (Payment Provider Research), PRD 73 (Business Analysis Refresh)
> **Blocks:** PRD 79 (Launch Marketing Content)

---

## 🎯 Objective

Define the complete crowdfunding campaign strategy for StepLeague — selecting the optimal platform, structuring reward tiers, planning campaign content, setting funding goals, and establishing a timeline relative to alpha/beta milestones. The output is a campaign strategy document and asset checklist that enables Vasso (solo bootstrapped developer, based in Vietnam, SA bank account) to launch a credible crowdfunding campaign with minimal overhead and maximum conversion potential.

The campaign serves two purposes: raising $3-5K in seed funding to cover infrastructure costs during beta, and validating market demand through backer count as a signal for sustainable growth. StepLeague's AI step verification is the primary differentiator and must be central to the campaign narrative.

---

## ⚠️ Research-First Mandate

Before implementing this PRD, the agent MUST conduct intensive research into all relevant aspects — crowdfunding platform fees and terms, successful software crowdfunding campaigns (case studies), campaign page best practices, backer communication strategies, fulfillment logistics for digital products, and timing relative to product readiness. This research phase should directly inform the campaign strategy and produce the best possible outcome. Do not skip or shortcut the research phase.

---

> **Session note**: This PRD runs in its own Claude Code session. Read the shared context file first. Do NOT update PRD_00_Index.md or CHANGELOG.md — the orchestrator session handles those to prevent conflicts.

## ⚠️ Agent Context

| File | Purpose |
|------|---------|
| docs/prds/SPRINT_EFG_CONTEXT.md | **READ FIRST** — Shared context for PRDs 70-80: business decisions, cross-PRD dependencies, architectural patterns, orchestration protocol |
| `docs/artifacts/stepleague_business_analysis.md` | Business analysis with two-stage crowdfunding approach and revenue projections |
| `docs/prds/admin-feedback-system/PRD_72_Payment_Provider_Research.md` | Payment provider recommendation — affects how backer payments are processed |
| `docs/prds/admin-feedback-system/PRD_73_Business_Analysis_Refresh.md` | Updated competitor landscape, pricing, and crowdfunding platform recommendation |
| `docs/prds/admin-feedback-system/PRD_71_Alpha_Verification_Gate.md` | Alpha gate criteria — determines when the product is "ready enough" for campaign launch |
| `docs/prds/admin-feedback-system/PRD_77_Alpha_Beta_Gate_Criteria.md` | Alpha/beta stage definitions — timing reference for campaign launch window |
| `docs/prds/admin-feedback-system/PRD_33_Pricing_HowItWorks.md` | Pricing tier definitions — crowdfunding tiers must align with long-term pricing |
| `src/app/(public)/pricing/page.tsx` | Live pricing page — verify tier alignment |
| `.claude/skills/architecture-philosophy/SKILL.md` | Systems thinking, future-proofing principles |

### MCP Servers

_None required — this PRD produces a strategy document and asset checklist, not code._

### Task-Optimized Structure

| Phase | Mode | Task |
|-------|------|------|
| 1 | `[READ-ONLY]` | Read business analysis, PRD 72, PRD 73, PRD 71, and PRD 77 for current context `[PARALLEL with 2]` |
| 2 | `[READ-ONLY]` | Research crowdfunding platforms, successful software campaigns, campaign page best practices, backer psychology `[PARALLEL with 1]` |
| 3 | `[READ-ONLY]` | Analyze platform fees, payout compatibility (Vietnam/SA), and campaign timing relative to alpha/beta `[SEQUENTIAL]` |
| 4 | `[READ-ONLY]` | Synthesize findings into platform recommendation, tier structure, and timeline `[SEQUENTIAL]` |
| 5 | `[WRITE]` | Write campaign strategy document to `docs/artifacts/plan_crowdfunding_campaign.md` `[SEQUENTIAL]` |

---

## 🏗️ Detailed Feature Requirements

### Section A: Platform Comparison & Selection — 4 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **A-1** | **Kickstarter evaluated for software products** | Kickstarter has the largest audience but all-or-nothing funding and strict project requirements — evaluate fit for a SaaS/fitness app | Feasibility rated, fee structure documented (5% + payment processing), audience fit for software assessed, Vietnam/SA payout path confirmed or ruled out |
| **A-2** | **Indiegogo evaluated with flexible funding** | Indiegogo offers flexible funding (keep what you raise) which reduces risk for a solo dev — evaluate InDemand program for ongoing sales | Flexible vs fixed funding pros/cons documented, InDemand post-campaign viability assessed, fee structure (5% + payment processing) compared |
| **A-3** | **Buy Me a Coffee evaluated for simplicity** | BMaC has minimal setup, supports memberships, and is friendly to solo creators — evaluate whether it can run a structured campaign | Membership tier support documented, one-time vs recurring donation capability assessed, audience reach compared to dedicated crowdfunding platforms |
| **A-4** | **Ko-fi evaluated as BMaC alternative** | Ko-fi offers 0% platform fee on donations and has shop/membership features — evaluate campaign viability | Fee advantage documented (0% vs BMaC's cut), shop feature for one-time tier purchases assessed, audience size and discoverability compared |

### Section B: Campaign Content Plan — 4 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **B-1** | **Campaign story arc defined** | Backers fund people and stories, not products — the narrative must resonate | Story arc documented: problem (fitness accountability is broken), journey (solo dev building in public), solution (AI-verified step challenges), ask (fund the beta) |
| **B-2** | **Visual asset checklist produced** | Campaign pages with strong visuals convert 2-3x better than text-only | Checklist includes: hero image specs, app screenshots (mobile + desktop), team/founder photo, infographic of how AI verification works, social proof mockups |
| **B-3** | **Campaign video requirements defined** | Video is the single highest-impact element on a crowdfunding page — 85% of funded projects have one | Video brief includes: target length (60-90 seconds), shot list (app demo, founder talking head, step verification in action), production options (DIY vs Fiverr), estimated cost |
| **B-4** | **FAQ section pre-written** | Unanswered questions kill conversions — preemptive FAQ reduces friction | At least 8 FAQ entries covering: when will I get access, what platforms are supported, is it a subscription or lifetime, what if the campaign fails, how is AI verification different, data privacy, refund policy, roadmap after funding |

### Section C: Tier Structure — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **C-1** | **Early Bird tier defined: $29 lifetime (50 units)** | Early bird creates urgency and rewards first movers — limited quantity drives FOMO | Tier includes: lifetime Standard access, early adopter badge, limited to 50 units, estimated revenue $1,450, clear what "lifetime" means (perpetual Standard tier access) |
| **C-2** | **Supporter tier defined: $49 + exclusive badge (75 units)** | Mid-tier captures backers willing to pay more for recognition | Tier includes: lifetime Premium access, exclusive "Founding Supporter" badge, name in credits/about page, limited to 75 units, estimated revenue $3,675 |
| **C-3** | **Team Pack tier defined: $99 for 3 licenses (30 units)** | Group/team tier captures higher ACV and appeals to workplace wellness buyers | Tier includes: 3 lifetime Standard licenses, team badge, priority support during beta, limited to 30 units, estimated revenue $2,970 |

### Section D: Timeline & Goals — 4 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **D-1** | **Launch timing recommendation produced** | Launching too early lacks credibility; too late misses the indie support window | Clear recommendation: launch after alpha gate (PRD 71) passes but during or before beta, with rationale tied to product readiness and backer confidence |
| **D-2** | **Minimum viable goal set at $3-5K** | Goal must be achievable to avoid failed campaign stigma while covering real costs | Goal amount justified with cost breakdown (hosting, API costs, domain, marketing), achievability assessed against tier unit limits, campaign duration recommended (30 days) |
| **D-3** | **Stretch goals defined at $15-25K** | Stretch goals maintain momentum after minimum is hit and signal ambition | 3-4 stretch goals mapped to specific features or milestones (e.g., $10K = mobile app, $15K = Apple Health integration, $20K = team tournaments, $25K = API for third-party integrations) |
| **D-4** | **Pre-launch and post-campaign timeline documented** | Campaign success depends on pre-launch buildup and post-campaign execution | Timeline includes: 4-week pre-launch (email list, social teasers, early access signups), 30-day campaign, 2-week post-campaign fulfillment and onboarding |

### Section E: Alternative & Complementary Paths — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **E-1** | **AppSumo marketplace evaluated** | AppSumo can generate $5-20K for software products with minimal marketing effort — evaluate fit | AppSumo submission requirements documented, typical revenue range for fitness/productivity apps assessed, fee structure (AppSumo takes 70% first deal) weighed against volume |
| **E-2** | **Build in Public strategy outlined** | Twitter/X and LinkedIn build-in-public audiences convert to early adopters and backers | Platform-specific strategy for each (Twitter: dev journey threads, LinkedIn: corporate wellness angle), recommended posting cadence, how BIP feeds into crowdfunding launch |
| **E-3** | **Product Hunt launch coordination planned** | Product Hunt launch and crowdfunding campaign can amplify each other if timed correctly | Recommendation on whether to launch PH before, during, or after crowdfunding, how to cross-reference between platforms, PH preparation checklist |

---

## ✅ Success Criteria

| Metric | Target | Verification Method |
|--------|--------|---------------------|
| Platform recommendation made | One primary platform selected with rationale and fallback | Strategy document has clear recommendation section |
| Tier structure complete | All 3 tiers defined with pricing, limits, inclusions, and estimated revenue | Tier table exists with all fields populated |
| Revenue projection calculated | Total potential revenue from all tiers calculated ($8,095 at full sell-through) | Math verified: (50 x $29) + (75 x $49) + (30 x $99) |
| Campaign content checklist produced | Story arc, visual list, video brief, and FAQ all documented | Each subsection exists in strategy document |
| Timeline aligned to alpha/beta | Launch window tied to specific PRD milestones (71, 77) | Timeline references gate criteria, not arbitrary dates |
| Goal and stretch goals justified | $3-5K minimum with cost breakdown, stretch goals with feature mapping | Cost breakdown table exists, stretch goals have deliverables |
| Alternative paths documented | AppSumo, Build in Public, and Product Hunt evaluated | Each has pros/cons and recommended timing |
| Strategy document saved | Output written to `docs/artifacts/plan_crowdfunding_campaign.md` | File exists with all sections |

---

## 🔍 Systems/Design Considerations

- **Tier-to-pricing alignment:** Crowdfunding tiers must not undercut or conflict with the long-term pricing model ($4.99/mo Standard, $9.99/mo Premium). A $29 lifetime deal is equivalent to ~6 months of Standard — this is sustainable only if it drives adoption that converts to organic growth. The strategy must include the math proving lifetime deals do not create a pricing ceiling problem.
- **Payment provider dependency:** The chosen crowdfunding platform may have its own payment processing, but post-campaign fulfillment (activating backer accounts, managing licenses) depends on the payment provider selected in PRD 72. Ensure the strategy accounts for how backer data flows from the crowdfunding platform into StepLeague's subscription system.
- **Single-developer bandwidth:** Every campaign element (video, updates, backer communication) competes with development time. The strategy must be realistic about what one person can execute and recommend outsourcing or automation where appropriate.
- **Geographic constraints:** Vietnam residency and SA bank account affect platform eligibility. Some platforms require US/EU bank accounts or business entities. The platform recommendation must confirm payout compatibility.

---

## 💡 Proactive Considerations

| # | Consideration | Why It Matters |
|---|---------------|----------------|
| 1 | **Campaign video production on a solo-dev budget** | Video is the highest-converting element on any crowdfunding page, yet professional production can cost $2-5K — more than the minimum funding goal. The strategy must define a realistic DIY approach: screen recording with voiceover (Loom/OBS), simple talking-head footage (phone + natural light), and editing tools (CapCut/DaVinci Resolve free tier). Include a budget ceiling of $50-100 for stock music and graphics. If the founder is camera-shy, evaluate faceless video formats (screen demo + narration) that still convert. |
| 2 | **Early bird FOMO psychology and conversion mechanics** | The 50-unit Early Bird tier at $29 is designed to create urgency. But FOMO only works if backers believe scarcity is real and the deal is genuinely better than what comes later. The strategy must define: how the "X of 50 remaining" counter is displayed, what happens when Early Bird sells out (do Supporter tier sales accelerate?), whether a "last chance" email blast is sent at 80% sold, and how the price gap between $29 Early Bird and $49 Supporter is framed as a reward for trust, not a penalty for lateness. |
| 3 | **Backer update cadence and content strategy** | Backers who feel informed stay engaged and share the campaign. Silence breeds refund requests. The strategy must define: update frequency during campaign (weekly), update frequency post-campaign (bi-weekly until fulfillment, monthly after), content themes per update (milestone hit, feature preview, behind-the-scenes, "you made this possible" gratitude), and which updates are public (marketing) vs backer-only (exclusivity). Aim for 4-5 updates during a 30-day campaign. |
| 4 | **What happens if the campaign fails** | If using an all-or-nothing platform (Kickstarter), failure means $0 and public embarrassment. If using flexible funding (Indiegogo, BMaC, Ko-fi), "failure" is raising less than the minimum goal. The strategy must define: what constitutes failure (less than $1K raised or fewer than 30 backers), the pivot plan if the campaign fails (shift to direct pre-sales via the website, AppSumo submission, or Bootstrap-only path), how to communicate a failed campaign without damaging brand credibility, and whether a second attempt is viable (typically 60+ days later with revised positioning). |
| 5 | **Lifetime deal sustainability math** | Offering lifetime access at $29-$49 creates a cohort of users who never generate recurring revenue. If 155 backers all claim lifetime access, that is 155 users consuming server resources indefinitely for a one-time payment. The strategy must include: projected monthly server cost per user (Supabase, Vercel, AI API calls for step verification), break-even analysis (how many months until a lifetime backer "costs" more than they paid), and a cap on total lifetime deals across all tiers (155 units total) to limit long-term liability. If AI verification costs $0.01-0.05 per check and users check daily, a $29 lifetime backer breaks even at ~2-5 years — this math must be explicit. |
| 6 | **Cross-promotion with Product Hunt launch** | A Product Hunt launch can drive 5,000-20,000 unique visitors in 24 hours. If timed to coincide with an active crowdfunding campaign, this traffic can convert to backers. The strategy must define: optimal sequencing (launch PH on day 2-3 of campaign when "trending" on the crowdfunding platform amplifies PH credibility), how the PH listing links to the campaign page (not the main site), a PH-exclusive perk for backers who come from PH (e.g., mention in a "PH Backers" hall of fame), and preparation steps (PH hunter outreach, teaser posts, maker comment strategy). |
| 7 | **Social proof from alpha testers** | Crowdfunding campaigns with testimonials and usage data convert significantly better than those without. By launching after alpha (per the timeline recommendation), there should be real alpha testers who can provide quotes, screenshots, and usage stats. The strategy must define: how to collect testimonials (in-app prompt, email request, feedback form), minimum number of testimonials needed (5-10), what format works best on campaign pages (quote + photo + stat, e.g., "I walked 12,000 steps/day for 3 weeks straight — Sarah, alpha tester"), and whether alpha testers get a free upgrade as thanks for testimonial use. |
| 8 | **Post-campaign fulfillment workflow** | After the campaign ends, every backer needs to be onboarded: account created, tier activated, badge applied, license keys issued (for Team Pack). The strategy must define: the fulfillment timeline (within 7 days of campaign end for digital products), the technical flow (backer email -> invite to create StepLeague account -> auto-apply tier and badge via a redemption code system), how Team Pack buyers distribute their 3 licenses (shareable invite links?), and what happens if a backer never redeems (reminder emails at 7, 30, 90 days, then archive). This workflow must be simple enough for one developer to manage manually for 155 backers. |

---

## 📋 Documentation Update Checklist

- [ ] PRD_00_Index.md — Add PRD 78 as Proposed, update counts
- [ ] CHANGELOG.md — Log PRD creation
- [ ] No AGENTS.md changes needed (no new code patterns)
- [ ] No skill file changes needed
- [ ] **Git commit** — `docs(prd): PRD 78 — crowdfunding campaign prep`

---

## 📚 Best Practice References

- **Crowdfunding for software:** Software/SaaS campaigns on Kickstarter have ~20% success rate vs ~40% for hardware. Indiegogo flexible funding removes the all-or-nothing risk. Campaigns with video raise 105% more than those without (Kickstarter data).
- **Lifetime deal economics:** LTD buyers generate high upfront revenue but zero recurring revenue. Cap lifetime deals at 10-15% of projected year-one users to avoid revenue ceiling. LTD works best as a bootstrapping tool, not a permanent pricing strategy.
- **Campaign page conversion:** Average crowdfunding page converts at 2-5% of visitors. Pages with video, social proof, and clear tier differentiation convert at the high end. The first 48 hours determine campaign trajectory — front-load marketing effort.
- **Build in Public:** Solo devs who share their journey (revenue numbers, user growth, challenges) build trust that directly converts to crowdfunding backers. Consistency matters more than polish — 3-5 posts/week across Twitter and LinkedIn for 4+ weeks before campaign launch.
- **Backer psychology:** Backers are motivated by (1) getting a deal, (2) being part of something early, (3) supporting an indie creator. The campaign must hit all three. Price anchoring (show the future price next to the backer price) and scarcity (limited units) are the strongest conversion levers.
- **Post-campaign retention:** 30-40% of crowdfunding backers become long-term users if onboarded within 7 days. Fulfillment delays beyond 30 days significantly increase refund requests and negative reviews.

---

## 💰 Revenue Projection Summary

| Tier | Price | Units | Revenue | Cumulative |
|------|-------|-------|---------|------------|
| Early Bird | $29 | 50 | $1,450 | $1,450 |
| Supporter | $49 | 75 | $3,675 | $5,125 |
| Team Pack | $99 | 30 | $2,970 | $8,095 |
| **Total** | | **155** | **$8,095** | |

**Minimum viable goal:** $3,000-$5,000 (achievable with Early Bird + partial Supporter sell-through)
**Full sell-through:** $8,095 (before platform fees)
**After platform fees (~8-10%):** ~$7,285-$7,447 net

---

## 🔗 Related Documents

- [PRD 72: Payment Provider Research](./PRD_72_Payment_Provider_Research.md) — Payment infrastructure for post-campaign fulfillment
- [PRD 73: Business Analysis Refresh](./PRD_73_Business_Analysis_Refresh.md) — Updated market analysis and crowdfunding platform recommendation
- [PRD 71: Alpha Verification Gate](./PRD_71_Alpha_Verification_Gate.md) — Alpha readiness criteria that must pass before campaign launch
- [PRD 77: Alpha/Beta Gate Criteria](./PRD_77_Alpha_Beta_Gate_Criteria.md) — Stage definitions for launch timing
- [PRD 33: Pricing & How It Works](./PRD_33_Pricing_HowItWorks.md) — Long-term pricing tiers that crowdfunding tiers must align with
- PRD 79: Launch Marketing Content (future) — Blocked by this PRD; will use campaign assets and messaging
- [Business Analysis](../../artifacts/stepleague_business_analysis.md) — Two-stage crowdfunding approach and revenue projections

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-03-29 | Initial | Created PRD |
