/**
 * Admin Analytics Query Functions
 *
 * Reusable query functions for computing platform KPIs.
 * Used by /api/admin/analytics to aggregate metrics.
 *
 * PRD 32 — Admin Analytics Dashboard
 */

type SupabaseClient = ReturnType<typeof import("@/lib/supabase/server").createAdminClient>;

export interface KPI {
  key: string;
  label: string;
  value: number;
  formatted: string;
  trend: number | null;
  trendLabel: string;
}

export interface TrendPoint {
  date: string;
  activeUsers: number;
  submissions: number;
  avgSteps: number;
}

export interface LeagueRow {
  id: string;
  name: string;
  memberCount: number;
  activeRate: number;
  avgSteps: number;
  submissionRate: number;
}

export type Period = "7d" | "30d" | "90d" | "all";

function getPeriodDates(period: Period): { start: string; end: string; prevStart: string } {
  const now = new Date();
  const end = now.toISOString().split("T")[0];

  const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365;

  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);
  const start = startDate.toISOString().split("T")[0];

  const prevStartDate = new Date(startDate);
  prevStartDate.setDate(prevStartDate.getDate() - days);
  const prevStart = prevStartDate.toISOString().split("T")[0];

  return { start, end, prevStart };
}

function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function computeTrend(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

export async function fetchKPIs(
  adminClient: SupabaseClient,
  period: Period,
  leagueId?: string
): Promise<KPI[]> {
  const { start, end, prevStart } = getPeriodDates(period);

  // Total users (non-proxy)
  const { count: totalUsers } = await adminClient
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("is_proxy", false);

  // Active users this period (users with at least 1 submission)
  let currentActiveQuery = adminClient
    .from("submissions")
    .select("user_id", { count: "exact", head: false })
    .gte("for_date", start)
    .lte("for_date", end);

  if (leagueId) {
    currentActiveQuery = currentActiveQuery.eq("league_id", leagueId);
  }

  const { data: currentActiveData } = await currentActiveQuery;
  const currentActiveUsers = new Set((currentActiveData || []).map((r: any) => r.user_id)).size;

  // Active users previous period (for trend)
  let prevActiveQuery = adminClient
    .from("submissions")
    .select("user_id")
    .gte("for_date", prevStart)
    .lt("for_date", start);

  if (leagueId) {
    prevActiveQuery = prevActiveQuery.eq("league_id", leagueId);
  }

  const { data: prevActiveData } = await prevActiveQuery;
  const prevActiveUsers = new Set((prevActiveData || []).map((r: any) => r.user_id)).size;

  // Average steps this period
  let stepsQuery = adminClient
    .from("submissions")
    .select("steps")
    .gte("for_date", start)
    .lte("for_date", end);

  if (leagueId) {
    stepsQuery = stepsQuery.eq("league_id", leagueId);
  }

  const { data: stepsData } = await stepsQuery;
  const stepsArr = (stepsData || []).map((r: any) => Number(r.steps) || 0);
  const currentAvgSteps = stepsArr.length > 0
    ? stepsArr.reduce((a: number, b: number) => a + b, 0) / stepsArr.length
    : 0;

  // Previous period avg steps
  let prevStepsQuery = adminClient
    .from("submissions")
    .select("steps")
    .gte("for_date", prevStart)
    .lt("for_date", start);

  if (leagueId) {
    prevStepsQuery = prevStepsQuery.eq("league_id", leagueId);
  }

  const { data: prevStepsData } = await prevStepsQuery;
  const prevStepsArr = (prevStepsData || []).map((r: any) => Number(r.steps) || 0);
  const prevAvgSteps = prevStepsArr.length > 0
    ? prevStepsArr.reduce((a: number, b: number) => a + b, 0) / prevStepsArr.length
    : 0;

  // Retention: users active in both periods
  const prevUserIds = new Set((prevActiveData || []).map((r: any) => r.user_id));
  const currentUserIds = new Set((currentActiveData || []).map((r: any) => r.user_id));
  const retainedUsers = [...prevUserIds].filter((id) => currentUserIds.has(id)).length;
  const retentionRate = prevUserIds.size > 0 ? (retainedUsers / prevUserIds.size) * 100 : 0;

  // Streak average from user_records
  const { data: streakData } = await adminClient
    .from("user_records")
    .select("current_streak");

  const streaks = (streakData || []).map((r: any) => Number(r.current_streak) || 0);
  const avgStreak = streaks.length > 0
    ? streaks.reduce((a: number, b: number) => a + b, 0) / streaks.length
    : 0;

  // Submission rate: submissions / (active users * days in period)
  const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365;
  const totalSubmissions = stepsArr.length;
  const submissionRate = currentActiveUsers > 0
    ? (totalSubmissions / (currentActiveUsers * days)) * 100
    : 0;

  const prevTotalSubmissions = prevStepsArr.length;
  const prevSubmissionRate = prevActiveUsers > 0
    ? (prevTotalSubmissions / (prevActiveUsers * days)) * 100
    : 0;

  const activeRate = (totalUsers || 0) > 0
    ? (currentActiveUsers / (totalUsers || 1)) * 100
    : 0;
  const prevActiveRate = (totalUsers || 0) > 0
    ? (prevActiveUsers / (totalUsers || 1)) * 100
    : 0;

  return [
    {
      key: "total_users",
      label: "Total Users",
      value: totalUsers || 0,
      formatted: formatNumber(totalUsers || 0),
      trend: null,
      trendLabel: "all time",
    },
    {
      key: "active_rate",
      label: "Active Rate",
      value: activeRate,
      formatted: formatPercent(activeRate),
      trend: computeTrend(activeRate, prevActiveRate),
      trendLabel: "vs prev period",
    },
    {
      key: "avg_steps",
      label: "Avg Steps",
      value: Math.round(currentAvgSteps),
      formatted: formatNumber(Math.round(currentAvgSteps)),
      trend: computeTrend(currentAvgSteps, prevAvgSteps),
      trendLabel: "vs prev period",
    },
    {
      key: "retention",
      label: "Retention",
      value: retentionRate,
      formatted: formatPercent(retentionRate),
      trend: null,
      trendLabel: "period-over-period",
    },
    {
      key: "avg_streak",
      label: "Avg Streak",
      value: avgStreak,
      formatted: avgStreak.toFixed(1),
      trend: null,
      trendLabel: "current",
    },
    {
      key: "submission_rate",
      label: "Submission Rate",
      value: submissionRate,
      formatted: formatPercent(submissionRate),
      trend: computeTrend(submissionRate, prevSubmissionRate),
      trendLabel: "vs prev period",
    },
  ];
}

export async function fetchTrends(
  adminClient: SupabaseClient,
  period: Period,
  leagueId?: string
): Promise<TrendPoint[]> {
  const { start, end } = getPeriodDates(period);

  let query = adminClient
    .from("submissions")
    .select("for_date, user_id, steps")
    .gte("for_date", start)
    .lte("for_date", end)
    .order("for_date", { ascending: true });

  if (leagueId) {
    query = query.eq("league_id", leagueId);
  }

  const { data } = await query;
  const rows = (data || []) as { for_date: string; user_id: string; steps: number }[];

  // Group by date
  const byDate = new Map<string, { users: Set<string>; steps: number[]; count: number }>();

  for (const row of rows) {
    const existing = byDate.get(row.for_date) || { users: new Set(), steps: [], count: 0 };
    existing.users.add(row.user_id);
    existing.steps.push(Number(row.steps) || 0);
    existing.count += 1;
    byDate.set(row.for_date, existing);
  }

  return Array.from(byDate.entries()).map(([date, data]) => ({
    date,
    activeUsers: data.users.size,
    submissions: data.count,
    avgSteps: data.steps.length > 0
      ? Math.round(data.steps.reduce((a, b) => a + b, 0) / data.steps.length)
      : 0,
  }));
}

export async function fetchLeagueBreakdown(
  adminClient: SupabaseClient,
  period: Period
): Promise<LeagueRow[]> {
  const { start, end } = getPeriodDates(period);

  // Get all active leagues
  const { data: leagues } = await adminClient
    .from("leagues")
    .select("id, name")
    .is("deleted_at", null);

  if (!leagues || leagues.length === 0) return [];

  // Get member counts
  const { data: memberships } = await adminClient
    .from("memberships")
    .select("league_id, user_id");

  // Get submissions in period
  const { data: submissions } = await adminClient
    .from("submissions")
    .select("league_id, user_id, steps")
    .gte("for_date", start)
    .lte("for_date", end);

  const membersByLeague = new Map<string, Set<string>>();
  for (const m of (memberships || []) as { league_id: string; user_id: string }[]) {
    const set = membersByLeague.get(m.league_id) || new Set();
    set.add(m.user_id);
    membersByLeague.set(m.league_id, set);
  }

  const subsByLeague = new Map<string, { users: Set<string>; steps: number[] }>();
  for (const s of (submissions || []) as { league_id: string; user_id: string; steps: number }[]) {
    if (!s.league_id) continue;
    const existing = subsByLeague.get(s.league_id) || { users: new Set(), steps: [] };
    existing.users.add(s.user_id);
    existing.steps.push(Number(s.steps) || 0);
    subsByLeague.set(s.league_id, existing);
  }

  const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365;

  return (leagues as { id: string; name: string }[]).map((league) => {
    const members = membersByLeague.get(league.id) || new Set();
    const subs = subsByLeague.get(league.id) || { users: new Set(), steps: [] };
    const memberCount = members.size;
    const activeUsers = subs.users.size;
    const avgSteps = subs.steps.length > 0
      ? Math.round(subs.steps.reduce((a, b) => a + b, 0) / subs.steps.length)
      : 0;
    const activeRate = memberCount > 0 ? (activeUsers / memberCount) * 100 : 0;
    const submissionRate = activeUsers > 0
      ? (subs.steps.length / (activeUsers * days)) * 100
      : 0;

    return {
      id: league.id,
      name: league.name,
      memberCount,
      activeRate,
      avgSteps,
      submissionRate,
    };
  }).sort((a, b) => b.activeRate - a.activeRate);
}

export function generateCSV(kpis: KPI[], trends: TrendPoint[], leagues: LeagueRow[]): string {
  const lines: string[] = [];

  // KPI Summary
  lines.push("=== Platform KPIs ===");
  lines.push("Metric,Value,Trend");
  for (const kpi of kpis) {
    const trend = kpi.trend !== null ? `${kpi.trend > 0 ? "+" : ""}${kpi.trend.toFixed(1)}%` : "N/A";
    lines.push(`"${kpi.label}","${kpi.formatted}","${trend}"`);
  }

  lines.push("");

  // Trends
  lines.push("=== Daily Trends ===");
  lines.push("Date,Active Users,Submissions,Avg Steps");
  for (const point of trends) {
    lines.push(`${point.date},${point.activeUsers},${point.submissions},${point.avgSteps}`);
  }

  lines.push("");

  // League breakdown
  lines.push("=== League Breakdown ===");
  lines.push("League,Members,Active Rate,Avg Steps,Submission Rate");
  for (const league of leagues) {
    lines.push(
      `"${league.name}",${league.memberCount},${league.activeRate.toFixed(1)}%,${league.avgSteps},${league.submissionRate.toFixed(1)}%`
    );
  }

  return lines.join("\n");
}
