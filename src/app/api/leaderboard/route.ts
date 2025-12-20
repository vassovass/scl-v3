import { z } from "zod";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { json, badRequest, unauthorized, forbidden, serverError } from "@/lib/api";

const querySchema = z.object({
  league_id: z.string().uuid(),
  period: z.enum(["day", "week", "month", "year", "all", "custom"]),
  dates: z.string().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // For custom range
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // For custom range
  verified: z.enum(["all", "verified", "unverified"]).default("all"),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

// GET /api/leaderboard
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const rawParams = Object.fromEntries(url.searchParams.entries());
    const parsed = querySchema.safeParse(rawParams);

    if (!parsed.success) {
      return badRequest("Invalid query parameters");
    }

    const { league_id, dates, limit, offset, verified, period, start_date, end_date } = parsed.data;

    // Determine date filtering mode
    const isAllTime = dates === "all" || period === "all";
    const isCustomRange = period === "custom" && start_date && end_date;
    const dateList = isAllTime ? [] : parseDates(dates);

    if (!isAllTime && !isCustomRange && dateList.length === 0) {
      return badRequest("At least one date is required");
    }

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

    // Build query
    let query = adminClient
      .from("submissions")
      .select(`
        user_id,
        steps,
        verified,
        partial,
        extracted_km,
        extracted_calories,
        profiles:user_id (display_name)
      `)
      .eq("league_id", league_id);

    // Apply date filter
    if (isCustomRange && start_date && end_date) {
      query = query.gte("for_date", start_date).lte("for_date", end_date);
    } else if (!isAllTime && dateList.length > 0) {
      query = query.in("for_date", dateList);
    }
    // If isAllTime, no date filter - get all submissions

    // Apply verified filter
    if (verified === "verified") {
      query = query.eq("verified", true);
    } else if (verified === "unverified") {
      query = query.eq("verified", false);
    }

    const { data: submissions, error: subError } = await query;

    if (subError) {
      console.error("Leaderboard query error:", subError);
      return serverError(subError.message);
    }

    // Aggregate by user
    const userMap = new Map<string, {
      user_id: string;
      display_name: string | null;
      total_steps: number;
      total_km: number;
      total_calories: number;
      verified_days: number;
      unverified_days: number;
    }>();

    for (const sub of submissions || []) {
      const uid = sub.user_id;
      const profile = sub.profiles as unknown as { display_name: string | null } | null;

      if (!userMap.has(uid)) {
        userMap.set(uid, {
          user_id: uid,
          display_name: profile?.display_name ?? null,
          total_steps: 0,
          total_km: 0,
          total_calories: 0,
          verified_days: 0,
          unverified_days: 0,
        });
      }

      const u = userMap.get(uid)!;
      u.total_steps += sub.steps || 0;
      u.total_km += sub.extracted_km || 0;
      u.total_calories += sub.extracted_calories || 0;
      if (sub.verified) {
        u.verified_days += 1;
      } else {
        u.unverified_days += 1;
      }
    }

    // Sort by steps and assign ranks
    const sorted = Array.from(userMap.values()).sort((a, b) => b.total_steps - a.total_steps);
    const entries = sorted.map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));

    return json({
      leaderboard: entries.slice(offset, offset + limit),
      meta: {
        total_members: entries.length,
        team_total_steps: entries.reduce((sum, e) => sum + e.total_steps, 0),
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return serverError(error instanceof Error ? error.message : "Unknown error");
  }
}

function parseDates(value?: string): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => /^\d{4}-\d{2}-\d{2}$/.test(part));
}
