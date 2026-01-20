/**
 * Unified Proxy Management API - PRD 41
 * 
 * CRUD operations for proxy users (ghost profiles managed by real users).
 * Replaces the legacy /api/leagues/[id]/proxy-members endpoint.
 * 
 * Key concepts:
 * - A proxy is a row in `users` where `managed_by IS NOT NULL`
 * - Proxies are league-agnostic (can be added to any league)
 * - Quota enforced via max_proxies_per_user setting
 */

import { z } from "zod";
import { withApiHandler } from "@/lib/api/handler";
import { nanoid } from "nanoid";

// =============================================================================
// Schemas
// =============================================================================

const createProxySchema = z.object({
    display_name: z.string().min(1, "Display name is required").max(100),
    /** Optional: immediately add proxy to a league */
    league_id: z.string().uuid().optional(),
});

const updateProxySchema = z.object({
    proxy_id: z.string().uuid(),
    display_name: z.string().min(1).max(100).optional(),
    is_archived: z.boolean().optional(),
});

// =============================================================================
// GET /api/proxies - List all proxies managed by current user
// =============================================================================

export const GET = withApiHandler({
    auth: "required",
}, async ({ user, adminClient, request }) => {
    const url = new URL(request.url);
    const includeArchived = url.searchParams.get('include_archived') === 'true';
    const leagueId = url.searchParams.get('league_id');

    // Build query
    let query = adminClient
        .from("users")
        .select(`
            id,
            display_name,
            invite_code,
            is_archived,
            claims_remaining,
            created_at
        `)
        .eq("managed_by", user!.id)
        .eq("is_proxy", true)
        .is("deleted_at", null)
        .order("display_name");

    // Filter archived unless explicitly requested
    if (!includeArchived) {
        query = query.eq("is_archived", false);
    }

    const { data: proxies, error } = await query;

    if (error) {
        console.error("Failed to fetch proxies:", error);
        return { error: "Failed to fetch proxies", status: 500 };
    }

    // Get submission counts for each proxy
    const proxyIds = proxies?.map((p: any) => p.id) || [];
    let submissionCounts: Record<string, number> = {};
    
    if (proxyIds.length > 0) {
        // Get counts grouped by user_id
        const { data: countData } = await adminClient
            .from("submissions")
            .select("user_id")
            .in("user_id", proxyIds);

        if (countData) {
            submissionCounts = countData.reduce((acc: Record<string, number>, row: any) => {
                acc[row.user_id] = (acc[row.user_id] || 0) + 1;
                return acc;
            }, {});
        }
    }

    // If filtering by league, get memberships
    let leagueMemberships: Set<string> = new Set();
    if (leagueId && proxyIds.length > 0) {
        const { data: memberships } = await adminClient
            .from("memberships")
            .select("user_id")
            .eq("league_id", leagueId)
            .in("user_id", proxyIds);

        leagueMemberships = new Set(memberships?.map((m: any) => m.user_id) || []);
    }

    // Enrich with counts and filter by league if needed
    const enrichedProxies = (proxies || [])
        .map((proxy: any) => ({
            ...proxy,
            submission_count: submissionCounts[proxy.id] || 0,
            in_league: leagueId ? leagueMemberships.has(proxy.id) : undefined,
        }))
        .filter((proxy: any) => !leagueId || proxy.in_league);

    return {
        proxies: enrichedProxies,
        total: enrichedProxies.length,
    };
});

// =============================================================================
// POST /api/proxies - Create a new proxy
// =============================================================================

export const POST = withApiHandler({
    auth: "required",
    schema: createProxySchema,
}, async ({ user, body, adminClient }) => {
    // Step 1: Check quota
    const MAX_PROXIES = 50; // TODO: Get from settings when available
    
    const { count: currentCount } = await adminClient
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("managed_by", user!.id)
        .eq("is_proxy", true)
        .is("deleted_at", null);

    if ((currentCount || 0) >= MAX_PROXIES) {
        return { 
            error: `Proxy quota exceeded. Maximum ${MAX_PROXIES} proxies allowed.`, 
            status: 403 
        };
    }

    // Step 2: Generate unique invite code
    const inviteCode = nanoid(12);

    // Step 3: Create proxy user
    // Note: is_proxy is auto-set by trigger based on managed_by
    // Generate UUID for proxy (users table doesn't auto-generate IDs like auth.users)
    const proxyId = crypto.randomUUID();
    
    const { data: newProxy, error: createError } = await adminClient
        .from("users")
        .insert({
            id: proxyId,
            display_name: body.display_name,
            managed_by: user!.id,
            invite_code: inviteCode,
            units: "metric", // Default
            is_superadmin: false,
        })
        .select(`
            id,
            display_name,
            invite_code,
            is_proxy,
            created_at
        `)
        .single();

    if (createError) {
        console.error("Failed to create proxy:", createError);
        return { error: `Failed to create proxy: ${createError.message}`, status: 500 };
    }

    // Safety check: ensure proxy was created
    if (!newProxy) {
        console.error("Proxy insert returned no data (RLS or constraint issue?)");
        return { error: "Failed to create proxy: No data returned", status: 500 };
    }

    // Step 4: If league_id provided, add proxy to league
    if (body.league_id) {
        // Verify manager is in the league
        const { data: managerMembership } = await adminClient
            .from("memberships")
            .select("role")
            .eq("user_id", user!.id)
            .eq("league_id", body.league_id)
            .maybeSingle();

        if (managerMembership) {
            await adminClient
                .from("memberships")
                .insert({
                    user_id: newProxy.id,
                    league_id: body.league_id,
                    role: "member",
                });
        }
    }

    // Step 5: Log creation (non-blocking - audit_log table may not exist yet)
    try {
        await adminClient
            .from("audit_log")
            .insert({
                action: "proxy_created",
                actor_id: user!.id,
                target_id: newProxy.id,
                details: {
                    display_name: body.display_name,
                    league_id: body.league_id || null,
                },
            });
    } catch (auditError) {
        // Audit logging is non-critical - log to console instead
        console.log("[AUDIT] proxy_created:", { actor: user!.id, target: newProxy.id, display_name: body.display_name });
    }

    return {
        success: true,
        proxy: newProxy,
        claim_link: `/claim/${inviteCode}`,
    };
});

// =============================================================================
// PUT /api/proxies - Update a proxy
// =============================================================================

export const PUT = withApiHandler({
    auth: "required",
    schema: updateProxySchema,
}, async ({ user, body, adminClient }) => {
    // Verify ownership (use maybeSingle to return null instead of throwing on no match)
    const { data: proxy } = await adminClient
        .from("users")
        .select("id, managed_by")
        .eq("id", body.proxy_id)
        .eq("managed_by", user!.id)
        .eq("is_proxy", true)
        .is("deleted_at", null)
        .maybeSingle();

    if (!proxy) {
        return { error: "Proxy not found or you don't have permission", status: 404 };
    }

    // Build update object
    const updates: Record<string, any> = {};
    if (body.display_name !== undefined) updates.display_name = body.display_name;
    if (body.is_archived !== undefined) updates.is_archived = body.is_archived;

    if (Object.keys(updates).length === 0) {
        return { error: "No updates provided", status: 400 };
    }

    const { data: updatedProxy, error: updateError } = await adminClient
        .from("users")
        .update(updates)
        .eq("id", body.proxy_id)
        .select("id, display_name, is_archived")
        .single();

    if (updateError) {
        return { error: `Failed to update proxy: ${updateError.message}`, status: 500 };
    }

    return {
        success: true,
        proxy: updatedProxy,
    };
});

// =============================================================================
// DELETE /api/proxies - Soft-delete a proxy
// =============================================================================

export const DELETE = withApiHandler({
    auth: "required",
}, async ({ user, adminClient, request }) => {
    const url = new URL(request.url);
    const proxyId = url.searchParams.get('proxy_id');

    if (!proxyId) {
        return { error: "proxy_id is required", status: 400 };
    }

    // Verify ownership (use maybeSingle to return null instead of throwing on no match)
    const { data: proxy } = await adminClient
        .from("users")
        .select("id, display_name, managed_by")
        .eq("id", proxyId)
        .eq("managed_by", user!.id)
        .eq("is_proxy", true)
        .is("deleted_at", null)
        .maybeSingle();

    if (!proxy) {
        return { error: "Proxy not found or you don't have permission", status: 404 };
    }

    // Soft delete
    const { error: deleteError } = await adminClient
        .from("users")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", proxyId);

    if (deleteError) {
        return { error: `Failed to delete proxy: ${deleteError.message}`, status: 500 };
    }

    // Log deletion (non-blocking - audit_log table may not exist yet)
    try {
        await adminClient
            .from("audit_log")
            .insert({
                action: "proxy_deleted",
                actor_id: user!.id,
                target_id: proxyId,
                details: {
                    display_name: proxy.display_name,
                },
            });
    } catch (auditError) {
        console.log("[AUDIT] proxy_deleted:", { actor: user!.id, target: proxyId, display_name: proxy.display_name });
    }

    return {
        success: true,
        message: `Proxy "${proxy.display_name}" deleted`,
    };
});

