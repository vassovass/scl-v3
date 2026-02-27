"use client";

import { useState, useEffect, useCallback } from "react";
import {
  KPICard,
  PeriodFilter,
  TrendChart,
  LeagueTable,
  ExportButton,
} from "@/components/admin/analytics";
import {
  BarChart3,
  Users,
  Trophy,
  TrendingUp,
  Activity,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import type { KPI, TrendPoint, LeagueRow } from "@/lib/admin/analyticsQueries";

/**
 * Analytics Overview Page
 *
 * Main hub for admin analytics per PRD 32.
 * Displays real KPIs, trend charts, league breakdown, and CSV export.
 */

const kpiIcons: Record<string, React.ReactNode> = {
  total_users: <Users className="h-4 w-4" />,
  active_rate: <TrendingUp className="h-4 w-4" />,
  avg_steps: <Activity className="h-4 w-4" />,
  retention: <BarChart3 className="h-4 w-4" />,
  avg_streak: <Calendar className="h-4 w-4" />,
  submission_rate: <Trophy className="h-4 w-4" />,
};

export default function AnalyticsOverviewPage() {
  const [period, setPeriod] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [leagueBreakdown, setLeagueBreakdown] = useState<LeagueRow[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?period=${period}`);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const data = await res.json();
      setKpis(data.kpis || []);
      setTrends(data.trends || []);
      setLeagueBreakdown(data.leagueBreakdown || []);
    } catch {
      // Structured logging handles server errors
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      {/* Header with period filter and export */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">Platform Overview</h2>
        <div className="flex items-center gap-3">
          <PeriodFilter value={period} onChange={setPeriod} />
          <ExportButton period={period} />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <KPICard key={i} label="" value="" loading={true} />
            ))
          : kpis.map((kpi) => (
              <KPICard
                key={kpi.key}
                label={kpi.label}
                value={kpi.formatted}
                trend={kpi.trend ?? undefined}
                trendLabel={kpi.trendLabel}
                icon={kpiIcons[kpi.key]}
              />
            ))}
      </div>

      {/* Trend Chart */}
      <TrendChart data={trends} loading={loading} />

      {/* League Breakdown */}
      <LeagueTable data={leagueBreakdown} loading={loading} />

      {/* Module Links */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Analytics Modules</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/admin/analytics/tours"
            className="block p-4 bg-card border rounded-lg hover:border-primary transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-medium">Tour Analytics</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Onboarding tour completion rates, step drop-off, and user feedback
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}
