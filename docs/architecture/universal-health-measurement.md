# Universal Health Measurement Architecture

> PRD 48 | Architecture Document | 2026-02-28

## Vision

Transform StepLeague from a step-only platform into an activity-agnostic fitness competition using **StepLeague Points (SLP)** as the universal unit. 1 step = 1 SLP (baseline). All other activities convert to SLP via a configurable conversion table.

## Conversion Table

| Activity | Unit | SLP per Unit | Rationale |
|----------|------|-------------|-----------|
| Steps | 1 step | 1 | Baseline reference |
| Calories | 1 kcal | 20 | ~50 kcal = 1,000 steps (moderate walking) |
| Kilojoules | 1 kJ | 5 | 1 kcal = 4.184 kJ, so 20/4.184 ~ 5 |
| Swimming | 100m | 150 | ~15 min swim = 1,500 steps equivalent effort |
| Cycling | 1 km | 100 | ~3 min cycling = 100 steps equivalent |
| Running | 1 km | 1,300 | 1 km running = ~1,300 actual footsteps |

### Design Decisions

**Why not hardcode?** Conversion rates should be stored in a DB config table (`activity_conversions`), not constants. This enables:
- Admin tuning without code deployment
- A/B testing different rates
- Per-league custom rates (corporate wellness might weight differently)
- Historical rate versioning (rates change but old submissions keep their SLP)

**Why SLP naming?** "Points" are overloaded (PRD 46 has its own points). SLP is specific, brandable, and naturally extends from "StepLeague".

## Database Design

### New Table: `activity_conversions`

```sql
CREATE TABLE activity_conversions (
  activity_type TEXT PRIMARY KEY,
  unit_label TEXT NOT NULL,        -- 'steps', 'kcal', 'kJ', 'meters', 'km'
  slp_per_unit NUMERIC NOT NULL,   -- Conversion factor
  display_name TEXT NOT NULL,      -- 'Steps', 'Calories', 'Swimming', etc.
  display_emoji TEXT,              -- Optional emoji for UI
  display_order INTEGER DEFAULT 0, -- Sort order in selector
  min_value NUMERIC DEFAULT 0,     -- Minimum valid value
  max_value NUMERIC,               -- Maximum daily value (fraud prevention)
  requires_verification_above NUMERIC, -- Trigger photo req above this
  enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Submissions Table Extensions

```sql
ALTER TABLE submissions ADD COLUMN activity_type TEXT DEFAULT 'steps';
ALTER TABLE submissions ADD COLUMN raw_value NUMERIC;
ALTER TABLE submissions ADD COLUMN raw_unit TEXT;
ALTER TABLE submissions ADD COLUMN slp_equivalent NUMERIC;
```

The `steps` column remains for backward compatibility. `slp_equivalent` is the universal ranking value.

### Data Migration

```sql
UPDATE submissions
SET activity_type = 'steps',
    raw_value = steps,
    raw_unit = 'steps',
    slp_equivalent = steps
WHERE slp_equivalent IS NULL;
```

### Daily Aggregation View

```sql
CREATE OR REPLACE VIEW user_daily_slp AS
SELECT
  user_id,
  for_date,
  SUM(slp_equivalent) as total_slp,
  array_agg(DISTINCT activity_type) as activity_types,
  COUNT(*) as submission_count
FROM submissions
WHERE slp_equivalent IS NOT NULL
GROUP BY user_id, for_date;
```

## Conversion Logic

```typescript
// src/lib/health/conversionTable.ts
function convertToSLP(activityType: string, rawValue: number): number
```

Pure function. Reads from a static config (initially), upgradeable to DB-backed. Handles:
- All 6 activity types
- Swimming in meters (not km) since pools use 25m/50m/100m
- Edge cases: zero values, unknown types (return 0), negative values (throw)

## Validation Thresholds

Per-activity sanity checks to prevent fraud:

| Activity | Max Daily | Requires Photo Above |
|----------|-----------|---------------------|
| Steps | 100,000 | 50,000 |
| Calories | 5,000 kcal | 3,000 kcal |
| Kilojoules | 20,000 kJ | 12,000 kJ |
| Swimming | 10,000m | 5,000m |
| Cycling | 300 km | 150 km |
| Running | 100 km | 42 km (marathon) |

## AI Extraction Enhancement

The existing Gemini-based screenshot verification (`supabase/functions/verify-steps/`) would need prompt updates to:

1. Detect multiple metric types (steps AND calories on same screen)
2. Infer activity type from screenshot context (Strava cycling UI vs step counter)
3. Return structured multi-metric response
4. Store prompt version with each extraction for reprocessing

This is a Phase B concern — the conversion table and types can be built independently.

## Leaderboard Integration

Two display modes:
1. **SLP Mode** (default when multi-activity is enabled): Rankings use `slp_equivalent`
2. **Steps Mode** (current): Rankings use `steps` column directly

Toggle is per-user preference or per-leaderboard view. Both queries must be efficient.

## Implementation Phases

| Phase | Scope | Trigger |
|-------|-------|---------|
| A | Conversion table + types (this PRD) | Now |
| B | AI prompt enhancement | When multi-activity demand exists |
| C | Manual entry UI + activity selector | When Phase B ready |
| D | Leaderboard SLP mode | When submissions have mixed activity types |

## Proactive Items

1. **Admin-configurable conversion rates** — `activity_conversions` table is admin-editable via `/admin/settings`, not hardcoded constants. Supports `effective_from` date for rate versioning.

2. **Activity validation thresholds** — Max plausible values per activity stored in config. Submissions exceeding thresholds auto-flag for review. Prevents gaming without blocking legitimate athletes.

3. **Multi-activity daily aggregation** — `user_daily_slp` view combines all activity types into single SLP total per user per day. Leaderboard queries switch from `SUM(steps)` to `SUM(slp_equivalent)` when multi-activity is enabled.
