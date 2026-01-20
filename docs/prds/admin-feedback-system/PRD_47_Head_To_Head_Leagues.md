# PRD 47: Head-to-Head League Mode (FPL Style)

> **Order:** 47
> **Status:** 📋 Proposed (Design Only)
> **Type:** Feature
> **Dependencies:** PRD 46 (Points System)
> **Blocks:** None

---

## 🎯 Objective

Design an FPL-style (Fantasy Premier League) head-to-head league mode where users are automatically paired for weekly 1v1 matchups. Winners earn league points (3 for win, 1 for draw), creating a season-long competition with fixtures, standings, and playoffs.

**Problem Solved:** Current leaderboards show cumulative rankings, which can feel static ("I'm always 5th"). Head-to-head adds drama, weekly stakes, and the possibility of "upset" wins where a lower-ranked player beats a higher-ranked opponent.

**Inspiration:** Fantasy Premier League's H2H leagues, where you don't need the most points overall — just more than your weekly opponent.

---

## ⚠️ Agent Context (Mandatory)

| File | Purpose |
|------|---------|
| `src/app/api/leagues/` | Existing league structure |
| `supabase/migrations/` | Database patterns |
| `src/components/league/LeagueNav.tsx` | Tab navigation for league pages |
| `AGENTS.md` | Architecture patterns |

---

## 🏗️ Detailed Feature Requirements

### Section A: League Configuration — 4 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **A-1** | **H2H mode toggle on league creation** | Optional feature | League owners can enable "Head-to-Head Mode" |
| **A-2** | **Season duration configurable** | Flexibility | Options: 4, 8, 12, or "continuous" weeks |
| **A-3** | **Minimum members required** | Viable competition | Minimum 4 members to enable H2H |
| **A-4** | **Bye week handling** | Odd member count | If odd members, one person gets bye (automatic win) |

### Section B: Fixture Generation — 4 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **B-1** | **Automatic weekly pairing** | No manual work | System generates matchups at season start |
| **B-2** | **Round-robin scheduling** | Fairness | Each member plays everyone once (full season) |
| **B-3** | **Fixture visibility** | Planning | Users can see upcoming matchups |
| **B-4** | **Fixture regeneration** | Member changes | New members added get remaining fixtures |

### Section C: Match Scoring — 4 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **C-1** | **Weekly step comparison** | Determine winner | User with more steps in the week wins |
| **C-2** | **League points awarded** | Season ranking | Win = 3 pts, Draw = 1 pt, Loss = 0 pts |
| **C-3** | **Tiebreaker: steps** | Equal league points | Higher total steps wins tiebreaker |
| **C-4** | **Match history** | Record tracking | Past matchups with results viewable |

### Section D: Standings & UI — 5 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **D-1** | **H2H standings table** | Ranking visibility | Shows: Position, Name, Played, Won, Drawn, Lost, Points, Steps |
| **D-2** | **Current matchup card** | Weekly focus | Dashboard shows "This Week: You vs [Opponent]" |
| **D-3** | **Live score during week** | Engagement | Mid-week check shows current steps vs opponent |
| **D-4** | **Fixtures tab** | Full schedule | Tab in league nav showing all fixtures |
| **D-5** | **Season summary** | End-of-season | Final standings, champion celebration |

### Section E: Notifications — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **E-1** | **Match start notification** | Awareness | "Your match vs [Opponent] starts Monday" |
| **E-2** | **Mid-week update** | Engagement | "You're winning/losing by X steps" |
| **E-3** | **Match result notification** | Closure | "You won/lost/drew against [Opponent]" |

---

## ✅ Success Criteria (For Design Phase)

| Metric | Target | Verification Method |
|--------|--------|---------------------|
| All mechanics documented | 20 items | Count in PRD |
| Fixture algorithm specified | Pseudocode present | Review algorithm section |
| Database schema drafted | Tables defined | Review schema section |
| UI wireframes described | Key screens listed | Review UI section |

---

## 📐 Fixture Generation Algorithm

### Round-Robin Scheduling

For `n` members, use circle method:

```python
def generate_fixtures(members):
    n = len(members)
    if n % 2 == 1:
        members.append("BYE")  # Add bye for odd count
        n += 1

    fixtures = []
    for round in range(n - 1):
        round_fixtures = []
        for i in range(n // 2):
            home = members[i]
            away = members[n - 1 - i]
            if home != "BYE" and away != "BYE":
                round_fixtures.append((home, away))
        fixtures.append(round_fixtures)
        # Rotate: keep first fixed, rotate rest
        members = [members[0]] + [members[-1]] + members[1:-1]

    return fixtures
```

### Example: 6 Members

| Week | Matches |
|------|---------|
| 1 | A vs F, B vs E, C vs D |
| 2 | A vs E, F vs D, B vs C |
| 3 | A vs D, E vs C, F vs B |
| 4 | A vs C, D vs B, E vs F |
| 5 | A vs B, C vs F, D vs E |

---

## 🗄️ Database Schema (Draft)

### New Table: `h2h_seasons`

```sql
CREATE TABLE h2h_seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES leagues(id) NOT NULL,
  season_number INTEGER NOT NULL DEFAULT 1,
  start_date DATE NOT NULL,
  end_date DATE,
  duration_weeks INTEGER NOT NULL DEFAULT 12,
  status VARCHAR(20) DEFAULT 'active', -- active, completed, cancelled
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(league_id, season_number)
);
```

### New Table: `h2h_fixtures`

```sql
CREATE TABLE h2h_fixtures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID REFERENCES h2h_seasons(id) NOT NULL,
  week_number INTEGER NOT NULL,
  home_user_id UUID REFERENCES users(id),
  away_user_id UUID REFERENCES users(id),
  home_steps INTEGER,
  away_steps INTEGER,
  home_points INTEGER, -- 0, 1, or 3
  away_points INTEGER,
  status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, in_progress, completed
  completed_at TIMESTAMPTZ,

  UNIQUE(season_id, week_number, home_user_id)
);

CREATE INDEX idx_h2h_fixtures_season ON h2h_fixtures(season_id);
CREATE INDEX idx_h2h_fixtures_user ON h2h_fixtures(home_user_id);
```

### New Table: `h2h_standings`

```sql
CREATE TABLE h2h_standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID REFERENCES h2h_seasons(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  played INTEGER DEFAULT 0,
  won INTEGER DEFAULT 0,
  drawn INTEGER DEFAULT 0,
  lost INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  total_steps BIGINT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(season_id, user_id)
);

CREATE INDEX idx_h2h_standings_season ON h2h_standings(season_id, points DESC, total_steps DESC);
```

### Updates to `leagues`

```sql
ALTER TABLE leagues ADD COLUMN IF NOT EXISTS h2h_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE leagues ADD COLUMN IF NOT EXISTS h2h_season_weeks INTEGER DEFAULT 12;
```

---

## 🎨 UI Wireframes (Conceptual)

### League Hub - H2H Enabled

```
┌─────────────────────────────────────────┐
│ League: Office Step Challenge           │
│ ─────────────────────────────────────── │
│ [Overview] [Standings] [Fixtures] [...]  │
├─────────────────────────────────────────┤
│ THIS WEEK'S MATCH                       │
│ ┌─────────────┐   VS   ┌─────────────┐  │
│ │ You         │        │ Sarah       │  │
│ │ 42,350 👟   │        │ 38,200 👟   │  │
│ │ WINNING     │        │             │  │
│ └─────────────┘        └─────────────┘  │
│                                         │
│ Season Progress: Week 5 of 12           │
└─────────────────────────────────────────┘
```

### Standings Tab

```
┌─────────────────────────────────────────┐
│ H2H STANDINGS - Season 1                │
├───┬──────────┬───┬───┬───┬───┬─────────┤
│ # │ Player   │ P │ W │ D │ L │ Points  │
├───┼──────────┼───┼───┼───┼───┼─────────┤
│ 1 │ You ⭐   │ 4 │ 3 │ 1 │ 0 │ 10      │
│ 2 │ Sarah    │ 4 │ 3 │ 0 │ 1 │ 9       │
│ 3 │ Mike     │ 4 │ 2 │ 1 │ 1 │ 7       │
│ 4 │ Emma     │ 4 │ 1 │ 0 │ 3 │ 3       │
└───┴──────────┴───┴───┴───┴───┴─────────┘
```

### Fixtures Tab

```
┌─────────────────────────────────────────┐
│ FIXTURES                                │
├─────────────────────────────────────────┤
│ Week 5 (Current)                        │
│ • You vs Sarah ── IN PROGRESS           │
│ • Mike vs Emma ── IN PROGRESS           │
├─────────────────────────────────────────┤
│ Week 4 (Completed)                      │
│ • You 45,200 - 32,100 Mike  WIN ✓       │
│ • Sarah 41,000 - 41,000 Emma DRAW       │
├─────────────────────────────────────────┤
│ Week 6 (Upcoming)                       │
│ • You vs Emma                           │
│ • Sarah vs Mike                         │
└─────────────────────────────────────────┘
```

---

## 🔄 Edge Cases

| Scenario | Handling |
|----------|----------|
| Member leaves mid-season | Remaining fixtures cancelled, opponent gets bye |
| New member joins mid-season | Joins next season (or gets remaining fixtures if early) |
| Both users submit 0 steps | Draw (1 point each) |
| User submits after week ends | Steps don't count for past fixtures |
| League has 3 members | H2H disabled, minimum 4 required |
| Tie in standings | Tiebreaker: total steps, then head-to-head result |

---

## 📅 Implementation Plan Reference

### Phase A: Database & Config
1. Add H2H tables
2. Add league config options
3. Create fixture generation function

### Phase B: Backend
1. Season management APIs
2. Fixture result calculation (weekly cron?)
3. Standings update logic

### Phase C: Frontend
1. H2H standings component
2. Current matchup card
3. Fixtures list component
4. League settings for H2H toggle

### Phase D: Notifications
1. Match start notifications
2. Mid-week updates
3. Result notifications

---

## 🔗 Related Documents

- [PRD 46: Points System](./PRD_46_Points_Scoring_System.md) - Could use points instead of steps for H2H
- [PRD 38: Notification Infrastructure](./PRD_38_Notification_Infrastructure.md) - For match notifications
- [FPL Rules Reference](https://fantasy.premierleague.com/help/rules) - Inspiration source

---

## Future Considerations

- **Playoffs**: Top 4 at season end play knockout rounds?
- **Divisions**: Auto-promotion/relegation between tiers?
- **Points-based H2H**: Use PRD 46 points instead of raw steps?
- **Team H2H**: Group members into teams for league-vs-league?

---

## 🔍 Systems/Design Considerations

_Things to understand/investigate during implementation (not do immediately):_

1. **League Type Coexistence** - H2H and standard cumulative leaderboard should work together; a league can show both views. Investigate how the existing `LeagueNav.tsx` tab structure can accommodate a "Fixtures" tab alongside "Leaderboard" and "Members".

2. **Week Boundary Definition** - Align week definition with points system (PRD 46). If points use UTC midnight and H2H uses user timezone, users will be confused by mismatched "weekly" metrics. Define a single `getWeekBoundary()` utility shared across features.

3. **Fixture Generation Scalability** - Round-robin works for small leagues (4-12 members) but generates `n*(n-1)/2` matches. For larger leagues (20+ members), consider Swiss-system (pair by standings) or random weekly pairing. The algorithm should be pluggable based on league settings.

4. **Membership Changes Impact** - Document what happens when members leave/join mid-season. Options: (a) cancelled fixtures count as opponent win, (b) new members wait for next season, (c) regenerate remaining fixtures. Each has implications for standings integrity.

---

## 💡 Proactive Considerations

_Forward-thinking items that anticipate future needs:_

1. **Season Templates** - Allow leagues to choose "Classic Season" (fixed weeks, round-robin) or "Endless" (random weekly pairing, no end date). Design the `h2h_seasons` schema to support both from day one: add `season_type: 'fixed' | 'endless'` column and optional `end_date`.

2. **Notification Preferences** - H2H adds 3+ notification types per week (match start, mid-week update, result). Ensure the notification settings UI (if it exists) allows granular control over H2H notifications without disabling all league notifications. Schema: `notification_preferences.h2h_match_start`, etc.

3. **Playoff System Design** - Top 4 playoffs are mentioned as future possibility. Ensure `h2h_fixtures` schema supports playoff rounds now: add `round_type: 'regular' | 'semifinal' | 'final'` column. This prevents needing a separate playoffs table later.

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-01-20 | Initial | Created FPL-style H2H league design PRD |
| 2026-01-20 | Systems/Proactive | Added modular design considerations and forward-thinking items |
