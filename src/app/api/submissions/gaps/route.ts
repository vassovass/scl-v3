import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { json, unauthorized, badRequest } from "@/lib/api";
import { analyzeSubmissionGaps, getNotification } from "@/lib/submissions/analytics";

export const dynamic = "force-dynamic";

/**
 * GET /api/submissions/gaps
 * 
 * Analyzes submission gaps for the authenticated user.
 * Returns missing dates, gap analysis, and a user-friendly notification.
 * 
 * Query params:
 * - days: Number of days to check (default: 7)
 * - league_id: Optional - include league name in notification
 */
export async function GET(request: Request) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return unauthorized();
        }

        const url = new URL(request.url);
        const days = parseInt(url.searchParams.get("days") || "7", 10);
        const leagueId = url.searchParams.get("league_id");

        if (days < 1 || days > 30) {
            return badRequest("days must be between 1 and 30");
        }

        const adminClient = createAdminClient();

        // Calculate date range
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - days);

        const startStr = startDate.toISOString().slice(0, 10);
        const endStr = new Date(today.setDate(today.getDate() - 1)).toISOString().slice(0, 10);

        // Fetch submissions for the date range (league-agnostic)
        const { data: submissions, error: fetchError } = await adminClient
            .from("submissions")
            .select("id, for_date, steps, verified")
            .eq("user_id", user.id)
            .gte("for_date", startStr)
            .lte("for_date", endStr);

        if (fetchError) {
            console.error("Error fetching submissions for gap analysis:", fetchError);
            return json({ error: "Failed to analyze gaps" }, { status: 500 });
        }

        // Get league name if provided
        let leagueName: string | undefined;
        if (leagueId) {
            const { data: league } = await adminClient
                .from("leagues")
                .select("name")
                .eq("id", leagueId)
                .single();
            leagueName = league?.name;
        }

        // Analyze gaps
        const analysis = analyzeSubmissionGaps(submissions || [], days);
        const notification = getNotification(analysis, leagueName);

        return json({
            ...analysis,
            notification,
            league_name: leagueName || null,
        });
    } catch (error) {
        console.error("Gap analysis error:", error);
        return json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
