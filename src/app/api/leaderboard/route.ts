import { z } from "zod";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { json, badRequest, unauthorized, forbidden, serverError } from "@/lib/api";
import { presetToDateRange, calculateStreak, type PeriodPreset } from "@/lib/utils/periods";

const querySchema = z.object({
  league_id: z.string().uuid(),
  period: z.string().default("this_week"),
  period_b: z.string().optional(), // For comparison mode
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  start_date_b: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date_b: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  verified: z.enum(["all", "verified", "unverified"]).default("all"),
  metric: z.enum(["total", "average", "common_days"]).default("total"),
  sort_by: z.enum(["steps", "improvement", "average", "streak"]).default("steps"),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

interface UserStats {
  user_id: string;
  display_name: string | null;
  nickname: string | null;
  total_steps: number;
  days_submitted: number;
  verified_days: number;
  unverified_days: number;
  average_per_day: number;
  streak: number;
  submission_dates: string[];
  steps_by_date: Map<string, number>;
}

interface ComparisonResult {
  user_id: string;
  display_name: string | null;
  nickname: string | null;
  period_a: UserStats;
  period_b: UserStats | null;
  improvement_pct: number | null;
  common_days_steps_a: number | null;
  common_days_steps_b: number | null;
  badges: string[];
  rank: number;
}

// GET /api/leaderboard
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const rawParams = Object.fromEntries(url.searchParams.entries());
    const parsed = querySchema.safeParse(rawParams);

    if (!parsed.success) {
      console.error("Validation error:", parsed.error);
      return badRequest("Invalid query parameters");
    }

    const {
      league_id, period, period_b,
      start_date, end_date, start_date_b, end_date_b,
      verified, metric, sort_by, limit, offset
    } = parsed.data;

    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorized();
    }

    const adminClient = createAdminClient();

    // Check membership
    const { data: membership } = await adminClient
      .from("memberships")
      .select("role")
      .eq("league_id", league_id)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return forbidden("You are not a member of this league");
    }

    // Resolve period A dates
    const rangeA = period === "custom" && start_date && end_date
      ? { start: start_date, end: end_date }
      : presetToDateRange(period as PeriodPreset);

    // Resolve period B dates (for comparison mode)
    const rangeB = period_b
      ? (period_b === "custom" && start_date_b && end_date_b
        ? { start: start_date_b, end: end_date_b }
        : presetToDateRange(period_b as PeriodPreset))
      : null;

    // Fetch period A data
    const statsA = await fetchPeriodStats(adminClient, league_id, rangeA, verified);

    // Fetch period B data if comparison mode
    const statsB = rangeB ? await fetchPeriodStats(adminClient, league_id, rangeB, verified) : null;

    // Calculate streaks for all users
    const allUserIds = Array.from(new Set([...Array.from(statsA.keys()), ...Array.from(statsB?.keys() || [])]));

    // Fetch all submission dates for streak calculation
    const { data: allSubmissions } = await adminClient
      .from("submissions")
      .select("user_id, for_date")
      .eq("league_id", league_id)
      .order("for_date", { ascending: false });

    const userSubmissionDates = new Map<string, string[]>();
    for (const sub of allSubmissions || []) {
      if (!userSubmissionDates.has(sub.user_id)) {
        userSubmissionDates.set(sub.user_id, []);
      }
      userSubmissionDates.get(sub.user_id)!.push(sub.for_date);
    }

    // Build results
    const results: ComparisonResult[] = [];

    for (const userId of allUserIds) {
      const a = statsA.get(userId);
      const b = statsB?.get(userId) || null;

      if (!a) continue; // Need at least period A data

      // Calculate improvement percentage
      let improvementPct: number | null = null;
      if (b && b.total_steps > 0) {
        improvementPct = ((a.total_steps - b.total_steps) / b.total_steps) * 100;
      }

      // Calculate common days steps (only for days both periods have submissions)
      let commonDaysStepsA: number | null = null;
      let commonDaysStepsB: number | null = null;
      if (b) {
        const commonDates = a.submission_dates.filter(d => b.submission_dates.includes(d));
        if (commonDates.length > 0) {
          commonDaysStepsA = commonDates.reduce((sum, d) => sum + (a.steps_by_date.get(d) || 0), 0);
          commonDaysStepsB = commonDates.reduce((sum, d) => sum + (b.steps_by_date.get(d) || 0), 0);
        }
      }

      // Calculate streak
      const streak = calculateStreak(userSubmissionDates.get(userId) || []);

      results.push({
        user_id: userId,
        display_name: a.display_name,
        nickname: a.nickname,
        period_a: { ...a, streak },
        period_b: b,
        improvement_pct: improvementPct,
        common_days_steps_a: commonDaysStepsA,
        common_days_steps_b: commonDaysStepsB,
        badges: [],
        rank: 0,
      });
    }

    // Sort results
    results.sort((a, b) => {
      switch (sort_by) {
        case "improvement":
          return (b.improvement_pct ?? -Infinity) - (a.improvement_pct ?? -Infinity);
        case "average":
          return b.period_a.average_per_day - a.period_a.average_per_day;
        case "streak":
          return b.period_a.streak - a.period_a.streak;
        case "steps":
        default:
          return b.period_a.total_steps - a.period_a.total_steps;
      }
    });

    // Assign ranks
    results.forEach((r, i) => { r.rank = i + 1; });

    // Assign badges
    assignBadges(results);

    // Calculate totals
    const totalSteps = results.reduce((sum, r) => sum + r.period_a.total_steps, 0);

    // Calculate total days in period
    const totalDaysInPeriod = rangeA ? calculateDaysBetween(rangeA.start, rangeA.end) : null;

    return json({
      leaderboard: results.slice(offset, offset + limit).map(r => ({
        rank: r.rank,
        user_id: r.user_id,
        display_name: r.nickname || r.display_name, // Prefer nickname
        nickname: r.nickname,
        total_steps: r.period_a.total_steps,
        days_submitted: r.period_a.days_submitted,
        total_days_in_period: totalDaysInPeriod,
        average_per_day: Math.round(r.period_a.average_per_day),
        verified_days: r.period_a.verified_days,
        unverified_days: r.period_a.unverified_days,
        streak: r.period_a.streak,
        period_b_steps: r.period_b?.total_steps ?? null,
        period_b_days: r.period_b?.days_submitted ?? null,
        improvement_pct: r.improvement_pct !== null ? Math.round(r.improvement_pct * 10) / 10 : null,
        common_days_steps_a: r.common_days_steps_a,
        common_days_steps_b: r.common_days_steps_b,
        badges: r.badges,
      })),
      meta: {
        total_members: results.length,
        team_total_steps: totalSteps,
        total_days_in_period: totalDaysInPeriod,
        period_a: rangeA,
        period_b: rangeB,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return serverError(error instanceof Error ? error.message : "Unknown error");
  }
}

async function fetchPeriodStats(
  client: ReturnType<typeof createAdminClient>,
  leagueId: string,
  range: { start: string; end: string } | null,
  verified: "all" | "verified" | "unverified"
): Promise<Map<string, UserStats>> {
  let query = client
    .from("submissions")
    .select(`
      user_id,
      steps,
      verified,
      for_date,
      users:user_id (display_name, nickname)
    `)
    .eq("league_id", leagueId);

  if (range) {
    query = query.gte("for_date", range.start).lte("for_date", range.end);
  }

  if (verified === "verified") {
    query = query.eq("verified", true);
  } else if (verified === "unverified") {
    query = query.eq("verified", false);
  }

  const { data: submissions, error } = await query;

  if (error) {
    console.error("Fetch stats error:", error);
    throw error;
  }

  const userMap = new Map<string, UserStats>();

  for (const sub of submissions || []) {
    const uid = sub.user_id;
    const profile = sub.users as unknown as { display_name: string | null; nickname: string | null } | null;

    if (!userMap.has(uid)) {
      userMap.set(uid, {
        user_id: uid,
        display_name: profile?.display_name ?? null,
        nickname: profile?.nickname ?? null,
        total_steps: 0,
        days_submitted: 0,
        verified_days: 0,
        unverified_days: 0,
        average_per_day: 0,
        streak: 0,
        submission_dates: [],
        steps_by_date: new Map(),
      });
    }

    const u = userMap.get(uid)!;
    u.total_steps += sub.steps || 0;
    u.days_submitted += 1;
    u.submission_dates.push(sub.for_date);
    u.steps_by_date.set(sub.for_date, (u.steps_by_date.get(sub.for_date) || 0) + (sub.steps || 0));

    if (sub.verified) {
      u.verified_days += 1;
    } else {
      u.unverified_days += 1;
    }
  }

  // Calculate averages
  for (const u of Array.from(userMap.values())) {
    u.average_per_day = u.days_submitted > 0 ? u.total_steps / u.days_submitted : 0;
  }

  return userMap;
}

function assignBadges(results: ComparisonResult[]) {
  if (results.length === 0) return;

  // Leader badge
  results[0].badges.push("leader");

  // Most Improved badge (top 3 with positive improvement)
  const byImprovement = [...results]
    .filter(r => r.improvement_pct !== null && r.improvement_pct > 0)
    .sort((a, b) => (b.improvement_pct ?? 0) - (a.improvement_pct ?? 0));

  for (let i = 0; i < Math.min(3, byImprovement.length); i++) {
    byImprovement[i].badges.push("most_improved");
  }

  // Consistent badge (submitted every day in period)
  // Would need to know total days in period - skip for now

  // Streak badges
  for (const r of results) {
    if (r.period_a.streak >= 7) {
      r.badges.push("streak_7");
    } else if (r.period_a.streak >= 3) {
      r.badges.push("streak_3");
    }
  }
}

function calculateDaysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to be inclusive
}
