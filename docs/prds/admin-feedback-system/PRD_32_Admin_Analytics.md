# PRD 32: Admin Analytics Dashboard

> **Order:** 32 of 36
> **Previous:** [PRD 31: Social Encouragement](./PRD_31_Social_Encouragement.md)
> **Next:** [PRD 33: Pricing & How It Works](./PRD_33_Pricing_HowItWorks.md)
> **Depends on:** PRD 26 (feature flags)
> **Status:** 📋 Proposed
> **Phase:** Product Hunt Stage

---

## ⚠️ Agent Instructions (MANDATORY)

Before starting work on this PRD, the implementing agent MUST:

1. **Read these files for context:**
   - `AGENTS.md` - Critical rules, patterns, and documentation requirements
   - `src/app/admin/` - Existing admin pages (kanban, feedback)
   - `src/types/database.ts` - Existing tables
   - PRD 21 for shadcn charts components

2. **Follow documentation rules:**
   - Update `CHANGELOG.md` with all changes
   - Use date format `YYYY-MM-DD` (current year is 2026)

3. **After completion:**
   - Commit with message format: `feat(PRD-32): Brief description`
   - Mark this PRD as done on the Kanban board

---

## Problem Statement

**B2B Need:** HR managers evaluating wellness programs need proof of ROI.

**Current:** StepLeague has no way to generate reports for:
- Sales conversations
- Client success meetings
- Internal ops monitoring

**Stats that matter to HR:**
- 91% of HR leaders report decreased healthcare costs from wellness programs
- They need metrics to justify budget approval

---

## Outcome

Add "Analytics" tab to existing admin panel with:
1. **KPI summary cards** - Key metrics at a glance
2. **Trend charts** - Participation over time
3. **Data tables** - Exportable user/team data
4. **PDF reports** - Polished reports for B2B sales

---

## What is Needed

### 1. Analytics Tab in Admin Panel

```
Admin Panel Tabs:
[Dashboard] [Kanban] [Feedback] [Analytics ★NEW] [Design System]
```

### 2. Analytics Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ Analytics Dashboard                                                  │
│ ┌──────────────────────────────────────────────────────────────────┐│
│ │ League: [All Leagues ▼]  Period: [Last 30 Days ▼]  [Export ▼]    ││
│ └──────────────────────────────────────────────────────────────────┘│
│                                                                      │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐        │
│ │ Total Users │ │ Active Rate │ │ Avg Steps   │ │ Retention  │        │
│ │   1,245     │ │    73.2%    │ │   8,234     │ │   89.1%    │        │
│ │  ↑ 12.3%    │ │  ↑ 5.2%     │ │  ↑ 8.1%     │ │  ↓ 2.1%    │        │
│ └────────────┘ └────────────┘ └────────────┘ └────────────┘        │
│                                                                      │
│ ┌─────────────────────────────┐ ┌─────────────────────────────────┐ │
│ │ Participation Trend (Line)  │ │ Engagement by League (Bar)      │ │
│ └─────────────────────────────┘ └─────────────────────────────────┘ │
```

### 3. KPI Summary Cards

**Metrics to display:**

| Metric | Calculation | Target |
|--------|-------------|--------|
| Total Users | COUNT(DISTINCT user_id) | Growth |
| Active Rate | Users with submission in period / Total users | 60%+ |
| Avg Steps | SUM(steps) / COUNT(submissions) | 8,000+ |
| Retention | Users active this period who were active last period | 80%+ |
| Streak Average | AVG(current_streak) for active users | 7+ days |
| Submission Rate | Submissions / Expected submissions | 80%+ |

### 4. Trend Charts (Recharts via shadcn)

Use shadcn's Chart component (built on Recharts).

### 5. Data Tables with Export

Using TanStack Table pattern:
- **Export formats:** CSV (papaparse), PDF (jsPDF)

### 6. Materialized View for Performance

Create `analytics_daily` materialized view for pre-aggregated stats.

### 7. PDF Report Generation

Auto-generate polished PDF reports for B2B.

---

## API Endpoints

### GET /api/admin/analytics

```typescript
// Query params
?period=30d | 7d | 90d | custom
&league_id=optional

// Response
{ kpis: {...}, trends: [...], leagues: [...] }
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/migrations/YYYYMMDD_create_analytics_views.sql` | **NEW** |
| `src/app/admin/analytics/page.tsx` | **NEW** |
| `src/components/admin/analytics/KPICard.tsx` | **NEW** |
| `src/components/admin/analytics/TrendChart.tsx` | **NEW** |
| `src/components/admin/analytics/LeagueTable.tsx` | **NEW** |
| `src/app/api/admin/analytics/route.ts` | **NEW** |
| `src/lib/pdf-generator.ts` | **NEW** |

---

## Verification Checklist

> **IMPORTANT:** After implementation, verify at these specific locations.

### Frontend Checks

| Check | URL/Location | Expected Result |
|-------|--------------|-----------------|
| Dashboard visible | `/admin/analytics` | KPIs and charts load |
| Filter by League | Dropdown | Data updates for specific league |
| Export CSV | Click Export | CSV file downloads with data |
| Export PDF | Click PDF | PDF report generates properly |
| Mobile view | Mobile viewport | Charts stack, tables scroll |

### Backend Checks

| Check | Method | Expected Result |
|-------|--------|-----------------|
| API Data | `GET /api/admin/analytics` | Returns JSON with correct usage stats |
| View refresh | SQL | `refresh_analytics_daily()` updates data |
| RLS check | API as user | Returns 403 Forbidden |

### Documentation Checks

- [ ] CHANGELOG.md updated
- [ ] AGENTS.md updated

---

## Feature Flag

Analytics export is gated by `feature_analytics_export` (PRD 26).

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-01-05 | Initial | Created PRD based on external B2B requirements |
