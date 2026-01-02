/**
 * Import Feedback API
 * 
 * POST /api/admin/feedback/import - Bulk import feedback items via CSV
 * 
 * Supports upsert logic:
 * - Items with existing ID: update
 * - Items without ID: create new
 * 
 * @see PRD 16: Import/Export System
 */

import { withApiHandler } from "@/lib/api/handler";
import { bulkImportSchema, ImportItem, importItemSchema } from "@/lib/schemas/feedback";
import { z } from "zod";

export const dynamic = 'force-dynamic';

interface ImportSummary {
    updated: number;
    created: number;
    errors: number;
}

interface ImportError {
    row?: number;
    id?: string;
    message: string;
}

/**
 * POST /api/admin/feedback/import
 * Bulk import/update feedback items (superadmin only)
 * 
 * Request body:
 * {
 *   items: Array<{
 *     id?: string;           // If present, update existing; if empty, create new
 *     type?: string;
 *     subject?: string;
 *     description?: string;
 *     board_status?: string;
 *     is_public?: boolean;
 *     priority_order?: number;
 *     target_release?: string;
 *     completed_at?: string;
 *   }>
 * }
 * 
 * Response:
 * {
 *   success: boolean;
 *   summary: { updated: number; created: number; errors: number };
 *   errors: Array<{ row?: number; id?: string; message: string }>;
 * }
 */
export const POST = withApiHandler({
    auth: 'superadmin',
    schema: bulkImportSchema,
}, async ({ body, adminClient }) => {
    const { items } = body;

    const summary: ImportSummary = { updated: 0, created: 0, errors: 0 };
    const errors: ImportError[] = [];

    // Separate items into updates and creates
    const toUpdate: Array<{ id: string; item: ImportItem }> = [];
    const toCreate: ImportItem[] = [];

    // Validating against relaxed bulk schema's items array
    for (let i = 0; i < items.length; i++) {
        const rawItem = items[i];

        // Validate item individually
        const result = importItemSchema.safeParse(rawItem);

        if (!result.success) {
            // Validation failed
            const message = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
            errors.push({
                row: i + 1, // 1-based index for user friendliness
                message: `Validation failed: ${message}`
            });
            summary.errors++;
            continue;
        }

        const item = result.data as ImportItem;
        const id = item.id?.trim();

        if (id && id.length > 0) {
            // Has ID - will update
            toUpdate.push({ id, item });
        } else {
            // No ID - will create
            toCreate.push(item);
        }
    }

    // Process updates
    for (const { id, item } of toUpdate) {
        try {
            // Build update object (only include non-undefined fields)
            const updateData: Record<string, unknown> = {
                updated_at: new Date().toISOString(),
            };

            if (item.type !== undefined) updateData.type = item.type;
            if (item.subject !== undefined) updateData.subject = item.subject;
            if (item.description !== undefined) updateData.description = item.description;
            if (item.board_status !== undefined) updateData.board_status = item.board_status;
            if (item.is_public !== undefined) updateData.is_public = item.is_public;
            if (item.priority_order !== undefined) updateData.priority_order = item.priority_order;
            if (item.target_release !== undefined) updateData.target_release = item.target_release;
            if (item.completed_at !== undefined) updateData.completed_at = item.completed_at;

            // If marking as done, set completed_at if not already set
            if (item.board_status === 'done' && !item.completed_at) {
                updateData.completed_at = new Date().toISOString().split('T')[0];
            }

            const { error } = await adminClient
                .from('feedback')
                .update(updateData)
                .eq('id', id);

            if (error) {
                errors.push({ id, message: error.message });
                summary.errors++;
            } else {
                summary.updated++;
            }
        } catch (err) {
            errors.push({
                id,
                message: err instanceof Error ? err.message : 'Update failed'
            });
            summary.errors++;
        }
    }

    // Process creates (batch insert for efficiency)
    if (toCreate.length > 0) {
        const newItems = toCreate.map(item => ({
            type: item.type || 'general',
            subject: item.subject || 'Imported Item',
            description: item.description || '',
            board_status: item.board_status || 'backlog',
            is_public: item.is_public ?? false,
            priority_order: item.priority_order ?? 0,
            target_release: item.target_release || null,
            completed_at: item.completed_at || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }));

        const { data, error } = await adminClient
            .from('feedback')
            .insert(newItems)
            .select('id');

        if (error) {
            errors.push({ message: `Failed to create items: ${error.message}` });
            summary.errors += toCreate.length;
        } else {
            summary.created = data?.length ?? 0;
        }
    }

    return {
        // Return true if operation completed without throwing entirely,
        // letting UI handle per-item errors.
        success: true,
        summary,
        errors,
    };
});
