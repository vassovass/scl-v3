# PRD 29: Unified Progress View

> **Order:** 29 of 36
> **Previous:** [PRD 28: Smart Engagement](./PRD_28_Smart_Engagement.md)
> **Next:** [PRD 30: Duplicate Submissions](./PRD_30_Duplicate_Resolution.md)
> **Depends on:** PRD 27 (hub tabs)
> **Status:** 📋 Proposed

---

## ⚠️ Agent Instructions (MANDATORY)

Before starting work on this PRD, the implementing agent MUST:

1. **Read these files for context:**
   - `AGENTS.md` - Critical rules, patterns, and documentation requirements
   - `src/app/(dashboard)/analytics/page.tsx` - Current broken page (to be replaced)
   - `src/app/(dashboard)/league/[id]/leaderboard/page.tsx` - Existing content to merge
   - `src/app/api/analytics/route.ts` - Existing flawed API (to be fixed)

2. **Follow documentation rules:**
   - Update `CHANGELOG.md` with all changes
   - Use date format `YYYY-MM-DD` (current year is 2026)

3. **After completion:**
   - Commit with message format: `feat(PRD-29): Brief description`
   - Mark this PRD as done on the Kanban board

---

## Problem Statement

**Current:**
1. Confusing menu items: "Analytics" (broken) vs "Leaderboard" (separate)
2. "Analytics" shows empty graphs for new users
3. Users click "Analytics" expecting to see *all* their leagues, but it's unclear
4. "Leaderboard" is siloed per league

**Needed:** A unified "Progress" view that combines personal growth with social context (league stance).

---

## Outcome

Rename "Analytics" to **"My Progress"**.
- Default landing is **Personal** (your steps, streak, milestones).
- Toggle to **League** (where you stand vs others).
- Accessible from global menu OR League Hub.

---

## Proposed UI Logic

**Dual View Toggle:**
```
[ My Progress ] [ League Progress ]
```

### View 1: My Progress (Personal)
- **Top:** "Step Bank" (Total lifetime steps - Gamified "Currency")
- **Chart:** 30-day activity trend (steps vs goal)
- **Streak:** Detailed streak history and current status
- **Milestones:** "Next Badge: 40% complete"

### View 2: League Progress (Social)
- **Top:** Your Rank in League X (Big number)
- **Chart:** You vs League Average (Trend line comparison)
- **Table:** Simplified leaderboard (Top 3 + You + Neighbors)
- **Context:** "You are 2,400 steps ahead of Sarah"

---

## Technical Changes

### 1. Rename & Route Update
- Rename `src/app/(dashboard)/analytics` to `src/app/(dashboard)/progress`
- Update `menuConfig.ts` labels: "Analytics" -> "My Progress"

### 2. Unified API Endpoint
- Fix `GET /api/analytics`:
  - Currently broken (500 errors often).
  - Must return `history` (days), `lifetime_total`, `streak_current`, `badge_progress`.
  - Add `comparison_mode` parameter (user vs league average).

### 3. Progress Components
- `ProgressChart.tsx`: Use existing Recharts but with "You vs Average" support.
- `MilestoneCard.tsx`: Visual progress bar towards next badge.
- `StepBankCard.tsx`: "1,240,000 Lifetime Steps" (Gamified text).

---

## What is Needed

### 1. Page Refactor
Refactor `src/app/(dashboard)/analytics/page.tsx` to:
- Accept `?view=personal|league` query param.
- Accept `?league_id=...` param (optional context).
- Render `ProgressToggle` component.

### 2. New Components
- `src/components/progress/ProgressToggle.tsx`
- `src/components/progress/StepBankCard.tsx`
- `src/components/progress/ComparisonChart.tsx`

---

## Success Criteria

- [ ] "Analytics" renamed to "My Progress" in all menus
- [ ] Page loads in < 1s (fix API performance)
- [ ] Toggle switches between Personal and Social views
- [ ] Charts handle empty data states gracefully (New User Onboarding)
- [ ] Mobile-responsive charts

---

## Proactive Enhancements

### 1. Sparklines in Menu available
- Show tiny sparkline next to "My Progress" in desktop sidebar (if possible with shadcn).

### 2. Shareable Progress Card
- "Share Report" button generates an image (or copyable text) of your weekly summary.

---

## Theme Awareness

All UI components must:
- Use CSS variables (`--background`, `--foreground`, etc.) from PRD 21
- Work in both light and dark modes (PRD 21 Part G)
- Avoid hardcoded colors
- Test in both themes before marking complete

---

## Verification Checklist

> **IMPORTANT:** After implementation, verify at these specific locations.

### Frontend Checks

| Check | URL/Location | Expected Result |
|-------|--------------|-----------------|
| Page loads | `/progress` | Progress UI visible, no 500 error |
| Rename complete | Sidebar menu | "My Progress" shown (not "Analytics") |
| Chart renders | `/progress` | Chart visible with data points |
| Comparison toggle | Click "League Progress" | Chart updates to show avg comparison |
| Empty state | New user account | "No data yet" friendly message |

### Backend Checks

| Check | Method | Expected Result |
|-------|--------|-----------------|
| API Route | `GET /api/analytics` | Returns JSON status 200 |
| Data integrity | Compare DB vs API | Totals match actual simple sum |

### Documentation Checks

- [ ] CHANGELOG.md updated
- [ ] AGENTS.md updated

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-01-05 | Initial | Created PRD for Unified Progress View |
