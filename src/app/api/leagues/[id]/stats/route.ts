import { withApiHandler } from "@/lib/api/handler";

// GET /api/leagues/[id]/stats
// Lightweight per-user league stats for the league overview page.
export const GET = withApiHandler(
  { auth: "league_member" },
  async ({ user, adminClient, params }) => {
    const leagueId = params.id;

    // By contract of withApiHandler + league_member auth, user is present.
    const userId = user!.id;

    // Last 7 days (matches existing /api/leagues stats logic)
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6);

    const dateRange: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      dateRange.push(d.toISOString().slice(0, 10));
    }

    // Fetch submissions for this league and date range
    const { data: submissions, error: submissionsError } = await adminClient
      .from("submissions")
      .select("user_id, steps")
      .eq("league_id", leagueId)
      .in("for_date", dateRange);

    if (submissionsError) {
      throw new Error(submissionsError.message);
    }

    // Sum steps per user
    const stepsByUser = new Map<string, number>();
    for (const sub of submissions || []) {
      stepsByUser.set(
        sub.user_id,
        (stepsByUser.get(sub.user_id) || 0) + (sub.steps || 0)
      );
    }

    const sorted = Array.from(stepsByUser.entries()).sort((a, b) => b[1] - a[1]);
    const rankIndex = sorted.findIndex(([uid]) => uid === userId);

    const stepsThisWeek = stepsByUser.get(userId) || 0;
    const rank = rankIndex >= 0 ? rankIndex + 1 : null;

    // Streak is stored per-user (league-agnostic)
    const { data: record } = await adminClient
      .from("user_records")
      .select("current_streak")
      .eq("user_id", userId)
      .maybeSingle();

    return {
      rank,
      steps_this_week: stepsThisWeek,
      current_streak: record?.current_streak ?? 0,
    };
  }
);

