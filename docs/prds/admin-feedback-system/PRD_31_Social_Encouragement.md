# PRD 31: Social Encouragement System

> **Order:** 31 of 36
> **Previous:** [PRD 30: Duplicate Submissions](./PRD_30_Duplicate_Resolution.md)
> **Next:** [PRD 32: Admin Analytics](./PRD_32_Admin_Analytics.md)
> **Depends on:** PRD 26 (feature flags)
> **Status:** 📋 Proposed

---

## ⚠️ Agent Instructions (MANDATORY)

Before starting work on this PRD, the implementing agent MUST:

1. **Read these files for context:**
   - `AGENTS.md` - Critical rules, patterns, and documentation requirements
   - `src/types/database.ts` - Existing types
   - `src/app/(dashboard)/league/[id]/leaderboard/page.tsx` - Where to add high-fives

2. **Follow documentation rules:**
   - Update `CHANGELOG.md` with all changes
   - Use date format `YYYY-MM-DD` (current year is 2026)

3. **After completion:**
   - Commit with message format: `feat(PRD-31): Brief description`
   - Mark this PRD as done on the Kanban board

---

## Problem Statement

**Current:** StepLeague is purely competition-focused.
**Risk:** Pure competition can cause anxiety and dropout for less active users.
**Opportunity:** Transform from "beat others" to "friends encouraging friends to be healthier."

---

## Outcome

A peer encouragement system where users can:
1. **"High-Five"** each other's submissions (one-click kudos)
2. **See encouragement** on their activity
3. **Get prompted** to encourage others ("Mike is 200 steps away...")
4. **Celebrate milestones** together

---

## What is Needed

### 1. High-Fives (Core Feature)

One-click encouragement similar to Strava's "Kudos" system.

**Database Schema:**
```sql
CREATE TABLE high_fives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One high-five per sender per submission
  UNIQUE NULLS NOT DISTINCT (sender_id, submission_id)
);
```

### 2. High-Five UI Component

```tsx
<HighFiveButton 
  recipientId={member.user_id}
  initialCount={member.high_five_count}
  hasHighFived={member.user_has_high_fived}
/>
```

**Animation:** Hand wave animation on tap + confetti burst.

### 3. Cheer Prompts

Contextual prompts to encourage others:
"Mike is 200 steps away from his goal. Send a cheer? 🙌"

---

## API Endpoints

### POST /api/high-fives
Send a high-five.

### DELETE /api/high-fives/:id
Remove a high-five.

---

## Verification Checklist

> **IMPORTANT:** After implementation, verify at these specific locations.

### Frontend Checks

| Check | URL/Location | Expected Result |
|-------|--------------|-----------------|
| Button visible | Leaderboard | Hand icon appears on rows |
| Tap action | Leaderboard | Icon animates, count increases |
| Persistence | Reload page | Count remains updated |
| Cheer prompt | Leaderboard | Shows "Cheer x?" if condition met |
| Summary card | Dashboard | "You got 5 high fives" card |

### Backend Checks

| Check | Method | Expected Result |
|-------|--------|-----------------|
| Table exists | Query `high_fives` | Table found |
| RLS | Query as other user | Cannot delete others' likes |

### Documentation Checks

- [ ] CHANGELOG.md updated
- [ ] AGENTS.md updated

---

## Feature Flag

This feature is gated by `feature_high_fives` (PRD 26).

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-01-05 | Initial | Created PRD based on external research |
