import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { json, unauthorized, forbidden, notFound, serverError } from "@/lib/api";

// GET /api/leagues/[id] - Get a single league
export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return unauthorized();
        }

        const { id } = await context.params;

        // Use admin client to bypass RLS
        const adminClient = createAdminClient();

        // Get league details
        const { data: league, error: leagueError } = await adminClient
            .from("leagues")
            .select("id, name, invite_code, stepweek_start, created_at")
            .eq("id", id)
            .single();

        if (leagueError || !league) {
            return notFound("League not found");
        }

        // Check if user is a member
        const { data: membership } = await adminClient
            .from("memberships")
            .select("role")
            .eq("league_id", id)
            .eq("user_id", user.id)
            .single();

        if (!membership) {
            return forbidden("You are not a member of this league");
        }

        return json({
            league: {
                ...league,
                role: membership.role,
            },
        });
    } catch (error) {
        return serverError(error instanceof Error ? error.message : "Unknown error");
    }
}
