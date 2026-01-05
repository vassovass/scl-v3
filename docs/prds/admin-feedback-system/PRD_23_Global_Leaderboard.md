# PRD 23: Global Leaderboard & Metagame

> **Order:** 23 of 33
> **Previous:** [PRD 22: PWA & Offline Support](./PRD_22_PWA_Offline.md)
> **Next:** [PRD 24: Smart Engagement](./PRD_24_Smart_Engagement.md)
> **Prioritized By:** User Request (2026-01-05) - "Unfinished Items"
> **Status:** 📋 Proposed

---

## ⚠️ Agent Instructions (MANDATORY)

1. **Read `AGENTS.md`** - Mobile-first, strict error handling, documentation rules.
2. **Context**: We now have "Global Submissions" (`league_id` is null).
3. **Update**: `CHANGELOG.md` and `ROADMAP.md` upon completion.

---

## Problem Statement

**Current:**
- Users can submit steps globally.
- But they can only see their rank *within specific leagues*.
- There is no platform-wide sense of competition or "Hall of Fame".
- Leagueless users have no leaderboard to look at.

**Goal:**
- Create a **Global Leaderboard** page accessible to everyone.
- Add **Meta-Achievements** that span across all leagues (lifetime stats).

---

## Outcome

1.  **Global Leaderboard Page** (`/leaderboard/global` or `/global`):
    - Shows top users across the entire platform.
    - Filters: All Time, This Year, This Month.
    - Opt-out option for privacy (in settings).
2.  **Meta-Achievements**:
    - "Million Step Club"
    - "365 Day Streak" (Platform-wide)
    - "League Hopper" (Joined 3+ leagues)
3.  **Profile Stats**:
    - User profile shows "Global Rank" explicitly.

---

## Technical Specifications

### 1. Global Leaderboard API (`/api/leaderboard/global`)

- Similar to existing `/api/leaderboard`, but:
  - `league_id` filter is REMOVED.
  - Queries `submissions` table directly for aggregated stats.
  - Respects "Public Visibility" setting (`users.is_public`).

```typescript
// Response Schema
{
  leaderboard: [
    { rank: 1, user_id: "...", display_name: "...", total_steps: 1500000, ... }
  ],
  user_rank: { rank: 450, ... } // Current user's standing
}
```

### 2. Privacy & Public Visibility Settings

> **User Rule (Freemium Model):**
> - **Free Users**: ALWAYS Public on Global Leaderboard (Default `true`, no toggle?).
> - **Paid/Private League Users**: Can toggle visibility.
> - *Current Implementation*: For now, default EVERYONE to `true` (Public). Add the "Privacy Toggle" as a locked/future feature UI or just keep it simple for now (everyone public).

- **Settings Integration**:
  - `is_public_global`: Boolean. (Default `true`).
  - *Future*: If user upgrade, allow toggling to `false`.
- **UI**:
  - Show "Global Visibility: ON" in settings.
  - If user aligns cursor to toggle OFF -> Tooltip: "Privacy features are available in Premium/Private Leagues."
  - "Ghost Mode" indicator reserved for future.

### 3. UI Implementation

- **New Page**: `src/app/(dashboard)/leaderboard/page.tsx` (Global)
  - Or switch within existing leaderboard page?
  - Better: `/leaderboard` is Global. `/league/[id]/leaderboard` is League.
- **Components**: Reuse `LeaderboardTable` but without league-specific columns if any.

### 4. Cross-League "Meta" Achievements

- Define new Badges in `badges.ts`.
- Calculate on-the-fly or via nightly cron job?
  - On-the-fly (`user_records` table already has `total_steps_lifetime`).
- Triggers:
  - Update `user_records` on every submission (already done?).
  - Check milestones after submission.

---

## Implementation Steps

1.  **Backend**: Verify `user_records` tracks GLOBAL lifetime steps correctly (it should).
2.  **API**: Create `/api/leaderboard/global` endpoint.
3.  **Frontend**: Create Global Leaderboard page.
4.  **Achievements**: Add visual display for "Lifetime Steps" milestones on Profile/Dashboard.
5.  **Settings**: Add privacy toggle.

---

## Requirements Checklist

- [ ] `/leaderboard` (or similar) displays platform-wide rankings.
- [ ] Users can opt-out of global leaderboard.
- [ ] Lifetime steps are accurate and aggregated from all leagues (and leagueless).
- [ ] Implementation uses `withApiHandler` and `AppError`.

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-01-05 | Initial | Created PRD for Global Leaderboard features |
