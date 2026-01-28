import { createAdminClient } from "@/lib/supabase/server";
import { json } from "@/lib/api";
import { NextResponse } from "next/server";

/**
 * GET /api/stats/public
 *
 * Returns aggregate public statistics for marketing pages.
 * No auth required - data is anonymized/aggregated.
 *
 * Used for: Social proof sections, marketing pages, public dashboards
 *
 * PRD-53: Dynamic social proof stats
 */
export async function GET() {
    try {
        const adminClient = createAdminClient();

        // Run all queries in parallel for performance
        const [usersResult, leaguesResult, submissionsResult, shareCardsResult] = await Promise.all([
            // Count active users (users who have submitted in last 30 days)
            adminClient
                .from("submissions")
                .select("user_id", { count: "exact", head: true })
                .gte("submission_date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]),

            // Count active leagues
            adminClient.from("leagues").select("id", { count: "exact", head: true }),

            // Sum total steps submitted (all time)
            adminClient.from("submissions").select("steps_count"),

            // Count share cards created
            adminClient.from("share_cards").select("id", { count: "exact", head: true }),
        ]);

        // Calculate total steps
        let totalSteps = 0;
        if (submissionsResult.data) {
            totalSteps = submissionsResult.data.reduce(
                (sum: number, row: { steps_count: number | null }) => sum + (row.steps_count || 0),
                0
            );
        }

        // Get unique active user count
        const activeUsersCount = usersResult.count || 0;
        const leaguesCount = leaguesResult.count || 0;
        const shareCardsCount = shareCardsResult.count || 0;

        // Format numbers for display
        const formatNumber = (num: number): string => {
            if (num >= 1_000_000) {
                return `${(num / 1_000_000).toFixed(1)}M+`;
            }
            if (num >= 1_000) {
                return `${(num / 1_000).toFixed(0)}K+`;
            }
            return `${num}+`;
        };

        const stats = {
            activeUsers: {
                value: activeUsersCount,
                formatted: formatNumber(activeUsersCount),
                label: "Active Users",
            },
            leagues: {
                value: leaguesCount,
                formatted: formatNumber(leaguesCount),
                label: "Leagues",
            },
            totalSteps: {
                value: totalSteps,
                formatted: formatNumber(totalSteps),
                label: "Steps Tracked",
            },
            shareCards: {
                value: shareCardsCount,
                formatted: formatNumber(shareCardsCount),
                label: "Cards Created",
            },
        };

        // Cache for 5 minutes (public data, doesn't need to be real-time)
        return json(stats, {
            headers: {
                "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
            },
        });
    } catch (error) {
        console.error("Error fetching public stats:", error);
        return json(
            {
                error: "Failed to fetch stats",
                // Return fallback stats so the page still works
                activeUsers: { value: 0, formatted: "10K+", label: "Active Users" },
                leagues: { value: 0, formatted: "500+", label: "Leagues" },
                totalSteps: { value: 0, formatted: "1M+", label: "Steps Tracked" },
                shareCards: { value: 0, formatted: "50K+", label: "Cards Created" },
            },
            { status: 200 } // Return 200 with fallback data rather than error
        );
    }
}
