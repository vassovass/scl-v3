# PRD 56: Sharing Encouragement System

> **Order:** 56
> **Status:** Proposed
> **Type:** Feature (Retention)
> **Dependencies:** PRD 51 (Social Sharing & Stats Hub), PRD 38 (Notification Infrastructure)
> **Blocks:** None
> **Sprint:** 3 (Retention & Engagement)
> **Last Updated:** 2026-01-29

---

## Objective

Create a comprehensive sharing encouragement system that incentivizes regular sharing through streaks, insights, smart nudges, and analytics. Build on existing notification infrastructure (PRD-38) and sharing foundation (PRD-51) to drive consistent engagement.

**Core Value:** Transform occasional sharers into habitual sharers by making sharing progress visible, rewarding consistency, and providing timely, non-intrusive reminders.

**Extracted from:** PRD-54 Section D (Sharing Frequency Encouragement)

---

## Agent Context (Mandatory)

| File | Purpose |
|------|---------|
| `src/lib/trends/index.ts` | Existing trend calculation exports |
| `src/components/trends/TrendCard.tsx` | Existing trend card UI pattern |
| `src/app/api/stats/trends/route.ts` | Trend API route pattern |
| `src/lib/utils/periods.ts` | Date/period calculation utilities |
| `src/lib/analytics.ts` | Dual-track analytics (GA4 + PostHog) |
| `AGENTS.md` | Critical patterns and architecture decisions |
| `.agent/skills/supabase-patterns/` | Database and notification patterns |
| `.agent/skills/design-system/` | Semantic CSS variables, theming |

---

## Detailed Feature Requirements

### Section A: Share Streak Tracking - 5 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **A-1** | **Share streak tracking database** | No persistence for share streaks | `share_streaks` table tracks current/longest streak per user |
| **A-2** | **Streak calculation on share** | No automatic streak updates | Each share triggers `update_share_streak()` function |
| **A-3** | **Milestone detection (7/14/30/100)** | No recognition of achievements | Uses `STREAK_MILESTONES` constant, triggers celebration |
| **A-4** | **Streak badge UI component** | No visual streak indicator | Fire emoji badge displays in Stats Hub and ShareModal |
| **A-5** | **Streak celebration animation** | Milestones feel unremarkable | Confetti/pulse animation on milestone achievement |

### Section B: Share Frequency Insights - 4 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **B-1** | **Share pattern analytics** | Users don't know their sharing habits | Track day-of-week, time-of-day patterns in `share_analytics_daily` |
| **B-2** | **"Best share day" insight** | No awareness of peak sharing times | Display "You share most on Mondays at 8pm" message |
| **B-3** | **Week-over-week comparison** | No visibility of sharing progress | "3 shares this week vs 2 last week (+50%)" display |
| **B-4** | **Share insights API** | No centralized insight data | `/api/share/insights` endpoint returns all metrics |

### Section C: Share Reminder Nudges - 5 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **C-1** | **Streak-at-risk detection** | Users lose streaks unknowingly | Detect when >24h since last share, trigger nudge |
| **C-2** | **Non-intrusive nudge UI** | Aggressive reminders annoy users | Dismissable inline card (not modal), positioned below main content |
| **C-3** | **Post-submission share prompt** | Miss natural sharing moments | "Share your day?" prompt after successful upload |
| **C-4** | **Nudge frequency preferences** | One-size-fits-all doesn't work | User preference: `daily` / `weekly` / `off` in settings |
| **C-5** | **Smart timing (optimal window)** | Nudges at inconvenient times | Learn from past share times, nudge during active hours |

### Section D: Share Analytics Dashboard - 4 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **D-1** | **Personal share history view** | Can't see past shares | List of recent shares with dates, card types, metrics |
| **D-2** | **Share performance metrics** | No engagement visibility | Views, clicks, CTR per share card |
| **D-3** | **Best performing share highlight** | Don't know what resonates | "Your top share got 15 views" prominently displayed |
| **D-4** | **Share analytics integration** | Metrics scattered across systems | Unified dashboard section in Stats Hub |

---

## Success Criteria

| Metric | Target | Verification |
|--------|--------|--------------|
| Share streak adoption | 30%+ of active sharers maintain 7+ day streak | Database query |
| Share frequency increase | +25% shares per active user vs. baseline | Analytics comparison |
| Nudge conversion rate | 15%+ of nudges result in a share | Analytics |
| Milestone completion | 50%+ of users hit 7-day milestone | Database |
| User satisfaction | <5% disable nudges entirely | User preferences |

---

## Technical Design

### Database Schema

**Table: `share_streaks`** (per user tracking)

```sql
CREATE TABLE share_streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_share_date DATE,
  total_shares INTEGER DEFAULT 0,
  shares_this_week INTEGER DEFAULT 0,
  week_start DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for weekly leaderboard queries
CREATE INDEX idx_share_streaks_weekly ON share_streaks(shares_this_week DESC);

-- Function to update streak on each share
CREATE OR REPLACE FUNCTION update_share_streak(p_user_id UUID)
RETURNS TABLE(
  new_streak INTEGER,
  is_milestone BOOLEAN,
  milestone_value INTEGER
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_last_date DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_today DATE := CURRENT_DATE;
  v_week_start DATE;
  v_is_milestone BOOLEAN := FALSE;
  v_milestone_value INTEGER := 0;
BEGIN
  -- Get current record or create new
  SELECT last_share_date, current_streak, longest_streak
  INTO v_last_date, v_current_streak, v_longest_streak
  FROM share_streaks WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    v_current_streak := 0;
    v_longest_streak := 0;
  END IF;

  -- Calculate new streak
  IF v_last_date IS NULL OR v_last_date < v_today - INTERVAL '1 day' THEN
    -- Streak broken or first share
    v_current_streak := 1;
  ELSIF v_last_date = v_today - INTERVAL '1 day' THEN
    -- Consecutive day
    v_current_streak := v_current_streak + 1;
  END IF;
  -- Same day share doesn't change streak

  -- Check milestones (7, 14, 30, 100)
  IF v_current_streak IN (7, 14, 30, 100) THEN
    v_is_milestone := TRUE;
    v_milestone_value := v_current_streak;
  END IF;

  -- Update longest if needed
  IF v_current_streak > v_longest_streak THEN
    v_longest_streak := v_current_streak;
  END IF;

  -- Calculate week start (Monday)
  v_week_start := date_trunc('week', v_today)::DATE;

  -- Upsert record
  INSERT INTO share_streaks (
    user_id, current_streak, longest_streak, last_share_date,
    total_shares, shares_this_week, week_start, updated_at
  ) VALUES (
    p_user_id, v_current_streak, v_longest_streak, v_today,
    1, 1, v_week_start, NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    current_streak = v_current_streak,
    longest_streak = v_longest_streak,
    last_share_date = v_today,
    total_shares = share_streaks.total_shares + 1,
    shares_this_week = CASE
      WHEN share_streaks.week_start = v_week_start
      THEN share_streaks.shares_this_week + 1
      ELSE 1
    END,
    week_start = v_week_start,
    updated_at = NOW();

  RETURN QUERY SELECT v_current_streak, v_is_milestone, v_milestone_value;
END;
$$;
```

**Table: `share_analytics_daily`** (pattern tracking)

```sql
CREATE TABLE share_analytics_daily (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_date DATE NOT NULL,
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 6=Saturday
  hour_of_day INTEGER NOT NULL, -- 0-23
  shares_count INTEGER DEFAULT 1,
  PRIMARY KEY (user_id, share_date, hour_of_day)
);

-- Index for pattern analysis
CREATE INDEX idx_share_analytics_user_dow ON share_analytics_daily(user_id, day_of_week);
```

### Notification Types (PRD-38 Integration)

```sql
INSERT INTO notification_types (id, name, category, supports_email, supports_push, supports_in_app) VALUES
  ('share_streak_milestone', 'Share Streak Milestone', 'achievement', false, true, true),
  ('share_streak_at_risk', 'Share Streak At Risk', 'engagement', false, true, true),
  ('share_weekly_summary', 'Share Weekly Summary', 'insights', true, false, true);
```

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/share/insights` | GET | Return streak, patterns, comparisons |
| `/api/share/streak` | GET | Current streak status |
| `/api/share/history` | GET | List past shares with performance |

### Component Structure

```
src/components/sharing/
├── ShareStreakBadge.tsx     # Fire emoji badge with streak count
├── ShareReminder.tsx        # Non-intrusive nudge card
├── ShareInsightsCard.tsx    # Pattern display component
├── ShareHistoryList.tsx     # Past shares with metrics
└── ShareMilestoneToast.tsx  # Celebration animation
```

### Leveraging Existing Systems

| System | How PRD-56 Uses It |
|--------|-------------------|
| **Notification Infrastructure (PRD-38)** | `notification_types`, `notifications`, `notification_preferences_user` tables for nudges |
| **Analytics Tracking** | Dual-track via `analytics.ts` (GA4 + PostHog) for share events |
| **User Preferences (PRD-25)** | Add `share_nudge_frequency` preference to `user_preferences` registry |
| **Milestone Pattern** | Reuse `STREAK_MILESTONES = [7, 14, 30, 100]` pattern from trends |
| **Toast System** | Use `@/hooks/use-toast` for in-app celebrations |
| **Share Cards Table** | Extend existing `share_cards` with views/clicks tracking |

---

## Implementation Plan

### Phase 1: Streak Infrastructure (Sessions 1-2)

1. Create `share_streaks` table migration
2. Create `update_share_streak()` database function
3. Integrate streak update into share creation flow
4. Create `ShareStreakBadge` component
5. Display badge in Stats Hub

### Phase 2: Insights & Analytics (Sessions 3-4)

1. Create `share_analytics_daily` table migration
2. Build `/api/share/insights` endpoint
3. Create `ShareInsightsCard` component
4. Add pattern visualization to Stats Hub

### Phase 3: Nudge System (Sessions 5-6)

1. Add notification types for streaks
2. Create `ShareReminder` component
3. Implement streak-at-risk detection
4. Add post-submission share prompt
5. Add nudge frequency preference

### Phase 4: Dashboard & Polish (Sessions 7-8)

1. Create `/api/share/history` endpoint
2. Build `ShareHistoryList` component
3. Add milestone celebration animation
4. Integrate all components into Stats Hub
5. Final testing and verification

---

## Proactive Items

### P-1: Share Streak Badges

Visual badge tier system based on streak length:

| Tier | Days | Badge |
|------|------|-------|
| Bronze | 7+ | Bronze flame |
| Silver | 14+ | Silver flame |
| Gold | 30+ | Gold flame |
| Diamond | 100+ | Diamond flame |

**Future-Proofing:** Extensible to achievements system (PRD-47 style).

### P-2: Share Leaderboard

Weekly top sharers in each league:
- "Most shares this week" leaderboard
- Separate from steps leaderboard
- Reuses existing leaderboard component patterns (PRD-23)

### P-3: Smart Share Timing

ML-like heuristics for optimal share times:
- Track when user's shares get most views
- Suggest "Best time to share: Mondays at 8am"
- Learn from historical engagement data

**Future-Proofing:** Lays groundwork for AI suggestions.

### P-4: Share Challenge Cards

Mini-challenges to encourage sharing:
- "Share 3 days in a row"
- "Share your weekend stats"
- "Share after a personal best"

**Future-Proofing:** Bridges to PRD-54 challenge system.

---

## Testing Requirements

### Unit Tests (Vitest)

| Component | Tests Required | Priority |
|-----------|---------------|----------|
| `update_share_streak()` | Streak calculation, edge cases, same-day shares | High |
| Milestone detection | All milestone values (7, 14, 30, 100) | High |
| Pattern analysis | Day-of-week, hour calculation | Medium |
| Nudge timing | At-risk detection, optimal window | Medium |

### Integration Tests

| Flow | Tests Required | Priority |
|------|---------------|----------|
| Share → Streak Update → Badge Display | Full streak lifecycle | High |
| Streak Milestone → Notification → Toast | Celebration flow | High |
| Nudge Trigger → Preference Check → Display | Nudge system | Medium |

### E2E Tests (Playwright)

| Scenario | Test Coverage |
|----------|---------------|
| New user first share | Streak starts at 1, badge appears |
| Consecutive day sharing | Streak increments correctly |
| Milestone celebration | Confetti/animation triggers at 7 days |
| Nudge dismissal | User can dismiss, respects preference |

---

## Deep Thinking Framework

### Why (Problem Definition)

- Users share sporadically with no incentive for consistency
- No visibility into sharing patterns or achievements
- Missed opportunities to encourage sharing at key moments
- No feedback loop showing impact of shares

### What (Solution Scope)

- Streak tracking with persistent database state
- Pattern insights revealing user behavior
- Smart, non-intrusive nudge system
- Analytics dashboard showing share performance

### How (Implementation Strategy)

- Leverage PRD-38 notification infrastructure for nudges
- Reuse milestone pattern from existing code
- Build on PRD-51 sharing foundation
- Modular components for Stats Hub integration

### Future-Proofing Considerations

- Badge system extensible to broader achievements
- Leaderboard pattern reusable for other metrics
- Smart timing lays groundwork for ML features
- Challenge cards bridge to PRD-54 challenges

---

## Design System Integration

### Semantic CSS Variables

| State | Token | Usage |
|-------|-------|-------|
| Streak Active | `text-[hsl(var(--success))]` | Current streak indicator |
| Streak At Risk | `text-[hsl(var(--warning))]` | Nudge warning |
| Streak Lost | `text-muted-foreground` | Reset indicator |
| Milestone | `text-primary` | Celebration state |

### Component Patterns

- `ShareStreakBadge` uses existing Badge component from shadcn/ui
- `ShareReminder` follows Alert component pattern
- `ShareInsightsCard` extends Card component
- All components support light/dark mode via semantic variables

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-01-29 | Initial | Created PRD-56, extracted from PRD-54 Section D |
| 2026-01-29 | Scope | Expanded from 3 items to 18 items across 4 sections |
| 2026-01-29 | Proactive | Added 4 proactive items for future extensibility |
