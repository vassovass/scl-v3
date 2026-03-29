# PRD 79: Launch Marketing Content

> **Order:** 79
> **Status:** 📋 Proposed
> **Type:** Architecture (Strategy)
> **Sprint:** G, Track 1 (G1.1)
> **Dependencies:** PRD 77 (Alpha/Beta Gate Criteria), PRD 78 (Crowdfunding Campaign Prep)
> **Blocks:** PRD 80 (Product Hunt Launch Plan)

---

## 🎯 Objective

Define the complete launch marketing content strategy for StepLeague — crafting LinkedIn personal story posts, Reddit community engagement plans, a 4-week content calendar, build-in-public narrative, LinkedIn DM outreach playbook, and cross-platform content repurposing. The output is a content strategy document and asset production checklist that enables Vasso (solo bootstrapped developer) to execute a credible, organic launch marketing campaign across LinkedIn, Reddit, and adjacent platforms with zero paid ad spend.

The marketing content serves three purposes: building pre-launch awareness through authentic storytelling ("building a fitness app with AI, solo dev journey"), driving traffic to the crowdfunding campaign (PRD 78), and establishing StepLeague's brand voice before the Product Hunt launch (PRD 80). The core message centers on five differentiators: works with ANY fitness tracker, AI-verified step counts (no cheating), privacy-first (no health data permissions), free for small groups, and competitive leagues with friends/family/coworkers.

---

## ⚠️ Research-First Mandate
Before implementing this PRD, the agent MUST conduct intensive research into all relevant aspects — successful indie app launch campaigns, Reddit community posting rules and best practices, LinkedIn content algorithms (2025-2026), build-in-public case studies, fitness app marketing channels, and content calendar frameworks for bootstrapped launches. This research phase should directly inform the content strategy and produce the best possible outcome. Do not skip or shortcut the research phase.

---

> **Session note**: This PRD runs in its own Claude Code session. Read the shared context file first. Do NOT update PRD_00_Index.md or CHANGELOG.md — the orchestrator session handles those to prevent conflicts.

## ⚠️ Agent Context

| File | Purpose |
|------|---------|
| docs/prds/SPRINT_EFG_CONTEXT.md | **READ FIRST** — Shared context for PRDs 70-80: business decisions, cross-PRD dependencies, architectural patterns, orchestration protocol |
| `docs/prds/admin-feedback-system/PRD_78_Crowdfunding_Campaign_Prep.md` | Crowdfunding strategy — marketing content must coordinate messaging and timing |
| `docs/prds/admin-feedback-system/PRD_77_Alpha_Beta_Gate_Criteria.md` | Alpha/beta gate definitions — know what you are launching and when |
| `docs/prds/admin-feedback-system/PRD_69_SEO_Content_Pages.md` | SEO content pages — coordinate organic search content with social content |
| `docs/prds/admin-feedback-system/PRD_53_Sharing_Marketing_Page.md` | Sharing and marketing page — existing social sharing infrastructure |
| `docs/prds/admin-feedback-system/PRD_51_Social_Sharing_Stats_Hub.md` | Social sharing stats hub — shareable content that can be repurposed for marketing |
| `docs/artifacts/stepleague_business_analysis.md` | Business analysis with target audience, positioning, and competitive landscape |
| `src/app/(public)/pricing/page.tsx` | Live pricing page — verify messaging alignment with pricing tiers |
| `.claude/skills/architecture-philosophy/SKILL.md` | Systems thinking, future-proofing principles |

### MCP Servers

_None required — this PRD produces a strategy document and content calendar, not code._

### Task-Optimized Structure

| Phase | Mode | Task |
|-------|------|------|
| 1 | `[READ-ONLY]` | Read PRD 77, PRD 78, PRD 69, business analysis, and pricing page for current context `[PARALLEL with 2]` |
| 2 | `[READ-ONLY]` | Research LinkedIn algorithm (2025-2026), Reddit community rules for target subreddits, build-in-public case studies, indie app launch campaigns `[PARALLEL with 1]` |
| 3 | `[READ-ONLY]` | Analyze successful fitness app launches, Reddit self-promo policies, content repurposing frameworks, and email list building strategies `[SEQUENTIAL]` |
| 4 | `[READ-ONLY]` | Synthesize findings into content calendar, platform-specific strategies, and asset production checklist `[SEQUENTIAL]` |
| 5 | `[WRITE]` | Write launch marketing content strategy to `docs/artifacts/plan_launch_marketing_content.md` `[SEQUENTIAL]` |

---

## 🏗️ Detailed Feature Requirements

### Section A: LinkedIn Personal Story Strategy — 4 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **A-1** | **Build-in-public narrative arc defined for LinkedIn** | LinkedIn rewards authentic storytelling from founders — a structured narrative arc over 4 weeks builds audience before the launch ask | Narrative arc documented with weekly themes: Week 1 (the problem — fitness accountability is broken), Week 2 (the journey — solo dev building with AI), Week 3 (the proof — alpha tester results and AI verification demo), Week 4 (the ask — crowdfunding launch and early access). Each week has 3-4 post briefs with hooks, body structure, and CTAs. |
| **A-2** | **Post format and cadence optimized for LinkedIn algorithm** | LinkedIn algorithm favors specific formats (text-only, carousel, document posts) and penalizes others (external links in body). Posting without algorithm awareness wastes effort. | Research-backed format recommendations documented: optimal post length (1,200-1,500 characters), best-performing formats (text-only personal stories, carousel breakdowns, document/PDF posts), link placement strategy (comment, not body), posting frequency (4-5x/week), optimal posting times, hashtag strategy (3-5 niche tags), and engagement pod tactics (if ethical). |
| **A-3** | **LinkedIn DM outreach playbook for personal network** | The founder's existing network (friends, ex-colleagues, fitness enthusiasts) is the highest-conversion channel for early traction. Cold outreach without a playbook feels spammy and burns relationships. | DM templates for 4 segments: (1) close friends/family ("I built this, would love your honest feedback"), (2) ex-colleagues ("remember when we talked about fitness challenges at work?"), (3) fitness-interested connections ("saw your running posts — built something you might like"), (4) tech/startup connections ("building in public, would love your eyes on this"). Each template includes: opening line, value proposition, specific ask, follow-up timing. Target: 50-100 personalized DMs in week 1. |
| **A-4** | **LinkedIn content pillars established** | Posting randomly lacks coherence and fails to build a recognizable brand voice. Content pillars create thematic consistency that the algorithm rewards. | 4-5 content pillars defined: (1) Build in Public (dev updates, metrics, challenges), (2) Fitness Accountability (why step challenges work, research-backed), (3) AI in Consumer Apps (how AI verification works, no-BS explainer), (4) Solo Dev Life (tools, decisions, wins/losses), (5) StepLeague Product Updates (features, alpha feedback, launch news). Each pillar has 3-4 example post hooks. |

### Section B: Reddit Community Strategy — 5 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **B-1** | **Target subreddits identified with posting rules documented** | Each subreddit has unique self-promotion rules — violating them results in bans and wasted effort. Blind posting across Reddit is the #1 mistake indie devs make. | At least 8 subreddits evaluated: r/sideproject, r/fitness, r/stepchallenge, r/running, r/getmotivated, r/apps, r/androidapps, r/startups. For each: subscriber count, self-promo rules (verbatim quotes from sidebar/wiki), best post format (text vs link vs image), flair requirements, moderator strictness level, and recommended approach (value-first post vs direct product post). |
| **B-2** | **Reddit engagement strategy defined (value-first, not spam)** | Reddit communities punish obvious self-promotion. The strategy must build karma and credibility before any product mention. | Pre-launch engagement plan: 2-3 weeks of genuine participation (commenting, answering questions, sharing fitness tips) before any product post. Account karma targets per subreddit. Content strategy that provides value first ("Here is how I used AI to verify step counts — open source approach") with product mention as secondary. Ratio defined: 9 value posts for every 1 product mention (Reddit's 9:1 rule). |
| **B-3** | **Reddit post templates for each subreddit** | Different subreddits respond to different framing — a post that works in r/sideproject will fail in r/fitness. Templates save time and increase success rate. | Post template for each target subreddit with: title format, body structure, tone (technical vs casual vs motivational), what to include (screenshots, stats, story), what to avoid (marketing speak, superlatives, direct links on first post), and expected engagement pattern. Include a "Show HN"-style template for r/sideproject and a "transformation story" template for r/fitness. |
| **B-4** | **Reddit AMA/feedback-request strategy planned** | "Roast my app" and "I built X in Y months" posts generate massive engagement on Reddit — they invite critique while showcasing the product. | Plan for 2-3 feedback-request posts: one in r/sideproject ("I quit my job to build a fitness app — roast my landing page"), one in r/startups ("Solo dev, 6 months in, here's what I learned"), one in a fitness sub ("Built an app that uses AI to verify your steps — looking for beta testers"). Each post timed to align with crowdfunding campaign milestones. |
| **B-5** | **Reddit cross-posting and timing strategy** | Posting the same content to multiple subreddits simultaneously triggers spam filters and moderator action. Strategic spacing and variation is required. | Cross-posting rules: minimum 24-48 hours between similar posts in different subreddits, title/body variation requirements, which subreddits to post to first (smaller communities before larger ones for initial feedback), optimal posting times per subreddit (research-backed), and how to handle viral posts (respond to every comment within 2 hours, prepare FAQ answers in advance). |

### Section C: Content Calendar (4 Weeks Post-Launch) — 4 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **C-1** | **Week 1 content calendar: Launch announcement blitz** | The first 48-72 hours of a launch determine its trajectory. Content must be pre-written and scheduled to maintain momentum without burning out. | Day-by-day calendar for Week 1 with: platform (LinkedIn/Reddit/other), post type, topic, pre-written or brief, posting time, and expected action (e.g., "Day 1 AM: LinkedIn personal story — why I built StepLeague. Day 1 PM: r/sideproject launch post. Day 2: LinkedIn carousel — 5 things I learned building with AI"). Minimum 2 posts/day across platforms. |
| **C-2** | **Week 2 content calendar: Social proof and momentum** | After launch excitement fades, social proof from early users and alpha testers sustains interest and converts fence-sitters. | Week 2 calendar focused on: alpha tester testimonials (with permission), early usage stats ("50 users in 3 days"), comparison content ("StepLeague vs manual step tracking"), and behind-the-scenes content (tech stack, AI verification demo). At least 1 post/day. LinkedIn DM follow-ups to Week 1 outreach. |
| **C-3** | **Week 3 content calendar: Crowdfunding push** | If the crowdfunding campaign (PRD 78) is live, Week 3 content must drive conversions. If not yet live, content must build anticipation for launch. | Week 3 calendar with two variants: (A) crowdfunding live — progress updates, backer milestone celebrations, urgency posts ("X% funded, Y days left"), behind-the-scenes of what funding enables; (B) crowdfunding not yet live — waitlist building, "launching soon" teasers, feature previews, email capture CTAs. |
| **C-4** | **Week 4 content calendar: Sustain and transition** | Most indie launches lose all momentum by Week 4. A planned content calendar prevents the post-launch silence that kills growth. | Week 4 calendar focused on: user stories and case studies, feature roadmap teasers, "what's next" narrative, community building (encouraging users to share their own step stats), and content that seeds the Product Hunt launch (PRD 80). At least 3 posts/week. Transition plan from launch marketing to ongoing content cadence. |

### Section D: Cross-Platform Content & Coordination — 4 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **D-1** | **Content repurposing framework across platforms** | Creating unique content for every platform is unsustainable for a solo dev. A repurposing framework turns one piece of content into 3-5 platform-specific variants. | Framework documented: one long-form piece (LinkedIn post or blog) repurposed into Reddit post (remove marketing tone, add technical detail), Twitter/X thread (break into 5-7 tweets), Instagram story (key stat + screenshot), and email newsletter snippet. Include format conversion rules (e.g., LinkedIn carousel becomes Reddit image gallery, Reddit AMA becomes LinkedIn "lessons learned" post). |
| **D-2** | **SEO content coordination with PRD 69** | Launch marketing content and SEO content pages serve different audiences but share keywords and messaging. Without coordination, they compete or contradict each other. | Coordination plan: which SEO pages (PRD 69) to publish before/during/after launch for maximum organic traffic timing, shared keyword list between social content and SEO pages, how social posts link to SEO pages (not just the homepage), and how SEO pages capture traffic from social-driven brand searches. |
| **D-3** | **Crowdfunding messaging alignment with PRD 78** | Marketing content must echo — not contradict — the crowdfunding campaign messaging, tiers, and urgency mechanics. | Messaging alignment matrix: key phrases and USPs that must appear consistently across all platforms, tier pricing and names that match exactly, urgency language that references actual campaign deadlines, and a "do not say" list (avoid claims that conflict with the campaign page). |
| **D-4** | **Build-in-public narrative consistency across platforms** | The build-in-public story must feel coherent whether someone encounters it on LinkedIn, Reddit, or Twitter. Inconsistent narratives break trust. | Narrative bible: the canonical version of the StepLeague story (who, what, why, when), approved talking points, metrics that can be shared publicly (user count ranges, not exact numbers unless agreed), and a timeline of key milestones to reference. Updated weekly during the launch period. |

### Section E: Email List Building & Direct Outreach — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **E-1** | **Email list building strategy from marketing content** | Social media reach is rented — email is owned. Every piece of launch content should funnel interested people onto an email list for direct communication. | Strategy defined: lead magnet options (early access, free premium trial, step challenge guide), email capture placement in social bios and posts, landing page CTA optimization, and email sequence for new subscribers (welcome, product story, social proof, launch/crowdfunding announcement). Target: 200-500 email subscribers in first 4 weeks. |
| **E-2** | **Email outreach templates for warm contacts** | Beyond LinkedIn DMs, email outreach to personal network, fitness communities, and tech journalists/bloggers can drive qualified traffic. | Templates for 3 audiences: (1) personal network ("Hey [name], I built something — 2-minute look?"), (2) fitness bloggers/influencers ("Your audience might find this useful — free access for a review"), (3) tech/startup newsletter curators ("Solo dev launches AI fitness app — potential story?"). Each template includes subject line, body, CTA, and follow-up timing. |
| **E-3** | **Email list segmentation for launch phases** | Different subscribers need different messages — alpha testers, crowdfunding backers, waitlist signups, and general interested people have different conversion paths. | Segmentation plan: tags/segments defined (alpha tester, crowdfunding backer, waitlist, newsletter subscriber, personal network), content variation per segment, send frequency per segment, and which segments receive which launch announcements. |

---

## ✅ Success Criteria

| Metric | Target | Verification Method |
|--------|--------|---------------------|
| LinkedIn content plan complete | 4-week calendar with 3-5 posts/week, each with hooks, body briefs, and CTAs | Calendar exists in strategy document with all fields populated |
| Reddit strategy documented | 8+ subreddits evaluated with rules, templates, and engagement plan | Each subreddit has a dedicated subsection with posting rules quoted |
| Content calendar complete | Day-by-day plan for Week 1, week-by-week for Weeks 2-4, covering all platforms | Calendar table exists with platform, post type, topic, and timing per entry |
| DM outreach playbook ready | 4 segment templates with openers, value props, asks, and follow-up timing | Each segment template is complete and personalization-ready |
| Cross-platform repurposing framework defined | One-to-many content conversion rules documented | Framework shows how 1 post becomes 3-5 platform variants |
| SEO coordination mapped | Shared keyword list and content timing alignment with PRD 69 | Coordination section references specific PRD 69 pages and keywords |
| Crowdfunding messaging aligned | USPs, tier names, and urgency language match PRD 78 exactly | Alignment matrix cross-references PRD 78 tiers and messaging |
| Email list strategy defined | Lead magnet, capture mechanics, sequences, and subscriber target (200-500) | Strategy document includes email section with target and funnel |
| Strategy document saved | Output written to `docs/artifacts/plan_launch_marketing_content.md` | File exists with all sections |

---

## 🔍 Systems/Design Considerations

- **Solo-dev bandwidth reality:** Every marketing activity competes with development time, customer support, and campaign management. The content calendar must be executable by one person spending a maximum of 1-2 hours/day on marketing. Batch creation sessions (write 5 posts in one sitting) are more efficient than daily writing.
- **Authenticity over polish:** The build-in-public audience values raw honesty over corporate messaging. Typos in a genuine story outperform polished copy that reads like marketing. The content strategy must explicitly favor authenticity — share real numbers, admit mistakes, show the messy process.
- **Platform algorithm dependency:** LinkedIn, Reddit, and Twitter algorithms change frequently. The strategy must document current algorithm behaviors (as of 2025-2026) but also include fallback tactics that work regardless of algorithm (DMs, email, personal asks). Do not bet everything on one platform's organic reach.
- **Crowdfunding timing coordination:** If PRD 78 defines a specific launch window, all marketing content must build toward that date. The content calendar should have a "T-minus" structure where content intensity increases as the campaign approaches. Marketing without a clear conversion target (campaign page, waitlist, etc.) wastes momentum.
- **USP consistency:** The five selling points (any tracker, AI-verified, privacy-first, free for small groups, competitive leagues) must appear consistently but not robotically. Each post should emphasize 1-2 USPs naturally, not list all five. Over 4 weeks, all five should receive roughly equal coverage.

---

## 💡 Proactive Considerations

| # | Consideration | Why It Matters |
|---|---------------|----------------|
| 1 | **LinkedIn algorithm optimization for founder content (2025-2026)** | LinkedIn's algorithm has shifted heavily toward personal narrative content from founders and solo builders. Posts that tell a story ("I spent 6 months building X, here is what happened") outperform product announcements by 5-10x in reach. The strategy must research current algorithm signals: dwell time (longer posts that people stop scrolling to read), early engagement velocity (first 60 minutes determine distribution), comment depth (replies-to-replies signal quality), and format preferences (text-only and carousels currently outperform video and link posts). Document specific tactics: post between 7-9 AM in the audience's timezone, ask a question at the end to drive comments, avoid editing posts within 10 minutes of publishing (kills distribution), and use line breaks every 1-2 sentences for mobile readability. |
| 2 | **Reddit self-promotion rules and ban avoidance** | Reddit is the most hostile platform to self-promotion — moderators in fitness and tech subreddits actively ban accounts that appear promotional. The strategy must document each target subreddit's specific self-promo rules (some allow "Show Reddit" posts, others ban any app mention). Critical tactics: build genuine comment karma (minimum 100+ in a subreddit before posting), use the subreddit's tone (r/fitness is no-nonsense, r/sideproject is supportive, r/getmotivated is inspirational), never use marketing language ("revolutionary", "game-changing"), and frame product posts as stories ("I built this to solve my own problem") not pitches. Include a risk matrix: which subreddits are safe for product posts, which require mod approval, and which should only receive value-add comments with a subtle profile link. |
| 3 | **Content repurposing workflow for a solo dev** | Creating unique content for LinkedIn, Reddit, Twitter, email, and a blog is unsustainable. The strategy must define a realistic repurposing workflow: write one long-form piece per week (1,500+ words), then slice it into platform-specific variants. Example: a LinkedIn post about "how AI verification works" becomes a Reddit technical breakdown (add code snippets), a Twitter thread (break into 7 tweets with visuals), an email newsletter section (add a CTA), and an Instagram carousel (extract 5 key stats). Include tools: use a scheduling tool (Buffer, Typefully, or free alternatives), batch-create one week's content in a 2-3 hour Sunday session, and maintain a content bank of evergreen pieces that can be reposted with updates. |
| 4 | **User-generated content from alpha testers** | Alpha testers who share their own StepLeague experience create the most credible marketing content — peer recommendations convert 4x better than founder claims. The strategy must define: how to ask alpha testers for testimonials (in-app prompt after 7 days of use, personal email request with specific questions), what format to request (screenshot of their step count + one sentence about what they like), how to incentivize sharing (free premium month, exclusive badge, early access to new features), and how to obtain permission for marketing use (simple consent form or email confirmation). Target: 5-10 usable testimonials with screenshots by launch day. Include a "wall of love" concept for the landing page and social proof in posts. |
| 5 | **Screenshot and video asset production checklist** | Every marketing post performs better with visuals, but producing high-quality screenshots and demo videos takes time. The strategy must define: a complete shot list (app dashboard, step submission flow, AI verification result, league leaderboard, mobile view, desktop view), device frames to use (Samsung, iPhone, Huawei mockups to reinforce "any tracker" message), a 30-60 second demo video brief (screen recording with voiceover showing the core loop: upload screenshot, AI verifies, steps counted, leaderboard updates), tools for production (screenshots: browser DevTools device mode + CleanShot or ShareX; video: Loom or OBS + CapCut for editing; device frames: shots.so or mockuphone.com), and a budget ceiling of $0-50 for any stock assets. All visual assets should be produced in one batch session. |
| 6 | **Email list building from day one** | Social media reach is volatile — algorithm changes can kill organic reach overnight. An email list is the only marketing channel the founder fully controls. The strategy must define: where to capture emails (landing page CTA, LinkedIn post comments offering a lead magnet, Reddit post offering beta access, crowdfunding page backer emails), what lead magnet to offer (free step challenge guide, early access to premium features, "how I built StepLeague" mini-ebook), which email tool to use (free tier options: Buttondown, Resend, Mailchimp free plan), the welcome email sequence (immediate: thank you + what to expect, Day 3: the StepLeague story, Day 7: social proof + CTA to try the app), and subscriber growth targets (50 in Week 1, 100 by Week 2, 200-500 by Week 4). Every piece of content should include one path to the email list. |
| 7 | **Analytics tracking for marketing attribution** | Without tracking, there is no way to know which platform, post, or campaign drove signups. The strategy must define: UTM parameter conventions for every link shared (utm_source=linkedin/reddit/email/twitter, utm_medium=social/dm/newsletter, utm_campaign=launch-week-1/crowdfunding/buildinpublic), how UTM data flows into PostHog or GA4 (PRD 59), a simple dashboard or spreadsheet tracking daily metrics (profile views, post impressions, link clicks, signups, email subscribers) per platform, and weekly review cadence to double down on what works and abandon what does not. Include specific tracking for: LinkedIn post impressions and profile views, Reddit post upvotes and comment counts, email open rates and click rates, and landing page conversion rate from each source. |
| 8 | **Timing relative to crowdfunding campaign (PRD 78)** | Marketing content and the crowdfunding campaign must be synchronized — launching content too early wastes momentum before people can back, launching too late means the campaign starts cold. The strategy must define: the pre-launch content phase (2-3 weeks before crowdfunding goes live — build audience, tease the product, grow the email list), the launch-day content blitz (coordinated posts across all platforms within a 4-hour window, all linking to the campaign page), the mid-campaign sustain phase (daily updates, milestone celebrations, urgency posts as the deadline approaches), and the post-campaign transition (shift messaging from "back us" to "join us", redirect traffic to the app). If the crowdfunding campaign has a specific launch date, the content calendar must count backward from that date with T-minus milestones. |

---

## 📋 Documentation Update Checklist

- [ ] PRD_00_Index.md — Add PRD 79 as Proposed, update counts
- [ ] CHANGELOG.md — Log PRD creation
- [ ] No AGENTS.md changes needed (no new code patterns)
- [ ] No skill file changes needed
- [ ] **Git commit** — `docs(prd): PRD 79 — launch marketing content`

---

## 📚 Best Practice References

- **LinkedIn for founders (2025-2026):** Personal story posts from founders generate 3-10x more engagement than company page posts. The algorithm currently favors text-only posts with 1,200-1,500 characters, early engagement (first 60 minutes), and comment depth. Carousel/document posts are the second-best format. External links in the post body reduce reach by 40-50% — place links in the first comment instead.
- **Reddit marketing for indie devs:** The 9:1 rule (9 value posts for every 1 self-promotional post) is enforced by moderators in most subreddits. Successful indie dev posts on Reddit frame the product as a personal story ("I built this because...") not a pitch. r/sideproject is the most forgiving community for product launches; r/fitness is the most strict about self-promotion.
- **Build in public:** Founders who share metrics (revenue, user count, challenges) build audiences 3-5x faster than those who only share product updates. Transparency creates trust. The most engaging BIP content format is the "milestone + lesson" post: "Hit 100 users — here is the one thing that actually worked."
- **Content repurposing:** The "create once, publish everywhere" framework (COPE) is essential for solo operators. One 1,500-word piece can yield 5-7 platform-specific posts. The key is adapting tone and format, not copy-pasting — Reddit hates marketing speak that works on LinkedIn.
- **Email list conversion:** Email subscribers convert to paying customers at 3-5x the rate of social media followers. For bootstrapped launches, even a 200-person email list can generate meaningful crowdfunding backers if the list is warm (opted in for a specific reason, not purchased).
- **Marketing attribution:** Campaigns without UTM tracking and analytics waste 30-50% of their effort on channels that do not convert. Simple UTM conventions (source/medium/campaign) in PostHog or GA4 provide enough signal to optimize within 1-2 weeks.

---

## 🔑 StepLeague USP Messaging Guide

| USP | One-Liner | LinkedIn Angle | Reddit Angle |
|-----|-----------|----------------|--------------|
| Any tracker | "Works with Samsung, Huawei, Xiaomi, Garmin, Fitbit, Apple Watch — no ecosystem lock-in" | "I built it to work with every fitness tracker because exclusivity is anti-user" | "Finally an app that doesn't require Apple Watch — works with any tracker" |
| AI-verified | "AI checks your step count from a screenshot — no syncing, no APIs, no cheating" | "We use AI to verify steps from screenshots — here is how it works (technical deep-dive)" | "Built an AI that reads step count screenshots so nobody can cheat in our leagues" |
| Privacy-first | "Just a screenshot — no health data permissions, no GPS, no heart rate" | "We made a deliberate choice: no health data permissions. Here is why privacy-first wins." | "Unlike [competitor], we don't ask for health data access. Screenshot only." |
| Free for small groups | "Free for groups of 3 or fewer — no credit card, no trial, just free" | "Our free tier is genuinely free — 3 people can compete forever at $0" | "Free for small groups, no catch. Paid tiers for larger leagues." |
| Competitive leagues | "Challenge friends, family, or coworkers to step competitions with real accountability" | "We are making fitness social again — leagues where your steps actually count" | "My friend group started a step league and now we all walk 10K+ daily" |

---

## 🔗 Related Documents

- [PRD 77: Alpha/Beta Gate Criteria](./PRD_77_Alpha_Beta_Gate_Criteria.md) — Know what you are launching and when
- [PRD 78: Crowdfunding Campaign Prep](./PRD_78_Crowdfunding_Campaign_Prep.md) — Coordinate messaging, tiers, and launch timing
- [PRD 69: SEO Content Pages](./PRD_69_SEO_Content_Pages.md) — Organic search content coordination
- [PRD 53: Sharing & Marketing Page](./PRD_53_Sharing_Marketing_Page.md) — Existing social sharing infrastructure
- [PRD 51: Social Sharing Stats Hub](./PRD_51_Social_Sharing_Stats_Hub.md) — Shareable content for repurposing
- PRD 80: Product Hunt Launch Plan (future) — Blocked by this PRD; builds on marketing momentum
- [Business Analysis](../../artifacts/stepleague_business_analysis.md) — Target audience, positioning, and competitive landscape

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-03-29 | Initial | Created PRD |
