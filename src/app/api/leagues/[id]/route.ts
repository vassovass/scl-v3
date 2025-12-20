import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { json, unauthorized, forbidden, notFound, serverError, badRequest } from "@/lib/api";

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

        // Get league details (exclude soft-deleted)
        const { data: league, error: leagueError } = await adminClient
            .from("leagues")
            .select("id, name, invite_code, stepweek_start, created_at, deleted_at")
            .eq("id", id)
            .is("deleted_at", null)
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

// DELETE /api/leagues/[id] - Soft delete or permanent delete league
export async function DELETE(
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
        const url = new URL(request.url);
        const permanent = url.searchParams.get("permanent") === "true";

        const adminClient = createAdminClient();

        // Check if user is admin of this league
        const { data: membership } = await adminClient
            .from("memberships")
            .select("role")
            .eq("league_id", id)
            .eq("user_id", user.id)
            .single();

        if (!membership || membership.role !== "admin") {
            return forbidden("Only league admins can delete leagues");
        }

        // Get league
        const { data: league } = await adminClient
            .from("leagues")
            .select("id, deleted_at")
            .eq("id", id)
            .single();

        if (!league) {
            return notFound("League not found");
        }

        if (permanent) {
            // Permanent delete - remove from database entirely
            // First delete all related data
            await adminClient.from("submissions").delete().eq("league_id", id);
            await adminClient.from("memberships").delete().eq("league_id", id);

            const { error: deleteError } = await adminClient
                .from("leagues")
                .delete()
                .eq("id", id);

            if (deleteError) {
                console.error("Permanent delete error:", deleteError);
                return serverError(deleteError.message);
            }

            return json({ message: "League permanently deleted", id });
        } else {
            // Soft delete - set deleted_at timestamp
            const { error: updateError } = await adminClient
                .from("leagues")
                .update({
                    deleted_at: new Date().toISOString(),
                    deleted_by: user.id,
                })
                .eq("id", id);

            if (updateError) {
                console.error("Soft delete error:", updateError);
                return serverError(updateError.message);
            }

            return json({ message: "League moved to trash", id, expires_in_days: 7 });
        }
    } catch (error) {
        return serverError(error instanceof Error ? error.message : "Unknown error");
    }
}

// PATCH /api/leagues/[id] - Restore soft-deleted league
export async function PATCH(
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
        const body = await request.json();

        if (body.action !== "restore") {
            return badRequest("Invalid action");
        }

        const adminClient = createAdminClient();

        // Check if user is admin
        const { data: membership } = await adminClient
            .from("memberships")
            .select("role")
            .eq("league_id", id)
            .eq("user_id", user.id)
            .single();

        if (!membership || membership.role !== "admin") {
            return forbidden("Only league admins can restore leagues");
        }

        // Restore by clearing deleted_at
        const { error: updateError } = await adminClient
            .from("leagues")
            .update({
                deleted_at: null,
                deleted_by: null,
            })
            .eq("id", id);

        if (updateError) {
            console.error("Restore error:", updateError);
            return serverError(updateError.message);
        }

        return json({ message: "League restored", id });
    } catch (error) {
        return serverError(error instanceof Error ? error.message : "Unknown error");
    }
}
