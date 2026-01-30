import { z } from "zod";
import { withApiHandler } from "@/lib/api/handler";
import { badRequest } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/server";
import { presetToDateRange, calculateStreak, type PeriodPreset } from "@/lib/utils/periods";

export const dynamic = "force-dynamic";

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
  total_steps: number;
  days_submitted: number;
  verified_days: number;
  unverified_days: number;
  average_per_day: number;
  streak: number;
  submission_dates: string[];
  steps_by_date: Map<string, number>;
  is_proxy?: boolean; // True if this is a proxy member
}

interface ComparisonResult {
  user_id: string;
  display_name: string | null;
  period_a: UserStats;
  period_b: UserStats | null;
  improvement_pct: number | null;
  common_days_steps_a: number | null;
  common_days_steps_b: number | null;
  badges: string[];
  rank: number;
  // Authoritative stats
  current_streak: number;
  total_steps_lifetime: number;
  is_proxy?: boolean; // True if this is a proxy member
  high_five_count: number;
  user_has_high_fived: boolean;
}

// GET /api/leaderboard
export const GET = withApiHandler({
  auth: 'league_member',  // Handler checks membership via query param
}, async ({ request, adminClient, user }) => {
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

  // Resolve period A dates
  let rangeA: { start: string; end: string } | null = period === "custom" && start_date && end_date
    ? { start: start_date, end: end_date }
    : presetToDateRange(period as PeriodPreset);

  // Resolve period B dates (for comparison mode)
  let rangeB: { start: string; end: string } | null = period_b
    ? (period_b === "custom" && start_date_b && end_date_b
      ? { start: start_date_b, end: end_date_b }
      : presetToDateRange(period_b as PeriodPreset))
    : null;

  // Fetch league settings (counting_start_date)
  const { data: leagueSettings } = await adminClient
    .from("leagues")
    .select("counting_start_date")
    .eq("id", league_id)
    .single();

  const countingStartDate = leagueSettings?.counting_start_date;

  // Helper to clamp start date if a counting_start_date is set
  const clampRange = (r: { start: string; end: string } | null) => {
    if (!r || !countingStartDate) return r;
    // If the entire range is before the start date, return null (no valid period)
    if (r.end < countingStartDate) return null;
    // If range starts before counting date, clamp it
    if (r.start < countingStartDate) return { ...r, start: countingStartDate };
    return r;
  };

  // Handle All Time with counting_start_date
  if (period === "all_time" && countingStartDate) {
    rangeA = {
      start: countingStartDate,
      end: new Date().toISOString().slice(0, 10),
    };
  }

  // Apply clamping
  rangeA = clampRange(rangeA);
  rangeB = clampRange(rangeB);

  // If rangeA is null after clamping (meaning the whole period is before league start),
  // we effectively have no stats.
  // EXCEPTION: If period is "all_time" and no counting_start_date, rangeA is null by default but we SHOULD fetch all.
  const shouldFetchA = rangeA !== null || (period === "all_time" && !countingStartDate);

  const statsA = shouldFetchA
    ? await fetchPeriodStats(adminClient, league_id, rangeA, verified)
    : new Map<string, UserStats>(); // Return empty map if out of bounds

  // Fetch period B data if comparison mode
  const statsB = rangeB ? await fetchPeriodStats(adminClient, league_id, rangeB, verified) : null;

  // PRD 41: Proxy members are now users with is_proxy=true
  // Fetch proxy member stats for period A - proxies are users with managed_by set
  const proxyStatsA = await fetchProxyUserStats(adminClient, league_id, rangeA, verified);

  // Fetch proxy member stats for period B if comparison mode
  const proxyStatsB = rangeB ? await fetchProxyUserStats(adminClient, league_id, rangeB, verified) : null;

  // Fetch ALL league members (not just those with submissions) for complete leaderboard display
  const { data: allLeagueMembers } = await adminClient
    .from("memberships")
    .select("user_id, users!inner(id, display_name, is_proxy)")
    .eq("league_id", league_id);

  // Separate real users from proxies
  const realMembers = (allLeagueMembers || []).filter((m: any) => !m.users?.is_proxy);
  const proxyMembers = (allLeagueMembers || []).filter((m: any) => m.users?.is_proxy === true);

  // Get all user IDs (for user_records and high_fives lookups)
  const allUserIds = realMembers.map((m: any) => m.user_id);

  // Fetch all submission dates for streak calculation
  // PRD 41: proxy_member_id removed - filter by users.is_proxy = false instead
  const { data: allSubmissions } = await adminClient
    .from("submissions")
    .select("user_id, for_date, users!inner(is_proxy)")
    .eq("league_id", league_id)
    .eq("users.is_proxy", false) // Only real user submissions for streaks
    .order("for_date", { ascending: false });

  const userSubmissionDates = new Map<string, string[]>();
  for (const sub of allSubmissions || []) {
    if (!userSubmissionDates.has(sub.user_id)) {
      userSubmissionDates.set(sub.user_id, []);
    }
    userSubmissionDates.get(sub.user_id)!.push(sub.for_date);
  }

  // Fetch user records (streaks, lifetime steps)
  const { data: userRecords } = await adminClient
    .from("user_records")
    .select("user_id, current_streak, total_steps_lifetime")
    .in("user_id", allUserIds);

  const recordsMap = new Map(userRecords?.map(r => [r.user_id, r]));

  // Fetch High Fives for these users
  const { data: highFivesData } = await adminClient
    .from("high_fives")
    .select("sender_id, recipient_id")
    .in("recipient_id", allUserIds);

  const highFiveCounts = new Map<string, number>();
  const userHighFivedMap = new Map<string, boolean>(); // recipient_id -> true if current user sent one

  if (highFivesData) {
    for (const hf of highFivesData) {
      // Count
      highFiveCounts.set(hf.recipient_id, (highFiveCounts.get(hf.recipient_id) || 0) + 1);

      // Check if current user sent it
      if (user && hf.sender_id === user.id) {
        userHighFivedMap.set(hf.recipient_id, true);
      }
    }
  }


  // Build results for ALL real members (including those without submissions)
  const results: ComparisonResult[] = [];

  for (const member of realMembers) {
    const userId = member.user_id;
    const userInfo = member.users as any;
    const a = statsA.get(userId);
    const b = statsB?.get(userId) || null;

    // Create default stats for members without submissions in period A
    const defaultStats: UserStats = {
      user_id: userId,
      display_name: userInfo?.display_name ?? null,
      total_steps: 0,
      days_submitted: 0,
      verified_days: 0,
      unverified_days: 0,
      average_per_day: 0,
      streak: 0,
      submission_dates: [],
      steps_by_date: new Map(),
    };

    const periodA = a || defaultStats;

    // Calculate improvement percentage
    let improvementPct: number | null = null;
    if (b && b.total_steps > 0) {
      improvementPct = ((periodA.total_steps - b.total_steps) / b.total_steps) * 100;
    }

    // Calculate common days steps (only for days both periods have submissions)
    let commonDaysStepsA: number | null = null;
    let commonDaysStepsB: number | null = null;
    if (b && periodA.submission_dates.length > 0) {
      const commonDates = periodA.submission_dates.filter(d => b.submission_dates.includes(d));
      if (commonDates.length > 0) {
        commonDaysStepsA = commonDates.reduce((sum, d) => sum + (periodA.steps_by_date.get(d) || 0), 0);
        commonDaysStepsB = commonDates.reduce((sum, d) => sum + (b.steps_by_date.get(d) || 0), 0);
      }
    }

    // Calculate streak from period (fallback)
    const periodStreak = calculateStreak(userSubmissionDates.get(userId) || []);
    const record = recordsMap.get(userId);
    const currentStreak = record?.current_streak ?? periodStreak; // Use DB streak if avail
    const lifetimeSteps = record?.total_steps_lifetime ?? 0;

    results.push({
      user_id: userId,
      display_name: periodA.display_name,
      period_a: { ...periodA, streak: periodStreak },
      period_b: b,
      improvement_pct: improvementPct,
      common_days_steps_a: commonDaysStepsA,
      common_days_steps_b: commonDaysStepsB,
      badges: [],
      rank: 0,
      current_streak: currentStreak,
      total_steps_lifetime: Number(lifetimeSteps),

      is_proxy: false,
      high_five_count: highFiveCounts.get(userId) || 0,
      user_has_high_fived: userHighFivedMap.get(userId) || false,
    });
  }

  // Add ALL proxy members to results (including those without submissions)
  for (const proxyMember of proxyMembers) {
    const proxyUserId = proxyMember.user_id;
    const proxyUserInfo = proxyMember.users as any;
    const proxyStats = proxyStatsA.get(proxyUserId);
    const proxyB = proxyStatsB?.get(proxyUserId) || null;

    // Create default stats for proxy members without submissions
    const defaultProxyStats: UserStats = {
      user_id: `proxy:${proxyUserId}`,
      display_name: proxyUserInfo?.display_name ?? "Unknown Proxy",
      total_steps: 0,
      days_submitted: 0,
      verified_days: 0,
      unverified_days: 0,
      average_per_day: 0,
      streak: 0,
      submission_dates: [],
      steps_by_date: new Map(),
      is_proxy: true,
    };

    const periodA = proxyStats || defaultProxyStats;

    // Calculate improvement percentage for proxy
    let improvementPct: number | null = null;
    if (proxyB && proxyB.total_steps > 0) {
      improvementPct = ((periodA.total_steps - proxyB.total_steps) / proxyB.total_steps) * 100;
    }

    results.push({
      user_id: periodA.user_id, // Already prefixed with "proxy:" or from default
      display_name: periodA.display_name,
      period_a: { ...periodA, streak: 0 },
      period_b: proxyB,
      improvement_pct: improvementPct,
      common_days_steps_a: null,
      common_days_steps_b: null,
      badges: [],
      rank: 0,
      current_streak: 0, // Proxies don't have streaks
      total_steps_lifetime: 0, // Proxies don't have lifetime stats
      is_proxy: true,
      high_five_count: 0, // Proxies don't have high fives yet (or need DB support)
      user_has_high_fived: false,
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
  // If rangeA was clamped or null, reflect that? 
  // Probably best to show the *effective* days in period.
  const totalDaysInPeriod = rangeA ? calculateDaysBetween(rangeA.start, rangeA.end) : 0;

  return {
    leaderboard: results.slice(offset, offset + limit).map(r => ({
      rank: r.rank,
      user_id: r.user_id,
      display_name: r.display_name,
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
      is_proxy: r.is_proxy ?? false,
      high_five_count: r.high_five_count,
      user_has_high_fived: r.user_has_high_fived,
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
  };
});

async function fetchPeriodStats(
  client: ReturnType<typeof createAdminClient>,
  leagueId: string,
  range: { start: string; end: string } | null,
  verified: "all" | "verified" | "unverified"
): Promise<Map<string, UserStats>> {
  // 1. Get all members of this league
  const { data: members } = await client
    .from("memberships")
    .select("user_id")
    .eq("league_id", leagueId);

  const memberIds = members?.map(m => m.user_id) || [];

  if (memberIds.length === 0) {
    return new Map();
  }

  // 2. Query submissions for these users (AGNOSTIC of league_id)
  let query = client
    .from("submissions")
    .select(`
      user_id,
      steps,
      verified,
      for_date,
      users:user_id (display_name)
    `)
    .in("user_id", memberIds); // Filter by USER, not by league specific rows

  if (range) {
    query = query.gte("for_date", range.start).lte("for_date", range.end);
  }

  if (verified === "verified") {
    query = query.eq("verified", true);
  } else if (verified === "unverified") {
    query = query.eq("verified", false);
  }

  // Note: We intentionally DO NOT filter by submission.league_id.
  // This implements the "Global Steps" logic where steps count for all leagues.

  const { data: submissions, error } = await query;

  if (error) {
    console.error("Fetch stats error:", error);
    throw error;
  }

  const userMap = new Map<string, UserStats>();

  // Use a composite key for deduplication if needed?
  // Current logic sums all rows.
  // PROBLEM: If we have multiple rows for same date (e.g. from legacy multiple-league submissions),
  // we will Double Count.
  // FIX: Group by user+date and take MAX or distinct?
  // User said "submit once". Existing data might have duplicates.
  // We should probably deduplicate by (user_id, for_date).

  const uniqueSubmissionsMap = new Map<string, typeof submissions[0]>();

  for (const sub of submissions || []) {
    const key = `${sub.user_id}_${sub.for_date}`;
    const existing = uniqueSubmissionsMap.get(key);

    // If duplicate, prefer verified, then higher steps?
    // Or just take the one created last?
    // Let's take the one with higher steps to be safe/generous.
    if (!existing || (sub.steps > existing.steps)) {
      uniqueSubmissionsMap.set(key, sub);
    }
    else if (existing.steps === sub.steps && sub.verified && !existing.verified) {
      uniqueSubmissionsMap.set(key, sub);
    }
  }

  for (const sub of Array.from(uniqueSubmissionsMap.values())) {
    const uid = sub.user_id;
    const profile = sub.users as unknown as { display_name: string | null } | null;

    if (!userMap.has(uid)) {
      userMap.set(uid, {
        user_id: uid,
        display_name: profile?.display_name ?? null,
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

// PRD 41: Fetch stats for proxy users (users with is_proxy=true)
// Proxies now use user_id directly, no separate proxy_member_id
async function fetchProxyUserStats(
  client: ReturnType<typeof createAdminClient>,
  leagueId: string,
  range: { start: string; end: string } | null,
  verified: "all" | "verified" | "unverified"
): Promise<Map<string, UserStats>> {
  // First get all proxy users that have membership in this league
  const { data: proxyMemberships } = await client
    .from("memberships")
    .select(`
      user_id,
      users!inner(id, display_name, is_proxy, managed_by)
    `)
    .eq("league_id", leagueId);

  // Filter to only proxy users (is_proxy = true)
  const proxyMembers = (proxyMemberships || [])
    .filter((m: any) => m.users?.is_proxy === true)
    .map((m: any) => ({
      id: m.users.id,
      display_name: m.users.display_name || "Unknown Proxy"
    }));

  if (proxyMembers.length === 0) {
    return new Map();
  }

  const proxyIds = proxyMembers.map((p: any) => p.id);
  const proxyNameMap = new Map(proxyMembers.map((p: any) => [p.id, p.display_name]));

  // Fetch submissions for proxy users (using user_id, not proxy_member_id)
  let query = client
    .from("submissions")
    .select("user_id, steps, verified, for_date")
    .in("user_id", proxyIds);

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
    console.error("Fetch proxy stats error:", error);
    throw error;
  }

  const proxyMap = new Map<string, UserStats>();

  const uniqueProxySubs = new Map<string, typeof submissions[0]>();
  for (const sub of submissions || []) {
    const key = `${sub.user_id}_${sub.for_date}`;
    const existing = uniqueProxySubs.get(key);
    if (!existing || (sub.steps > existing.steps)) {
      uniqueProxySubs.set(key, sub);
    }
  }

  for (const sub of Array.from(uniqueProxySubs.values())) {
    const proxyId = sub.user_id;
    if (!proxyId) continue;

    if (!proxyMap.has(proxyId)) {
      proxyMap.set(proxyId, {
        user_id: `proxy:${proxyId}`, // Prefix to distinguish from real users
        display_name: proxyNameMap.get(proxyId) ?? "Unknown Proxy",
        total_steps: 0,
        days_submitted: 0,
        verified_days: 0,
        unverified_days: 0,
        average_per_day: 0,
        streak: 0,
        submission_dates: [],
        steps_by_date: new Map(),
        is_proxy: true,
      });
    }

    const u = proxyMap.get(proxyId)!;
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
  for (const u of Array.from(proxyMap.values())) {
    u.average_per_day = u.days_submitted > 0 ? u.total_steps / u.days_submitted : 0;
  }

  return proxyMap;
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

  // Streak badges (using authoritative streak)
  for (const r of results) {
    if (r.current_streak >= 30) {
      r.badges.push("streak_30");
    } else if (r.current_streak >= 7) {
      r.badges.push("streak_7");
    } else if (r.current_streak >= 3) {
      r.badges.push("streak_3");
    }

    // Lifetime Milestone badges
    if (r.total_steps_lifetime >= 1000000) { // 1 Million
      r.badges.push("million_club");
    } else if (r.total_steps_lifetime >= 500000) {
      r.badges.push("500k_club");
    } else if (r.total_steps_lifetime >= 100000) {
      r.badges.push("100k_club");
    }
  }
}

function calculateDaysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to be inclusive
}

