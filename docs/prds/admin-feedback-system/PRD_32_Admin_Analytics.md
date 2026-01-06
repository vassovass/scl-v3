# PRD 28: Admin Analytics Dashboard

> **Order:** 28 of 30  
> **Previous:** [PRD 27: Social Encouragement](./PRD_27_Social_Encouragement.md)  
> **Next:** [PRD 29: B2B Landing](./PRD_29_B2B_Landing.md)  
> **Depends on:** PRD 23 (feature flags)  
> **Status:** 📋 Proposed

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
   - Commit with message format: `feat(PRD-27): Brief description`
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
│                                                                      │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Top Performing Leagues                                [Export]   │ │
│ │ League Name   | Members | Avg Steps | Participation | Actions   │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### 3. KPI Summary Cards

```tsx
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"

interface KPICardProps {
  title: string;
  value: string | number;
  change: number; // % vs previous period
  changeDirection: 'up' | 'down' | 'neutral';
}
```

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

Use shadcn's Chart component (built on Recharts):

```tsx
import { LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

// Participation trend
<LineChart data={participationData}>
  <XAxis dataKey="date" />
  <YAxis />
  <Tooltip />
  <Line type="monotone" dataKey="activeUsers" stroke="hsl(var(--primary))" />
  <Line type="monotone" dataKey="submissions" stroke="hsl(var(--muted-foreground))" />
</LineChart>
```

### 5. Data Tables with Export

Using TanStack Table pattern:

```tsx
const columns = [
  { accessorKey: 'league_name', header: 'League' },
  { accessorKey: 'member_count', header: 'Members' },
  { accessorKey: 'avg_steps', header: 'Avg Steps' },
  { accessorKey: 'participation_rate', header: 'Participation' },
];
```

**Export formats:**
- CSV (using `papaparse`)
- PDF (using `jsPDF` + `jspdf-autotable`)

### 6. Materialized View for Performance

```sql
-- Create materialized view for daily aggregates
CREATE MATERIALIZED VIEW analytics_daily AS
SELECT 
  DATE(s.for_date) as date,
  s.league_id,
  l.name as league_name,
  COUNT(DISTINCT s.user_id) as active_users,
  COUNT(*) as submission_count,
  SUM(s.steps) as total_steps,
  AVG(s.steps)::INTEGER as avg_steps,
  (SELECT COUNT(*) FROM memberships m WHERE m.league_id = s.league_id) as total_members
FROM submissions s
JOIN leagues l ON l.id = s.league_id
WHERE s.for_date >= NOW() - INTERVAL '90 days'
GROUP BY DATE(s.for_date), s.league_id, l.name;

-- Create unique index for refresh
CREATE UNIQUE INDEX analytics_daily_idx ON analytics_daily(date, league_id);

-- Refresh function (call via Edge Function or pg_cron)
CREATE OR REPLACE FUNCTION refresh_analytics_daily()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_daily;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 7. PDF Report Generation

```typescript
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const generatePDFReport = async (data: ReportData) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text('StepLeague Analytics Report', 20, 20);
  doc.setFontSize(12);
  doc.text(`Period: ${data.period}`, 20, 30);
  
  // KPIs
  doc.text(`Active Users: ${data.activeUsers}`, 20, 50);
  doc.text(`Average Steps: ${data.avgSteps}`, 20, 60);
  doc.text(`Participation Rate: ${data.participationRate}%`, 20, 70);
  
  // Table
  autoTable(doc, {
    head: [['League', 'Members', 'Avg Steps', 'Participation']],
    body: data.leagues.map(l => [l.name, l.members, l.avgSteps, `${l.rate}%`]),
    startY: 90,
  });
  
  doc.save(`stepleague-report-${new Date().toISOString().split('T')[0]}.pdf`);
};
```

---

## API Endpoints

### GET /api/admin/analytics

```typescript
// Query params
?period=30d | 7d | 90d | custom
&start_date=2026-01-01
&end_date=2026-01-31
&league_id=optional

// Response
{
  kpis: {
    total_users: 1245,
    active_rate: 73.2,
    avg_steps: 8234,
    retention_rate: 89.1,
  },
  trends: [
    { date: "2026-01-01", active_users: 120, submissions: 450 },
    ...
  ],
  leagues: [
    { id, name, member_count, avg_steps, participation_rate },
    ...
  ]
}
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

## Dependencies

| Package | Purpose |
|---------|---------|
| `recharts` | Charts (already in shadcn) |
| `@tanstack/react-table` | Data tables |
| `papaparse` | CSV export |
| `jspdf` | PDF generation |
| `jspdf-autotable` | PDF tables |

---

## Success Criteria

- [ ] Analytics tab visible in admin panel
- [ ] KPI cards show with trend indicators
- [ ] Line chart shows participation over time
- [ ] Data table is sortable/filterable
- [ ] CSV export works
- [ ] PDF report generates correctly
- [ ] Materialized view refreshes (manual or scheduled)
- [ ] SuperAdmin-only access (RLS)
- [ ] Mobile-responsive
- [ ] Build passes (`npm run build`)

---

## Proactive Enhancements

### 1. Scheduled Email Reports

Auto-send weekly digest to SuperAdmin:
- Every Monday at 9am (configurable)
- Summary of key metrics vs previous week
- Top/bottom performing leagues highlighted
- Uses existing email infrastructure

### 2. Period Comparison Mode

Compare two periods side-by-side:
- "This Week vs Last Week" toggle
- Charts overlay both periods
- Delta indicators (+/-) for each KPI

---

## Theme Awareness

All UI components must:
- Use CSS variables (`--background`, `--foreground`, etc.) from PRD 21
- Work in both light and dark modes (PRD 21 Part G)
- Avoid hardcoded colors
- Charts use `hsl(var(--primary))` theme-aware colors
- PDF exports should default to light theme for print

---

## Feature Flag

Analytics export is gated by `feature_analytics_export` (PRD 28):
- Check setting before showing export buttons
- Can be disabled for non-enterprise users

---

## Out of Scope

- Real-time dashboards (batch is fine)
- Per-user detailed analytics (privacy)
- Custom report builder
- Scheduled email reports

---

## Future Enhancements (B2B)

- Client-facing analytics portal
- White-labeled PDF reports
- Scheduled refresh via Edge Function
- Import capabilities for B2B onboarding

---

## Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-01-05 | Initial | Created PRD based on external B2B requirements |
