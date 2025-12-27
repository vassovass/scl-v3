# PRD 18: League Start Date

> **Order:** 18 of 18  
> **Previous:** [PRD 17: Documentation](./PRD_17_Documentation.md)

---

## ⚠️ Agent Instructions (MANDATORY)

Before starting work on this PRD, the implementing agent MUST:

1. **Read these files for context:**
   - `AGENTS.md` - Critical rules, patterns, and documentation requirements
   - `src/types/database.ts` - Current league and submission types
   - `src/app/api/leagues/` - League API routes
   - `src/app/(dashboard)/league/[id]/leaderboard/page.tsx` - Leaderboard logic
   - Existing migration files for `leagues` table

2. **Follow documentation rules:**
   - Update `CHANGELOG.md` with all changes
   - Use date format `YYYY-MM-DD` (current year is 2025)
   - Store artifacts in `docs/artifacts/`
   - Update roadmap when complete

3. **After completion:**
   - Commit with message format: `feat(PRD-XX): Brief description`
   - Mark this PRD as done on the Kanban board
   - Update `AGENTS.md` if adding new patterns

---

## Outcome

League owners can set a "counting start date" for their league. Only steps submitted for dates **on or after** that start date count toward the league leaderboard and stats. Steps submitted by users still persist globally (across all leagues), but each league filters by its own start date.

---

## Problem Statement

Currently:

- A user's daily steps persist across all leagues they are in (correct behavior ✅)
- Leagues have no way to define when step counting begins
- A league that starts mid-year counts ALL historical steps from members

**Issue:**

- League owners cannot run "fresh start" competitions
- Joining a league mid-season creates unfair advantages/disadvantages
- No way to create seasonal or time-bound challenges

---

## What is Needed

### 1. Database: Add `counting_start_date` to Leagues

Add a new nullable column to the `leagues` table:

```sql
ALTER TABLE leagues 
ADD COLUMN IF NOT EXISTS counting_start_date DATE DEFAULT NULL;

COMMENT ON COLUMN leagues.counting_start_date IS 
  'If set, only submissions with for_date >= counting_start_date count toward this league. NULL means count all submissions.';
```

**Behavior:**

- `NULL` = count all submissions (backward compatible default)
- Date = only count steps submitted for dates on or after this date

### 2. Update Leaderboard Query

The `leaderboard_period` function (or equivalent query) must filter submissions:

```sql
WHERE s.for_date >= COALESCE(l.counting_start_date, '1970-01-01')
```

This ensures:

- Existing leagues (NULL start date) continue working as-is
- Leagues with a start date only aggregate steps from that date forward

### 3. League Settings UI

Add a field to the league settings page for league owners:

| Field | Type | Description |
|-------|------|-------------|
| Counting Start Date | Date picker | "Steps count from this date onwards" |

**UI considerations:**

- Show "All time" or similar when NULL
- Only league owner/admin can edit
- Warn if changing date will affect existing rankings

### 4. TypeScript Types

Update `src/types/database.ts`:

```typescript
leagues: {
  Row: {
    // ... existing fields
    counting_start_date: string | null;  // DATE format 'YYYY-MM-DD'
  };
  // Update Insert and Update types too
};
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/migrations/YYYYMMDD_add_league_start_date.sql` | CREATE - Migration |
| `src/types/database.ts` | MODIFY - Add counting_start_date |
| Leaderboard RPC/query | MODIFY - Filter by start date |
| League settings page/component | MODIFY - Add date picker |
| `src/app/api/leagues/[id]/route.ts` | MODIFY - Allow updating start date |

---

## Success Criteria

- [ ] `counting_start_date` column exists on `leagues` table
- [ ] Existing leagues default to NULL (all history counts)
- [ ] League owner can set/update the start date in settings
- [ ] Leaderboard only shows steps from start date onwards
- [ ] User's step submissions remain unchanged (global persistence)
- [ ] TypeScript types updated
- [ ] Build passes (`npm run build`)

---

## Visual Reference

**League Settings:**

```
┌─────────────────────────────────────────────┐
│ League Settings                             │
├─────────────────────────────────────────────┤
│ Name: [Morning Walkers                    ] │
│                                             │
│ Step Week Start: [Monday ▼]                 │
│                                             │
│ Counting Start Date:                        │
│ [📅 January 1, 2025        ] [Clear]        │
│ ℹ️ Steps only count from this date onwards  │
│                                             │
│              [Save Changes]                 │
└─────────────────────────────────────────────┘
```

**Leaderboard behavior:**

```
League: "2025 Challenge" (starts Jan 1, 2025)

User steps on Dec 15, 2024 → NOT counted for this league
User steps on Jan 3, 2025  → COUNTED for this league

Same user's steps visible in "All-Time" league (no start date)
```

---

## Out of Scope

- End date for leagues (future enhancement)
- Seasons/phases within a league
- Auto-archiving historical data
- Per-user start dates within a league

---

## Related Concepts

This feature complements existing league settings:

| Setting | Purpose |
|---------|---------|
| `stepweek_start` | When the week begins (Mon/Sun) |
| `backfill_limit` | How far back users can submit |
| `counting_start_date` | **NEW** When steps start counting |

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2025-12-28 | Initial | Created PRD for league start date |
