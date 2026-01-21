# PRD 45: Why Upload Daily - Public Value Proposition Page

> **Order:** 45
> **Status:** ✅ Complete
> **Type:** Feature (Marketing/Content)
> **Dependencies:** PRD 44 (Auto-Enroll World League)
> **Blocks:** None

---

## 🎯 Objective

Create a compelling public-facing page that explains the value of uploading steps daily, even without a private league. This page educates users about the Global Leaderboard, builds motivation for consistent participation, and serves as a landing page for marketing efforts.

**Problem Solved:** Users who haven't joined a private league may not understand why they should upload steps. Without clear value communication, engagement drops. This page connects daily uploads to tangible benefits (global ranking, streak rewards, personal progress).

---

## ⚠️ Agent Context (Mandatory)

| File | Purpose |
|------|---------|
| `src/app/(public)/` | Public route group for marketing pages |
| `src/app/(public)/pricing/page.tsx` | Example of marketing page structure |
| `src/app/(public)/how-it-works/page.tsx` | Example of value prop page |
| `docs/THEME_SYSTEM.md` | Light/dark mode styling requirements |
| `AGENTS.md` | Mobile-first design patterns |

---

## 🏗️ Detailed Feature Requirements

### Section A: Page Structure — 5 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **A-1** | **Hero section with clear headline** | Immediate value communication | Headline like "Every Step Counts Globally" visible on load |
| **A-2** | **Section: Compete Globally** | Explains Global Leaderboard | Describes how all users compete, rank shown worldwide |
| **A-3** | **Section: Track Your Progress** | Personal benefit highlight | Explains analytics, calendar heatmap, personal records |
| **A-4** | **Section: Build Streaks** | Engagement incentive | Teases upcoming points system, shows streak benefits |
| **A-5** | **Section: Join Private Leagues** | Upsell to social features | Encourages creating/joining friend leagues |

### Section B: Call-to-Action — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **B-1** | **Primary CTA: Start Uploading** | Convert visitors to active users | Button links to `/submit-steps` (or `/sign-up` if not logged in) |
| **B-2** | **Secondary CTA: View Leaderboard** | Show proof of community | Button links to `/leaderboard` |
| **B-3** | **Tertiary CTA: Create a League** | Social engagement | Button links to `/league/create` |

### Section C: SEO & Marketing — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **C-1** | **SEO-optimized metadata** | Discoverability | Title, description, OpenGraph tags for "step counting competition" |
| **C-2** | **Shareable URL** | Word of mouth | Page at `/why-upload` or `/global-league` |
| **C-3** | **Social proof elements** | Trust building | Stats like "X users competing globally" or testimonials placeholder |

### Section D: Design — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **D-1** | **Mobile-first responsive layout** | All users can access | Works well on mobile, tablet, desktop |
| **D-2** | **Theme-aware colors** | Consistent with app | Uses CSS variables, works in light/dark mode |
| **D-3** | **Visual elements** | Engagement | Icons, illustrations, or screenshots showing the app in action |

---

## ✅ Success Criteria

| Metric | Target | Verification Method |
|--------|--------|---------------------|
| Page loads on `/why-upload` | 200 OK | Browser navigation |
| Mobile responsive | No horizontal scroll | Device testing |
| CTA links work | All buttons navigate correctly | Manual testing |
| SEO metadata present | Title, description, OG tags | View page source |

---

## 📅 Implementation Plan Reference

### Phase A: Page Creation
1. Create page at `src/app/(public)/why-upload/page.tsx`
2. Structure hero and content sections
3. Add CTAs with conditional auth logic

### Phase B: Content & Copy
1. Write compelling headline and section copy
2. Add placeholder for stats/social proof
3. Ensure tone aligns with brand (supportive, not competitive)

### Phase C: SEO & Polish
1. Add metadata export for SEO
2. Test on mobile devices
3. Add to footer navigation

---

## 🔗 Related Documents

- [PRD 33: Pricing & How It Works](./PRD_33_Pricing_HowItWorks.md) - Similar marketing page pattern
- [PRD 44: Auto-Enroll World League](./PRD_44_Auto_Enroll_World_League.md) - What users join automatically
- [docs/artifacts/decisions_tone_softening.md](../../artifacts/decisions_tone_softening.md) - Brand voice guidelines

---

## Content Draft (Reference)

### Hero
**Headline:** "Every Step Counts — Globally"
**Subhead:** "Upload your daily steps and see how you rank against people worldwide. No private league required."

### Section 1: Compete Globally
- Your steps automatically count on the Global Leaderboard
- See your worldwide rank update in real-time
- Compete with thousands of step enthusiasts

### Section 2: Track Your Progress
- Calendar heatmap shows your consistency
- Personal records tracked (best day, longest streak)
- Analytics dashboard reveals your patterns

### Section 3: Build Streaks (Teaser)
- Consecutive days build your streak
- Coming soon: Points for consistency
- Early uploaders will have a head start

### Section 4: Join Private Leagues
- Challenge friends, family, or coworkers
- Create custom competitions
- Same steps count everywhere — upload once

---

## 🔍 Systems/Design Considerations

_Things to understand/investigate during implementation (not do immediately):_

1. **Content vs Code Separation** - Consider whether page copy should be in code or a CMS/MDX file. Marketing pages typically need frequent iteration without developer involvement. Review `src/app/(public)/how-it-works/page.tsx` for the existing pattern—if copy is hardcoded, consider extracting to a content file for easier updates.

2. **Auth State Awareness** - CTAs should be context-aware. Logged-in users should see "Upload Now" (→ `/submit-steps`) while logged-out users should see "Sign Up to Start" (→ `/sign-up`). Review how other public pages handle conditional CTAs, likely via `useAuth()` hook.

3. **SEO Routing** - Ensure the route is in the `(public)` route group (no auth required). Verify `robots.txt` allows indexing of `/why-upload`. Check if `next-sitemap` config includes this route for search engine discovery.

---

## 💡 Proactive Considerations

_Forward-thinking items that anticipate future needs:_

1. **A/B Testing Infrastructure** - This page is a prime candidate for copy experiments. Consider adding simple variant support (query param like `?variant=b` or cookie-based). Even a basic implementation allows testing different headlines before alpha launch scales up.

2. **Social Proof Automation** - "10,000 users competing" copy will quickly become outdated. Plan for a stats endpoint (`/api/stats/public`) that returns user count, total steps, etc. Cache aggressively (1 hour) to avoid database load. Better to show real numbers than hardcode values that need manual updates.

3. **Localization Ready** - Keep text strings in a separate constant object or i18n file, even if not localizing now. Pattern: `const CONTENT = { hero: { title: '...', subtitle: '...' }, ... }`. This prevents painful find-replace when internationalization is requested.

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-01-20 | Initial | Created PRD for alpha launch marketing page |
| 2026-01-20 | Systems/Proactive | Added modular design considerations and forward-thinking items |
