import { z } from "zod";
import { withApiHandler } from "@/lib/api/handler";
import { badRequest } from "@/lib/api";

const querySchema = z.object({
    period: z.enum(["all_time", "this_year", "this_month", "last_30_days", "last_7_days", "custom"]).default("all_time"),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    // Comparison mode
    compare: z.enum(["none", "period", "user"]).default("none"),
    compare_period: z.enum(["previous", "last_year", "custom"]).optional(),
    compare_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    compare_end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    compare_user_id: z.string().uuid().optional(),
    // Pagination
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
});

export interface GlobalLeaderboardEntry {
    rank: number;
    user_id: string;
    display_name: string | null;
    nickname: string | null;
    total_steps: number;
    current_streak: number;
    longest_streak: number;
    best_day_steps: number;
    best_day_date: string | null;
    badges: string[];
    // Comparison data (if requested)
    compare_steps?: number | null;
    improvement_pct?: number | null;
}

// GET /api/leaderboard/global
// Public endpoint - shows platform-wide rankings
export const GET = withApiHandler({
    auth: 'none', // Public leaderboard
}, async ({ request, adminClient }) => {
    const url = new URL(request.url);
    const rawParams = Object.fromEntries(url.searchParams.entries());
    const parsed = querySchema.safeParse(rawParams);

    if (!parsed.success) {
        console.error("Validation error:", parsed.error);
        return badRequest("Invalid query parameters");
    }

    const {
        period, start_date, end_date,
        compare, compare_period, compare_start_date, compare_end_date, compare_user_id,
        limit, offset
    } = parsed.data;

    // Check site settings for global leaderboard visibility (optional - defaults to enabled)
    let isEnabled = true;
    try {
        const { data: visibilitySetting, error } = await adminClient
            .from("site_settings")
            .select("value")
            .eq("key", "global_leaderboard_enabled")
            .maybeSingle(); // Use maybeSingle to avoid error when no row exists

        // Only disable if we have a setting explicitly set to "false"
        if (!error && visibilitySetting?.value === "false") {
            isEnabled = false;
        }
    } catch {
        // If site_settings table doesn't exist or any error, default to enabled
        console.log("site_settings table not available, defaulting leaderboard to enabled");
    }

    if (!isEnabled) {
        return {
            leaderboard: [],
            meta: {
                total_users: 0,
                period,
                enabled: false,
                message: "Global leaderboard is currently disabled by administrator.",
            },
        };
    }

    // Resolve primary date range
    const dateRange = resolveDateRange(period, start_date, end_date);

    // Resolve comparison date range if requested
    let compareDateRange: { start: string; end: string } | null = null;
    if (compare === "period" && compare_period) {
        compareDateRange = resolveComparisonRange(dateRange, compare_period, compare_start_date, compare_end_date);
    }

    let results: GlobalLeaderboardEntry[] = [];
    let totalUsers = 0;
    let compareUserData: GlobalLeaderboardEntry | null = null;

    if (period === "all_time" && !compareDateRange) {
        // For all_time without comparison, use pre-calculated user_records table
        const { data: records, error } = await adminClient
            .from("user_records")
            .select(`
        user_id,
        total_steps_lifetime,
        current_streak,
        longest_streak,
        best_day_steps,
        best_day_date,
        users:user_id (display_name, nickname)
      `)
            .order("total_steps_lifetime", { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error("Error fetching global leaderboard:", error);
            throw error;
        }

        // Get total count
        const { count } = await adminClient
            .from("user_records")
            .select("user_id", { count: "exact", head: true });

        totalUsers = count ?? 0;

        results = (records || []).map((record: any, index: number) => {
            // Supabase embedded query may return array or single object
            const usersData = record.users;
            const user = Array.isArray(usersData) ? usersData[0] : usersData;
            const badges = calculateBadges(
                record.total_steps_lifetime,
                record.current_streak,
                record.longest_streak
            );

            return {
                rank: offset + index + 1,
                user_id: record.user_id,
                display_name: user?.display_name ?? null,
                nickname: user?.nickname ?? null,
                total_steps: Number(record.total_steps_lifetime),
                current_streak: record.current_streak ?? 0,
                longest_streak: record.longest_streak ?? 0,
                best_day_steps: record.best_day_steps ?? 0,
                best_day_date: record.best_day_date ?? null,
                badges,
            };
        });
    } else {
        // For period-specific or comparison mode, aggregate from submissions
        const primaryStats = await fetchPeriodStats(adminClient, dateRange);
        const compareStats = compareDateRange
            ? await fetchPeriodStats(adminClient, compareDateRange)
            : null;

        // Get user_records for streak/badge info
        const userIds = Array.from(primaryStats.keys());
        const { data: userRecords } = await adminClient
            .from("user_records")
            .select("user_id, current_streak, longest_streak, best_day_steps, best_day_date")
            .in("user_id", userIds);

        const recordsMap = new Map((userRecords || []).map((r: any) => [r.user_id, r]));

        // Sort by total steps
        const sorted = Array.from(primaryStats.entries())
            .sort((a, b) => b[1].total - a[1].total);

        totalUsers = sorted.length;

        // Apply pagination
        const paginated = sorted.slice(offset, offset + limit);

        results = paginated.map(([userId, data], index) => {
            const record = recordsMap.get(userId);
            const compareData = compareStats?.get(userId);

            let improvementPct: number | null = null;
            if (compareData && compareData.total > 0) {
                improvementPct = ((data.total - compareData.total) / compareData.total) * 100;
            }

            const badges = calculateBadges(
                data.total,
                record?.current_streak ?? 0,
                record?.longest_streak ?? 0
            );

            return {
                rank: offset + index + 1,
                user_id: userId,
                display_name: data.user?.display_name ?? null,
                nickname: data.user?.nickname ?? null,
                total_steps: data.total,
                current_streak: record?.current_streak ?? 0,
                longest_streak: record?.longest_streak ?? 0,
                best_day_steps: record?.best_day_steps ?? 0,
                best_day_date: record?.best_day_date ?? null,
                badges,
                compare_steps: compareData?.total ?? null,
                improvement_pct: improvementPct !== null ? Math.round(improvementPct * 10) / 10 : null,
            };
        });
    }

    // Handle user comparison mode
    if (compare === "user" && compare_user_id) {
        const { data: compareUserRecord } = await adminClient
            .from("user_records")
            .select(`
        user_id,
        total_steps_lifetime,
        current_streak,
        longest_streak,
        best_day_steps,
        best_day_date,
        users:user_id (display_name, nickname)
      `)
            .eq("user_id", compare_user_id)
            .single();

        if (compareUserRecord) {
            // Supabase embedded query may return array or single object
            const usersData = compareUserRecord.users;
            const user = Array.isArray(usersData) ? usersData[0] : usersData;
            compareUserData = {
                rank: 0, // Calculate actual rank if needed
                user_id: compareUserRecord.user_id,
                display_name: user?.display_name ?? null,
                nickname: user?.nickname ?? null,
                total_steps: Number(compareUserRecord.total_steps_lifetime),
                current_streak: compareUserRecord.current_streak ?? 0,
                longest_streak: compareUserRecord.longest_streak ?? 0,
                best_day_steps: compareUserRecord.best_day_steps ?? 0,
                best_day_date: compareUserRecord.best_day_date ?? null,
                badges: calculateBadges(
                    compareUserRecord.total_steps_lifetime,
                    compareUserRecord.current_streak,
                    compareUserRecord.longest_streak
                ),
            };
        }
    }

    return {
        leaderboard: results.map((r) => ({
            rank: r.rank,
            user_id: r.user_id,
            display_name: r.nickname || r.display_name,
            nickname: r.nickname,
            total_steps: r.total_steps,
            current_streak: r.current_streak,
            longest_streak: r.longest_streak,
            best_day_steps: r.best_day_steps,
            best_day_date: r.best_day_date,
            badges: r.badges,
            compare_steps: r.compare_steps,
            improvement_pct: r.improvement_pct,
        })),
        meta: {
            total_users: totalUsers,
            period,
            date_range: dateRange,
            compare_date_range: compareDateRange,
            compare_mode: compare,
            enabled: true,
            limit,
            offset,
        },
        compare_user: compareUserData,
    };
});

/**
 * Resolve period to date range
 */
function resolveDateRange(
    period: string,
    customStart?: string,
    customEnd?: string
): { start: string; end: string } | null {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);

    switch (period) {
        case "all_time":
            return null; // null means use user_records
        case "this_year":
            return { start: `${now.getFullYear()}-01-01`, end: today };
        case "this_month": {
            const month = String(now.getMonth() + 1).padStart(2, "0");
            return { start: `${now.getFullYear()}-${month}-01`, end: today };
        }
        case "last_30_days": {
            const start = new Date(now);
            start.setDate(start.getDate() - 30);
            return { start: start.toISOString().slice(0, 10), end: today };
        }
        case "last_7_days": {
            const start = new Date(now);
            start.setDate(start.getDate() - 7);
            return { start: start.toISOString().slice(0, 10), end: today };
        }
        case "custom":
            if (customStart && customEnd) {
                return { start: customStart, end: customEnd };
            }
            return null;
        default:
            return null;
    }
}

/**
 * Resolve comparison date range
 */
function resolveComparisonRange(
    primaryRange: { start: string; end: string } | null,
    compareType: string,
    customStart?: string,
    customEnd?: string
): { start: string; end: string } | null {
    if (!primaryRange) return null;

    switch (compareType) {
        case "previous": {
            // Same duration, previous period
            const startDate = new Date(primaryRange.start);
            const endDate = new Date(primaryRange.end);
            const durationMs = endDate.getTime() - startDate.getTime();
            const prevEnd = new Date(startDate.getTime() - 1); // Day before primary start
            const prevStart = new Date(prevEnd.getTime() - durationMs);
            return {
                start: prevStart.toISOString().slice(0, 10),
                end: prevEnd.toISOString().slice(0, 10),
            };
        }
        case "last_year": {
            // Same dates, one year ago
            const startDate = new Date(primaryRange.start);
            const endDate = new Date(primaryRange.end);
            startDate.setFullYear(startDate.getFullYear() - 1);
            endDate.setFullYear(endDate.getFullYear() - 1);
            return {
                start: startDate.toISOString().slice(0, 10),
                end: endDate.toISOString().slice(0, 10),
            };
        }
        case "custom":
            if (customStart && customEnd) {
                return { start: customStart, end: customEnd };
            }
            return null;
        default:
            return null;
    }
}

/**
 * Fetch aggregated stats for a date range
 */
async function fetchPeriodStats(
    client: any,
    dateRange: { start: string; end: string } | null
): Promise<Map<string, { total: number; user: any; dates: Set<string> }>> {
    let query = client
        .from("submissions")
        .select(`
      user_id,
      steps,
      for_date,
      users:user_id (display_name, nickname)
    `);

    if (dateRange) {
        query = query.gte("for_date", dateRange.start).lte("for_date", dateRange.end);
    }

    const { data: submissions, error } = await query;

    if (error) {
        console.error("Error fetching submissions:", error);
        throw error;
    }

    // Aggregate by user, keeping only max steps per date to avoid duplicates
    const userSteps = new Map<string, { total: number; user: any; dates: Set<string> }>();

    for (const sub of submissions || []) {
        const existing = userSteps.get(sub.user_id);

        if (!existing) {
            userSteps.set(sub.user_id, {
                total: sub.steps,
                user: sub.users,
                dates: new Set([sub.for_date]),
            });
        } else {
            if (!existing.dates.has(sub.for_date)) {
                existing.total += sub.steps;
                existing.dates.add(sub.for_date);
            }
        }
    }

    return userSteps;
}

/**
 * Calculate achievement badges based on user stats
 * Designed to be modular - new badges can be added easily
 */
function calculateBadges(
    totalSteps: number,
    currentStreak: number,
    longestStreak: number
): string[] {
    const badges: string[] = [];

    // Lifetime step milestones (mutually exclusive - show highest)
    if (totalSteps >= 1000000) {
        badges.push("million_club");
    } else if (totalSteps >= 500000) {
        badges.push("500k_club");
    } else if (totalSteps >= 100000) {
        badges.push("100k_club");
    }

    // Current streak badges (mutually exclusive - show highest)
    if (currentStreak >= 30) {
        badges.push("streak_30");
    } else if (currentStreak >= 7) {
        badges.push("streak_7");
    } else if (currentStreak >= 3) {
        badges.push("streak_3");
    }

    // Longest streak badges - lifetime achievements (cumulative)
    if (longestStreak >= 365) {
        badges.push("legend_365");
    } else if (longestStreak >= 100) {
        badges.push("centurion");
    }

    return badges;
}
