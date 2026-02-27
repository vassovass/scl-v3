# PRD 32: Admin Analytics Dashboard

> **Order:** 32
> **Status:** 🟨 Partial
> **Type:** Feature
> **Dependencies:** None (feature flags available)
> **Blocks:** None
> **Remaining Scope:** KPI data integration, trend charts, export (UI scaffold exists)
> **Previous:** [PRD 31: Social Encouragement](./PRD_31_Social_Encouragement.md)
> **Next:** [PRD 33: Pricing & How It Works](./PRD_33_Pricing_HowItWorks.md)
> **Phase:** Product Hunt Stage

---

## ⚠️ Agent Context

| File | Purpose |
|------|---------|
| `src/app/admin/analytics/page.tsx` | Existing scaffold — wire KPI data here |
| `src/app/admin/layout.tsx` | Admin layout with tabs |
| `src/app/api/admin/` | Existing admin API routes for pattern reference |
| `src/types/database.ts` | Schema reference for aggregation queries |
| `.claude/skills/supabase-patterns/SKILL.md` | Query patterns, materialized views |
| `.claude/skills/design-system/SKILL.md` | Chart components, KPI cards |
| `.claude/skills/api-handler/SKILL.md` | withApiHandler pattern |

### MCP Servers

| Server | Purpose |
|--------|---------|
| **Supabase MCP** | Create materialized views, verify aggregation queries |
| **GA4 Stape MCP** | Pull analytics reports for comparison with internal data |
| **PostHog MCP** | Dashboard insights, verify admin usage patterns |
| **Playwright MCP** | E2E test admin analytics dashboard |

### Task-Optimized Structure

| Phase | Mode | Task |
|-------|------|------|
| 1 | `[READ-ONLY]` | Audit existing admin analytics scaffold and available data |
| 2 | `[WRITE]` | Create `/api/admin/analytics` route with KPI calculations `[PARALLEL with Phase 3]` |
| 3 | `[WRITE]` | Create materialized view for daily aggregates `[PARALLEL with Phase 2]` |
| 4 | `[WRITE]` | Wire KPI cards with real data `[SEQUENTIAL]` |
| 5 | `[WRITE]` | Add trend charts with Recharts/shadcn `[SEQUENTIAL]` |
| 6 | `[WRITE]` | Add CSV/PDF export `[SEQUENTIAL]` |
| 7 | `[WRITE]` | Write Vitest + Playwright tests `[SEQUENTIAL]` |

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

## 🏗️ Detailed Feature Requirements

### Section A: KPI Integration — 3 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **A-1** | **KPI cards show real data** | Admin sees placeholder dashes | Total users, active rate, avg steps, retention show live values |
| **A-2** | **Period filter works** | No time-range selection | 7d, 30d, 90d filters update all KPIs |
| **A-3** | **League filter works** | Can't see per-league stats | Dropdown filters all data by selected league |

### Section B: Visualizations — 2 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **B-1** | **Participation trend chart** | No visual trend data | Line chart shows daily active users over period |
| **B-2** | **Engagement by league bar chart** | No league comparison view | Bar chart ranks leagues by activity |

### Section C: Export — 2 Items

| # | Outcome | Problem Solved | Success Criteria |
|---|---------|----------------|------------------|
| **C-1** | **CSV export** | Can't export data for HR reports | CSV downloads with filtered data |
| **C-2** | **PDF report** | No polished reports for B2B sales | PDF generates with KPIs and charts |

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

## 📋 Documentation Update Checklist

- [ ] AGENTS.md — Add admin analytics API pattern
- [ ] `supabase-patterns` skill — Add materialized view pattern
- [ ] CHANGELOG.md — Log admin analytics data integration
- [ ] PRD_00_Index.md — Update PRD 32 status to ✅ Complete
- [ ] **Git commit** — Stage all PRD changes, commit with conventional message: `type(scope): PRD 32 — short description`

## 📚 Best Practice References

- **Materialized views:** Use `analytics_daily` materialized view for pre-aggregated stats. Refresh via Supabase cron or on-demand.
- **KPI calculations:** Active rate = users with submission in period / total users. Retention = users active this AND last period.
- **Chart library:** Use shadcn/ui Chart (Recharts wrapper). Responsive by default.
- **Export:** CSV via `papaparse`, PDF via `jsPDF` or server-side generation.

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-01-05 | Initial | Created PRD based on external B2B requirements |
