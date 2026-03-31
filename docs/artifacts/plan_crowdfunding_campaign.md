---
## Document Context
**What**: Complete crowdfunding campaign strategy for StepLeague — platform selection, tier structure, campaign content plan, timeline, and fulfillment workflow
**Why**: Provides a research-backed, actionable plan for raising $3-5K in seed funding while validating market demand; blocks PRD 79 (Launch Marketing Content)
**Status**: Active
**Last verified**: 2026-03-31
**Agent note**: This is the PRD 78 deliverable. Key finding: neither Kickstarter nor Indiegogo supports South African creators. The recommended approach is Ko-fi Shop + self-hosted Paystack campaign page.
---

# Crowdfunding Campaign Strategy

> **PRD**: 78
> **Date**: 2026-03-31
> **Goal**: Raise $3,000-$5,000 in seed funding and validate demand with 100+ backers
> **Full sell-through**: $8,095 (before fees)

---

## 1. Research Summary

### 1.1 Key Findings

Research conducted across crowdfunding platforms, Reddit communities, indie developer forums, and official platform documentation revealed several findings that significantly alter the original strategy assumptions from the business analysis:

1. **Platform eligibility is the primary blocker.** Neither Kickstarter nor Indiegogo supports South African creators. Both require residency and a bank account in one of ~25-30 supported countries (US, EU, UK, Australia, Canada, Japan, etc.). South Africa and Vietnam are absent from both lists. The only workaround is forming a US LLC via Stripe Atlas ($500), which contradicts the zero-budget bootstrap constraint.

2. **Indiegogo removed flexible funding in October 2025.** The Gamefound acquisition (July 2025) led to a platform overhaul. All campaigns are now fixed funding only. The "keep what you raise" safety net that made Indiegogo attractive for solo developers no longer exists.

3. **Software/SaaS campaigns consistently underperform on hardware-focused platforms.** Crowdfunding data shows that apps "almost always bomb" on Kickstarter/Indiegogo because backers expect tangible products. Software success rates are estimated at 10-20% vs 37-42% overall.

4. **Ko-fi and Buy Me a Coffee are viable alternatives with direct payouts.** Ko-fi pays directly to your Stripe or PayPal account with 0% fee on tips and 5% on shop/memberships ($6/mo Gold removes the 5%). Buy Me a Coffee takes 5% but does NOT support South Africa for payouts.

5. **Paystack can power a self-hosted campaign page.** Since Paystack is already the chosen payment provider (PRD 72) and supports one-time payments with custom metadata, a self-hosted crowdfunding page on stepleague.com is a realistic alternative to third-party platforms.

6. **Video increases funding by 105%.** Campaigns with video raise 2x more, and 60% more likely to succeed. DIY video production (screen recording + voiceover) is sufficient for software campaigns.

7. **42% of funds come in the first and last days.** The opening and closing surge pattern means front-loading marketing effort and creating "last chance" urgency are critical.

8. **Pre-launch email list converts at 1-5%.** A list of 500 subscribers could yield 5-25 backers on day one. Combined with personal network outreach, this is sufficient for the $3K minimum.

9. **AppSumo takes 60-70% of revenue.** At a $29 price point, only ~$8.70-$11.60 reaches the creator. With 40% of LTD businesses failing within 3 years, AppSumo is not recommended for bootstrapped projects.

10. **South African tax residents are taxed on worldwide income.** Crowdfunding income is taxable unless it qualifies as a gift (no quid pro quo) or loan. Since backers receive lifetime access, this is income. The R1.25M foreign employment exemption does not apply to self-employment/business income.

### 1.2 Sources

| Source | Finding | URL |
|--------|---------|-----|
| Kickstarter Support | 25 supported countries; SA/VN not listed | https://help.kickstarter.com/hc/en-us/articles/115005128014 |
| Indiegogo Creator Guidelines | SA/VN not in creator eligibility list | https://www.indiegogo.com/en/terms/creators |
| Indiegogo/Gamefound | Flexible funding retired Oct 2025 | https://www.boostyourcampaign.com/blog/flexible-funding-out |
| Indiegogo Support | Acquired by Gamefound July 2025 | https://support.indiegogo.com/hc/en-us/articles/39600950083988 |
| Ko-fi Pricing | 0% on tips, 5% on shop/memberships | https://ko-fi.com/pricing |
| Buy Me a Coffee Support | 45 supported countries; SA not listed | https://help.buymeacoffee.com/en/articles/6258038 |
| LaunchBoom | Video = 105% more funding | https://www.launchboom.com/crowdfunding-tips/the-psychology-of-a-successful-crowdfunding-campaign-updated |
| LaunchBoom | 42% of funds in opening/closing days | https://www.launchboom.com/crowdfunding-tips/the-psychology-of-a-successful-crowdfunding-campaign-updated |
| LaunchBoom | 30% in first week = 75% success chance | https://www.launchboom.com/crowdfunding-tips/kickstarter-crowdfunding/ |
| Indiegogo Email Guide | Pre-launch list converts 1-5% | https://entrepreneur.indiegogo.com/education/guide/email-strategy-crowfunding-campaign/ |
| AppSumo Blog | LTD economics and seller perspective | https://appsumo.com/blog/is-launching-a-lifetime-deal-worth-it |
| autoposting.ai | 40% of LTD businesses fail in 3 years | https://autoposting.ai/appsumo-review/ |
| SARS | SA residents taxed on worldwide income | https://www.sars.gov.za/individuals/tax-during-all-life-stages-and-events/foreign-employment-income-exemption/ |
| Paystack | SA/FNB direct settlement, T+1 | https://paystack.com/stripe/south-africa |
| Crowdfunding statistics | Average campaign raises ~$8,150 (2024) | https://bloggingwizard.com/crowdfunding-statistics/ |
| SearchLogistics | Kickstarter 39% overall success rate | https://www.searchlogistics.com/learn/statistics/kickstarter-stats-facts/ |

---

## 2. Platform Comparison Matrix

### 2.1 Eligibility Matrix

| Platform | SA Creator Eligible | VN Creator Eligible | SA Bank Payout | Workaround |
|----------|:-------------------:|:-------------------:|:--------------:|------------|
| **Kickstarter** | NO | NO | NO | Stripe Atlas US LLC ($500) |
| **Indiegogo** | NO | NO | NO | Stripe Atlas US LLC ($500) |
| **Ko-fi** | YES (via PayPal) | YES (via PayPal) | YES (PayPal/Stripe) | None needed |
| **Buy Me a Coffee** | NO | NO | NO | Payoneer US bank details |
| **AppSumo** | Unclear | Unclear | Unclear | Requires working product + review |
| **Self-hosted (Paystack)** | YES (native) | YES (SA registration) | YES (direct FNB T+1) | None needed |

### 2.2 Full Comparison

| Criteria | Kickstarter | Indiegogo | Ko-fi | Buy Me a Coffee | Self-hosted (Paystack) |
|----------|-------------|-----------|-------|-----------------|----------------------|
| **SA eligibility** | NO | NO | YES | NO | YES |
| **Platform fee** | 5% | 5% | 0% tips / 5% shop | 5% | 0% |
| **Payment processing** | 3-5% | 3% + $0.20 | ~3% + $0.30 (Stripe/PayPal) | ~3.4% + $0.30 | 2.9-3.1% + R1 |
| **Total cost on $4K** | ~$340 | ~$340 | ~$120-$320 | ~$340 | ~$164 |
| **You keep from $4K** | ~$3,660 | ~$3,660 | ~$3,680-$3,880 | ~$3,660 | ~$3,836 |
| **Funding model** | All-or-nothing | Fixed only (2026) | Flexible (keep all) | Flexible (keep all) | Flexible (keep all) |
| **Built-in audience** | Large (games/hardware) | Large (tech) | Small (creators) | Small (creators) | None (your audience) |
| **Software fit** | Poor (20% success) | Poor-Medium | Good (digital products) | Good (digital products) | Excellent (custom) |
| **Campaign page** | Hosted | Hosted | Shop page | Tips/membership page | Custom (full control) |
| **Video support** | Native | Native | Embedded | Embedded | Custom embed |
| **Payout speed** | ~14 days post-campaign | Per schedule | Instant to Stripe/PayPal | Weekly/monthly | T+1 to FNB |
| **Post-campaign sales** | No (external redirect) | Late Pledge | Always-on shop | Always-on | Always-on |

---

## 3. Platform Recommendation

### Primary: Ko-fi Shop + Self-hosted Paystack Campaign Page (Dual Strategy)

**The original plan to use Indiegogo is not viable.** South Africa is not in Indiegogo's or Kickstarter's creator eligibility list, and Indiegogo has removed flexible funding. The recommended approach combines two platforms:

#### Channel A: Self-hosted Campaign Page (stepleague.com/crowdfunding)

A dedicated page on stepleague.com powered by Paystack handles the primary campaign:

- **Why**: Zero platform fees. Direct FNB settlement (T+1). Full control over design, messaging, and analytics. Paystack already chosen as payment provider (PRD 72). Supports one-time payments with custom metadata for tier tracking.
- **How**: Static campaign page with tier cards, progress bar (updated via Supabase query), and Paystack checkout integration. Each tier is a Paystack "plan" or one-time transaction with metadata tags.
- **Limitation**: No built-in audience. All traffic must be driven by the creator.

#### Channel B: Ko-fi Shop (supplementary)

A Ko-fi page handles discovery and international payment fallback:

- **Why**: Ko-fi is accessible to SA creators (via PayPal or Stripe via Paystack). 0% platform fee on tips. Shop feature supports one-time product purchases (tiers). Memberships support recurring support. Acts as a secondary landing page for backers who prefer a recognized platform.
- **How**: List each tier as a Ko-fi Shop product. Link from the main campaign page. Use Ko-fi Gold ($6/mo) to remove 5% shop fee if volume justifies it.
- **Limitation**: Less customizable than self-hosted. No progress bar.

#### Why Not the Others

| Platform | Reason for Elimination |
|----------|----------------------|
| Kickstarter | SA not eligible. All-or-nothing too risky for $3-5K. Requires Stripe Atlas ($500). |
| Indiegogo | SA not eligible. Flexible funding removed. Fixed funding = all-or-nothing risk. Requires Stripe Atlas ($500). |
| Buy Me a Coffee | SA not supported for payouts. Workaround (Payoneer) adds complexity and fees. |
| AppSumo | 60-70% revenue share. Attracts deal hunters, not long-term users. Requires fully working product with marketplace review. |

### Fallback: Ko-fi Only

If building a self-hosted campaign page is not feasible within the timeline, run the entire campaign through Ko-fi Shop. Accepts this trade-off: slightly higher fees (5% on shop sales without Gold) and less control over the campaign experience, but faster to set up.

---

## 4. Campaign Story Arc

### The Narrative: "Every Step Verified"

The campaign narrative follows the classic problem-journey-solution-ask arc, optimized for a solo indie developer audience:

#### Act 1: The Problem (15 seconds / 2 paragraphs)

> Step challenges are broken. People cheat. Fitness apps require you to hand over your health data to yet another company. And if you use a Samsung watch while your friends use Apple? Forget competing together.
>
> StepLeague was born from frustration. I wanted to compete with friends on daily steps, but every app either locked me into one ecosystem, demanded invasive permissions, or had no way to stop people from faking their numbers.

#### Act 2: The Journey (15 seconds / 2 paragraphs)

> I am a solo developer from South Africa, building StepLeague from Vietnam. Over the past year, I have written 69+ product requirement documents and built a complete platform: PWA with offline support, AI-powered step verification, league competitions, and a global leaderboard.
>
> StepLeague works with ANY fitness tracker. Samsung, Apple, Garmin, Xiaomi, Fitbit -- take a screenshot of your step count, upload it, and our AI verifies it is real. No health data permissions. No API integrations that break. Just screenshots and artificial intelligence.

#### Act 3: The Solution (15 seconds / 2 paragraphs)

> StepLeague is a competitive step-tracking platform where friends, coworkers, and communities form leagues and compete weekly. AI verification means no cheating. Universal device support means everyone can play. The free tier lets you try it with up to 3 people per league.
>
> The platform is in alpha testing right now. Real people are using it, submitting steps, and climbing leaderboards. The core experience works. Now I need your help to take it to beta and beyond.

#### Act 4: The Ask (15 seconds / 1 paragraph)

> Back StepLeague today and lock in lifetime access at a fraction of the future price. Your contribution funds the beta launch: server costs, AI verification API, and the marketing push to bring StepLeague to thousands of step-counters around the world. As a founding backer, you will get your name in the app, a permanent badge, and the satisfaction of knowing you helped build something from the ground up.

---

## 5. Visual Asset Checklist + Video Brief

### 5.1 Visual Assets

| Asset | Specs | Purpose | Status |
|-------|-------|---------|--------|
| Hero image | 1200x630px, mobile + desktop mockup | Campaign page header, social shares | To create |
| App screenshots (mobile) | 390x844px (iPhone 14 Pro), 5-7 screens | Showcase core features | Can capture from app |
| App screenshots (desktop) | 1440x900px, 3-4 screens | Show dashboard, leaderboard | Can capture from app |
| Founder photo | 800x800px, natural/casual | Humanize the campaign | To take |
| AI verification infographic | 1200x800px | Explain screenshot -> AI -> verified flow | To create (Canva/Figma) |
| Social proof mockup | 1200x628px | Alpha tester quotes with step counts | To create after alpha |
| Tier comparison graphic | 1200x800px | Side-by-side tier benefits | To create |
| Progress bar graphic | Dynamic | Show funding progress | Built into campaign page |
| OG image for sharing | 1200x630px | Social media previews | To create |
| Favicon/logo | 512x512px | Brand consistency | Already exists |

### 5.2 Video Brief

| Element | Detail |
|---------|--------|
| **Length** | 60-90 seconds |
| **Format** | Screen recording + voiceover (faceless OK) |
| **Budget** | $50-100 total |
| **Tools** | OBS Studio (free) for recording, DaVinci Resolve (free) for editing |
| **Music** | Royalty-free from Pixabay or Artlist ($0-16) |
| **Graphics** | Canva Pro ($0 with free trial) for title cards |

#### Shot List

| Time | Content | Type |
|------|---------|------|
| 0:00-0:10 | Problem statement: "Step challenges are broken" + quick cuts of broken experiences | Text overlays + stock footage |
| 0:10-0:25 | App demo: signup, screenshot upload, AI verification animation, step count appearing | Screen recording (mobile) |
| 0:25-0:40 | Leaderboard competition, league creation, high-fives | Screen recording (mobile + desktop) |
| 0:40-0:55 | The ask: "Back StepLeague" + tier cards appearing | Screen recording + graphics |
| 0:55-1:10 | Social proof: alpha tester quotes, step counts | Text overlays |
| 1:10-1:20 | CTA: "Join the founding backers" + link | End card |

#### Faceless Video Notes

If camera-shy, the entire video can be screen recording with narration. Research shows that software campaign videos with clear app demos convert well even without talking-head footage. The authenticity of showing the real product matters more than production quality.

---

## 6. Tier Structure with Lifetime Deal Sustainability Math

### 6.1 Tier Definitions

| Tier | Price | Units | Revenue | What Backers Get |
|------|-------|-------|---------|-----------------|
| **Early Bird** | $29 | 50 | $1,450 | Lifetime Standard access, Early Adopter badge, name on Founders wall |
| **Supporter** | $49 | 75 | $3,675 | Lifetime Premium access, Founding Supporter badge, name in credits/about page, priority beta access |
| **Team Pack** | $99 | 30 | $2,970 | 3x Lifetime Standard licenses, Team badge, priority support during beta, shareable invite links |
| **Total** | | **155** | **$8,095** | |

**Revenue verification**: (50 x $29) + (75 x $49) + (30 x $99) = $1,450 + $3,675 + $2,970 = **$8,095**

### 6.2 Net Revenue After Fees

| Scenario | Gross | Platform Fee | Processing Fee | Net Revenue |
|----------|-------|-------------|----------------|-------------|
| Self-hosted (Paystack) at full sell-through | $8,095 | $0 | ~$267 (3.3%) | **~$7,828** |
| Ko-fi Shop (no Gold) at full sell-through | $8,095 | ~$405 (5%) | ~$243 (3%) | **~$7,447** |
| Ko-fi Shop (Gold, $6/mo x 2) at full sell-through | $8,095 | $12 | ~$243 (3%) | **~$7,840** |
| Minimum goal ($3K) via Paystack | $3,000 | $0 | ~$99 | **~$2,901** |
| Minimum goal ($3K) via Ko-fi Shop | $3,000 | ~$150 | ~$90 | **~$2,760** |

### 6.3 Lifetime Deal Sustainability Math

**Cost per user per month (estimated):**

| Cost Component | Monthly Cost per User | Notes |
|----------------|----------------------|-------|
| Supabase (free tier, 500MB) | ~$0 | Free tier covers 50K MAU |
| Vercel (Hobby, then Pro at scale) | ~$0.02-0.05 | Bandwidth + serverless invocations |
| AI step verification (Gemini) | ~$0.15-0.75 | 1 verification/day x 30 days x $0.005-0.025/call |
| Total per user/month | **~$0.17-0.80** | |

**Break-even analysis:**

| Tier | Price | Monthly Cost (low) | Monthly Cost (high) | Break-even (low) | Break-even (high) |
|------|-------|-------------------|--------------------|-----------------|--------------------|
| Early Bird ($29) | $29 | $0.17 | $0.80 | 170 months (14 yrs) | 36 months (3 yrs) |
| Supporter ($49) | $49 | $0.17 | $0.80 | 288 months (24 yrs) | 61 months (5 yrs) |
| Team Pack ($99 / 3 users) | $33/user | $0.17 | $0.80 | 194 months (16 yrs) | 41 months (3.4 yrs) |

**Interpretation**: At the low-cost estimate ($0.17/user/month), lifetime deals are sustainable for 14+ years -- well beyond the product lifecycle. At the high-cost estimate ($0.80/user/month), the Early Bird tier breaks even at 3 years. This is acceptable because:

1. **155 lifetime users is the cap.** Total long-term liability is capped at 155 users (+ 90 team pack sub-users = 245 max).
2. **AI costs will decrease.** Gemini API pricing trends downward as models become more efficient.
3. **Most backers will churn organically.** Industry data shows 30-40% of crowdfunding backers become long-term active users. The rest stop using the product within 6-12 months regardless of lifetime access.
4. **Lifetime users drive word-of-mouth.** Active lifetime users who never pay again still refer paying subscribers.

**Risk mitigation**: The total lifetime deal pool is 155 units (+ 90 team sub-users). If all 245 users remain active indefinitely at the high-cost estimate, annual server cost is ~$2,352/yr. This is manageable against projected subscription revenue ($3K-$15K ARR Year 1).

### 6.4 Tier-to-Pricing Alignment

| Tier | Crowdfunding Price | Equivalent Subscription Value | Months Equivalent |
|------|-------------------|------------------------------|-------------------|
| Early Bird ($29) | $29 lifetime Standard | $4.99/mo Standard | 5.8 months |
| Supporter ($49) | $49 lifetime Premium | $9.99/mo Premium | 4.9 months |
| Team Pack ($33/user) | $33/user lifetime Standard | $4.99/mo Standard x 3 | 6.6 months |

**Pricing ceiling risk**: Lifetime deals at $29-$49 do not undercut the subscription model because they are explicitly limited (155 units) and positioned as a founding backer reward. The subscription price ($4.99/mo, $9.99/mo) is the permanent pricing. The framing is: "Founding backers get rewarded for taking a risk on an early product."

---

## 7. Timeline Aligned to Alpha/Beta Gates

### 7.1 Campaign Timeline

The campaign launches after the alpha gate passes (PRD 71/77) but before or during early beta (Tier 1: 50-200 users per BETA_GATE_CRITERIA.md).

| Week | Phase | Activities | Dependencies |
|------|-------|------------|-------------|
| **T-4** | Pre-launch | Build campaign page (self-hosted). Set up Ko-fi shop. Collect alpha tester testimonials. Create video. Build email list (personal network + alpha testers). | Alpha gate passed (PRD 77). Paystack live mode working. |
| **T-3** | Pre-launch | Share "coming soon" on Facebook, LinkedIn, WhatsApp. Post build-in-public content. Send email teaser to list. Set up PostHog tracking for campaign page. | Campaign page ready. Video complete. |
| **T-2** | Pre-launch | Final campaign page review. Test Paystack checkout flow end-to-end. Prepare launch-day social posts. Brief alpha testers on sharing plan. | All assets ready. |
| **T-1** | Pre-launch | Send "launching tomorrow" email. Post countdown on social. Confirm all links work. | Email list > 100 subscribers. |
| **Day 1-3** | Launch | Go live. Email blast. Social posts (Facebook, LinkedIn, WhatsApp). Reddit r/SideProject post. Ask alpha testers to share. Monitor Paystack dashboard. | Marketing content ready (PRD 79). |
| **Day 4-7** | Early momentum | First backer update. Share milestone ("20 backers in 3 days!"). Engage with comments. Cross-post to r/fitness. | |
| **Day 8-14** | Mid-campaign | Second update. Testimonial spotlight. Early Bird sell-out cascade (if applicable). LinkedIn "building in public" post. | |
| **Day 15-21** | Sustain | Third update. Behind-the-scenes content. Feature preview for backers. Reddit AMA in r/SaaS. | |
| **Day 22-28** | Final push | "Last chance" messaging. Fourth update. Social proof roundup. WhatsApp direct outreach to network. | |
| **Day 29-30** | Close | Final 48-hour countdown. Email blast. "X spots remaining" urgency. Campaign ends. | |
| **Day 31-37** | Fulfillment | Process backer accounts. Send onboarding emails. Activate tiers. Distribute Team Pack invite links. | Fulfillment workflow ready. |

### 7.2 Alignment with PRD 77 Gate Criteria

| Gate | Requirement for Campaign Launch |
|------|-------------------------------|
| A-2 (Submission rate) | HARD gate must pass -- proves core loop works (backers need to see a working product) |
| A-5 (Bug count) | 0 P0 bugs, <=2 P1 bugs -- campaign page links to a functional product |
| B-2 (Core flow completion) | 70%+ unassisted completion -- strangers must be able to use the product |
| C-5 (Security readiness) | POPIA/GDPR consent must be functional -- crowdfunding backers are "strangers" |
| D-1 (Core features) | All core features must pass -- the campaign promises a working product |
| D-3 (Onboarding) | Onboarding must work for zero-context users -- backers are new users |

**Campaign launch should occur after the beta gate evaluation passes at Tier 0 (alpha), ideally during the transition to Tier 1 (closed beta, 50-200 users).**

---

## 8. Funding Goal Justification with Cost Breakdown

### 8.1 Minimum Goal: $3,000

| Cost Category | Amount | Notes |
|---------------|--------|-------|
| Vercel Pro (12 months) | $240 | $20/mo for production deployment |
| Supabase Pro (if needed, 12 months) | $300 | $25/mo if free tier is exceeded |
| Domain renewal (stepleague.com) | $15 | Annual renewal |
| AI verification API (Gemini, 12 months) | $120-600 | Depends on usage volume |
| Campaign video production | $50-100 | Stock music, graphics |
| Ko-fi Gold (2 months) | $12 | Remove shop fees during campaign |
| Misc (email service, monitoring tools) | $100-200 | PostHog free tier, Resend, etc. |
| **Reserve for unexpected costs** | $500-1,000 | Buffer |
| **Total minimum needs** | **$1,337-$2,467** | |

A $3,000 minimum goal covers 12 months of infrastructure with a healthy buffer. It is achievable with Early Bird sell-through ($1,450) plus ~30% of Supporter tier ($1,100).

### 8.2 Achievability Assessment

| Scenario | Backers Needed | Revenue | Achievable? |
|----------|---------------|---------|-------------|
| Minimum ($3K) | ~60-80 mixed | $3,000 | YES -- personal network + alpha testers |
| Conservative ($5K) | ~100-120 mixed | $5,000 | YES -- with moderate social media effort |
| Full sell-through ($8K) | 155 | $8,095 | STRETCH -- requires significant reach |

**Personal network math**: If Vasso has 200 Facebook friends + 300 LinkedIn connections + 50 WhatsApp contacts, and 3-5% back the campaign, that is 16-28 backers from personal network alone. Add 10-20 alpha testers who back, and 20-40 from Reddit/social, the $3K minimum is realistic.

---

## 9. Stretch Goals

Stretch goals activate after the $5,000 minimum is exceeded. Each is mapped to a specific feature with clear deliverables.

| Goal | Amount | Feature | Deliverable | PRD Alignment |
|------|--------|---------|-------------|---------------|
| **Base** | $3,000-$5,000 | Beta launch funded | 12 months infrastructure + marketing | Core campaign |
| **Stretch 1** | $10,000 | Health Connect Integration | Android auto-sync via Health Connect API (no more screenshots for Android users) | Future PRD |
| **Stretch 2** | $15,000 | Apple HealthKit Integration | iOS auto-sync via HealthKit (no more screenshots for iPhone users) | Future PRD |
| **Stretch 3** | $20,000 | Team Tournaments | Cross-league tournaments where leagues compete against each other | Future PRD |
| **Stretch 4** | $25,000 | Public API | REST API for third-party integrations, custom dashboards, and Zapier triggers | Future PRD |

**Stretch goal psychology**: Each goal is set at 125-150% of the previous threshold, making it feel achievable. The first stretch ($10K) addresses the most-requested feature (auto-sync) and directly resolves the "screenshot limitation" objection.

---

## 10. FAQ (12 Entries)

### For the Campaign Page

**Q1: When will I get access to StepLeague?**
A: Immediately. StepLeague is live in alpha. Once you back the campaign, you will receive an email with instructions to create your account and activate your lifetime tier within 7 days.

**Q2: What platforms and devices are supported?**
A: StepLeague is a Progressive Web App (PWA) that works in any modern browser on any device -- iPhone, Android, tablet, or desktop. It works with ANY fitness tracker: Samsung Health, Apple Health, Garmin Connect, Fitbit, Xiaomi Mi Fit, Google Fit, or any other app that shows your step count. Just screenshot your step count and upload it.

**Q3: Is this a subscription or lifetime access?**
A: Backing this campaign gives you lifetime access to your tier (Standard or Premium). After the campaign, StepLeague will move to a subscription model ($4.99/mo Standard, $9.99/mo Premium). Founding backers keep lifetime access forever.

**Q4: What does "lifetime" mean exactly?**
A: Lifetime means as long as StepLeague exists and operates. Your access does not expire. If StepLeague is acquired or shuts down, we will provide at least 90 days notice and export your data.

**Q5: How does AI step verification work?**
A: You upload a screenshot of your fitness app showing your step count. Our AI (powered by Google Gemini) analyzes the screenshot to verify it is a genuine fitness app screenshot with a real step count. This prevents cheating -- no more inflated numbers.

**Q6: What happens if the campaign does not reach its goal?**
A: We are using a flexible funding approach (self-hosted + Ko-fi). You are charged immediately and receive access immediately. There is no "failed campaign" scenario -- every contribution funds development directly. If total contributions are below expectations, development continues at a slower pace.

**Q7: Can I get a refund?**
A: Within 14 days of backing, you can request a full refund by emailing support@stepleague.com. After 14 days, contributions are non-refundable as they have been allocated to infrastructure costs.

**Q8: How is StepLeague different from Stridekick, StepBet, or Fitbit challenges?**
A: Three things: (1) AI verification prevents cheating, (2) works with ANY device (not locked to one ecosystem), and (3) no health data permissions required -- we never access your health data directly.

**Q9: I backed the Team Pack. How do I share my 3 licenses?**
A: After backing, you will receive 3 unique invite links. Share each link with a team member. When they create their account using the link, their lifetime Standard access is automatically activated.

**Q10: Is my payment data secure?**
A: Payments are processed by Paystack (a Stripe company) using bank-grade encryption. StepLeague never sees or stores your card details. Paystack is used by Burger King, MTN, and Under Armour in Africa.

**Q11: What data do you collect and how is it protected?**
A: StepLeague collects your email, display name, and uploaded screenshots. We do NOT access health data from your device. Screenshots are processed by AI and stored securely on Supabase (hosted in London). Full privacy policy at stepleague.com/privacy. You can request data deletion at any time.

**Q12: Who is building this?**
A: StepLeague is built by a solo developer (Vasso) -- a South African software developer based in Vietnam. The project has 69+ product requirement documents and has been in active development since late 2025. This is a passion project born from wanting a better way to compete with friends on daily steps.

---

## 11. AppSumo Evaluation

### Summary: Not Recommended

| Factor | Assessment |
|--------|-----------|
| **Revenue share** | AppSumo takes 60-70% on first deal (you keep $8.70-$11.60 on a $29 product) |
| **Revenue from $8,095 gross** | ~$2,430-$3,240 net (vs ~$7,800 via self-hosted) |
| **User quality** | "Deal hunters" -- 30-40% buy from FOMO, low conversion to active users |
| **Support burden** | LTD buyers expect all features; 20-30% become "hardcore" users who create disproportionate support load |
| **Sustainability** | 40% of LTD businesses fail within 3 years; AppSumo's cut makes unit economics worse |
| **Product requirement** | Must have a fully working, polished product; AppSumo reviews before listing |
| **Timeline** | Review process takes weeks-months; not suitable for pre-beta |
| **Control** | AppSumo controls pricing, promotion, and can remove listings; reviews are reportedly curated |

### Developer Experience Data (from Reddit/Indie Hackers)

- Developers report that AppSumo customers are "spoiled and think it is their right to have all features."
- Success stories exist (Pictory: 50 to 6,000 users; Komodo Decks: 6,000+ licenses) but these are mature products with large teams.
- Solo developers consistently report unsustainable support burden from LTD buyers.
- AppSumo may be viable as a Stage 2 play (post-beta, $15K-25K goal) if the product is mature and the developer can handle support volume.

### Recommendation

**Skip AppSumo for Stage 1.** The 60-70% revenue share destroys the economics of a $3-5K campaign. Consider for Stage 2 only if: (a) the product is fully launched with stable subscription revenue, (b) you have support automation in place, and (c) you treat it as a user acquisition channel (not a revenue channel).

---

## 12. Build in Public Strategy

### Platforms and Cadence

| Platform | Content Type | Frequency | Audience |
|----------|-------------|-----------|----------|
| **LinkedIn** | Professional journey, step challenge culture, workplace wellness | 2x/week | Professional contacts, HR/wellness leads |
| **Reddit** | Technical dev updates, "I built this" posts, fitness community | 1-2x/week | r/SideProject, r/SaaS, r/fitness |
| **Facebook** | Personal updates, friend group challenges, app screenshots | 1x/week | Personal network, friends & family |
| **WhatsApp** | Direct asks, alpha testing invites, campaign link | As needed | Close contacts, existing alpha testers |

### Content Themes

1. **Behind-the-scenes**: "Here is what I built this week" with screenshots
2. **Metrics sharing**: "StepLeague now has X users who walked Y total steps"
3. **Challenge stories**: "My friend group did a 7-day step challenge. Here is what happened."
4. **Technical deep-dives**: "How I built AI step verification with Google Gemini"
5. **Vulnerability/authenticity**: "The hardest part of building a product alone is..." (research shows negative emotions increase perceived authenticity)

### Pre-Campaign Build in Public Calendar (4 weeks)

| Week | LinkedIn Post | Reddit Post | Facebook/WhatsApp |
|------|-------------|-------------|-------------------|
| T-4 | "I am building a fitness app that uses AI to verify step counts. Here is why." | Post in r/SideProject: "Show HN"-style introduction | Share with close friends: "I built this, want to try?" |
| T-3 | "After 69 PRDs, here is what StepLeague looks like today" (screenshots) | Post in r/fitness: value-first post about step challenges | WhatsApp alpha tester group: "Campaign launching in 2 weeks" |
| T-2 | "Why I chose screenshots over health data APIs" (technical angle) | Comment in relevant threads, build karma | Facebook: share a "my step count journey" post |
| T-1 | "Tomorrow I am launching a crowdfunding campaign. Here is what I learned building alone for a year." | Build anticipation in r/SaaS | WhatsApp: "Launching tomorrow -- here is the link" |

---

## 13. Product Hunt Cross-Promotion Timing

### Recommendation: Launch Product Hunt 2-5 Days AFTER Campaign Start

| Timing Option | Pros | Cons | Verdict |
|---------------|------|------|---------|
| PH before campaign | Builds awareness first | PH traffic has nowhere to convert (no campaign yet) | NO |
| PH on campaign launch day | Maximum simultaneous buzz | Split attention; two launches to manage at once | RISKY |
| PH 2-5 days after campaign | Campaign is "trending" (early momentum visible); PH traffic sees social proof (X backers already) | Slightly delayed PH traffic | **RECOMMENDED** |
| PH after campaign ends | No cross-promotion benefit | Missed opportunity to convert PH visitors to backers | NO |

### Execution Plan

1. **Day 1-2 of campaign**: Focus entirely on campaign launch. Personal network, email blast, social posts.
2. **Day 3-5**: Launch on Product Hunt. The campaign page now shows "X backers, $Y raised" -- social proof for PH visitors.
3. **PH listing CTA**: Links to the campaign page (not the main site). The maker comment mentions the active campaign.
4. **PH-exclusive perk**: "Product Hunt backers" are tagged internally for a future "PH Founders" badge or special mention.

### Product Hunt Preparation Checklist

- [ ] Create PH "Coming Soon" page 4+ weeks before launch
- [ ] Prepare maker comment (authentic, personal story)
- [ ] Reach out to 2-3 PH hunters for a potential hunt
- [ ] Prepare launch-day assets (tagline, description, screenshots)
- [ ] Brief alpha testers on PH voting (genuine support, not vote manipulation)
- [ ] Coordinate PH launch timing: 12:01 AM PST for maximum exposure window

---

## 14. Post-Campaign Fulfillment Workflow

### 14.1 Backer Onboarding Flow

```
Backer pays via Paystack/Ko-fi
    |
    v
Paystack webhook fires (charge.success) / Ko-fi notification
    |
    v
Record backer in Supabase: email, tier, amount, payment_id
    |
    v
Send onboarding email (within 24 hours):
  - Welcome message
  - Account creation link (stepleague.com/signup?ref=backer&tier=X)
  - For Team Pack: 3 unique invite links
    |
    v
Backer creates account via link
    |
    v
Automatic tier activation:
  - subscription_tiers row linked to user
  - Badge applied (Early Adopter / Founding Supporter / Team)
  - Founders wall entry created
    |
    v
Backer lands on dashboard with tier active
```

### 14.2 Team Pack Distribution

Team Pack buyers receive 3 unique invite links (e.g., `stepleague.com/redeem/ABCD1234`). Each link:
- Can be used once
- Creates an account with Standard lifetime access
- Applies the Team badge
- Links back to the Team Pack buyer's record

### 14.3 Fulfillment Timeline

| Day | Action |
|-----|--------|
| Day 0 (payment) | Paystack webhook records backer. Confirmation email sent. |
| Day 1 | Onboarding email with account creation link. |
| Day 3 | Reminder email if account not yet created. |
| Day 7 | Second reminder. Campaign ends around this point (if Day 30). |
| Day 14 | Final "don't miss your lifetime access" email. |
| Day 30 | If still unredeemed, tag as dormant. |
| Day 90 | Archive if still unredeemed. Access remains available if they return later. |

### 14.4 Manual vs Automated

For 155 backers, a hybrid approach works:
- **Automated**: Paystack webhook -> Supabase record creation -> email via Resend/SendGrid
- **Manual**: Edge cases (failed payments, duplicate accounts, Team Pack questions)
- **Time estimate**: ~2-4 hours total for fulfillment setup, ~30 minutes/week during campaign for manual edge cases

---

## 15. Backer Communication Cadence

### During Campaign (30 days)

| Update | Timing | Content | Visibility |
|--------|--------|---------|------------|
| Update 1 | Day 2-3 | "Thank you + first milestone" | Public (marketing) |
| Update 2 | Day 7-8 | "Behind the scenes: what your funding enables" | Backer-only (exclusivity) |
| Update 3 | Day 14-15 | "Feature preview / alpha tester spotlight" | Public (marketing) |
| Update 4 | Day 21-22 | "Stretch goal announcement" (if applicable) | Public (marketing) |
| Update 5 | Day 28-29 | "Final push + gratitude" | Public (marketing) |

### Post-Campaign

| Update | Timing | Content |
|--------|--------|---------|
| Fulfillment kickoff | Day 31 | "Here is how to activate your account" |
| First progress update | Day 45 | "Here is what we built with your funding" |
| Monthly update 1 | Day 60 | Development progress, user milestones |
| Monthly update 2 | Day 90 | Feature release, community growth |
| Quarterly thereafter | Every 90 days | Ongoing development updates |

### Communication Channels

- **Email** (primary): All updates sent via email list
- **Ko-fi** (secondary): Updates posted on Ko-fi page for supporters who follow there
- **Campaign page** (tertiary): Major updates posted on stepleague.com/crowdfunding

---

## 16. Proactive Items

### 16.1 Full Currency Conversion Cost Modeling

```
Backer pays $29 USD (international card)
    |
    v
Paystack converts to ZAR at market rate + ~1% spread
    |
    v
Paystack deducts 3.1% + R1 fee
    |
    v
Net to FNB: ~R530 (at R19/$1 rate)
    |
    v
If Vasso needs USD/VND: FNB -> Wise -> VND
    Additional cost: ~0.5-1% (Wise fee)
```

**Total conversion cost path**: Backer pays $29 -> Vasso receives ~$27.50-28.00 equivalent (after Paystack fees + conversion spread). Effective fee: ~3.5-5.2%.

For Ko-fi (Stripe path): Backer pays $29 -> Stripe takes ~3% + $0.30 = $1.17 -> Ko-fi takes 0-5% -> Net: $26.40-$27.83.

### 16.2 Backer-to-Subscriber Conversion Funnel

```
Campaign backer (155 max)
    |  100% create account (email link)
    v
Active user during beta (estimated 60-70%)
    |  Natural churn over 6 months
    v
Active user at 6 months (estimated 30-40%)
    |  These users never churn from billing
    v
Permanent active users (~50-60 of 155)
    |  Each generates word-of-mouth
    v
Referred users (estimated 0.5-1 referral per active backer)
    |  These pay full subscription price
    v
25-60 new paying subscribers ($4.99/mo)
    = $1,497-$3,594 additional ARR from backer referrals
```

### 16.3 Failed Campaign Pivot Playbook

| Trigger | Definition | Pivot Action |
|---------|-----------|-------------|
| <$500 in 7 days | Near-zero traction | Pause campaign. Reassess messaging. Direct-ask 10 friends for honest feedback. Relaunch in 30 days with revised positioning. |
| <$1,000 in 14 days | Below minimum viable | Shift to direct pre-sales via the website. Remove campaign framing. Sell lifetime deals directly via Paystack. No urgency/deadline. |
| <$2,000 at Day 30 | Below minimum goal | Campaign "succeeds" (flexible funding) but below target. Continue with reduced scope. Defer stretch goals indefinitely. Focus on bootstrap-only path. |
| 0 backers outside personal network | No market signal | Product-market fit not validated. Pivot to free-only model. Focus on user growth before monetization. |

**Communication after a "failed" campaign**: Post a transparent update: "We raised $X from Y backers. That is not enough to hit our goal, but every backer is valued and will receive their lifetime access. Here is our revised plan." Transparency preserves credibility for a potential future attempt.

### 16.4 Early Bird Sell-Out Cascade Strategy

The Early Bird tier (50 units, $29) is designed to sell out first, creating urgency:

1. **At launch**: "50 Early Bird spots available at $29 -- the lowest price StepLeague will ever be."
2. **At 50% sold (25 units)**: Social post: "Half of Early Bird spots gone in X days!"
3. **At 80% sold (40 units)**: Email blast: "Only 10 Early Bird spots remaining."
4. **At sell-out**: "Early Bird is SOLD OUT. Supporter tier ($49) is now the best deal."
5. **Cascade effect**: Supporter tier sales accelerate because $49 is now the "cheapest" option and buyers feel urgency from seeing Early Bird sell out.

### 16.5 Solo Dev Bandwidth Calendar

| Activity | Hours/Week (Pre-Campaign) | Hours/Week (During Campaign) | Hours/Week (Post-Campaign) |
|----------|--------------------------|-----------------------------|-----------------------------|
| Development | 20-25 | 10-15 | 20-25 |
| Campaign content creation | 5-8 | 2-3 | 0 |
| Social media / BIP | 2-3 | 3-5 | 1-2 |
| Backer communication | 0 | 2-3 | 1 |
| Fulfillment | 0 | 0-1 | 3-5 (first 2 weeks) |
| **Total** | **27-36** | **17-27** | **25-33** |

**Key constraint**: During the campaign, development hours drop by ~40%. Plan for this by completing critical features BEFORE the campaign, not during it. The campaign is a marketing sprint, not a development sprint.

### 16.6 Testimonial Collection Pipeline

| Step | Timing | Method |
|------|--------|--------|
| 1. Identify willing testers | Alpha phase | WhatsApp ask: "Would you be OK giving a quote about StepLeague?" |
| 2. Provide prompt | 1 week before campaign | Email/WhatsApp: "In 1-2 sentences, what do you like about StepLeague? Bonus if you include your step count." |
| 3. Collect responses | T-3 to T-1 | Compile in a spreadsheet. Ask for permission to use name + photo. |
| 4. Format for campaign | T-1 | "I walked 12,000 steps/day for 3 weeks straight -- Sarah, alpha tester" format |
| 5. Offer thank-you | Post-campaign | Free upgrade to Supporter tier for testimonial contributors |

**Target**: 5-10 testimonials before campaign launch. At least 3 with step count numbers for social proof.

### 16.7 Referral/Sharing Mechanics for Backers

- **Share link**: Each backer gets a unique referral link (stepleague.com/ref/BACKER_CODE)
- **Incentive**: "Refer 3 friends who back the campaign and get upgraded to the next tier for free"
- **Tracking**: Paystack metadata tags referral source. Dashboard query shows referral counts.
- **Social sharing**: Campaign page includes pre-written share text for WhatsApp, Twitter, LinkedIn

### 16.8 Legal/Tax Implications

**South African Tax Obligations:**

| Factor | Detail |
|--------|--------|
| Tax residency | SA residents are taxed on worldwide income (residence-based system) |
| Crowdfunding income classification | Business income (backers receive goods/services in exchange) |
| Employment income exemption | Does NOT apply (this is self-employment/business income, not employment income) |
| R1.25M exemption | Only for foreign employment income where 183+ days outside SA; does not cover business income |
| Tax rate | Marginal rate on total taxable income (18-45% depending on bracket) |
| Filing | Must declare on annual SARS return even if earned abroad |
| Vietnam tax | Vietnam taxes worldwide income of tax residents (>183 days in Vietnam). Potential double taxation. SA-Vietnam DTA may provide relief -- consult tax advisor. |
| VAT | Not applicable until revenue exceeds R1M/year (unlikely in Year 1) |

**Recommendation**: Consult a cross-border tax specialist before campaign launch. Budget R2,000-5,000 for a tax consultation. The R1.25M employment exemption is frequently misunderstood and does NOT cover business/crowdfunding income.

### 16.9 Post-Campaign Content Repurposing Plan

| Campaign Asset | Repurposed As | Platform |
|---------------|--------------|----------|
| Campaign video | Website hero video | stepleague.com |
| Campaign video | Social media clips (15-30s cuts) | LinkedIn, Facebook, Reddit |
| Testimonials | Social proof on pricing page | stepleague.com/pricing |
| FAQ | Help center articles | stepleague.com/help |
| "Building in public" posts | Blog/changelog entries | stepleague.com/blog |
| Backer milestone graphics | Social media posts | All platforms |
| Campaign story arc | Product Hunt maker comment | producthunt.com |
| Tier comparison graphic | Pricing page visual | stepleague.com/pricing |

### 16.10 Competitor Crowdfunding Analysis

| Competitor | Crowdfunding History | Funding Model |
|------------|---------------------|---------------|
| Stridekick | $800K seed round (2014). No public crowdfunding campaign found. | Traditional VC/angel |
| YuMuuv | EUR 401K total funding. No crowdfunding campaign found. | Revenue-funded + small round |
| StepBet | Part of WayBetter family. No standalone crowdfunding. | Parent company funded |
| Charity Miles | Minimal funding. No crowdfunding found. | Ad-supported |

**Conclusion**: No direct competitor has used crowdfunding. StepLeague would be the first step-tracking competition app to crowdfund, which is both an opportunity (no competition for backers in this niche) and a risk (no proven playbook to follow).

### 16.11 Campaign Analytics and Optimization Plan

| Metric | Tool | Check Frequency | Action Threshold |
|--------|------|----------------|-----------------|
| Daily revenue | Paystack dashboard | Daily | <$50/day after Day 3 = adjust messaging |
| Conversion rate (visit -> back) | PostHog funnel | Daily | <2% = revise campaign page |
| Traffic sources | PostHog / GA4 | Daily | Identify top source, double down |
| Email open rate | Resend/SendGrid | Per send | <20% = change subject lines |
| Social post engagement | Native analytics | Daily | Identify top-performing content type |
| Ko-fi vs Paystack split | Manual comparison | Weekly | If Ko-fi > 30% of revenue, invest more there |
| Refund rate | Paystack dashboard | Weekly | >5% = investigate product/messaging issues |
| Tier sell-through rate | Supabase query | Daily | Early Bird > 60% sold = trigger cascade messaging |

**Daily routine during campaign (15 minutes)**:
1. Check Paystack dashboard: new backers, total raised
2. Check PostHog: traffic, conversion funnel, top sources
3. Respond to any backer questions (email, Ko-fi messages)
4. Post one social media update (rotate platforms)

---

## Revenue Summary

| Metric | Value |
|--------|-------|
| Total potential (full sell-through) | $8,095 |
| Net after Paystack fees | ~$7,828 |
| Minimum viable goal | $3,000 |
| Net at minimum goal | ~$2,901 |
| Backers for minimum goal | ~60-80 |
| Backers for full sell-through | 155 |
| Campaign duration | 30 days |
| Total lifetime deal users (max) | 245 (155 direct + 90 Team Pack sub-users) |
| Estimated annual server cost for LTD users | $500-$2,352 |
| Revenue math verification | (50 x $29) + (75 x $49) + (30 x $99) = $1,450 + $3,675 + $2,970 = $8,095 |

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-03-31 | Initial | Created crowdfunding campaign strategy document (PRD 78 deliverable). Key finding: Kickstarter and Indiegogo not available for SA creators. Recommended approach: Ko-fi Shop + self-hosted Paystack campaign page. Indiegogo flexible funding no longer exists (removed Oct 2025). |
