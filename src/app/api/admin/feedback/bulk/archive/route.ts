/**
 * Bulk Archive API
 * 
 * POST /api/admin/feedback/bulk/archive - Archive multiple feedback items
 */

import { withApiHandler } from "@/lib/api/handler";
import { bulkArchiveSchema } from "@/lib/schemas/feedback";

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/feedback/bulk/archive
 * Archive multiple feedback/kanban items at once (superadmin only)
 * 
 * Sets archived_at to current timestamp (soft delete).
 * Items will be hidden from the main Kanban view.
 * 
 * Request body:
 * {
 *   ids: string[];  // UUIDs of items to archive (1-100)
 *   hard?: boolean; // If true, permanently delete. Default: false (soft delete)
 * }
 * 
 * Response:
 * {
 *   success: true;
 *   archived: number;  // Count of items archived
 * }
 */
export const POST = withApiHandler({
    auth: 'superadmin',
    schema: bulkArchiveSchema,
}, async ({ body, adminClient }) => {
    const { ids, hard } = body;

    const now = new Date();

    if (hard) {
        // Hard delete - permanently remove from database
        const { data, error } = await adminClient
            .from("feedback")
            .delete()
            .in("id", ids)
            .select("id");

        if (error) {
            console.error("Bulk hard delete error:", error);
            return { success: false, error: error.message, deleted: 0 };
        }

        return {
            success: true,
            deleted: data?.length ?? 0,
            hard: true,
        };
    } else {
        // Soft delete - set archived_at timestamp
        const { data, error } = await adminClient
            .from("feedback")
            .update({
                archived_at: now.toISOString(),
                updated_at: now.toISOString(),
            })
            .in("id", ids)
            .select("id");

        if (error) {
            console.error("Bulk archive error:", error);
            return { success: false, error: error.message, archived: 0 };
        }

        return {
            success: true,
            archived: data?.length ?? 0,
        };
    }
});


