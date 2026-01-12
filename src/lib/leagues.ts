import { createAdminClient } from "@/lib/supabase/server";
import { AppError, ErrorCode, reportError } from "@/lib/errors";

export interface League {
    id: string;
    name: string;
    role: string;
    member_count: number;
    user_rank: number;
    user_steps_this_week: number;
    invite_code?: string;
    stepweek_start?: string;
    created_at?: string;
}

/**
 * Fetch all leagues for a specific user with calculated stats (Rank, Steps).
 * 
 * Logic refactored from /api/leagues/route.ts for Server Component usage.
 * @param userId - The user's ID
 */
export async function getUserLeagues(userId: string): Promise<League[]> {
    try {
        // Use admin client to bypass RLS infinite recursion
        const adminClient = createAdminClient();

        // 1. Get user's memberships with league details
        const { data, error } = await adminClient
            .from("memberships")
            .select("role, leagues(id, name, stepweek_start, invite_code, created_at, deleted_at)")
            .eq("user_id", userId);

        if (error) {
            throw new AppError({
                code: ErrorCode.DB_QUERY_FAILED,
                message: "Failed to fetch memberships",
                cause: error,
            });
        }

        // 2. Filter active leagues
        const activeLeagues = (data || [])
            .filter((m: any) => m.leagues !== null && m.leagues.deleted_at === null)
            .map((m: any) => ({
                ...m.leagues,
                role: m.role // Attach role here for easier processing
            }));

        if (activeLeagues.length === 0) return [];

        const leagueIds = activeLeagues.map((l: any) => l.id);

        // 3. Get member counts (aggregate)
        const { data: memberCounts, error: countError } = await adminClient
            .from("memberships")
            .select("league_id")
            .in("league_id", leagueIds);

        if (countError) throw countError;

        const countMap = new Map<string, number>();
        for (const m of memberCounts || []) {
            countMap.set(m.league_id, (countMap.get(m.league_id) || 0) + 1);
        }

        // 4. Get recent submissions for ranking (Last 7 days)
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 6);

        // Create date range strings
        const dateRange = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(weekStart);
            d.setDate(weekStart.getDate() + i);
            dateRange.push(d.toISOString().slice(0, 10));
        }

        const { data: submissions, error: subError } = await adminClient
            .from("submissions")
            .select("league_id, user_id, steps")
            .in("league_id", leagueIds)
            .in("for_date", dateRange);

        if (subError) throw subError;

        // 5. Calculate Ranks
        // First, sum steps per user per league
        const leagueUserSteps = new Map<string, Map<string, number>>();
        for (const sub of submissions || []) {
            if (!leagueUserSteps.has(sub.league_id)) {
                leagueUserSteps.set(sub.league_id, new Map());
            }
            const userMap = leagueUserSteps.get(sub.league_id)!;
            userMap.set(sub.user_id, (userMap.get(sub.user_id) || 0) + (sub.steps || 0));
        }

        // Then find user's specific rank
        const userRankMap = new Map<string, { rank: number; steps: number }>();
        for (const leagueId of leagueIds) {
            const userMap = leagueUserSteps.get(leagueId) || new Map();
            const sorted = Array.from(userMap.entries()).sort((a, b) => b[1] - a[1]);

            const rankIndex = sorted.findIndex(([uid]) => uid === userId);

            userRankMap.set(leagueId, {
                rank: rankIndex >= 0 ? rankIndex + 1 : 0,
                steps: userMap.get(userId) || 0,
            });
        }

        // 6. Assemble Result
        return activeLeagues.map((league: any) => {
            const stats = userRankMap.get(league.id);
            return {
                id: league.id,
                name: league.name,
                role: league.role,
                member_count: countMap.get(league.id) || 0,
                user_rank: stats?.rank || 0,
                user_steps_this_week: stats?.steps || 0,
                // Include other fields if needed by UI
                invite_code: league.invite_code,
                stepweek_start: league.stepweek_start,
            };
        });

    } catch (error) {
        // Log and rethrow as AppError
        const appError = error instanceof AppError ? error : new AppError({
            code: ErrorCode.API_FETCH_FAILED,
            message: "Failed to get user leagues",
            cause: error instanceof Error ? error : undefined
        });

        reportError(appError);
        throw appError;
    }
}
