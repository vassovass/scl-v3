/**
 * Bulk Feedback API
 * 
 * PATCH /api/admin/feedback/bulk - Bulk update feedback items
 */

import { withApiHandler } from "@/lib/api/handler";
import { bulkUpdateSchema } from "@/lib/schemas/feedback";

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/feedback/bulk
 * Bulk update multiple feedback/kanban items (superadmin only)
 * 
 * Request body:
 * {
 *   ids: string[];      // UUIDs of items to update (1-100)
 *   updates: {
 *     board_status?: "backlog" | "todo" | "in_progress" | "review" | "done";
 *     priority_order?: number;
 *     is_public?: boolean;
 *     target_release?: "now" | "next" | "later" | "future" | null;
 *   }
 * }
 * 
 * Response:
 * {
 *   success: true;
 *   updated: number;  // Count of items updated
 * }
 */
export const PATCH = withApiHandler({
    auth: 'superadmin',
    schema: bulkUpdateSchema,
}, async ({ body, adminClient }) => {
    const { ids, updates } = body;

    // Build update object
    const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
    };

    if (updates.board_status !== undefined) {
        updateData.board_status = updates.board_status;
    }
    if (updates.priority_order !== undefined) {
        updateData.priority_order = updates.priority_order;
    }
    if (updates.is_public !== undefined) {
        updateData.is_public = updates.is_public;
    }
    if (updates.target_release !== undefined) {
        updateData.target_release = updates.target_release;
    }

    // If marking as done, set completed_at
    if (updates.board_status === "done") {
        updateData.completed_at = new Date().toISOString().split("T")[0];
    }

    // Atomic bulk update using .in()
    const { data, error } = await adminClient
        .from("feedback")
        .update(updateData)
        .in("id", ids)
        .select("id");

    if (error) {
        console.error("Bulk update error:", error);
        return { success: false, error: error.message, updated: 0 };
    }

    return {
        success: true,
        updated: data?.length ?? 0,
    };
});
