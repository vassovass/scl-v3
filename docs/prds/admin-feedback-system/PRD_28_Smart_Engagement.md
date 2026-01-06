# PRD 28: Smart Engagement & Notifications

> **Order:** 28 of 36
> **Previous:** [PRD 27: League Hub](./PRD_27_League_Hub.md)
> **Next:** [PRD 29: Unified Progress](./PRD_29_Unified_Progress.md)
> **Prioritized By:** User Request (2026-01-05) - "Smart Missed Day Prompt"
> **Status:** 📋 Proposed
> **Includes:** Formerly "PRD 25 Smart Step Reminder"
> **Depends on:** PRD 25 (User Prefs for notification settings)

---

## ⚠️ Agent Instructions (MANDATORY)

1. **Read `AGENTS.md`**.
2. **Read `src/app/(dashboard)/dashboard/page.tsx`**.
3. **Goal**: Proactive engagement to prevent churn.

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

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-01-05 | Initial | Created PRD for Smart Engagement (incorporating Missed Day logic) |
