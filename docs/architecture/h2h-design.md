# Head-to-Head League Architecture

> PRD 47 | Design Document | 2026-02-28

## Overview

H2H mode adds FPL-style weekly 1v1 matchups to existing leagues. Instead of only competing on cumulative leaderboards, members are paired each week. The person with more steps wins 3 points; draws earn 1 point each.

## Schema Design

### Tables

```
h2h_seasons ──→ leagues (league_id)
h2h_fixtures ──→ h2h_seasons (season_id), users (home/away)
h2h_standings ──→ h2h_seasons (season_id), users (user_id)
```

**h2h_seasons** — One per league per season cycle. Tracks duration, type (fixed/endless), and status.

**h2h_fixtures** — Individual matchups. One row per pairing per week. Stores steps and points for both sides. Supports playoff rounds via `round_type`.

**h2h_standings** — Denormalized leaderboard. Updated after each fixture resolves. Ranked by points, then total steps.

### League Extensions

`leagues.h2h_enabled` (boolean) and `leagues.h2h_season_weeks` (int) added directly to leagues table rather than a separate config table, since they're simple flags.

## Fixture Generation Algorithm

### Circle Method (Round-Robin)

For `n` participants (padded to even with BYE if odd):

1. Fix participant[0] in position
2. Rotate remaining participants clockwise each round
3. Pair position[i] with position[n-1-i]
4. BYE matchups generate a bye entry (automatic win)

**Complexity:** O(n^2) — generates n-1 rounds with n/2 matches each.

### Example (6 members)

```
Round 1: [A B C D E F] → A-F, B-E, C-D
Round 2: [A F B C D E] → A-E, F-D, B-C
Round 3: [A E F B C D] → A-D, E-C, F-B
Round 4: [A D E F B C] → A-C, D-B, E-F
Round 5: [A C D E F B] → A-B, C-F, D-E
```

Every pair meets exactly once. 15 total matches = 6*5/2.

### Odd Members

5 members → pad with BYE → 6 slots → 5 rounds. Each round, one member faces BYE (gets automatic win). Each member gets exactly 1 bye across the season.

## Match Resolution

Weekly cron or API trigger:
1. For each `in_progress` fixture where the week has ended
2. Sum steps for each user for that week's date range
3. Compare: higher steps = 3 pts, equal = 1 pt each
4. Update fixture with steps, points, status=completed
5. Increment standings counters (played, won/drawn/lost, points, total_steps)

## Season Lifecycle

```
pending → active → completed
                 → cancelled (admin action)
```

- **pending**: Fixtures generated, waiting for start_date
- **active**: Current week's fixtures are in_progress
- **completed**: All weeks resolved, standings are final

## Edge Cases

| Scenario | Resolution |
|----------|-----------|
| Member leaves mid-season | Remaining fixtures cancelled, opponents get BYE wins |
| New member joins mid-season | Joins next season |
| Both submit 0 steps | Draw (1 pt each) |
| Late submission | Steps only count for current/future fixtures |
| League < 4 members | H2H toggle disabled |
| Season with 3 members | 3 rounds, 1 bye per round |

## Scalability

- Round-robin is practical for leagues up to ~20 members (19 weeks, 10 matches/week)
- For larger leagues, consider Swiss-system pairing (match by current standings)
- `season_type: 'endless'` uses random weekly pairing instead of round-robin

## Future Extensions

1. **Playoffs** — `round_type: 'semifinal' | 'final'` already in schema. Top 4 after regular season enter knockout.
2. **Divisions** — Multiple tiers with promotion/relegation between seasons.
3. **Team H2H** — Group members into sub-teams for team-vs-team matchups.
4. **Points-based H2H** — Use PRD 46 SLP points instead of raw steps for more normalized comparison.
