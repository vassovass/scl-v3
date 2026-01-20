import { z } from "zod";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { json, badRequest, unauthorized, forbidden, serverError, jsonError } from "@/lib/api";

const deleteSchema = z.object({
    ids: z.array(z.string().uuid()).min(1).max(1000),
});

const patchSchema = z.object({
    ids: z.array(z.string().uuid()).min(1).max(1000),
    updates: z.object({
        for_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    }),
    reason: z.string().optional(),
});

// DELETE /api/submissions/bulk - Bulk delete submissions
export async function DELETE(request: Request): Promise<Response> {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return unauthorized();
        }

        const body = await request.json();
        const parsed = deleteSchema.safeParse(body);

        if (!parsed.success) {
            return badRequest("Invalid payload: " + parsed.error.message);
        }

        const { ids } = parsed.data;
        const adminClient = createAdminClient();

        // Security check: Ensure user owns ALL these submissions
        // PRD 41: proxy_member_id removed - proxies are now regular users
        const { data: submissions, error: fetchError } = await adminClient
            .from("submissions")
            .select("id, user_id")
            .in("id", ids);

        if (fetchError || !submissions) {
            return serverError("Failed to verify submission ownership");
        }

        if (submissions.length !== ids.length) {
            // Some IDs not found
            return badRequest("Some submissions were not found");
        }

        // Get user's admin leagues to check proxy permissions
        const { data: memberships } = await adminClient
            .from("memberships")
            .select("league_id, role")
            .eq("user_id", user.id)
            .in("role", ["owner", "admin"]);

        const adminLeagueIds = new Set(memberships?.map(m => m.league_id) || []);

        // Also check if superadmin
        const { data: userData } = await adminClient
            .from("users")
            .select("is_superadmin")
            .eq("id", user.id)
            .single();
        const isSuperAdmin = userData?.is_superadmin || false;

        // PRD 41: Simplified permission check - just verify user owns submission
        // For proxy submissions, the proxy user_id IS the submission owner

        // Better Approach: Use RLS-like logic in query or just trust the `user_id` check for self, 
        // and complex check for proxy.
        // Fetch with league_id for admin permission check
        const { data: detailedSubmissions } = await adminClient
            .from("submissions")
            .select("id, user_id, league_id")
            .in("id", ids);

        if (!detailedSubmissions) return serverError("Failed to fetch details");

        const invalidAccess = detailedSubmissions.some(sub => {
            if (isSuperAdmin) return false;
            if (sub.user_id === user.id) return false; // Own submission
            // PRD 41: Admins can manage submissions in their leagues
            if (sub.league_id && adminLeagueIds.has(sub.league_id)) {
                return false; // Admin of the league
            }
            return true; // No access
        });

        if (invalidAccess) {
            return forbidden("You do not have permission to delete one or more selected submissions");
        }

        // Log deletions
        // Note: Bulk logging might vary in efficiency, doing simple loop for now or single bulk insert
        // Only logging simplistic "bulk delete" event reference might be enough, or individual?
        // Let's try bulk insert for audit logs
        const auditLogs = detailedSubmissions.map(sub => ({
            submission_id: sub.id,
            user_id: user.id,
            field_name: "deleted",
            old_value: "bulk_delete",
            new_value: null,
            reason: "Bulk delete",
        }));

        await adminClient.from("submission_changes").insert(auditLogs);

        // Delete
        const { error: deleteError } = await adminClient
            .from("submissions")
            .delete()
            .in("id", ids);

        if (deleteError) {
            return serverError(deleteError.message);
        }

        return json({ success: true, count: ids.length });

    } catch (error) {
        return serverError(error instanceof Error ? error.message : "Unknown error");
    }
}

// PATCH /api/submissions/bulk - Bulk update submissions
export async function PATCH(request: Request): Promise<Response> {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return unauthorized();
        }

        const body = await request.json();
        const parsed = patchSchema.safeParse(body);

        if (!parsed.success) {
            return badRequest("Invalid payload: " + parsed.error.message);
        }

        const { ids, updates, reason } = parsed.data;
        const adminClient = createAdminClient();

        // 1. Fetch details for permission check
        // PRD 41: proxy_member_id removed
        const { data: detailedSubmissions } = await adminClient
            .from("submissions")
            .select("id, user_id, league_id, for_date")
            .in("id", ids);

        if (!detailedSubmissions || detailedSubmissions.length !== ids.length) {
            return badRequest("One or more submissions not found");
        }

        // 2. Check permissions
        const { data: memberships } = await adminClient
            .from("memberships")
            .select("league_id, role")
            .eq("user_id", user.id)
            .in("role", ["owner", "admin"]);
        const adminLeagueIds = new Set(memberships?.map(m => m.league_id) || []);

        const { data: userData } = await adminClient
            .from("users")
            .select("is_superadmin")
            .eq("id", user.id)
            .single();
        const isSuperAdmin = userData?.is_superadmin || false;

        const invalidAccess = detailedSubmissions.some(sub => {
            if (isSuperAdmin) return false;
            if (sub.user_id === user.id) return false;
            // PRD 41: Admins can manage submissions in their leagues
            if (sub.league_id && adminLeagueIds.has(sub.league_id)) return false;
            return true;
        });

        if (invalidAccess) {
            return forbidden("You do not have permission to update one or more selected submissions");
        }

        // 3. Prepare updates
        // We only allow bulk updating `for_date` currently per plan/UI
        if (!updates.for_date) {
            return badRequest("No updates provided");
        }

        // Validate future date
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const newDate = new Date(updates.for_date + "T00:00:00");
        if (newDate > today) {
            return badRequest("Cannot set future date");
        }

        // 4. Log changes
        const auditLogs = detailedSubmissions.map(sub => ({
            submission_id: sub.id,
            user_id: user.id,
            field_name: "for_date",
            old_value: sub.for_date,
            new_value: updates.for_date,
            reason: reason || "Bulk update",
        }));
        await adminClient.from("submission_changes").insert(auditLogs);

        // 5. Apply update
        const { error: updateError } = await adminClient
            .from("submissions")
            .update({ for_date: updates.for_date })
            .in("id", ids);

        if (updateError) {
            return serverError(updateError.message);
        }

        return json({ success: true, count: ids.length });

    } catch (error) {
        return serverError(error instanceof Error ? error.message : "Unknown error");
    }
}

