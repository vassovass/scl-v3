import { createAdminClient } from "@/lib/supabase/server";
import { json } from "@/lib/api";

/**
 * GET /api/stats/public
 *
 * Returns aggregate public statistics for marketing pages.
 * No auth required - data is anonymized/aggregated.
 *
 * Used for: Social proof sections, marketing pages, public dashboards
 *
 * PRD-53: Dynamic social proof stats
 * PRD-56: Uses SECURITY DEFINER function to bypass RLS issues with admin client
 */
export async function GET() {
    try {
        const adminClient = createAdminClient();

        // PRD-56: Use SECURITY DEFINER function to bypass RLS issues
        // The RLS policies on submissions check auth.uid() which returns NULL
        // for admin client, causing stats to show zeros. The function bypasses this.
        const { data: rpcData, error: rpcError } = await adminClient.rpc("get_public_stats");

        if (rpcError) {
            console.error("Error calling get_public_stats RPC:", rpcError);
            // Fall back to direct queries if function doesn't exist yet (pre-migration)
            return await fallbackStats(adminClient);
        }

        const activeUsersCount = rpcData?.activeUsers || 0;
        const leaguesCount = rpcData?.leaguesCount || 0;
        const totalSteps = rpcData?.totalSteps || 0;
        const shareCardsCount = rpcData?.shareCardsCount || 0;

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

/**
 * Fallback stats using direct queries (pre-migration compatibility)
 * Note: This may return zeros due to RLS issues until migration is applied
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fallbackStats(adminClient: any) {
    const [usersResult, leaguesResult, submissionsResult, shareCardsResult] = await Promise.all([
        adminClient
            .from("submissions")
            .select("user_id", { count: "exact", head: true })
            .gte("for_date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]),
        adminClient.from("leagues").select("id", { count: "exact", head: true }),
        adminClient.from("submissions").select("steps"),
        adminClient.from("share_cards").select("id", { count: "exact", head: true }),
    ]);

    let totalSteps = 0;
    if (submissionsResult.data) {
        totalSteps = submissionsResult.data.reduce(
            (sum: number, row: { steps: number | null }) => sum + (row.steps || 0),
            0
        );
    }

    const formatNumber = (num: number): string => {
        if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M+`;
        if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K+`;
        return `${num}+`;
    };

    const stats = {
        activeUsers: {
            value: usersResult.count || 0,
            formatted: formatNumber(usersResult.count || 0),
            label: "Active Users",
        },
        leagues: {
            value: leaguesResult.count || 0,
            formatted: formatNumber(leaguesResult.count || 0),
            label: "Leagues",
        },
        totalSteps: {
            value: totalSteps,
            formatted: formatNumber(totalSteps),
            label: "Steps Tracked",
        },
        shareCards: {
            value: shareCardsResult.count || 0,
            formatted: formatNumber(shareCardsResult.count || 0),
            label: "Cards Created",
        },
    };

    return json(stats, {
        headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
    });
}
