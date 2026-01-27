# PRD 51: Social Sharing & Stats Hub

> **Order:** 51
> **Status:** 🔄 In Progress
> **Type:** Feature (Social/Growth)
> **Dependencies:** PRD 48 (Universal Health Measurement - modular metric patterns), PRD 50 (Tour System)
> **Blocks:** PRD 52 (Sharing Tour), PRD 53 (Sharing Marketing Page)
> **Last Updated:** 2026-01-27

---

## Executive Summary

Transform StepLeague into the **preferred platform for sharing fitness achievements** in WhatsApp groups and social media. Users upload screenshots, and StepLeague generates beautiful, shareable cards with professional Open Graph images. The system is **modular** (metric-agnostic) to support future activity types (per PRD-48) and **WhatsApp-first** since most users share in messaging groups.

**Core Insight:** The WhatsApp group sharing pattern works because it's EASY. StepLeague must be easier than raw screenshots AND more beautiful.

---

## 🎯 Objective

Enable users to easily share their fitness achievements with auto-generated, professional-looking cards that display well on WhatsApp, X/Twitter, and other platforms. The system should:

1. Make sharing **easier** than screenshotting raw app data
2. Generate **beautiful OG images** that look professional when shared
3. Be **modular** to support any future metric types (steps today, calories/SLP later)
4. **Prompt at peak moments** (after upload, milestone achievements)
5. Create **viral loops** through challenge cards and achievement sharing

---

## ⚠️ Agent Context (Mandatory)

| File | Purpose |
|------|---------|
| `src/hooks/useShare.ts` | Existing share hook with analytics integration |
| `src/app/share/[id]/page.tsx` | Current share landing page with dynamic OG metadata |
| `src/app/api/og/route.tsx` | OG image generation (Vercel OG) |
| `src/lib/analytics.ts` | Analytics tracking including share events |
| `.agent/skills/social-sharing/SKILL.md` | **NEW** - Sharing patterns skill |
| `.agent/skills/analytics-tracking/SKILL.md` | Updated with share funnel patterns |
| `docs/prds/PRD_48_Universal_Health_Measurement.md` | Future metric types |
| `docs/prds/PRD_50_Modular_Tour_System.md` | Tour integration patterns |

---

## 📚 Research Foundation

### User Motivation Psychology

| Psychological Need | How Sharing Addresses It | Source |
|--------------------|--------------------------|--------|
| **Autonomy** | User chooses WHAT and WHEN to share | [Frontiers Psychology 2025](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2025.1635912/full) |
| **Competence** | Achievements validate effort and progress | [PMC Research](https://pmc.ncbi.nlm.nih.gov/articles/PMC11907615/) |
| **Relatedness** | Social validation from friends/community | [ScienceDaily](https://sciencedaily.com/releases/2020/08/200818094050.htm) |

**Critical Insights:**
- Social support boosts engagement through encouragement
- **Self-comparison** (vs your own past) is better than comparing to others - downward comparison hurts motivation
- Intrinsic motivation mediates social media's influence on exercise behavior

### Competitor Analysis (Strava)

| Feature | Strava | StepLeague Opportunity |
|---------|--------|------------------------|
| Activity Sharing | Auto-generates beautiful cards | We have data, need better cards |
| Engagement | 35x/month user engagement | Widget + dedicated page approach |
| Challenges | Correlates with "friends, community, share" | Challenge-style share cards |
| Navigation | 60% find it hard to navigate | Simpler app = simpler sharing |

### WhatsApp Group Best Practices

| Practice | Research Finding | Source |
|----------|------------------|--------|
| Daily check-ins | Creates accountability | [Trainerize](https://www.trainerize.com/blog/workout-accountability/) |
| Milestone celebrations | Keeps motivation | [Peloton](https://www.onepeloton.com/blog/fitness-accountability-partner) |
| PR-based challenges | Self-calibrated, no comparison pressure | [HevyCoach](https://hevycoach.com/workout-accountability-for-clients/) |
| Concise shares | No flooding the group | [Best practices](https://www.scribd.com/document/900999147/Rules-for-Healthy-WhatsApp-Group) |

### OG Image Best Practices

| Spec | Requirement | Source |
|------|-------------|--------|
| Size | 1200x630px | [OG Image Gallery](https://www.ogimage.gallery/libary/the-ultimate-guide-to-og-image-dimensions-2024-update) |
| File size | <300KB | [OpenGraph.xyz](https://www.opengraph.xyz/blog/the-ultimate-guide-to-open-graph-images) |
| Text coverage | <20-25% | [Simplified](https://simplified.com/blog/design/open-graph-image-everything-you-need-to-know) |

**Impact:** Posts with images have **100% more engagement** and **114% more impressions**.

---

## 🏗️ Detailed Feature Requirements

### Section A: Stats Hub Dashboard — 9 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **A-1** | **Dedicated Stats Hub page at `/my-stats`** | Central location for all shareable stats | Page accessible from nav menu |
| **A-2** | **Dashboard "Share Your Progress" widget** | Quick access without navigating away | Compact widget on dashboard with 1-click share |
| **A-3** | **Quick Stats summary cards** | Instant view of shareable achievements | Shows: today, week total, streak, personal best |
| **A-4** | **Period selector** | Users choose timeframe to share | Dropdown: Today, Yesterday, This Week, Last Week, This Month, Custom |
| **A-5** | **League selector** | Context for rankings | Dropdown shows all user's leagues + "Global" option |
| **A-6** | **Self-comparison toggle** | Show improvement vs SELF (research-backed) | Toggle: "+15% vs last week" comparison |
| **A-7** | **"Share This" button on each stat card** | One-click sharing | Button opens share modal with pre-filled data |
| **A-8** | **Mobile-optimized layout** | Most users on mobile | Responsive grid (1 col mobile, 2+ desktop) |
| **A-9** | **"View Full Stats Hub" link on widget** | Discovery path from dashboard | Widget links to /my-stats for more options |

### Section B: Shareable Card Generator — 8 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **B-1** | **Card type selector** | Users choose what to share | 6 types: Daily, Weekly, Personal Best, Streak, Rank, Challenge |
| **B-2** | **Live card preview** | WYSIWYG for shared image | Shows exactly what OG image will look like |
| **B-3** | **Customizable elements** | Personal touch | Toggle: show/hide rank, improvement %, league name |
| **B-4** | **Metric display with units** | Support future metrics (PRD-48) | Uses MetricConfig for "12,345 steps" or "2,500 SLP" |
| **B-5** | **Activity icon/emoji** | Visual variety | Default emoji from MetricConfig (🚶, 🔥, ⚡) |
| **B-6** | **Period badge on card** | Context clarity | Shows "This Week", "Today", "Jan 1-7" |
| **B-7** | **Personal message field** | User expression | Optional text input (max 100 chars) |
| **B-8** | **Card theme variants** | User preference | Light/Dark themes |

### Section C: OG Image System (Modular) — 6 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **C-1** | **MetricType parameter on OG API** | Future-proof for any metric | API accepts `metric_type=steps|calories|slp|distance` |
| **C-2** | **Dynamic unit labels** | Correct display per metric | Uses MetricConfig for unit display |
| **C-3** | **Activity-aware styling** | Visual differentiation | Different gradient colors per metric type |
| **C-4** | **Self-improvement badge** | Motivational (research-backed) | Shows "+15% vs last week" when provided |
| **C-5** | **Rank badge (optional)** | Social proof | Shows "#3 in [League]" when rank provided |
| **C-6** | **Branding footer** | App recognition | StepLeague branding at bottom, <20% text coverage |

### Section D: Share Flow & UX — 8 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **D-1** | **WhatsApp-first button layout** | Primary use case | WhatsApp button is largest/primary in modal |
| **D-2** | **Native Web Share API** | Best mobile UX | Uses navigator.share when available |
| **D-3** | **Fallback share options** | Desktop support | Shows WhatsApp, X, Copy Link when native unavailable |
| **D-4** | **Pre-filled CONCISE messages** | Reduce friction, follow WA best practices | <100 chars + link + #StepLeague hashtag |
| **D-5** | **Shareable URL with OG preview** | Beautiful social cards | URL generates 1200x630 OG image when pasted |
| **D-6** | **Post-share success state** | Positive reinforcement | Confetti animation + "Shared!" confirmation |
| **D-7** | **Share history** | Track past shares | "Recently Shared" list in Stats Hub |
| **D-8** | **Quick re-share** | Return sharing | "Share Again" button on previously shared items |

### Section E: Integration Points — 5 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **E-1** | **Post-submission share prompt** | Capture peak moment | After upload success, show share modal |
| **E-2** | **Personal best auto-prompt** | Celebrate achievements | When new PB detected, prompt to share |
| **E-3** | **Streak milestone prompt** | Engagement loops | At day 7, 14, 30, 100, auto-prompt share |
| **E-4** | **Tour trigger hook** | Onboarding integration | Data attribute `[data-tour="sharing"]` for Joyride |
| **E-5** | **Settings toggle (ON by default)** | User control with max sharing | Preference "Prompt me to share" - enabled by default |

### Section F: Analytics & Tracking — 6 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **F-1** | **Share intent tracking** | Measure interest | Track `share_intent` when modal opens |
| **F-2** | **Share completion tracking** | Measure success | Track `share` event by platform |
| **F-3** | **Card type analytics** | Understand preferences | Which card types are shared most |
| **F-4** | **Share-to-conversion funnel** | Growth measurement | Track: Share → Click → Sign Up |
| **F-5** | **UTM parameters on share URLs** | Attribution | `utm_source=share&utm_medium=[platform]&utm_campaign=[card_type]` |
| **F-6** | **Shared link click tracking** | Engagement | Track `share_link_click` on share landing pages |

---

## 🎁 5 Proactive "Stickiness" Features

### Feature 1: "Challenge a Friend" Cards
- **Card text:** "Can you beat my 15,234 steps today? 💪"
- **Landing page UX:** View challenge details without account, "Accept Challenge" → sign-up to compete
- **Viral loop:** Recipients become sharers when they beat the challenge
- **Analytics:** Track challenge views vs signups for conversion metrics

### Feature 2: Weekly Leaderboard Position Cards
- **Card text:** "I moved from #8 to #3 this week! 🚀"
- **Visual:** Arrow showing rank movement
- **Trigger:** Auto-prompt when user improves 2+ positions

### Feature 3: Streak Celebration Cards
- **Milestones:** 7 (bronze), 14 (silver), 30 (gold), 100 (diamond)
- **Auto-prompt:** System detects milestone and shows share modal
- **Visual:** Badge/medal visual on the card

### Feature 4: "Beat My Record" Challenge Cards
- **Card text:** "My best day: 23,456 steps. Beat this! 🏆"
- **Link destination:** Leaderboard or sign-up page
- **Research-backed:** Personal bests are non-comparative, healthier motivation

### Feature 5: Weekly Digest Share Cards
- **Auto-generated:** Sunday evening or Monday morning
- **Content:** Week total, daily average, rank, current streak
- **Visual:** Mini calendar heatmap showing active days
- **Push notification:** "Your weekly summary is ready to share!"

---

## 🔧 Technical Architecture

### MetricConfig System (PRD-48 Compatible)

```typescript
// src/lib/sharing/metricConfig.ts

export type MetricType = 'steps' | 'calories' | 'slp' | 'distance' | 'swimming' | 'cycling' | 'running';

export interface MetricConfig {
  type: MetricType;
  displayName: string;
  unit: string;
  emoji: string;
  gradient: string;
  formatValue: (value: number) => string;
}

export const METRIC_CONFIGS: Record<MetricType, MetricConfig> = {
  steps: {
    type: 'steps',
    displayName: 'Steps',
    unit: 'steps',
    emoji: '🚶',
    gradient: 'from-sky-500 to-emerald-500',
    formatValue: (v) => v.toLocaleString(),
  },
  // Future metrics added here (PRD-48)
};
```

### Share Cards Database Schema

```sql
CREATE TABLE share_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_code VARCHAR(8) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Card content
  card_type VARCHAR(50) NOT NULL,
  metric_type VARCHAR(20) DEFAULT 'steps',
  metric_value INTEGER NOT NULL,

  -- Context
  period_start DATE,
  period_end DATE,
  league_id UUID REFERENCES leagues(id),
  rank INTEGER,
  improvement_pct INTEGER,
  custom_message TEXT,

  -- Analytics
  created_at TIMESTAMPTZ DEFAULT NOW(),
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  shares_completed INTEGER DEFAULT 0
);

CREATE INDEX idx_share_cards_short_code ON share_cards(short_code);
```

### Pre-filled Share Messages

```typescript
// src/lib/sharing/shareMessages.ts

export const SHARE_MESSAGES: Record<CardType, (data: ShareData) => string> = {
  daily: (d) => `Just logged ${d.formattedValue} today! ${d.emoji} #StepLeague`,
  weekly: (d) => `My week: ${d.formattedValue} (avg ${d.average}/day) 💪 #StepLeague`,
  personal_best: (d) => `NEW PERSONAL BEST! ${d.formattedValue} 🏆 #StepLeague`,
  streak: (d) => `${d.value} days in a row! 🔥 #StepLeague`,
  challenge: (d) => `Can you beat my ${d.formattedValue}? 💪 #StepLeague`,
  rank_change: (d) => `Moved from #${d.oldRank} to #${d.newRank}! 🚀 #StepLeague`,
};
```

---

## ✅ Success Criteria

| Metric | Target | Verification Method |
|--------|--------|---------------------|
| Stats Hub page loads | 200 OK | Browser navigation |
| Share modal opens from stat cards | All cards have share button | Manual testing |
| OG images generate correctly | 1200x630 PNG, <300KB | Preview shared URL |
| WhatsApp share works | Opens wa.me with pre-filled text | Mobile testing |
| Analytics track shares | Events in GA4 + PostHog | Query analytics |
| Post-submission prompt shows | Modal appears after batch upload | E2E test |
| Mobile responsive | No horizontal scroll on 375px | Device testing |
| Share modal opens | 30% of active users/week | Analytics |
| Share completion rate | 50% of modal opens | Analytics |
| WhatsApp share % | 60% of all shares | Platform tracking |
| New signups from shares | 5% of shared link clicks | UTM attribution |

---

## 📅 Implementation Plan Reference

### Phase 1: Skills & Foundation
1. Create `social-sharing` skill with patterns
2. Update `analytics-tracking` skill with share funnels
3. Design MetricConfig system
4. Design share_cards database schema

### Phase 2: OG Image System
1. Extend `/api/og` with metric_type parameter
2. Add activity-specific styling and gradients
3. Add improvement and rank badges

### Phase 3: Stats Hub
1. Build Stats Hub page (`/my-stats`)
2. Implement Dashboard widget
3. Build stat cards with share buttons
4. Build card type selector and live preview

### Phase 4: Share Flow
1. Build WhatsApp-first share modal
2. Implement pre-filled messages per card type
3. Add UTM tracking to share URLs
4. Add share success animation

### Phase 5: Integration Points
1. Add post-submission share prompt
2. Implement personal best detection
3. Add streak milestone celebration
4. Add settings toggle for prompts

### Phase 6: Sub-PRDs
1. Create PRD-52: Sharing Tour
2. Create PRD-53: Sharing Marketing Page

### Phase 7: Analytics & Polish
1. Implement share funnel tracking
2. Set up A/B testing for card designs
3. Build share history feature

---

## 🔗 Related Documents

- [PRD 48: Universal Health Measurement](./PRD_48_Universal_Health_Measurement.md) - Modular metric types
- [PRD 50: Modular Tour System](./PRD_50_Modular_Tour_System.md) - Tour integration
- [PRD 45: Why Upload Daily](./PRD_45_Why_Upload_Daily.md) - Marketing page pattern
- [PRD 31: Social Encouragement](./PRD_31_Social_Encouragement.md) - High-fives pattern
- [social-sharing Skill](../../../.agent/skills/social-sharing/SKILL.md) - Implementation patterns

---

## 🔍 Systems/Design Considerations

1. **OG Image Caching** - Cache at edge (Vercel) to prevent re-generation on every share. Consider cache key based on parameter hash.

2. **Share URL Persistence** - Quick shares use URL params (no DB). Persistent shares generate short code stored in `share_cards` table for tracking.

3. **Rate Limiting** - OG image generation is CPU-intensive. Add rate limiting (e.g., max 50 generations per user per hour).

4. **Offline Share Queue** - If user tries to share while offline, queue the intent and complete when online (PWA pattern from PRD-22).

---

## 💡 Proactive Considerations

1. **Share Card Templates** - Store in database so SuperAdmins can add new types without code deployment.

2. **Seasonal/Event Cards** - Support limited-time themes ("Holiday Streak", "New Year Challenge") via settings.

3. **Team/League Aggregate Cards** - Future: Allow league admins to share total league stats.

4. **QR Code Option** - Some users prefer QR codes for in-person sharing.

5. **Share Credits/Gamification** - Track "shares earned" as a stat. Award badge at 10, 50, 100 shares.

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-01-26 | Initial | Created comprehensive PRD for Social Sharing & Stats Hub |
| 2026-01-26 | Research | Added psychology research, competitor analysis, WhatsApp best practices |
| 2026-01-26 | Features | Added 42 requirements across 6 sections |
| 2026-01-26 | Stickiness | Added 5 proactive stickiness features |
| 2026-01-26 | Technical | Added MetricConfig system and share_cards schema |
| 2026-01-26 | Implementation | **Phase 1 Complete:** MetricConfig, shareMessages, database migration, TypeScript types |
| 2026-01-26 | Implementation | **Phase 2 Complete:** OG API extended, Share Card API, Short URL handler, Share landing page updated |
| 2026-01-27 | Implementation | **Phase 3 Complete:** Stats Hub API, My Stats page, ShareProgressWidget, dashboard integration |
| 2026-01-27 | Implementation | **Phase 4 Complete:** ShareModal with card generator, live OG preview, useShareModal hook |
| 2026-01-27 | Implementation | **Phase 5 Started:** Post-submission share prompt in SubmissionForm |
