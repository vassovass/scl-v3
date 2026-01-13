import { z } from "zod";
import { withApiHandler } from "@/lib/api/handler";
import { AppError, ErrorCode } from "@/lib/errors";

// GET /api/proxy-claim/[code] - Get proxy details for claim
export const GET = withApiHandler({
    auth: "required",
}, async ({ user, params, adminClient }) => {
    const code = params?.code;

    if (!code || typeof code !== "string") {
        return { error: "Invalid invite code", status: 400 };
    }

    // Find proxy user by invite code
    // We explicitly check is_proxy to ensure we only claim proxy accounts
    const { data: proxy, error: proxyError } = await adminClient
        .from("users")
        .select(`
      id,
      display_name,
      invite_code,
      created_at
    `)
        .eq("invite_code", code)
        .eq("is_proxy", true)
        .single();

    if (proxyError || !proxy) {
        return { error: "Invalid or expired invite code", status: 404 };
    }

    // Get submission count for this proxy user
    const { count: submissionCount } = await adminClient
        .from("submissions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", proxy.id);

    // Get leagues the proxy is in (to show context)
    const { data: memberships } = await adminClient
        .from("memberships")
        .select("league:leagues(id, name)")
        .eq("user_id", proxy.id);

    const leagues = memberships?.map((m: any) => m.league).filter(Boolean) || [];

    return {
        proxy: {
            id: proxy.id,
            display_name: proxy.display_name,
            submission_count: submissionCount || 0,
        },
        leagues, // Show which leagues they are part of
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

    // Find proxy user
    const { data: proxy, error: proxyError } = await adminClient
        .from("users")
        .select("id, display_name")
        .eq("invite_code", code)
        .eq("is_proxy", true)
        .single();

    if (proxyError || !proxy) {
        return { error: "Invalid or expired invite code", status: 404 };
    }

    if (proxy.id === user!.id) {
        return { error: "You cannot claim yourself", status: 400 };
    }

    // Step 1: Transfer submissions
    const { error: submissionError, data: updatedSubmissions } = await adminClient
        .from("submissions")
        .update({ user_id: user!.id })
        .eq("user_id", proxy.id)
        .select("id");

    if (submissionError) {
        throw new AppError({
            code: ErrorCode.DB_UPDATE_FAILED,
            message: "Failed to transfer submissions",
            cause: submissionError
        });
    }

    const transferredCount = updatedSubmissions?.length || 0;

    // Step 2: Transfer Memberships (Merge Logic)
    // Get proxy's memberships
    const { data: proxyMemberships } = await adminClient
        .from("memberships")
        .select("league_id, role")
        .eq("user_id", proxy.id);

    if (proxyMemberships && proxyMemberships.length > 0) {
        // Get claimer's memberships to check for conflicts
        const { data: myMemberships } = await adminClient
            .from("memberships")
            .select("league_id")
            .eq("user_id", user!.id);

        const myLeagueIds = new Set(myMemberships?.map(m => m.league_id) || []);

        for (const pm of proxyMemberships) {
            if (myLeagueIds.has(pm.league_id)) {
                // Conflict: Claimer is already in this league.
                // Action: Delete proxy membership (Claimer's existing membership takes precedence)
                // We could potentially upgrade role here if proxy was higher, but safer to keep claimer's role.
                await adminClient
                    .from("memberships")
                    .delete()
                    .eq("user_id", proxy.id)
                    .eq("league_id", pm.league_id);
            } else {
                // No conflict: Transfer membership to claimer
                await adminClient
                    .from("memberships")
                    .update({ user_id: user!.id })
                    .eq("user_id", proxy.id)
                    .eq("league_id", pm.league_id);
            }
        }
    }

    // Step 3: Delete the proxy user
    const { error: deleteError } = await adminClient
        .from("users")
        .delete()
        .eq("id", proxy.id);

    if (deleteError) {
        // Log but don't fail, as the critical data (steps) is moved.
        // It might fail if there are other FKs we missed, but introspect showed main ones.
        console.error("Failed to delete proxy user after claim:", deleteError);
    }

    return {
        success: true,
        message: `Successfully claimed profile "${proxy.display_name}"`,
        transferred_submissions: transferredCount,
    };
});
