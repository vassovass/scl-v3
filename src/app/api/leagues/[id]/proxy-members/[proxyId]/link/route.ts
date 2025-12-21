import { z } from "zod";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { json, badRequest, unauthorized, forbidden, serverError, notFound } from "@/lib/api";

const linkSchema = z.object({
    target_user_id: z.string().uuid(),
});

// POST /api/leagues/[id]/proxy-members/[proxyId]/link - Link proxy to real user
export async function POST(
    request: Request,
    context: { params: Promise<{ id: string; proxyId: string }> }
) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return unauthorized();
        }

        const { id: leagueId, proxyId } = await context.params;
        const body = await request.json();
        const parsed = linkSchema.safeParse(body);

        if (!parsed.success) {
            return badRequest(parsed.error.message);
        }

        const { target_user_id } = parsed.data;
        const adminClient = createAdminClient();

        // Check if user is owner or admin
        const { data: membership } = await adminClient
            .from("memberships")
            .select("role")
            .eq("league_id", leagueId)
            .eq("user_id", user.id)
            .single();

        if (!membership || !["owner", "admin"].includes(membership.role)) {
            return forbidden("Only league owners and admins can link proxy members");
        }

        // Verify proxy exists and belongs to this league
        const { data: proxy } = await adminClient
            .from("proxy_members")
            .select("id, display_name")
            .eq("id", proxyId)
            .eq("league_id", leagueId)
            .single();

        if (!proxy) {
            return notFound("Proxy member not found");
        }

        // Verify target user is a member of this league
        const { data: targetMembership } = await adminClient
            .from("memberships")
            .select("role")
            .eq("league_id", leagueId)
            .eq("user_id", target_user_id)
            .single();

        if (!targetMembership) {
            return badRequest("Target user is not a member of this league");
        }

        // Transfer all submissions from proxy to the target user
        const { data: updatedSubmissions, error: updateError } = await adminClient
            .from("submissions")
            .update({
                user_id: target_user_id,
                proxy_member_id: null // Clear the proxy reference
            })
            .eq("proxy_member_id", proxyId)
            .select("id");

        if (updateError) {
            return serverError(`Failed to transfer submissions: ${updateError.message}`);
        }

        const transferredCount = updatedSubmissions?.length || 0;

        // Delete the proxy member
        const { error: deleteError } = await adminClient
            .from("proxy_members")
            .delete()
            .eq("id", proxyId);

        if (deleteError) {
            return serverError(`Submissions transferred but failed to delete proxy: ${deleteError.message}`);
        }

        return json({
            message: `Successfully linked proxy "${proxy.display_name}" to user`,
            transferred_submissions: transferredCount,
        });

    } catch (error) {
        return serverError(error instanceof Error ? error.message : "Unknown error");
    }
}
