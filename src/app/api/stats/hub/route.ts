import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { presetToDateRange, type PeriodPreset } from "@/lib/utils/periods";

export const dynamic = "force-dynamic";

/**
 * GET /api/stats/hub
 *
 * Returns aggregated stats for the Stats Hub page.
 * Includes:
 * - User's basic stats (from user_records)
 * - Period-specific totals (today, this week, etc.)
 * - Comparison with previous period
 * - League-specific rank when league_id provided
 */
export async function GET(request: NextRequest) {
    const supabase = await createServerSupabaseClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const period = (searchParams.get("period") || "this_week") as PeriodPreset;
    const comparisonPeriod = searchParams.get("comparison_period") as PeriodPreset | null;
    const leagueId = searchParams.get("league_id");

    const adminClient = createAdminClient();

    try {
        // 1. Get base user stats from user_records
        const { data: userStats } = await adminClient
            .from("user_records")
            .select("*")
            .eq("user_id", user.id)
            .single();

        // 2. Get user display name
        const { data: userData } = await adminClient
            .from("users")
            .select("display_name")
            .eq("id", user.id)
            .single();

        // 3. Calculate period-specific stats
        const periodRange = presetToDateRange(period);
        let periodStats = {
            total_steps: 0,
            days_submitted: 0,
            average_per_day: 0,
        };

        if (periodRange) {
            const { data: submissions } = await adminClient
                .from("submissions")
                .select("steps, for_date")
                .eq("user_id", user.id)
                .gte("for_date", periodRange.start)
                .lte("for_date", periodRange.end);

            if (submissions && submissions.length > 0) {
                // Dedupe by date (take highest)
                const byDate = new Map<string, number>();
                for (const sub of submissions) {
                    const current = byDate.get(sub.for_date) || 0;
                    byDate.set(sub.for_date, Math.max(current, sub.steps || 0));
                }

                periodStats.total_steps = Array.from(byDate.values()).reduce((a, b) => a + b, 0);
                periodStats.days_submitted = byDate.size;
                periodStats.average_per_day = Math.round(periodStats.total_steps / byDate.size);
            }
        }

        // 4. Calculate comparison period stats if requested
        let comparisonStats = null;
        let improvementPct = null;

        if (comparisonPeriod) {
            const compRange = presetToDateRange(comparisonPeriod);
            if (compRange) {
                const { data: compSubmissions } = await adminClient
                    .from("submissions")
                    .select("steps, for_date")
                    .eq("user_id", user.id)
                    .gte("for_date", compRange.start)
                    .lte("for_date", compRange.end);

                if (compSubmissions && compSubmissions.length > 0) {
                    const byDate = new Map<string, number>();
                    for (const sub of compSubmissions) {
                        const current = byDate.get(sub.for_date) || 0;
                        byDate.set(sub.for_date, Math.max(current, sub.steps || 0));
                    }

                    const compTotal = Array.from(byDate.values()).reduce((a, b) => a + b, 0);
                    comparisonStats = {
                        total_steps: compTotal,
                        days_submitted: byDate.size,
                        average_per_day: Math.round(compTotal / byDate.size),
                    };

                    // Calculate improvement %
                    if (compTotal > 0) {
                        improvementPct = Math.round(((periodStats.total_steps - compTotal) / compTotal) * 100);
                    }
                }
            }
        }

        // 5. Get league-specific rank if league_id provided
        let leagueStats = null;
        if (leagueId && periodRange) {
            // Get league name
            const { data: league } = await adminClient
                .from("leagues")
                .select("name")
                .eq("id", leagueId)
                .single();

            // Get all submissions in this league for the period
            const { data: leagueSubmissions } = await adminClient
                .from("submissions")
                .select("user_id, steps, for_date")
                .eq("league_id", leagueId)
                .gte("for_date", periodRange.start)
                .lte("for_date", periodRange.end);

            if (leagueSubmissions) {
                // Calculate totals per user
                const userTotals = new Map<string, number>();
                for (const sub of leagueSubmissions) {
                    userTotals.set(sub.user_id, (userTotals.get(sub.user_id) || 0) + (sub.steps || 0));
                }

                // Sort and find rank
                const sorted = Array.from(userTotals.entries()).sort((a, b) => b[1] - a[1]);
                const userIndex = sorted.findIndex(([uid]) => uid === user.id);

                leagueStats = {
                    league_id: leagueId,
                    league_name: league?.name || "Unknown",
                    rank: userIndex >= 0 ? userIndex + 1 : null,
                    total_members: userTotals.size,
                    user_steps: userTotals.get(user.id) || 0,
                };
            }
        }

        // 6. Get user's leagues for the selector
        const { data: memberships } = await adminClient
            .from("memberships")
            .select("league_id, leagues(id, name, deleted_at)")
            .eq("user_id", user.id);

        const leagues = (memberships || [])
            .filter((m: any) => m.leagues && m.leagues.deleted_at === null)
            .map((m: any) => ({
                id: m.leagues.id,
                name: m.leagues.name,
            }));

        // 7. Get today's steps specifically
        const today = new Date().toISOString().slice(0, 10);
        const { data: todaySubmission } = await adminClient
            .from("submissions")
            .select("steps")
            .eq("user_id", user.id)
            .eq("for_date", today)
            .order("steps", { ascending: false })
            .limit(1)
            .single();

        return NextResponse.json({
            user: {
                id: user.id,
                display_name: userData?.display_name || "Player",
            },
            base_stats: {
                best_day_steps: userStats?.best_day_steps || 0,
                best_day_date: userStats?.best_day_date || null,
                current_streak: userStats?.current_streak || 0,
                longest_streak: userStats?.longest_streak || 0,
                total_steps_lifetime: userStats?.total_steps_lifetime || 0,
            },
            today_steps: todaySubmission?.steps || 0,
            period_stats: {
                period,
                ...periodStats,
            },
            comparison_stats: comparisonStats ? {
                period: comparisonPeriod,
                ...comparisonStats,
            } : null,
            improvement_pct: improvementPct,
            league_stats: leagueStats,
            leagues,
        });
    } catch (error) {
        console.error("Error fetching stats hub data:", error);
        return NextResponse.json(
            { error: "Failed to fetch stats" },
            { status: 500 }
        );
    }
}
