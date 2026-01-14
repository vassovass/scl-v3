/**
 * Proxy Claim API - PRD 41 Unified Model
 * 
 * Allows users to claim a proxy profile using an invite code.
 * After claiming, the proxy becomes a real user with all historical data preserved.
 */

import { z } from "zod";
import { withApiHandler } from "@/lib/api/handler";

const claimSchema = z.object({
    merge_strategy: z.enum(['keep_proxy_profile', 'keep_my_profile']).optional().default('keep_proxy_profile'),
});

// GET /api/proxy-claim/[code] - Get proxy details for claim preview
export const GET = withApiHandler({
    auth: "required",
}, async ({ user, params, adminClient }) => {
    const code = params?.code;

    if (!code || typeof code !== "string") {
        return { error: "Invalid invite code", status: 400 };
    }

    // Find proxy user by invite code (unified model - proxy is in users table)
    const { data: proxy, error: proxyError } = await adminClient
        .from("users")
        .select(`
            id,
            display_name,
            invite_code,
            claims_remaining,
            managed_by,
            is_proxy,
            created_at
        `)
        .eq("invite_code", code)
        .eq("is_proxy", true)
        .is("deleted_at", null)
        .single();

    if (proxyError || !proxy) {
        return { error: "Invalid or expired invite code", status: 404 };
    }

    // Check if proxy can still be claimed
    if (proxy.claims_remaining <= 0) {
        return { error: "This profile has already been claimed", status: 400 };
    }

    // Get submission count for this proxy
    const { count: submissionCount } = await adminClient
        .from("submissions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", proxy.id);

    // Get leagues the proxy is a member of
    const { data: memberships } = await adminClient
        .from("memberships")
        .select(`
            league_id,
            role,
            leagues:league_id (
                id,
                name
            )
        `)
        .eq("user_id", proxy.id);

    // Get manager info (use maybeSingle to handle deleted/missing managers gracefully)
    const { data: manager } = await adminClient
        .from("users")
        .select("id, display_name")
        .eq("id", proxy.managed_by)
        .maybeSingle();

    // Check if claiming user is already a member of any of the proxy's leagues
    const proxyLeagueIds = memberships?.map((m: any) => m.league_id) || [];
    let userExistingMemberships: string[] = [];

    if (proxyLeagueIds.length > 0) {
        const { data: existingMemberships } = await adminClient
            .from("memberships")
            .select("league_id")
            .eq("user_id", user!.id)
            .in("league_id", proxyLeagueIds);

        userExistingMemberships = existingMemberships?.map((m: any) => m.league_id) || [];
    }

    return {
        proxy: {
            id: proxy.id,
            display_name: proxy.display_name,
            submission_count: submissionCount || 0,
            created_at: proxy.created_at,
        },
        leagues: memberships?.map((m: any) => ({
            id: m.leagues?.id,
            name: m.leagues?.name,
            role: m.role,
            user_already_member: userExistingMemberships.includes(m.league_id),
        })) || [],
        manager: manager ? {
            id: manager.id,
            display_name: manager.display_name,
        } : null,
        can_claim: true,
    };
});

// POST /api/proxy-claim/[code] - Claim proxy and convert to real user
export const POST = withApiHandler({
    auth: "required",
    schema: claimSchema,
}, async ({ user, params, body, adminClient }) => {
    const code = params?.code;

    if (!code || typeof code !== "string") {
        return { error: "Invalid invite code", status: 400 };
    }

    // Find proxy user by invite code
    const { data: proxy, error: proxyError } = await adminClient
        .from("users")
        .select(`
            id,
            display_name,
            invite_code,
            claims_remaining,
            managed_by,
            is_proxy
        `)
        .eq("invite_code", code)
        .eq("is_proxy", true)
        .is("deleted_at", null)
        .single();

    if (proxyError || !proxy) {
        return { error: "Invalid or expired invite code", status: 404 };
    }

    // Check if proxy can still be claimed
    if (proxy.claims_remaining <= 0) {
        return { error: "This profile has already been claimed", status: 400 };
    }

    // Prevent users from claiming their own proxy
    if (proxy.managed_by === user!.id) {
        return { error: "You cannot claim your own proxy", status: 400 };
    }

    const managerId = proxy.managed_by;

    // Get the claiming user's current profile
    const { data: claimingUser } = await adminClient
        .from("users")
        .select("display_name")
        .eq("id", user!.id)
        .single();

    // Determine which display name to use based on merge strategy
    const finalDisplayName = body.merge_strategy === 'keep_my_profile'
        ? claimingUser?.display_name
        : proxy.display_name;

    // Step 1: Transfer all submissions from proxy to the claiming user
    const { data: transferredSubmissions, error: transferError } = await adminClient
        .from("submissions")
        .update({ user_id: user!.id })
        .eq("user_id", proxy.id)
        .select("id");

    if (transferError) {
        console.error("Failed to transfer submissions:", transferError);
        return { error: `Failed to transfer submissions: ${transferError.message}`, status: 500 };
    }

    const transferredCount = transferredSubmissions?.length || 0;

    // Step 2: Transfer league memberships (if user not already a member)
    const { data: proxyMemberships } = await adminClient
        .from("memberships")
        .select("league_id, role")
        .eq("user_id", proxy.id);

    let membershipsTransferred = 0;

    if (proxyMemberships && proxyMemberships.length > 0) {
        for (const membership of proxyMemberships) {
            // Check if user already in this league
            const { data: existing } = await adminClient
                .from("memberships")
                .select("league_id")
                .eq("user_id", user!.id)
                .eq("league_id", membership.league_id)
                .maybeSingle();

            if (!existing) {
                // Transfer membership
                await adminClient
                    .from("memberships")
                    .update({ user_id: user!.id })
                    .eq("user_id", proxy.id)
                    .eq("league_id", membership.league_id);
                membershipsTransferred++;
            } else {
                // Delete proxy's membership (user already has one)
                await adminClient
                    .from("memberships")
                    .delete()
                    .eq("user_id", proxy.id)
                    .eq("league_id", membership.league_id);
            }
        }
    }

    // Step 3: Update claiming user's display name if using proxy profile
    if (body.merge_strategy === 'keep_proxy_profile' && proxy.display_name) {
        await adminClient
            .from("users")
            .update({ display_name: proxy.display_name })
            .eq("id", user!.id);
    }

    // Step 4: Soft-delete the proxy (mark as claimed)
    // We soft-delete instead of hard-delete to preserve audit trail
    const { error: deleteError } = await adminClient
        .from("users")
        .update({
            claims_remaining: 0,
            deleted_at: new Date().toISOString(),
            invite_code: null, // Clear invite code
        })
        .eq("id", proxy.id);

    if (deleteError) {
        console.error("Failed to mark proxy as claimed:", deleteError);
        // Not critical - submissions already transferred
    }

    // Step 5: Log the claim (non-blocking - audit_log table may not exist yet)
    try {
        await adminClient
            .from("audit_log")
            .insert({
                action: "proxy_claimed",
                actor_id: user!.id,
                target_id: proxy.id,
                details: {
                    proxy_display_name: proxy.display_name,
                    manager_id: managerId,
                    submissions_transferred: transferredCount,
                    memberships_transferred: membershipsTransferred,
                    merge_strategy: body.merge_strategy,
                },
            });
    } catch (auditError) {
        console.log("[AUDIT] proxy_claimed:", {
            actor: user!.id,
            target: proxy.id,
            submissions: transferredCount,
            memberships: membershipsTransferred
        });
    }

    return {
        success: true,
        message: `Successfully claimed profile "${proxy.display_name}"`,
        transferred_submissions: transferredCount,
        transferred_memberships: membershipsTransferred,
        final_display_name: finalDisplayName,
    };
});
