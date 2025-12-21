import { z } from "zod";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { json, badRequest, unauthorized, forbidden, serverError, notFound } from "@/lib/api";

const createProxySchema = z.object({
    display_name: z.string().min(1).max(100),
});

// GET /api/leagues/[id]/proxy-members - List all proxy members
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

        const { id: leagueId } = await context.params;
        const adminClient = createAdminClient();

        // Check if user is a member of this league
        const { data: membership } = await adminClient
            .from("memberships")
            .select("role")
            .eq("league_id", leagueId)
            .eq("user_id", user.id)
            .single();

        if (!membership) {
            return forbidden("You are not a member of this league");
        }

        // Get all proxy members for this league
        const { data: proxyMembers, error } = await adminClient
            .from("proxy_members")
            .select("id, display_name, created_by, created_at")
            .eq("league_id", leagueId)
            .order("created_at", { ascending: false });

        if (error) {
            return serverError(error.message);
        }

        // Get submission counts for each proxy member
        const proxyIds = (proxyMembers || []).map((p: any) => p.id);

        let submissionCounts: Record<string, number> = {};
        if (proxyIds.length > 0) {
            const { data: counts } = await adminClient
                .from("submissions")
                .select("proxy_member_id")
                .in("proxy_member_id", proxyIds);

            if (counts) {
                for (const row of counts as any[]) {
                    const id = row.proxy_member_id;
                    submissionCounts[id] = (submissionCounts[id] || 0) + 1;
                }
            }
        }

        // Attach submission count to each proxy member
        const enrichedProxies = (proxyMembers || []).map((p: any) => ({
            ...p,
            submission_count: submissionCounts[p.id] || 0,
        }));

        return json({ proxy_members: enrichedProxies });

    } catch (error) {
        return serverError(error instanceof Error ? error.message : "Unknown error");
    }
}

// POST /api/leagues/[id]/proxy-members - Create a new proxy member
export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return unauthorized();
        }

        const { id: leagueId } = await context.params;
        const body = await request.json();
        const parsed = createProxySchema.safeParse(body);

        if (!parsed.success) {
            return badRequest(parsed.error.message);
        }

        const adminClient = createAdminClient();

        // Check if user is owner, admin, or superadmin
        const { data: membership } = await adminClient
            .from("memberships")
            .select("role")
            .eq("league_id", leagueId)
            .eq("user_id", user.id)
            .single();

        const { data: userProfile } = await adminClient
            .from("users")
            .select("is_superadmin")
            .eq("id", user.id)
            .single();

        const isSuperAdmin = userProfile?.is_superadmin ?? false;
        const isLeagueAdmin = membership && ["owner", "admin"].includes(membership.role);

        if (!isSuperAdmin && !isLeagueAdmin) {
            return forbidden("Only league owners, admins, or superadmins can create proxy members");
        }

        // Create proxy member
        const { data: proxyMember, error } = await adminClient
            .from("proxy_members")
            .insert({
                league_id: leagueId,
                display_name: parsed.data.display_name,
                created_by: user.id,
            })
            .select()
            .single();

        if (error) {
            return serverError(error.message);
        }

        return json({ proxy_member: proxyMember }, { status: 201 });

    } catch (error) {
        return serverError(error instanceof Error ? error.message : "Unknown error");
    }
}

// DELETE /api/leagues/[id]/proxy-members?proxy_id=xxx - Delete a proxy member
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

        const { id: leagueId } = await context.params;
        const url = new URL(request.url);
        const proxyId = url.searchParams.get("proxy_id");

        if (!proxyId) {
            return badRequest("proxy_id is required");
        }

        const adminClient = createAdminClient();

        // Check if user is owner, admin, or superadmin
        const { data: membership } = await adminClient
            .from("memberships")
            .select("role")
            .eq("league_id", leagueId)
            .eq("user_id", user.id)
            .single();

        const { data: userProfile } = await adminClient
            .from("users")
            .select("is_superadmin")
            .eq("id", user.id)
            .single();

        const isSuperAdmin = userProfile?.is_superadmin ?? false;
        const isLeagueAdmin = membership && ["owner", "admin"].includes(membership.role);

        if (!isSuperAdmin && !isLeagueAdmin) {
            return forbidden("Only league owners, admins, or superadmins can delete proxy members");
        }

        // Verify proxy exists and belongs to this league
        const { data: proxy } = await adminClient
            .from("proxy_members")
            .select("id")
            .eq("id", proxyId)
            .eq("league_id", leagueId)
            .single();

        if (!proxy) {
            return notFound("Proxy member not found");
        }

        // Check if proxy has submissions
        const { count } = await adminClient
            .from("submissions")
            .select("*", { count: 'exact', head: true })
            .eq("proxy_member_id", proxyId);

        if (count && count > 0) {
            return badRequest(`Cannot delete proxy member with ${count} submissions. Link to a real user first, or delete the submissions.`);
        }

        // Delete proxy member
        const { error } = await adminClient
            .from("proxy_members")
            .delete()
            .eq("id", proxyId);

        if (error) {
            return serverError(error.message);
        }

        return json({ message: "Proxy member deleted" });

    } catch (error) {
        return serverError(error instanceof Error ? error.message : "Unknown error");
    }
}
