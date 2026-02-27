# PRD 28: Smart Engagement & Notifications

> **Order:** 28
> **Status:** 🟨 Partial
> **Type:** Feature
> **Dependencies:** PRD 25 (User Prefs for notification settings)
> **Blocks:** None
> **Remaining Scope:** Missed-day prompt UI, streak warning component (streak freeze already done)
> **Previous:** [PRD 27: League Hub](./PRD_27_League_Hub.md)
> **Next:** [PRD 29: Unified Progress](./PRD_29_Unified_Progress.md)
> **Prioritized By:** User Request (2026-01-05) - "Smart Missed Day Prompt"
> **Includes:** Formerly "PRD 25 Smart Step Reminder"

---

## ⚠️ Agent Context

| File | Purpose |
|------|---------|
| `src/app/(dashboard)/dashboard/page.tsx` | Dashboard — add missed-day prompt here |
| `src/app/(dashboard)/submit-steps/page.tsx` | Submit page — accept `?date=` query param |
| `src/lib/appSettings.ts` | Contains streak freeze settings (already done) |
| `src/types/database.ts` | User preferences schema |
| `.claude/skills/design-system/SKILL.md` | CSS variables, component patterns |
| `.claude/skills/supabase-patterns/SKILL.md` | Data fetching patterns |
| `.claude/skills/analytics-tracking/SKILL.md` | Track engagement events |

### MCP Servers

| Server | Purpose |
|--------|---------|
| **Supabase MCP** | Query submission history for missed days |
| **PostHog MCP** | Verify engagement funnel events |
| **Playwright MCP** | E2E test missed-day prompt flow |

### Task-Optimized Structure

| Phase | Mode | Task |
|-------|------|------|
| 1 | `[READ-ONLY]` | Audit existing streak freeze code and dashboard layout |
| 2 | `[WRITE]` | Create `MissedDayCard` component `[PARALLEL with Phase 3]` |
| 3 | `[WRITE]` | Create `StreakWarning` component `[PARALLEL with Phase 2]` |
| 4 | `[WRITE]` | Add `?date=` query param support to submit page `[SEQUENTIAL]` |
| 5 | `[WRITE]` | Wire components into dashboard with visibility logic `[SEQUENTIAL]` |
| 6 | `[WRITE]` | Write Vitest + Playwright tests `[SEQUENTIAL]` |

---

## Problem Statement

**Current:**
- Dashboard is passive. It shows data but doesn't "nudge".
- Users often forget to submit for *Yesterday* if they missed the window.
- Streaks break silently.

**Goal:**
- **Smart Missed Day Prompt**: "You didn't submit for Yesterday (Tuesday). Do you want to submit now?"
- **Streak Protection Messaging**: Warn users when a streak is at risk.
- **Encouragement**: Celebrate milestones proactively.

---

## Outcome

1.  **Dashboard "Missed Day" Alert**:
    - Top of dashboard (or floating).
    - Checks if `yesterday` has a submission. If not -> Prominent CTA "Submit for Yesterday".
    - One-click access to Submit Form with `date` pre-filled.
2.  **Streak Warnings**:
    - "🔥 5 Day Streak at Risk!" (Evening/Night warning).
    - Depends on current time (Client-side check).
3.  **Streak Freeze System** (Optional/Future): Allow "freezing" a streak.

---

## Technical Specifications

### 1. Logic via `useEngagement` Hook

```typescript
const { misseddays, riskLevel } = useEngagement(userSubmissions);

// Logic:
// 1. Check user timezone date.
// 2. Check submissions for Today and Yesterday.
// 3. If Yesterday missing => return prompt data.
```

### 2. UI Components

- `MissedDayCard.tsx`:
  - "Constructive" tone: "Keep your history complete! Log yesterday's steps."
  - Action: Opens `SubmitSteps` modal/page with `date={yesterday}`.

- `StreakWarning.tsx`:
  - Appears after 6 PM local time if no submission today.
  - "Don't break the chain!"

### 3. Backend Support

- API needs to return `submission_history` efficiently (already does via `leaderboard` or `submissions` endpoints).
- Ensure `for_date` logic handles timezones correctly (store YYYY-MM-DD).

---

## Implementation Steps

1.  **Frontend Hook**: Implement `useEngagement` to analyze local history vs current date.
2.  **Dashboard UI**: Insert `MissedDayCard` at top of Dashboard feed.
3.  **Submit Page**: Ensure it accepts a `?date=YYYY-MM-DD` query param to pre-fill the form.
4.  **Notifications**: (Browser Notification API?) - "Submit your steps!" (Opt-in).

---

## Requirements Checklist

- [ ] Dashboard prompts for "Yesterday" if missing.
- [ ] Submit page enables pre-filling date via URL.
- [ ] "Streak at Risk" warning in evening.
- [ ] Mobile-responsive and dismissible.

---

## 🏗️ Detailed Feature Requirements

### Section A: Missed Day Prompt — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **A-1** | **Dashboard shows missed day card** | Users forget to submit for yesterday | Card appears if yesterday has no submission |
| **A-2** | **One-click submit for missed day** | Extra clicks to submit for past date | Card links to `/submit-steps?date=YYYY-MM-DD` |
| **A-3** | **Card is dismissible** | Persistent prompts annoy users | Dismiss button hides card for session |

### Section B: Streak Protection — 2 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **B-1** | **Evening streak warning** | Streaks break silently | Warning shown after 6PM local if no today submission |
| **B-2** | **Streak freeze already implemented** | Users need forgiveness for missed days | ✅ DONE — in `appSettings.ts` and `user_preferences` |

---

## Verification Checklist

> **IMPORTANT:** After implementation, verify at these specific locations.

### Frontend Checks

| Check | URL/Location | Expected Result |
|-------|--------------|-----------------|
| Missed day prompt | `/dashboard` | Shows card if yesterday missing |
| Pre-fill date | `/submit?date=2026-01-05` | Form shows 2026-01-05 |
| Streak warning | `/dashboard` | Shows if >6pm & no submit |
| Dismiss works | Click dismiss | Card disappears |

### Code Checks

| Check | Command | Expected Result |
|-------|---------|-----------------|
| Timezone logic | Manual test | Uses local time not UTC |
| Hook performance | `useEngagement` | Only runs on mount/data change |

### Documentation Checks

- [ ] CHANGELOG.md updated

---

## 📋 Documentation Update Checklist

- [ ] AGENTS.md — Add missed-day prompt pattern
- [ ] `design-system` skill — Add engagement card component pattern
- [ ] CHANGELOG.md — Log engagement features
- [ ] PRD_00_Index.md — Update PRD 28 status to ✅ Complete
- [ ] **Git commit** — Stage all PRD changes, commit with conventional message: `type(scope): PRD 28 — short description`

## 📚 Best Practice References

- **Timezone handling:** Always use client-side timezone for "today" and "yesterday" checks. Store dates as `YYYY-MM-DD`.
- **Nudge UX:** Use constructive, encouraging tone — never guilt. "Keep your history complete!" not "You missed a day!"
- **Dismissibility:** All notification-style UI must be dismissible. Persist dismiss state per session (not permanently).

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-01-05 | Initial | Created PRD for Smart Engagement (incorporating Missed Day logic) |
