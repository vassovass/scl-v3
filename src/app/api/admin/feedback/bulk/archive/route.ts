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
 * Sets board_status to "done" and completed_at to current date.
 * 
 * Request body:
 * {
 *   ids: string[];  // UUIDs of items to archive (1-100)
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
    const { ids } = body;

    const now = new Date();
    const dateString = now.toISOString().split("T")[0]; // YYYY-MM-DD

    // Atomic bulk archive
    const { data, error } = await adminClient
        .from("feedback")
        .update({
            board_status: "done",
            completed_at: dateString,
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
});
