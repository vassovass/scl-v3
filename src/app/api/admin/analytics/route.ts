import { withApiHandler } from "@/lib/api/handler";
import {
  fetchKPIs,
  fetchTrends,
  fetchLeagueBreakdown,
  type Period,
} from "@/lib/admin/analyticsQueries";

/**
 * Admin Analytics API
 *
 * Returns platform KPIs, daily trends, and league breakdown.
 * Superadmin-only endpoint.
 *
 * PRD 32 — Admin Analytics Dashboard
 *
 * Query params:
 *   period: "7d" | "30d" | "90d" | "all" (default: "30d")
 *   league_id: optional UUID to filter by league
 */

export const dynamic = "force-dynamic";

const VALID_PERIODS = new Set(["7d", "30d", "90d", "all"]);

export const GET = withApiHandler(
  { auth: "superadmin" },
  async ({ request, adminClient }) => {
    const url = new URL(request.url);
    const periodParam = url.searchParams.get("period") || "30d";
    const leagueId = url.searchParams.get("league_id") || undefined;

    const period: Period = VALID_PERIODS.has(periodParam)
      ? (periodParam as Period)
      : "30d";

    const [kpis, trends, leagueBreakdown] = await Promise.all([
      fetchKPIs(adminClient, period, leagueId),
      fetchTrends(adminClient, period, leagueId),
      fetchLeagueBreakdown(adminClient, period),
    ]);

    return { kpis, trends, leagueBreakdown, period };
  }
);
