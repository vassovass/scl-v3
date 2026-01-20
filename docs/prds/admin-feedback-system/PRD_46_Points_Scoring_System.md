# PRD 46: Points-Based Scoring System

> **Order:** 46
> **Status:** 📋 Proposed (Design Only)
> **Type:** Feature
> **Dependencies:** PRD 44 (Auto-Enroll World League)
> **Blocks:** PRD 47 (Head-to-Head)

---

## 🎯 Objective

Design a comprehensive points-based scoring system that rewards users for personal improvement, consistency, and engagement — not just raw step counts. This system shifts focus from pure competition (which favors naturally active people) to personal growth and habits (which everyone can achieve).

**Problem Solved:** Currently, leaderboards only rank by raw steps. This discourages:
- Users with lower baseline activity (they'll "never catch up")
- Users who improve significantly but started low
- Consistency (a user walking 10K every day loses to someone who walks 50K once)

The points system rewards the *journey*, not just the destination.

---

## ⚠️ Agent Context (Mandatory)

| File | Purpose |
|------|---------|
| `src/app/api/leaderboard/route.ts` | Current leaderboard logic (steps-based) |
| `supabase/migrations/` | Database schema patterns |
| `src/lib/badges.ts` | Achievement badge system |
| `AGENTS.md` | Architecture patterns |

---

## 🏗️ Detailed Feature Requirements

### Section A: Core Mechanics (User Specified) — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **A-1** | **Base Step Points** | Foundation scoring | 1 step = 1 base point (maintains intuitive connection to steps) |
| **A-2** | **Personal Improvement Bonus** | Rewards self-improvement | Bonus points when exceeding 7-day rolling average |
| **A-3** | **Consistency Multiplier** | Rewards daily participation | Streak length multiplies daily points |

### Section B: Additional Engagement Mechanics — 8 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **B-1** | **Early Bird Bonus** | Encourages prompt uploads | +5 points for submissions before 12:00 local time |
| **B-2** | **Weekend Warrior** | Recognizes weekend effort | +10 points for Saturday/Sunday submissions |
| **B-3** | **Goal Achiever** | Personalized targets | +15 points for hitting personal daily goal |
| **B-4** | **Comeback King** | Reduces dropout after gaps | +20 points for first submission after 3+ missed days |
| **B-5** | **Milestone Markers** | Lifetime celebration | One-time bonuses at 100K, 500K, 1M lifetime steps |
| **B-6** | **Verification Bonus** | Encourages photo proof | +5 points for photo-verified submissions |
| **B-7** | **Social Engagement** | Rewards community | +2 points per High Five sent (max 10/day) |
| **B-8** | **League Diversity** | Multi-league participation | +3 points per active league membership (max 5) |

### Section C: Streak System — 4 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **C-1** | **Streak counting** | Track consecutive days | Count days with at least 1 submission |
| **C-2** | **Streak multipliers** | Compound rewards | 1.1x at 7 days, 1.25x at 14 days, 1.5x at 30+ days |
| **C-3** | **Streak protection** (future) | Reduce frustration | Option to "freeze" streak once per month (future premium) |
| **C-4** | **Streak milestones** | Visual celebration | Badges/confetti at 7, 30, 100, 365 day streaks |

### Section D: Leaderboard Integration — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **D-1** | **Points-based leaderboard option** | Alternative ranking | Toggle between "By Steps" and "By Points" |
| **D-2** | **Points breakdown visible** | Transparency | User can see how their points were calculated |
| **D-3** | **Weekly points reset** (optional) | Fresh competition | Weekly points ranking alongside all-time |

---

## ✅ Success Criteria (For Design Phase)

| Metric | Target | Verification Method |
|--------|--------|---------------------|
| All mechanics documented | 11 total | Count in PRD |
| Formulas specified | All calculable | Review formulas section |
| Database schema drafted | Tables defined | Review schema section |
| Edge cases considered | Common scenarios covered | Review edge cases section |

---

## 📐 Point Calculation Formulas

### Daily Points Formula

```
daily_points = base_points + improvement_bonus + activity_bonuses + social_bonuses
final_daily_points = daily_points * streak_multiplier
```

### Component Calculations

**Base Points:**
```
base_points = steps_submitted
```

**Improvement Bonus:**
```
rolling_avg_7 = average(last 7 days steps)
if today_steps > rolling_avg_7:
  improvement_bonus = (today_steps - rolling_avg_7) / 100
else:
  improvement_bonus = 0
```

**Streak Multiplier:**
```
if streak < 7: multiplier = 1.0
elif streak < 14: multiplier = 1.1
elif streak < 30: multiplier = 1.25
else: multiplier = 1.5
```

**Activity Bonuses:**
```
early_bird = 5 if submitted_before_noon else 0
weekend_warrior = 10 if is_weekend else 0
goal_achiever = 15 if steps >= daily_goal else 0
comeback_king = 20 if (days_since_last_submission >= 3 and today_submitted) else 0
verification = 5 if has_photo_verification else 0
```

**Milestone Bonuses (One-Time):**
```
100K_club = 100 (once, at 100,000 lifetime steps)
500K_club = 500 (once, at 500,000 lifetime steps)
1M_club = 1000 (once, at 1,000,000 lifetime steps)
```

**Social Bonuses:**
```
high_fives_sent = min(high_fives_today, 10) * 2
league_diversity = min(active_leagues, 5) * 3
```

### Example Calculation

User: 8,500 steps, 7-day avg: 7,000, streak: 15 days, submitted at 10am, weekday, goal: 8,000, photo verified, sent 5 high fives, in 3 leagues

```
base_points = 8,500
improvement_bonus = (8,500 - 7,000) / 100 = 15
early_bird = 5
weekend_warrior = 0
goal_achiever = 15 (8,500 >= 8,000)
comeback_king = 0
verification = 5
high_fives = 5 * 2 = 10
league_diversity = 3 * 3 = 9

subtotal = 8,500 + 15 + 5 + 0 + 15 + 0 + 5 + 10 + 9 = 8,559
streak_multiplier = 1.25 (15 days)
final_daily_points = 8,559 * 1.25 = 10,699
```

---

## 🗄️ Database Schema (Draft)

### New Table: `user_points`

```sql
CREATE TABLE user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  date DATE NOT NULL,

  -- Breakdown
  base_points INTEGER NOT NULL DEFAULT 0,
  improvement_bonus INTEGER NOT NULL DEFAULT 0,
  early_bird_bonus INTEGER NOT NULL DEFAULT 0,
  weekend_bonus INTEGER NOT NULL DEFAULT 0,
  goal_bonus INTEGER NOT NULL DEFAULT 0,
  comeback_bonus INTEGER NOT NULL DEFAULT 0,
  verification_bonus INTEGER NOT NULL DEFAULT 0,
  social_bonus INTEGER NOT NULL DEFAULT 0,
  league_bonus INTEGER NOT NULL DEFAULT 0,

  -- Final
  streak_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.0,
  total_points INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_id, date)
);

CREATE INDEX idx_user_points_user_date ON user_points(user_id, date DESC);
CREATE INDEX idx_user_points_date ON user_points(date);
```

### Updates to `user_records`

```sql
ALTER TABLE user_records ADD COLUMN IF NOT EXISTS rolling_avg_7 INTEGER DEFAULT 0;
ALTER TABLE user_records ADD COLUMN IF NOT EXISTS lifetime_points BIGINT DEFAULT 0;
ALTER TABLE user_records ADD COLUMN IF NOT EXISTS daily_goal INTEGER DEFAULT 10000;

-- Milestone tracking
ALTER TABLE user_records ADD COLUMN IF NOT EXISTS milestone_100k_awarded BOOLEAN DEFAULT FALSE;
ALTER TABLE user_records ADD COLUMN IF NOT EXISTS milestone_500k_awarded BOOLEAN DEFAULT FALSE;
ALTER TABLE user_records ADD COLUMN IF NOT EXISTS milestone_1m_awarded BOOLEAN DEFAULT FALSE;
```

---

## 🔄 Edge Cases

| Scenario | Handling |
|----------|----------|
| User submits multiple times per day | Only highest step count used for points |
| User backdates submission | Points calculated based on submission date, not for_date |
| Streak broken by missed day | Multiplier resets to 1.0 |
| User has no 7-day history | Improvement bonus uses available days, or 0 if first day |
| User joins mid-week | Weekly points calculated from join date |
| User in 10 leagues | League bonus caps at 5 leagues (15 points max) |

---

## 📅 Implementation Plan Reference

### Phase A: Database
1. Create `user_points` table
2. Update `user_records` with new columns
3. Create triggers/functions for point calculation

### Phase B: Backend
1. Point calculation service/function
2. Update submission flow to calculate points
3. API endpoint for point breakdown

### Phase C: Frontend
1. Points toggle on leaderboard
2. Point breakdown modal/tooltip
3. Streak and milestone visualizations

### Phase D: Backfill (Optional)
1. Calculate historical points for existing users
2. Award milestone badges retroactively

---

## 🔗 Related Documents

- [PRD 31: Social Encouragement](./PRD_31_Social_Encouragement.md) - High Fives system
- [PRD 23: Global Leaderboard](./PRD_23_Global_Leaderboard.md) - Where points ranking appears
- [badges.ts](../../../src/lib/badges.ts) - Achievement badge definitions

---

## Future Considerations

- **Points Economy**: Could points become spendable (e.g., streak freeze purchase)?
- **Seasonal Resets**: Quarterly/yearly point competitions?
- **Team Points**: Aggregate points for league-based rankings?
- **Anti-Gaming**: Rate limiting, anomaly detection for abuse?

---

## 🔍 Systems/Design Considerations

_Things to understand/investigate during implementation (not do immediately):_

1. **Calculation Timing** - Decide when points are calculated: on submission (real-time) vs. end-of-day (batch cron job). Real-time is simpler but may recalculate incorrectly if user submits multiple times per day. Batch is more accurate but introduces leaderboard lag. Consider hybrid: calculate on submission, reconcile nightly.

2. **Streak Definition Edge Cases** - Define what counts as a "day": UTC midnight, user's local timezone, or 24-hour rolling window? This affects global users significantly. A user in Australia shouldn't lose their streak because they submitted at 11pm local time (which is yesterday UTC). Store `user_timezone` in profile.

3. **Leaderboard Query Performance** - Points leaderboard will need different indexes than steps leaderboard. Plan for `user_points` aggregation queries with proper indexing: `CREATE INDEX idx_user_points_total ON user_points(date, total_points DESC)`. Consider materialized views for weekly/monthly aggregations.

4. **Backward Compatibility** - Existing leaderboard by raw steps must continue working; points is an alternative view, not a replacement. Users who prefer simplicity should still see "This Week: 52,340 steps" alongside "This Week: 68,500 points".

---

## 💡 Proactive Considerations

_Forward-thinking items that anticipate future needs:_

1. **Points Economy Extensibility** - Design `user_points` schema to support future "spendable" points (streak freeze purchases, cosmetic unlocks). Consider adding `points_type: 'earned' | 'spent' | 'bonus'` column or a separate ledger table for transactions. This enables gamification features without schema migration.

2. **Anti-Gaming Measures** - Document rate limits and anomaly detection requirements upfront. Examples: cap daily social bonus at 10 high-fives to prevent farming collusion, flag users who suddenly submit 10x their average steps, require photo verification for submissions above 30K steps.

3. **Historical Backfill Strategy** - Decide upfront whether existing users get retroactive points calculated. If yes, the calculation logic must work historically (parsing old submissions), not just for new ones. Consider a `points_backfill_completed_at` flag on user records to track migration status.

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-01-20 | Initial | Created comprehensive points system design PRD |
| 2026-01-20 | Systems/Proactive | Added modular design considerations and forward-thinking items |
