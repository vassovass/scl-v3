import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { json, badRequest, unauthorized } from "@/lib/api";

/**
 * Duplicate Cleanup API for SuperAdmins
 * 
 * GET: List duplicate entries (items with identical subjects)
 * DELETE: Remove specified duplicate by ID
 */

// GET: Find duplicate entries
export async function GET() {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return unauthorized("Authentication required");
        }

        // Check if superadmin
        const { data: isAdmin } = await supabase.rpc("is_superadmin");
        if (!isAdmin) {
            return unauthorized("SuperAdmin access required");
        }

        const adminClient = createAdminClient();

        // Find duplicate subjects (items that share the same subject)
        const { data: duplicates, error } = await adminClient
            .from("feedback")
            .select("id, subject, description, board_status, created_at, is_public")
            .order("subject")
            .order("created_at", { ascending: true });

        if (error) {
            return badRequest(error.message);
        }

        // Group by subject and find duplicates
        const subjectGroups: Record<string, typeof duplicates> = {};
        for (const item of duplicates || []) {
            if (!subjectGroups[item.subject]) {
                subjectGroups[item.subject] = [];
            }
            subjectGroups[item.subject].push(item);
        }

        // Filter to only subjects with duplicates (more than 1 entry)
        const duplicateGroups = Object.entries(subjectGroups)
            .filter(([_, items]) => items.length > 1)
            .map(([subject, items]) => ({
                subject,
                count: items.length,
                items: items.map(i => ({
                    id: i.id,
                    description: i.description?.substring(0, 100),
                    board_status: i.board_status,
                    created_at: i.created_at,
                    is_public: i.is_public,
                })),
                // Suggest keeping the oldest (first created)
                keep_id: items[0].id,
                delete_ids: items.slice(1).map(i => i.id),
            }));

        return json({
            duplicate_groups: duplicateGroups,
            total_duplicates: duplicateGroups.reduce((sum, g) => sum + g.count - 1, 0),
        });
    } catch (error: any) {
        return badRequest(error.message || "Unknown error");
    }
}

// DELETE: Remove a duplicate by ID
export async function DELETE(request: Request) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return unauthorized("Authentication required");
        }

        // Check if superadmin
        const { data: isAdmin } = await supabase.rpc("is_superadmin");
        if (!isAdmin) {
            return unauthorized("SuperAdmin access required");
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return badRequest("id parameter required");
        }

        const adminClient = createAdminClient();

        const { data, error } = await adminClient
            .from("feedback")
            .delete()
            .eq("id", id)
            .select()
            .single();

        if (error) {
            return badRequest(error.message);
        }

        return json({ success: true, deleted: data });
    } catch (error: any) {
        return badRequest(error.message || "Unknown error");
    }
}
