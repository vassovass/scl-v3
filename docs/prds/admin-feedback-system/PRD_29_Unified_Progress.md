# PRD 29: Unified Progress View

> **Order:** 29
> **Status:** 📋 Proposed
> **Type:** Feature
> **Dependencies:** None (analytics routes exist)
> **Blocks:** None
> **Previous:** [PRD 28: Smart Engagement](./PRD_28_Smart_Engagement.md)
> **Next:** [PRD 30: Duplicate Submissions](./PRD_30_Duplicate_Resolution.md)

---

## ⚠️ Agent Context

| File | Purpose |
|------|---------|
| `src/app/(dashboard)/analytics/page.tsx` | Current page — replace with unified progress |
| `src/app/(dashboard)/league/[id]/leaderboard/page.tsx` | Existing leaderboard content to merge |
| `src/app/api/analytics/route.ts` | Existing API — fix and extend |
| `src/components/dashboard/` | Existing dashboard components for pattern reference |
| `.claude/skills/design-system/SKILL.md` | CSS variables, chart patterns, shadcn/ui |
| `.claude/skills/architecture-philosophy/SKILL.md` | Modular design principles |
| `.claude/skills/analytics-tracking/SKILL.md` | Event tracking for page views |

### MCP Servers

| Server | Purpose |
|--------|---------|
| **Supabase MCP** | Query progress data, verify API responses |
| **GA4 Stape MCP** | Verify page view tracking on new route |
| **PostHog MCP** | Track user journey through progress views |
| **Playwright MCP** | E2E test progress page, toggle, charts |

### Task-Optimized Structure

| Phase | Mode | Task |
|-------|------|------|
| 1 | `[READ-ONLY]` | Audit analytics routes and existing leaderboard components |
| 2 | `[WRITE]` | Fix and extend `/api/analytics` route `[PARALLEL with Phase 3]` |
| 3 | `[WRITE]` | Create `ProgressToggle`, `StepBankCard`, `ComparisonChart` components `[PARALLEL with Phase 2]` |
| 4 | `[WRITE]` | Rename route from `/analytics` to `/progress`, update menu config `[SEQUENTIAL]` |
| 5 | `[WRITE]` | Wire components with data fetching and empty states `[SEQUENTIAL]` |
| 6 | `[WRITE]` | Write Vitest + Playwright tests `[SEQUENTIAL]` |

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

## ✅ Success Criteria

| Metric | Target | Verification Method |
|--------|--------|---------------------|
| Menu renamed | "My Progress" in all menus | Visual check + Playwright E2E |
| Page load | < 1s (fix API performance) | Lighthouse audit |
| Toggle works | Switches between Personal and Social | Playwright click test |
| Empty state | Graceful for new users | Vitest with empty data |
| Mobile responsive | Charts work on mobile | Playwright mobile viewport |

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

## 📋 Documentation Update Checklist

- [ ] AGENTS.md — Add progress view pattern, update menu reference
- [ ] `design-system` skill — Add chart/toggle component patterns
- [ ] CHANGELOG.md — Log progress view feature
- [ ] PRD_00_Index.md — Update PRD 29 status to ✅ Complete
- [ ] **Git commit** — Stage all PRD changes, commit with conventional message: `type(scope): PRD 29 — short description`

## 📚 Best Practice References

- **Charts:** Use shadcn/ui Chart component (built on Recharts). Mobile-first: stack charts vertically.
- **Toggle UX:** Use a segmented control (tab-like), not a checkbox. Active state clearly visible.
- **Empty states:** Never show empty charts. Show "Submit your first steps to see progress here" with CTA.
- **Gamification:** "Step Bank" concept makes lifetime totals feel like earned currency.

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-01-05 | Initial | Created PRD for Unified Progress View |
