import { z } from "zod";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { json, badRequest, unauthorized, forbidden, serverError } from "@/lib/api";

const querySchema = z.object({
  league_id: z.string().uuid(),
  period: z.enum(["day", "week", "month", "custom"]),
  dates: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string | null;
  total_steps: number;
  total_km: number;
  total_calories: number;
  partial_days: number;
  missed_days: number;
  verified_days: number;
  unverified_days: number;
  member_total?: number;
  team_total_steps?: number;
}

// GET /api/leaderboard
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const rawParams = Object.fromEntries(url.searchParams.entries());
    const parsed = querySchema.safeParse(rawParams);

    if (!parsed.success) {
      return badRequest("Invalid query parameters");
    }

    const { league_id, dates, limit, offset } = parsed.data;
    const dateList = parseDates(dates);

    if (dateList.length === 0) {
      return badRequest("At least one date is required");
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorized();
    }

    // Use admin client to bypass RLS infinite recursion
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

    // Call RPC function (may fail due to RLS in function)
    const { data, error } = await adminClient.rpc("leaderboard_period", {
      _league_id: league_id,
      _dates: dateList,
      _limit: limit,
      _offset: offset,
    });

    // If RPC fails with permission error, fallback to direct query
    if (error) {
      console.error("Leaderboard RPC error:", error.message);

      // Check if it's a permission/RLS error
      if (error.message.includes("permission denied") || error.code === "42501") {
        // Fallback: Direct query via admin client
        const { data: submissions, error: subError } = await adminClient
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
          .eq("league_id", league_id)
          .in("for_date", dateList);

        if (subError) {
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
      }

      return serverError(error.message);
    }

    const entries: LeaderboardEntry[] = data ?? [];

    return json({
      leaderboard: entries.map((entry) => ({
        rank: entry.rank,
        user_id: entry.user_id,
        display_name: entry.display_name,
        total_steps: entry.total_steps,
        total_km: entry.total_km,
        total_calories: entry.total_calories,
        verified_days: entry.verified_days,
        unverified_days: entry.unverified_days,
      })),
      meta: {
        total_members: entries[0]?.member_total ?? 0,
        team_total_steps: entries[0]?.team_total_steps ?? 0,
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
