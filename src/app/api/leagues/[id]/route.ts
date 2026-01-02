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
            .select("id, name, invite_code, stepweek_start, created_at, deleted_at, counting_start_date, description, is_public, allow_manual_entry, require_verification_photo, daily_step_goal, max_members, category")
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

        // Check for super admin status
        const { data: userProfile } = await adminClient
            .from("users")
            .select("is_superadmin")
            .eq("id", user.id)
            .single();

        const isSuperAdmin = userProfile?.is_superadmin ?? false;

        if (!membership && !isSuperAdmin) {
            return forbidden("You are not a member of this league");
        }

        // Fetch all members for admin tools (proxy linking dropdown)
        const { data: members } = await adminClient
            .from("memberships")
            .select("user_id, role, users:user_id (display_name, nickname)")
            .eq("league_id", id);

        const membersList = (members || []).map((m: any) => ({
            user_id: m.user_id,
            role: m.role,
            display_name: m.users?.nickname || m.users?.display_name || null,
        }));

        return json({
            league: {
                ...league,
                role: membership?.role ?? (isSuperAdmin ? "owner" : null), // Give Super Admin owner-level access in UI
            },
            members: membersList,
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

        // Check permissions: Super Admin OR (Member AND (Admin OR Owner))
        const { data: membership } = await adminClient
            .from("memberships")
            .select("role")
            .eq("league_id", id)
            .eq("user_id", user.id)
            .single();

        const { data: userProfile } = await adminClient
            .from("users")
            .select("is_superadmin")
            .eq("id", user.id)
            .single();

        const isSuperAdmin = userProfile?.is_superadmin ?? false;
        const isLeagueAdmin = membership?.role === "admin" || membership?.role === "owner";

        if (!isSuperAdmin && !isLeagueAdmin) {
            return forbidden("Only league admins or owners can delete leagues");
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

        // Check permissions: Super Admin OR (Member AND (Admin OR Owner))
        const { data: membership } = await adminClient
            .from("memberships")
            .select("role")
            .eq("league_id", id)
            .eq("user_id", user.id)
            .single();

        const { data: userProfile } = await adminClient
            .from("users")
            .select("is_superadmin")
            .eq("id", user.id)
            .single();

        const isSuperAdmin = userProfile?.is_superadmin ?? false;
        const isLeagueAdmin = membership?.role === "admin" || membership?.role === "owner";

        if (!isSuperAdmin && !isLeagueAdmin) {
            return forbidden("Only league admins or owners can restore leagues");
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

// PUT /api/leagues/[id] - Update league settings
export async function PUT(
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

        // Use admin client to bypass RLS
        const adminClient = createAdminClient();

        // Check permissions: Only Owner or Super Admin can update settings (Admins cannot)
        const { data: league } = await adminClient
            .from("leagues")
            .select("owner_id")
            .eq("id", id)
            .single();

        if (!league) {
            return notFound("League not found");
        }

        const { data: userProfile } = await adminClient
            .from("users")
            .select("is_superadmin")
            .eq("id", user.id)
            .single();

        const isSuperAdmin = userProfile?.is_superadmin ?? false;
        const isOwner = league.owner_id === user.id;

        if (!isOwner && !isSuperAdmin) {
            return forbidden("Only the league owner can update settings");
        }

        // Validate payload
        const updates: any = {};

        if (typeof body.name === 'string') updates.name = body.name.trim().slice(0, 100);
        if (body.stepweek_start === 'monday' || body.stepweek_start === 'sunday') updates.stepweek_start = body.stepweek_start;
        if (typeof body.counting_start_date === 'string' || body.counting_start_date === null) updates.counting_start_date = body.counting_start_date;
        if (typeof body.description === 'string' || body.description === null) updates.description = body.description ? body.description.slice(0, 500) : null;
        if (typeof body.category === 'string') updates.category = body.category;
        if (typeof body.is_public === 'boolean') updates.is_public = body.is_public;
        if (typeof body.allow_manual_entry === 'boolean') updates.allow_manual_entry = body.allow_manual_entry;
        if (typeof body.require_verification_photo === 'boolean') updates.require_verification_photo = body.require_verification_photo;
        if (typeof body.daily_step_goal === 'number') updates.daily_step_goal = Math.max(1000, body.daily_step_goal);
        if (typeof body.max_members === 'number') updates.max_members = Math.max(1, body.max_members);

        if (Object.keys(updates).length === 0) {
            return badRequest("No valid fields to update");
        }

        const { data: updatedLeague, error: updateError } = await adminClient
            .from("leagues")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (updateError) {
            console.error("League update error:", updateError);
            return serverError(updateError.message);
        }

        return json({ league: updatedLeague });

    } catch (error) {
        return serverError(error instanceof Error ? error.message : "Unknown error");
    }
}
