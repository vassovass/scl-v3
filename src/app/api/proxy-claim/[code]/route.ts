import { z } from "zod";
import { withApiHandler } from "@/lib/api/handler";

// GET /api/proxy-claim/[code] - Get proxy details for claim
export const GET = withApiHandler({
    auth: "required",
}, async ({ user, params, adminClient }) => {
    const code = params?.code;

    if (!code || typeof code !== "string") {
        return { error: "Invalid invite code", status: 400 };
    }

    // Find proxy member by invite code
    const { data: proxy, error: proxyError } = await adminClient
        .from("proxy_members")
        .select(`
            id,
            display_name,
            league_id,
            invite_code,
            created_at
        `)
        .eq("invite_code", code)
        .single();

    if (proxyError || !proxy) {
        return { error: "Invalid or expired invite code", status: 404 };
    }

    // Get league details
    const { data: league } = await adminClient
        .from("leagues")
        .select("id, name")
        .eq("id", proxy.league_id)
        .single();

    // Get submission count for this proxy
    const { count: submissionCount } = await adminClient
        .from("submissions")
        .select("*", { count: "exact", head: true })
        .eq("proxy_member_id", proxy.id);

    // Check if user is already a member of this league
    const { data: existingMembership } = await adminClient
        .from("memberships")
        .select("role")
        .eq("league_id", proxy.league_id)
        .eq("user_id", user!.id)
        .single();

    return {
        proxy: {
            id: proxy.id,
            display_name: proxy.display_name,
            submission_count: submissionCount || 0,
        },
        league: league ? {
            id: league.id,
            name: league.name,
        } : null,
        user_already_member: !!existingMembership,
        can_claim: true,
    };
});

// POST /api/proxy-claim/[code] - Claim proxy and transfer submissions
export const POST = withApiHandler({
    auth: "required",
}, async ({ user, params, adminClient }) => {
    const code = params?.code;

    if (!code || typeof code !== "string") {
        return { error: "Invalid invite code", status: 400 };
    }

    // Find proxy member by invite code
    const { data: proxy, error: proxyError } = await adminClient
        .from("proxy_members")
        .select("id, display_name, league_id, invite_code")
        .eq("invite_code", code)
        .single();

    if (proxyError || !proxy) {
        return { error: "Invalid or expired invite code", status: 404 };
    }

    // Step 1: Add user to league if not already a member
    const { data: existingMembership } = await adminClient
        .from("memberships")
        .select("role")
        .eq("league_id", proxy.league_id)
        .eq("user_id", user!.id)
        .single();

    if (!existingMembership) {
        const { error: membershipError } = await adminClient
            .from("memberships")
            .insert({
                league_id: proxy.league_id,
                user_id: user!.id,
                role: "member",
            });

        if (membershipError) {
            return { error: `Failed to join league: ${membershipError.message}`, status: 500 };
        }
    }

    // Step 2: Transfer all submissions from proxy to the user
    const { data: updatedSubmissions, error: updateError } = await adminClient
        .from("submissions")
        .update({
            user_id: user!.id,
            proxy_member_id: null, // Clear the proxy reference
        })
        .eq("proxy_member_id", proxy.id)
        .select("id");

    if (updateError) {
        return { error: `Failed to transfer submissions: ${updateError.message}`, status: 500 };
    }

    const transferredCount = updatedSubmissions?.length || 0;

    // Step 3: Delete the proxy member record
    const { error: deleteError } = await adminClient
        .from("proxy_members")
        .delete()
        .eq("id", proxy.id);

    if (deleteError) {
        // Not a critical failure - submissions are already transferred
        console.error("Failed to delete proxy after transfer:", deleteError);
    }

    // Get league details for response
    const { data: league } = await adminClient
        .from("leagues")
        .select("id, name")
        .eq("id", proxy.league_id)
        .single();

    return {
        success: true,
        message: `Successfully claimed profile "${proxy.display_name}"`,
        transferred_submissions: transferredCount,
        league: league ? { id: league.id, name: league.name } : null,
        was_new_member: !existingMembership,
    };
});
