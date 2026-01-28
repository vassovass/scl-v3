# PRD 54: Advanced Sharing Features

> **Order:** 54
> **Status:** 📋 Proposed
> **Type:** Feature (Enhancement)
> **Dependencies:** PRD 51 (Social Sharing & Stats Hub)
> **Blocks:** None
> **Last Updated:** 2026-01-28

---

## 🎯 Objective

Enhance StepLeague's sharing capabilities to enable more powerful, personalized progress sharing. These features build on the foundation from PRD-51 and unlock the full vision of "sharing progress you can't do elsewhere."

**Core Value:** Make it effortless to share calculated progress over time in ways that default fitness apps can't match.

---

## ⚠️ Agent Context (Mandatory)

| File | Purpose |
|------|---------|
| `src/components/sharing/ShareModal.tsx` | Current share modal implementation |
| `src/app/(dashboard)/my-stats/page.tsx` | Stats Hub with period selection |
| `src/lib/sharing/metricConfig.ts` | Card type and metric configurations |
| `src/lib/utils/periodUtils.ts` | Period calculation utilities |
| `.agent/skills/social-sharing/SKILL.md` | Sharing patterns documentation |

---

## 🏗️ Detailed Feature Requirements

### Section A: Custom Date Range Sharing — 4 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **A-1** | **Date range picker in Share Modal** | Can only share preset periods | Users can select any start/end date |
| **A-2** | **"Custom" period type in Stats Hub** | Limited to today/this week/this month | Full calendar picker exposed |
| **A-3** | **Relative date shortcuts** | Tedious manual date entry | "Last 3 days", "Last 2 weeks" quick picks |
| **A-4** | **Custom range OG image support** | Can't visualize custom periods | OG API accepts date range params |

### Section B: Friend-Specific Challenges — 5 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **B-1** | **Challenge targeting UI** | Challenges are broadcast, not personal | Select specific friend(s) to challenge |
| **B-2** | **Challenge notification system** | No awareness of being challenged | Notify target via in-app + optional email |
| **B-3** | **Challenge acceptance flow** | No formal acceptance | Target can accept/decline challenge |
| **B-4** | **Challenge tracking dashboard** | No visibility on active challenges | See sent/received challenges with status |
| **B-5** | **Challenge resolution** | No winner determination | Auto-compare at period end, declare winner |

### Section C: Progress Trend Visualization — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **C-1** | **Weekly trend chart** | No visual progress over time | Line/bar chart showing last 4-12 weeks |
| **C-2** | **Shareable trend card** | Can't share long-term progress | New "trend" card type with mini-chart |
| **C-3** | **Comparison overlay** | Can't compare two periods visually | Overlay two periods on same chart |

### Section D: Sharing Frequency Encouragement — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **D-1** | **Share streak tracking** | No incentive for regular sharing | Track consecutive days shared |
| **D-2** | **Share frequency insights** | Users don't know their patterns | "You share most on Mondays" |
| **D-3** | **Share reminder nudges** | Forget to share after upload | Optional "Share your day?" prompt |

---

## ✅ Success Criteria

| Metric | Target | Verification |
|--------|--------|--------------|
| Custom date range usage | 20%+ of shares use custom dates | Analytics |
| Challenge completion rate | 50%+ of challenges get response | Database |
| Trend card adoption | 10%+ of shares are trend cards | Analytics |
| Share frequency increase | +25% shares per active user | Analytics |

---

## 📐 Technical Design Considerations

### Custom Date Range

- Extend `getPeriodDates()` in `periodUtils.ts` to handle custom range objects
- Add `DateRangePicker` component (react-day-picker or similar)
- Update OG API to accept `period_start` and `period_end` params
- Cache bust strategy for custom range OG images

### Friend Challenges

- New database table: `challenges`
  ```sql
  challenges (
    id UUID PRIMARY KEY,
    challenger_id UUID REFERENCES users(id),
    target_id UUID REFERENCES users(id),
    metric_type VARCHAR(20) DEFAULT 'steps',
    period_start DATE,
    period_end DATE,
    challenger_value INTEGER,
    target_value INTEGER,
    status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, declined, completed
    winner_id UUID REFERENCES users(id),
    created_at TIMESTAMP,
    resolved_at TIMESTAMP
  )
  ```
- New API routes: `/api/challenges/create`, `/api/challenges/respond`, `/api/challenges/resolve`
- Edge function for auto-resolution at period end

### Trend Visualization

- Use lightweight charting (Recharts or Chart.js)
- Server-side rendering for trend card OG images (complex)
- Consider Vercel OG limitations for dynamic charts

---

## 🚀 Implementation Plan Reference

### Phase 1: Custom Date Ranges (Foundation)
1. Add DateRangePicker component
2. Extend period utilities for custom ranges
3. Update Share Modal with date picker
4. Update OG API for custom periods

### Phase 2: Friend Challenges (Social)
1. Create challenges database table + RLS
2. Build challenge creation flow
3. Implement notification system
4. Add challenge tracking UI
5. Build auto-resolution logic

### Phase 3: Trend Visualization (Delight)
1. Add trend chart component
2. Create trend card type
3. Generate trend OG images
4. Add comparison overlay

### Phase 4: Sharing Encouragement (Retention)
1. Track share frequency
2. Add share streak tracking
3. Implement nudge system

---

## 🔄 Proactive Items

### P-1: Challenge Templates
Pre-made challenge types:
- "Beat my Monday" (specific day)
- "This week's winner" (weekly head-to-head)
- "Personal best challenge" (beat your own record)

### P-2: Challenge Groups
Extend challenges beyond 1:1 to small groups (2-5 people).

### P-3: Shareable Trend GIFs
Animated trends that play in WhatsApp preview.

### P-4: AI-Generated Share Suggestions
Based on your stats, suggest optimal sharing moments:
- "You beat your weekly average! Share it?"
- "3-week improvement streak — worth sharing!"

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-01-28 | Initial | Created advanced sharing features PRD |
