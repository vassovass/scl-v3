# PRD 27: Social Encouragement System

> **Order:** 27 of 30  
> **Previous:** [PRD 26: Unified Progress](./PRD_26_Unified_Progress.md)  
> **Next:** [PRD 28: Admin Analytics](./PRD_28_Admin_Analytics.md)  
> **Depends on:** PRD 23 (feature flags)  
> **Status:** 📋 Proposed

---

## ⚠️ Agent Instructions (MANDATORY)

Before starting work on this PRD, the implementing agent MUST:

1. **Read these files for context:**
   - `AGENTS.md` - Critical rules, patterns, and documentation requirements
   - `src/types/database.ts` - Existing types (for high_fives table)
   - `src/app/(dashboard)/league/[id]/leaderboard/page.tsx` - Where to add high-fives
   - PRD 23 for reminder integration

2. **Follow documentation rules:**
   - Update `CHANGELOG.md` with all changes
   - Use date format `YYYY-MM-DD` (current year is 2026)

3. **After completion:**
   - Commit with message format: `feat(PRD-26): Brief description`
   - Mark this PRD as done on the Kanban board

---

## Problem Statement

**Current:** StepLeague is purely competition-focused.

**Research Insight:** Strava found that encouragement from lower-activity friends was MORE motivating than pressure from high-performers. It normalized breaks and reduced pressure.

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
  -- Alternatively, high-five a day's activity without specific submission:
  for_date DATE,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One high-five per sender per submission (or per day if no submission_id)
  UNIQUE NULLS NOT DISTINCT (sender_id, submission_id),
  UNIQUE NULLS NOT DISTINCT (sender_id, recipient_id, for_date, league_id)
);

-- RLS
ALTER TABLE high_fives ENABLE ROW LEVEL SECURITY;

-- Users can give high-fives to league members
CREATE POLICY "Users can give high-fives to league members"
ON high_fives FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM memberships m1
    JOIN memberships m2 ON m1.league_id = m2.league_id
    WHERE m1.user_id = auth.uid() 
    AND m2.user_id = recipient_id
    AND m1.league_id = high_fives.league_id
  )
);

-- Users can see high-fives they gave or received
CREATE POLICY "Users can view related high-fives"
ON high_fives FOR SELECT TO authenticated
USING (sender_id = auth.uid() OR recipient_id = auth.uid());
```

### 2. High-Five UI Component

```tsx
interface HighFiveButtonProps {
  recipientId: string;
  submissionId?: string;
  forDate?: string;
  leagueId: string;
  initialCount?: number;
  hasHighFived?: boolean;
}

// Usage on leaderboard row
<HighFiveButton 
  recipientId={member.user_id}
  forDate={todayDate}
  leagueId={leagueId}
  initialCount={member.high_five_count}
  hasHighFived={member.user_has_high_fived}
/>
```

**Visual Design:**
```
Normal:    🙌 12      (grey, clickable)
Active:    🙌 13      (animated, colored when you've given)
Hover:     🙌 Give a high-five!
```

**Animation:** 
- Hand wave animation on tap
- Count increments with bounce
- Brief confetti burst (subtle)

### 3. Cheer Prompts

Contextual prompts to encourage others:

| Trigger | Prompt |
|---------|--------|
| User near goal | "Mike is 200 steps away from his goal. Send a cheer? 🙌" |
| User broke streak | "Sarah missed yesterday. Send encouragement?" |
| User hit milestone | "Alex just hit a 30-day streak! Celebrate? 🎉" |

**Implementation:**
- Show at top of leaderboard when applicable
- Dismissible (once per day per prompt)
- Track in `localStorage` to avoid spam

### 4. Weekly Encouragement Summary

Show users the encouragement they received:

```
┌────────────────────────────────────────┐
│ 📬 Your Week in High-Fives             │
│                                        │
│ You received 12 high-fives this week!  │
│ From: Sarah (4), Mike (3), Alex (2)... │
│                                        │
│ You gave 8 high-fives.                 │
│ Keep spreading the motivation! 🙌       │
└────────────────────────────────────────┘
```

---

## API Endpoints

### POST /api/high-fives

```typescript
// Request
{ recipient_id: string, league_id: string, for_date?: string, submission_id?: string }

// Response
{ success: true, new_count: 13 }
```

### DELETE /api/high-fives/:id

Remove a high-five (undo).

### GET /api/leagues/[id]/leaderboard

Enhance existing response:
```typescript
{
  leaderboard: [
    {
      user_id: "...",
      high_five_count: 12,        // NEW
      user_has_high_fived: true,  // NEW: Has current user high-fived?
    }
  ]
}
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/migrations/YYYYMMDD_create_high_fives.sql` | **NEW** |
| `src/types/database.ts` | **MODIFY** - Add high_fives type |
| `src/components/social/HighFiveButton.tsx` | **NEW** |
| `src/components/social/CheerPrompt.tsx` | **NEW** |
| `src/components/social/WeeklySummaryCard.tsx` | **NEW** |
| `src/app/api/high-fives/route.ts` | **NEW** |
| `src/app/(dashboard)/league/[id]/leaderboard/page.tsx` | **MODIFY** |

---

## Success Criteria

- [ ] Users can tap to high-five others on leaderboard
- [ ] High-five count shows on leaderboard rows
- [ ] Animation plays on tap
- [ ] Cheer prompts appear for relevant situations
- [ ] Weekly summary shows encouragement received
- [ ] RLS policies prevent abuse (only league members)
- [ ] Mobile-responsive
- [ ] Build passes (`npm run build`)

---

## Proactive Enhancements

### 1. High-Five Streaks

Track consecutive days of giving high-fives:
- "🙌 You've encouraged others 5 days in a row!"
- Gamifies the act of encouragement
- Separate from step streaks

### 2. Most Supportive Member

Weekly recognition for encouragement:
- "Sarah gave the most high-fives this week 🏆"
- Shown in league progress view (PRD 24)
- Encourages positive community behavior

---

## Theme Awareness

All UI components must:
- Use CSS variables (`--background`, `--foreground`, etc.) from PRD 21
- Work in both light and dark modes (PRD 21 Part G)
- Avoid hardcoded colors
- Test in both themes before marking complete
- High-five animations should be visible in both themes

---

## Feature Flag

This feature is gated by `feature_high_fives` (PRD 28):
- Check setting before rendering high-five components
- Gracefully hide if disabled

---

## Out of Scope

- Custom encouragement messages (keep it one-click)
- Direct messaging between users
- Notifications for high-fives (future, requires push infrastructure)
- Gamified high-five badges (future)

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-01-05 | Initial | Created PRD based on external research |
