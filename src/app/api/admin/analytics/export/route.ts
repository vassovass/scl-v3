import { withApiHandler } from "@/lib/api/handler";
import {
  fetchKPIs,
  fetchTrends,
  fetchLeagueBreakdown,
  generateCSV,
  type Period,
} from "@/lib/admin/analyticsQueries";

/**
 * Admin Analytics CSV Export
 *
 * Downloads KPIs, trends, and league breakdown as CSV.
 * Superadmin-only endpoint.
 *
 * PRD 32 — Admin Analytics Dashboard
 */

export const dynamic = "force-dynamic";

const VALID_PERIODS = new Set(["7d", "30d", "90d", "all"]);

export const GET = withApiHandler(
  { auth: "superadmin" },
  async ({ request, adminClient }) => {
    const url = new URL(request.url);
    const periodParam = url.searchParams.get("period") || "30d";

    const period: Period = VALID_PERIODS.has(periodParam)
      ? (periodParam as Period)
      : "30d";

    const [kpis, trends, leagueBreakdown] = await Promise.all([
      fetchKPIs(adminClient, period),
      fetchTrends(adminClient, period),
      fetchLeagueBreakdown(adminClient, period),
    ]);

    const csv = generateCSV(kpis, trends, leagueBreakdown);
    const date = new Date().toISOString().split("T")[0];

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="stepleague-analytics-${period}-${date}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }
);
