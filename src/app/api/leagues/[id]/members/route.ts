import { z } from "zod";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { json, badRequest, unauthorized, forbidden, serverError, notFound } from "@/lib/api";

const updateRoleSchema = z.object({
    user_id: z.string().uuid(),
    role: z.enum(["admin", "member"]),
});

// PATCH /api/leagues/[id]/members - Update member role
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
        const parsed = updateRoleSchema.safeParse(body);

        if (!parsed.success) {
            return badRequest(parsed.error.message);
        }

        const { user_id: targetUserId, role: newRole } = parsed.data;

        const adminClient = createAdminClient();

        // 1. Check Requester Permissions
        const { data: requesterMembership } = await adminClient
            .from("memberships")
            .select("role")
            .eq("league_id", id)
            .eq("user_id", user.id)
            .single();

        const { data: requesterProfile } = await adminClient
            .from("users")
            .select("is_superadmin")
            .eq("id", user.id)
            .single();

        const isSuperAdmin = requesterProfile?.is_superadmin ?? false;
        // Only Owners and Super Admins can change roles
        const isOwner = requesterMembership?.role === "owner";

        if (!isSuperAdmin && !isOwner) {
            return forbidden("Only the league owner can manage roles");
        }

        // 2. Check Target Existence and Role
        const { data: targetMembership } = await adminClient
            .from("memberships")
            .select("role")
            .eq("league_id", id)
            .eq("user_id", targetUserId)
            .single();

        if (!targetMembership) {
            return notFound("User is not a member of this league");
        }

        if (targetMembership.role === "owner") {
            return forbidden("Cannot change the role of the league owner");
        }

        // 3. Update Role
        const { error: updateError } = await adminClient
            .from("memberships")
            .update({ role: newRole })
            .eq("league_id", id)
            .eq("user_id", targetUserId);

        if (updateError) {
            return serverError(updateError.message);
        }

        return json({ message: "Role updated successfully" });

    } catch (error) {
        return serverError(error instanceof Error ? error.message : "Unknown error");
    }
}

// DELETE /api/leagues/[id]/members - Kick member
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
        const targetUserId = url.searchParams.get("user_id");

        if (!targetUserId) {
            return badRequest("user_id is required");
        }

        const adminClient = createAdminClient();

        // 1. Check Requester Permissions
        const { data: requesterMembership } = await adminClient
            .from("memberships")
            .select("role")
            .eq("league_id", id)
            .eq("user_id", user.id)
            .single();

        const { data: requesterProfile } = await adminClient
            .from("users")
            .select("is_superadmin")
            .eq("id", user.id)
            .single();

        const isSuperAdmin = requesterProfile?.is_superadmin ?? false;
        const requesterRole = requesterMembership?.role;

        // 2. Check Target Existence and Role
        const { data: targetMembership } = await adminClient
            .from("memberships")
            .select("role")
            .eq("league_id", id)
            .eq("user_id", targetUserId)
            .single();

        if (!targetMembership) {
            return notFound("User is not a member of this league");
        }

        if (targetMembership.role === "owner") {
            return forbidden("Cannot kick the league owner");
        }

        // 3. Check Logic: Can Requester kick Target?
        // - Super Admin: Yes (except owner, handled above)
        // - Owner: Yes
        // - Admin: Yes, if target is "member"
        // - Member: No

        const canKick = isSuperAdmin ||
            requesterRole === "owner" ||
            (requesterRole === "admin" && targetMembership.role === "member");

        if (!canKick) {
            return forbidden("You do not have permission to kick this user");
        }

        // 4. Delete Membership
        const { error: deleteError } = await adminClient
            .from("memberships")
            .delete()
            .eq("league_id", id)
            .eq("user_id", targetUserId);

        if (deleteError) {
            return serverError(deleteError.message);
        }

        return json({ message: "User removed from league" });

    } catch (error) {
        return serverError(error instanceof Error ? error.message : "Unknown error");
    }
}
