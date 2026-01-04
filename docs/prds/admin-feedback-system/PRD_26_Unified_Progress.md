# PRD 26: Unified Progress View

> **Order:** 26 of 30  
> **Previous:** [PRD 25: Smart Step Reminder](./PRD_25_Step_Reminder.md)  
> **Next:** [PRD 27: Social Encouragement](./PRD_27_Social_Encouragement.md)  
> **Depends on:** PRD 24 (hub tabs)  
> **Status:** 📋 Proposed

---

## ⚠️ Agent Instructions (MANDATORY)

Before starting work on this PRD, the implementing agent MUST:

1. **Read these files for context:**
   - `AGENTS.md` - Critical rules, patterns, and documentation requirements
   - `src/app/(dashboard)/league/[id]/analytics/page.tsx` - Current analytics (to merge)
   - `src/app/(dashboard)/league/[id]/leaderboard/page.tsx` - Current leaderboard (to merge)
   - Existing component patterns in `src/components/analytics/`

2. **Follow documentation rules:**
   - Update `CHANGELOG.md` with all changes
   - Use date format `YYYY-MM-DD` (current year is 2026)
   - Update ROADMAP.md when complete

3. **After completion:**
   - Commit with message format: `feat(PRD-24): Brief description`
   - Mark this PRD as done on the Kanban board

---

## Problem Statement

**Current:**
- "Analytics" page shows personal stats (calendar, breakdown)
- "Leaderboard" page shows rankings
- Two separate pages for related content
- "Analytics" is a technical name - users don't recognize it

**Issues:**
1. Users miss the Analytics page (poor discoverability)
2. No way to see personal progress *compared* to league
3. Technical naming confusion

---

## Outcome

A unified **Progress** page with two views:

1. **My Progress** - Individual performance (renamed from "Analytics")
2. **League Progress** - Team performance with user highlighted

User can toggle between views. Both include relevant metrics and comparisons.

---

## Naming Changes

| Current | New |
|---------|-----|
| "Analytics" | **"My Progress"** |
| "Leaderboard" | **"League Rankings"** or merged into **"League Progress"** |
| n/a | **"League Progress"** (new combined view) |

---

## What is Needed

### 1. Progress Page with Toggle

Create unified `/league/[id]/progress/page.tsx`:

```
┌─────────────────────────────────────┐
│ Progress               ← League Hub │
├─────────────────────────────────────┤
│ [My Progress] [League Progress]     │  ← Toggle switch
├─────────────────────────────────────┤
│                                     │
│        View content here            │
│                                     │
└─────────────────────────────────────┘
```

### 2. My Progress View (Individual)

Renamed from "Analytics", includes:

| Section | Content |
|---------|---------|
| **Your Records** | Personal stats card (existing `PersonalStatsCard`) |
| **Submission Calendar** | Calendar heatmap (existing `CalendarHeatmap`) |
| **Daily Breakdown** | Table of recent days (existing `DailyBreakdownTable`) |
| **vs League** | NEW - "You're ahead of 75% of members this week" |

### 3. League Progress View (Team + Comparison)

New combined view showing:

| Section | Content |
|---------|---------|
| **Team Summary** | Total team steps, participation rate |
| **Your Position** | Rank card with trend (↑2 from last week) |
| **Rankings** | Leaderboard table (current user highlighted) |
| **Team Trends** | NEW - Weekly team performance chart |

### 4. User Highlighted in Rankings

When viewing League Progress, current user row should:
- Be highlighted with distinct background
- Show "You" badge
- Be sticky at top if scrolled out of view (optional)

---

## User Preference: Default Landing Page

**Also included:** User can choose their default landing page after login:

| Option | Destination |
|--------|-------------|
| Dashboard (default) | `/dashboard` - Your Leagues |
| Submit Steps | `/league/[primary-league]/submit` |
| My Progress | `/league/[primary-league]/progress` |
| League Rankings | `/league/[primary-league]/progress?view=league` |

**Implementation:**
- Add `default_landing` column to `profiles` table
- Add setting in Profile Settings page
- Check on login and redirect accordingly

---

## Visual Design

### Toggle Component

```
┌────────────────────────────────────────┐
│ [●  My Progress  ] [  League Progress ] │
└────────────────────────────────────────┘
```

- Pill-style toggle
- Active state: filled background
- Smooth transition animation

### My Progress View

```
┌────────────────────────────────────────┐
│ 🏆 Your Records                        │
│ ┌────────────────────────────────────┐ │
│ │ Best Day: 18,420 steps (Dec 15)   │ │
│ │ Current Streak: 🔥 12 days        │ │
│ │ Total: 245,000 lifetime steps     │ │
│ └────────────────────────────────────┘ │
│                                        │
│ 📊 You're outperforming 8 of 12       │
│    league members this week!           │
│                                        │
│ 📅 Submission Calendar                 │
│ [  Calendar heatmap component  ]       │
│                                        │
│ 📋 Daily Breakdown                     │
│ [  Table component  ]                  │
└────────────────────────────────────────┘
```

### League Progress View

```
┌────────────────────────────────────────┐
│ 👥 Team Summary                        │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│ │ 312,000  │ │   12     │ │   85%    │ │
│ │ Team Steps│ │ Members  │ │ Active   │ │
│ └──────────┘ └──────────┘ └──────────┘ │
│                                        │
│ 🎯 Your Position                       │
│ ┌────────────────────────────────────┐ │
│ │  #3 of 12  │  ↑2 from last week   │ │
│ │ 15,420 steps │ 10,240 avg/day     │ │
│ └────────────────────────────────────┘ │
│                                        │
│ 🏆 Rankings                            │
│ ┌────────────────────────────────────┐ │
│ │ 1. Alice      18,420   🥇         │ │
│ │ 2. Bob        16,300   🥈         │ │
│ │ 3. YOU        15,420   ← You      │ │ ← Highlighted
│ │ 4. Charlie    14,800              │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/app/(dashboard)/league/[id]/progress/page.tsx` | **NEW** - Unified progress page |
| `src/components/progress/ProgressToggle.tsx` | **NEW** - View toggle component |
| `src/components/progress/MyProgressView.tsx` | **NEW** - Individual view |
| `src/components/progress/LeagueProgressView.tsx` | **NEW** - Team view |
| `src/components/progress/UserComparisonCard.tsx` | **NEW** - "vs league" comparison |
| `src/components/progress/UserPositionCard.tsx` | **NEW** - Rank with trend |
| `src/app/(dashboard)/league/[id]/analytics/` | **DELETE or REDIRECT** |
| `src/app/(dashboard)/league/[id]/leaderboard/` | **REDIRECT or KEEP** (can keep for direct links) |
| `supabase/migrations/YYYYMMDD_add_default_landing.sql` | **NEW** - User preference |
| `src/app/settings/profile/page.tsx` | **MODIFY** - Add landing preference |

---

## API Changes

### GET /api/leagues/[id]/stats

New endpoint for unified progress data:

```typescript
{
  user: {
    rank: 3,
    rank_change: 2,  // +2 from last week
    total_steps: 15420,
    avg_per_day: 10240,
    percentile: 75,  // Better than 75% of members
    streak: 12,
  },
  team: {
    total_steps: 312000,
    member_count: 12,
    active_rate: 0.85,  // 85% submitted this week
  },
  leaderboard: [...],
}
```

---

## Success Criteria

- [ ] Progress page with toggle between My Progress / League Progress
- [ ] My Progress shows personal stats + calendar + "vs league" comparison
- [ ] League Progress shows team stats + rankings with user highlighted
- [ ] User can set default landing page in settings
- [ ] Old `/analytics` and `/leaderboard` URLs redirect to `/progress`
- [ ] Mobile-responsive
- [ ] Analytics tracking for view switches
- [ ] Build passes (`npm run build`)

---

## Proactive Enhancements

> These enhancements go beyond the basic requirements to deliver exceptional UX.

### 1. Mini-Trend Sparklines

Add small sparkline charts next to key metrics:

```
┌─────────────────────────────────────────┐
│ Your Steps This Week                    │
│ 12,420  ▁▃▅▇▅▃▇  (+15% vs last week)   │
└─────────────────────────────────────────┘
```

Use lightweight SVG sparklines (no chart library needed).

### 2. Shareable Achievement Cards

Generate share-ready cards for achievements:

| Achievement | Share Message |
|-------------|---------------|
| New personal best | "🏆 New PB! 18,420 steps in one day!" |
| Moved to #1 | "👑 I'm leading the league!" |
| 30-day streak | "🔥 30 days straight!" |
| Beat last week | "📈 Up 15% from last week!" |

Integrates with existing `ShareButton` component.

### 3. Weekly Summary Card

On Monday, show recap of previous week:

```
┌─────────────────────────────────────────┐
│ 📊 Your Week in Review                  │
│                                         │
│ Total: 52,420 steps                     │
│ Rank: #3 → #2 (↑1)                      │
│ Best Day: Thursday (12,420)             │
│ Streak: 🔥 12 days                      │
│                                         │
│ [Share Summary] [View Details]          │
└─────────────────────────────────────────┘
```

Dismissible, shows for first visit on Monday/Tuesday.

### 4. Goal Progress Ring

Visual ring showing progress toward daily goal:

```
      ╭───────╮
    ╱  8,420   ╲   ← Steps today
   │  ───────   │
   │   84%      │   ← % of 10k goal
    ╲           ╱
      ╰───────╯
```

Animates on load. Color changes: red → yellow → green → blue (exceeded).

### 5. Export My Progress

Download personal stats as shareable image:
- One-click "📷 Export as Image" button
- Generates branded card with week's stats
- Optimized for Instagram stories (9:16) or Twitter (16:9)

### 6. Period Comparison Mode

Compare two time periods side-by-side:
- "This Week vs Last Week" toggle
- Shows +/- delta for each metric
- Highlights improvements in green, declines in red

---

## Theme Awareness

All UI components must:
- Use CSS variables (`--background`, `--foreground`, etc.) from PRD 21
- Work in both light and dark modes (PRD 21 Part G)
- Avoid hardcoded colors (e.g., use `text-foreground` not `text-white`)
- Test in both themes before marking complete
- Charts must use `hsl(var(--primary))` style theme-aware colors

---

## Out of Scope

- Team activity feed
- Comments on progress
- Detailed per-member profiles

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-01-05 | Initial | Created PRD for unified progress view with default landing preference |
