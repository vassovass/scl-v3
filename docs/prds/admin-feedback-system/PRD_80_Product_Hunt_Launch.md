# PRD 80: Product Hunt Launch Plan

> **Order:** 80
> **Status:** 📋 Proposed
> **Type:** Architecture (Strategy)
> **Sprint:** G, Track 1 (G1.2)
> **Dependencies:** PRD 79 (Launch Marketing Content must be ready)
> **Blocks:** None (final PRD in the launch chain)

---

## 🎯 Objective

Define the complete Product Hunt launch strategy for StepLeague — from pre-launch preparation through launch day execution to post-launch momentum. Product Hunt gives you ONE SHOT: a poorly prepared launch wastes the platform's algorithmic boost and community attention permanently. The output is a battle-tested launch plan, asset checklist, and contingency playbook that enables Vasso (solo maker) to execute a top-5 daily finish with maximum signup conversion.

StepLeague's unique angle for Product Hunt: AI-powered step verification that turns walking into competitive leagues — a PWA with no App Store friction (direct web signup), built by a solo developer as a passion project. The solo maker narrative is Product Hunt's most beloved story archetype.

---

## ⚠️ Research-First Mandate

Before implementing this PRD, the agent MUST conduct intensive research into all relevant aspects — Product Hunt launch best practices (2025-2026), successful fitness/health app launches on PH, optimal launch timing (day of week, time), hunter vs self-post tradeoffs, thumbnail/gallery optimization, tagline character limits, and first comment strategy. This research phase should directly inform the launch plan and produce the best possible outcome. Do not skip or shortcut the research phase.

---

> **Session note**: This PRD runs in its own Claude Code session. Read the shared context file first. Do NOT update PRD_00_Index.md or CHANGELOG.md — the orchestrator session handles those to prevent conflicts.

## ⚠️ Agent Context

| File | Purpose |
|------|---------|
| docs/prds/SPRINT_EFG_CONTEXT.md | **READ FIRST** — Shared context for PRDs 70-80: business decisions, cross-PRD dependencies, architectural patterns, orchestration protocol |
| `docs/prds/admin-feedback-system/PRD_78_Crowdfunding_Campaign_Prep.md` | Crowdfunding strategy — cross-promotion timing with PH launch |
| `docs/prds/admin-feedback-system/PRD_33_Pricing_HowItWorks.md` | Pricing page — must be polished before PH visitors arrive |
| `docs/prds/admin-feedback-system/PRD_34_B2B_Landing.md` | /teams page — B2B angle for PH visitors exploring team use cases |
| `docs/prds/admin-feedback-system/PRD_69_SEO_Content_Pages.md` | SEO pages — additional landing surfaces for PH-referred traffic |
| `docs/prds/admin-feedback-system/PRD_77_Alpha_Beta_Gate_Criteria.md` | Alpha/beta stage definitions — product must be beta-ready before PH launch |
| `docs/prds/admin-feedback-system/PRD_59_Analytics_Implementation.md` | Analytics setup — must be configured to attribute PH traffic |
| `src/app/(public)/pricing/page.tsx` | Live pricing page — verify it handles PH traffic spike |
| `src/app/(public)/teams/page.tsx` | Live B2B landing page |
| `.claude/skills/architecture-philosophy/SKILL.md` | Systems thinking, future-proofing principles |

### MCP Servers

_None required — this PRD produces a strategy document, not code._

### Task-Optimized Structure

| Phase | Mode | Task |
|-------|------|------|
| 1 | `[READ-ONLY]` | Read PRD 78 (crowdfunding cross-promotion), PRD 79 (marketing content), PRD 59 (analytics), and PRD 77 (beta readiness) `[PARALLEL with 2]` |
| 2 | `[READ-ONLY]` | Research Product Hunt launch best practices (2025-2026), successful fitness/health launches, timing data, thumbnail specs, tagline limits, hunter dynamics `[PARALLEL with 1]` |
| 3 | `[READ-ONLY]` | Analyze hunter vs self-post tradeoffs, PH algorithm factors, gallery optimization, first comment strategies from top launches `[SEQUENTIAL]` |
| 4 | `[READ-ONLY]` | Synthesize findings into launch timeline, asset checklist, war room plan, and contingency playbook `[SEQUENTIAL]` |
| 5 | `[WRITE]` | Write Product Hunt launch plan to `docs/artifacts/plan_product_hunt_launch.md` `[SEQUENTIAL]` |

---

## 🏗️ Detailed Feature Requirements

### Section A: Pre-Launch Preparation (T-30 to T-1 Days) — 5 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **A-1** | **Hunter selection strategy decided** | A well-known hunter can boost initial visibility, but self-posting as the maker enables direct engagement and the "solo builder" narrative that PH loves | Hunter vs self-post tradeoffs documented with recommendation, if hunter route chosen: outreach template and 5+ candidate hunters identified, timeline for outreach (T-21 minimum) |
| **A-2** | **Product Hunt listing assets prepared** | PH has strict specs for thumbnails, gallery images, and taglines — assets that miss specs get cropped or rejected | Thumbnail (240x240), gallery images (1270x760, up to 5), animated GIF or video demo, tagline (60 char max), one-liner description, all reviewed against PH 2025-2026 spec requirements |
| **A-3** | **Maker story and first comment drafted** | The maker's first comment sets the tone for the entire launch — it is the highest-read piece of content on any PH listing | First comment template written: personal story (why you built this), what makes it different (AI step verification), honest ask (try it, share feedback), no hard sell. 300-500 words, conversational tone, includes 1-2 personal anecdotes |
| **A-4** | **Community pre-engagement completed** | Products that launch cold get buried — PH rewards products with an existing engaged audience | 4-week pre-launch plan: build PH follower base, engage in PH discussions, connect with makers in fitness/health space, tease upcoming launch in relevant communities (Twitter/X, Reddit r/SideProject, Indie Hackers, running/fitness subreddits) |
| **A-5** | **Website hardened for traffic spike** | PH launches can drive 5,000-20,000 visitors in 24 hours — a slow or broken site wastes the opportunity permanently | Checklist: Vercel handles auto-scaling (confirm plan limits), Supabase connection pool verified, rate limiting configured, pricing page loads under 2s, signup flow tested end-to-end under simulated load, error monitoring active (PostHog, Sentry or equivalent) |

### Section B: Launch Day Execution (T-0) — 5 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **B-1** | **Launch timing optimized** | PH resets at 12:01 AM PT — launching at the wrong time means missing the critical first-hour momentum window | Research-backed recommendation for optimal post time (typically 12:01-12:05 AM PT for maximum exposure window), day of week recommendation (Tuesday-Thursday historically strongest), seasonal considerations documented |
| **B-2** | **War room checklist defined** | Launch day is a 24-hour sprint — without a checklist, critical tasks get missed in the chaos | Hour-by-hour checklist covering: T-0 (post goes live, share first comment), T+1h (first social blast), T+2-4h (respond to every comment within 30 minutes), T+6h (second social push to EU audiences waking up), T+12h (Asian timezone push), T+18h (final push before day ends), T+24h (results assessment) |
| **B-3** | **Comment response strategy defined** | Every unanswered comment is a missed conversion — PH algorithm weights maker engagement | Response templates for: feature requests ("Love this idea — added to our roadmap"), bug reports ("Thanks for catching this — fixing now"), comparisons to competitors ("Great question — here's how we differ..."), pricing questions, "how does AI verification work" questions. All templates sound human and authentic, not canned. |
| **B-4** | **Social amplification plan executed** | PH upvotes from PH-referred traffic (organic discovery) count more than external traffic upvotes — but social sharing still drives awareness and signups | Platform-specific share plan: Twitter/X thread (5-7 tweets telling the launch story), LinkedIn post (professional/wellness angle), relevant Discord/Slack communities, email to existing alpha/beta users asking them to check it out on PH (NOT asking for upvotes — this violates PH rules), WhatsApp/Telegram groups |
| **B-5** | **Ethical promotion boundaries enforced** | PH actively penalizes vote manipulation — fake upvotes, upvote-for-upvote groups, and direct "please upvote" asks can get a product delisted | Clear list of DO and DO NOT: DO share the PH link broadly, DO ask people to "check it out and share feedback", DO respond to every comment. DO NOT ask for upvotes, DO NOT use upvote exchange groups, DO NOT send direct messages asking for votes, DO NOT use services that sell upvotes. Include consequences of violation (product delisted, maker banned, permanent reputation damage). |

### Section C: Post-Launch Momentum (T+1 to T+30 Days) — 4 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **C-1** | **Follow-up content drip plan defined** | PH traffic spikes and dies within 48 hours — sustained content extends the long tail | 30-day content calendar: Day 1-2 (launch recap and thank-you posts), Day 3-5 (behind-the-scenes "what we learned from PH launch"), Day 7 (first feature update based on PH feedback), Day 14 (user story spotlight from PH-originated signups), Day 21 (data-driven post: "X signups, Y steps tracked, Z leagues created since PH launch"), Day 30 (one-month retrospective) |
| **C-2** | **PH badge integrated on website** | The "Featured on Product Hunt" badge is social proof that converts visitors long after launch day | Badge placement plan: above the fold on homepage, on pricing page, on /teams page, in footer. Dynamic badge showing upvote count (PH provides embed code). Badge must link back to PH listing for continued discovery. |
| **C-3** | **PH-originated user cohort tracked** | Without attribution, you cannot measure PH ROI or optimize future launches | UTM parameters defined for all PH links (utm_source=producthunt, utm_medium=referral, utm_campaign=launch_2026), PostHog cohort created for PH-referred users, conversion funnel tracked (PH visit -> signup -> first step upload -> league join -> day-7 retention) |
| **C-4** | **Cross-promotion with crowdfunding executed** | PH launch and crowdfunding campaign can amplify each other if timed correctly (per PRD 78, item E-3) | Recommendation on sequencing: launch PH during active crowdfunding campaign (day 2-3 of campaign when "trending" status amplifies credibility), PH listing links to campaign page for backer conversion, PH-exclusive perk defined for backers arriving from PH |

### Section D: Metrics and Contingency — 4 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **D-1** | **Launch day metrics dashboard defined** | Without real-time metrics, you cannot make tactical decisions during the 24-hour launch window | Dashboard includes: PH upvote count (check every hour), PH comment count, PH ranking position, website traffic (real-time via PostHog/GA4), signup count (Supabase query), conversion rate (visits to signups), server health (response times, error rates) |
| **D-2** | **Success tiers defined** | "Did the launch go well?" needs a quantifiable answer, not a feeling | Tier definitions: Bronze (top 10 daily, 100+ upvotes, 50+ signups), Silver (top 5 daily, 250+ upvotes, 150+ signups, featured in PH newsletter), Gold (#1-3 of the day, 500+ upvotes, 300+ signups, PH badge of honor). Each tier maps to expected long-term impact on traffic and signups. |
| **D-3** | **Underperformance contingency plan defined** | If the launch is tracking below Bronze by T+6h, waiting 24 hours to react wastes the remaining window | Decision tree: If under 50 upvotes at T+6h: activate backup social channels, post in additional communities, share a personal/vulnerable "launch day is hard" tweet. If under 25 upvotes at T+12h: accept the launch is underperforming, focus on maximizing signups from whatever traffic exists, document lessons learned, plan a "re-launch" strategy (PH allows relaunching after significant product updates). If PH listing gets flagged/delisted: immediate outreach to PH support, audit for accidental rule violations, shift traffic to direct signup page. |
| **D-4** | **Lessons-learned retrospective template prepared** | A post-launch retrospective ensures the next launch (whether on PH or elsewhere) benefits from this experience | Template includes: what worked (specific tactics with data), what failed (and why), unexpected outcomes, community feedback themes, conversion funnel analysis, total cost of launch prep (time and money), recommendations for next time. To be completed within 48 hours of launch day end. |

---

## ✅ Success Criteria

| Metric | Target | Verification Method |
|--------|--------|---------------------|
| Launch plan document produced | Complete plan saved to `docs/artifacts/plan_product_hunt_launch.md` | File exists with all sections |
| All listing assets specified | Thumbnail, gallery, tagline, description, first comment all drafted or templated | Checklist in plan document with specs and drafts |
| War room checklist complete | Hour-by-hour T-0 plan with specific actions, owners (Vasso), and timing | Checklist exists with 8+ time-blocked entries |
| Ethical promotion guidelines documented | Clear DO/DO NOT list with consequences | Section exists with 5+ items in each column |
| Comment response templates ready | Templates for 5+ common comment types | Templates section with scenario-specific responses |
| Post-launch content calendar defined | 30-day content plan with specific post topics and platforms | Calendar with dated entries and platform targets |
| Analytics attribution configured | UTM parameters defined, PostHog cohort specified | UTM scheme documented, cohort definition included |
| Contingency plan defined | Decision tree for underperformance with specific triggers and actions | Decision tree with numeric thresholds at T+6h and T+12h |
| Success tiers quantified | Bronze/Silver/Gold with upvote, signup, and ranking targets | Tier table with numeric targets per metric |
| Cross-promotion with crowdfunding planned | Sequencing recommendation with rationale | Recommendation references PRD 78 timing and links to campaign page |

---

## 🔍 Systems/Design Considerations

- **PWA advantage on Product Hunt:** StepLeague is a PWA — no App Store download friction. PH visitors can sign up and start using the product in under 60 seconds. This is a major conversion advantage over native app launches that require store redirects. The launch plan must emphasize this instant-access angle in the tagline, first comment, and gallery images.
- **One-shot constraint:** Product Hunt's algorithm heavily favors first launches. A re-launch is possible after significant updates but never gets the same algorithmic boost. Every element of the launch must be production-quality before the post goes live. There is no "soft launch" on Product Hunt.
- **Solo maker authenticity:** PH's community viscerally rewards solo makers who share genuine stories and penalizes corporate-feeling launches. Every piece of launch content must sound like a real person, not a marketing department. Vulnerability (sharing struggles, being honest about limitations) converts better than polish on PH.
- **Traffic spike infrastructure:** PH traffic is a spike, not a steady stream. The site must handle 5-20K visitors in 24 hours without degradation. Vercel's auto-scaling handles compute, but Supabase connection pools, rate limiting, and third-party API limits (AI step verification) need pre-launch verification.
- **Conversion funnel readiness:** PH visitors are high-intent but low-patience. The signup flow must be frictionless: no mandatory email verification before first use, no multi-step onboarding blocking the core experience, pricing page must be clear and load fast. Any friction point loses PH visitors permanently — they do not come back.

---

## 💡 Proactive Considerations

| # | Consideration | Why It Matters |
|---|---------------|----------------|
| 1 | **Launch day war room checklist as a living document** | The hour-by-hour checklist (B-2) should be a printable single-page document that Vasso can keep next to his computer during the 24-hour launch window. It must include: exact times in local timezone (Vietnam, ICT/UTC+7), specific actions at each checkpoint, links to PH dashboard/PostHog/Supabase for quick metric checks, pre-written social posts ready to copy-paste, and a "panic button" section with PH support contact info and the contingency decision tree. The war room checklist is the difference between a chaotic launch and a controlled one — a solo maker cannot hold all this in their head during a high-adrenaline 24-hour sprint. |
| 2 | **Comment response templates that sound human** | PH users can detect canned responses instantly, and generic replies ("Thanks for your feedback!") actively hurt credibility. Each template (B-3) must have 3-4 variants to avoid repetition, include specific product details (not generic SaaS speak), and start with genuine engagement with the commenter's point before pivoting to StepLeague's response. For feature requests: acknowledge the idea, share whether it is on the roadmap (reference specific PRDs if applicable), and invite the commenter to join the beta. For criticism: thank them, be honest about limitations, and share what is being improved. Templates are starting points — every response must be personalized before posting. |
| 3 | **Post-launch content drip that sustains traffic** | PH traffic drops 90%+ after 48 hours. The 30-day content plan (C-1) must be designed to capture long-tail traffic from PH's search and "collections" features, while also driving organic discovery on other platforms. Key tactics: publish a "Building StepLeague" blog post that links back to the PH listing (PH ranks these posts internally), share weekly metrics updates on Twitter/X that reference the PH launch as the origin story, create a "lessons from our Product Hunt launch" post on Indie Hackers (this format consistently performs well and drives PH re-visits). Each piece of content should include a link to the PH listing to accumulate ongoing upvotes. |
| 4 | **PH badge integration as permanent social proof** | The "Featured on Product Hunt" badge (C-2) is one of the highest-converting social proof elements for SaaS products — visitors who see it convert at 15-30% higher rates than those who do not. The badge must be integrated within 24 hours of launch (while the upvote count is climbing), placed above the fold on the homepage, and dynamically updated with the final upvote count. Implementation: PH provides official embed widgets (JavaScript) and static badges (SVG/PNG). Use the dynamic widget on the homepage and static badges on the pricing and /teams pages. Ensure the badge does not cause layout shift (reserve space with explicit width/height). |
| 5 | **Maker story authenticity as the primary conversion lever** | On Product Hunt, the maker's story IS the product. A solo developer in Vietnam building a fitness competition platform with AI verification is a compelling narrative that PH's community will rally behind — but only if it is told authentically. The first comment (A-3) must include: the personal motivation (why fitness accountability matters to Vasso specifically), the technical challenge (building AI step verification as a solo dev), an honest admission of what is not perfect yet, and a genuine ask for feedback (not downloads or upvotes). Reference specific moments in the building journey — late nights debugging, the first time the AI correctly verified steps, the reaction from the first alpha tester. Authenticity cannot be faked, and PH's community will ruthlessly call out anything that feels manufactured. |
| 6 | **Cross-promotion with crowdfunding campaign for maximum amplification** | Per PRD 78 (item E-3), the PH launch and crowdfunding campaign should amplify each other. The optimal sequencing: launch crowdfunding first (get to "trending" status), then launch on PH 2-3 days later so the PH listing can reference an active, funded campaign as social proof. The PH listing should link to the crowdfunding page as the primary CTA (instead of or alongside direct signup) if the campaign is active. PH visitors who see an already-funded campaign experience strong social proof ("others have already backed this"). Define a PH-exclusive crowdfunding perk: "Mention you found us on Product Hunt for a bonus [founding supporter badge / early access to a future feature]" — this also helps track PH-to-backer attribution. |
| 7 | **Analytics setup for PH traffic attribution before launch day** | By launch day, the analytics pipeline must be fully operational — there is no time to debug tracking during the 24-hour window. Pre-launch checklist: PostHog configured with UTM parameter capture (utm_source=producthunt), custom event tracking for signup funnel stages (ph_visit, ph_signup_start, ph_signup_complete, ph_first_step, ph_league_join), real-time dashboard created in PostHog showing PH-specific metrics, Google Analytics 4 configured with the same UTM scheme as a backup, Vercel Analytics checked for real-time server metrics. Test the entire attribution chain end-to-end 48 hours before launch by simulating a PH referral visit (append UTM parameters manually and verify they flow through to PostHog). |
| 8 | **What to do if the launch underperforms — recovery playbook** | Not every PH launch goes well, and a poor showing is not the end — but only if the response is handled correctly. If the launch finishes outside the top 10: do NOT delete the listing (this looks worse than a low ranking), DO publish a transparent "What we learned from our Product Hunt launch" post within 72 hours (this format generates sympathy upvotes and organic traffic), DO use the PH comments as a feedback goldmine for the next product iteration, and DO plan a re-launch after a significant product update (PH allows this, and "v2 relaunch" stories sometimes outperform the original). If the launch is flagged for rule violations: immediately contact PH support (support@producthunt.com), audit all social posts for accidental "vote for us" language, and be transparent with the community about what happened. The worst outcome is not a low-ranking launch — it is a panicked overreaction that damages the brand. |

---

## 📋 Documentation Update Checklist

- [ ] PRD_00_Index.md — Add PRD 80 as Proposed, update counts
- [ ] CHANGELOG.md — Log PRD creation
- [ ] No AGENTS.md changes needed (no new code patterns)
- [ ] No skill file changes needed
- [ ] **Git commit** — `docs(prd): PRD 80 — Product Hunt launch plan`

---

## 📚 Best Practice References

- **Product Hunt launch timing:** Tuesday-Thursday launches historically outperform Monday and Friday. Posting at 12:01 AM PT maximizes the 24-hour visibility window. Avoid launching on the same day as major tech events or product launches from well-known companies.
- **First comment impact:** The maker's first comment is the most-read text on any PH listing. Top-performing first comments are 300-500 words, tell a personal story, explain the "why" not just the "what", and include an honest ask for feedback. Comments that ask for upvotes or sound like marketing copy are downvoted.
- **Gallery optimization:** PH listings with 4-5 gallery images (or animated GIFs showing the product in action) receive 2-3x more engagement than those with 1-2 static screenshots. The first gallery image is the "hero" — it must communicate the core value proposition in a single glance. Mobile screenshots are essential for a PWA.
- **Upvote dynamics:** PH's algorithm weights organic discovery upvotes more heavily than upvotes from externally referred traffic. Direct "vote for us" messages actively harm ranking. The best strategy is broad awareness ("check out what we launched") that drives genuine interest.
- **Solo maker advantage:** Products launched by solo makers or small indie teams consistently outperform VC-backed products in PH engagement metrics. The PH community roots for underdogs. Leaning into the solo maker story is not a weakness — it is the primary competitive advantage on this platform.
- **Post-launch long tail:** 60-70% of total PH traffic arrives in the first 24 hours, but the remaining 30-40% trickles in over weeks and months via PH search, collections, and "similar products" recommendations. Keeping the listing updated and the badge visible on the website extends this long tail.
- **Ethical promotion:** PH has actively cracked down on vote manipulation since 2024. Products caught using upvote services, exchange groups, or direct vote solicitation are delisted and makers are banned. The reputational damage extends beyond PH — the indie community shares blacklists.

---

## 🔗 Related Documents

- PRD 79: Launch Marketing Content (dependency) — All marketing content, messaging, and assets must be finalized before PH launch
- [PRD 78: Crowdfunding Campaign Prep](./PRD_78_Crowdfunding_Campaign_Prep.md) — Cross-promotion timing and backer conversion from PH traffic
- [PRD 77: Alpha/Beta Gate Criteria](./PRD_77_Alpha_Beta_Gate_Criteria.md) — Product must pass beta gate before PH launch
- [PRD 59: Analytics Implementation](./PRD_59_Analytics_Implementation.md) — PostHog and GA4 must be configured for PH traffic attribution
- [PRD 33: Pricing & How It Works](./PRD_33_Pricing_HowItWorks.md) — Pricing page must be polished and converting before PH visitors arrive
- [PRD 34: B2B Landing](./PRD_34_B2B_Landing.md) — /teams page as secondary conversion path for PH visitors exploring team use cases
- [PRD 69: SEO Content Pages](./PRD_69_SEO_Content_Pages.md) — SEO pages capture organic traffic from PH-generated search interest
- [Business Analysis](../../artifacts/stepleague_business_analysis.md) — Market positioning and competitive differentiation

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-03-29 | Initial | Created PRD |
