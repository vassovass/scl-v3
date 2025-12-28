/**
 * Feedback Schemas
 * 
 * Zod schemas for feedback-related API operations.
 */

import { z } from "zod";

// Valid board statuses
export const boardStatusSchema = z.enum([
    "backlog",
    "todo",
    "in_progress",
    "review",
    "done",
]);

// Valid target releases
export const targetReleaseSchema = z.enum([
    "now",
    "next",
    "later",
    "future",
]);

// =============================================================================
// Bulk Operations
// =============================================================================

/**
 * Schema for bulk update operations
 * PATCH /api/admin/feedback/bulk
 */
export const bulkUpdateSchema = z.object({
    ids: z
        .array(z.string().uuid())
        .min(1, "At least one ID required")
        .max(100, "Maximum 100 items per operation"),
    updates: z
        .object({
            board_status: boardStatusSchema.optional(),
            priority_order: z.number().int().optional(),
            is_public: z.boolean().optional(),
            target_release: targetReleaseSchema.nullable().optional(),
        })
        .refine(
            (obj) => Object.values(obj).some((v) => v !== undefined),
            "At least one update field required"
        ),
});

/**
 * Schema for bulk archive operations
 * POST /api/admin/feedback/bulk/archive
 */
export const bulkArchiveSchema = z.object({
    ids: z
        .array(z.string().uuid())
        .min(1, "At least one ID required")
        .max(100, "Maximum 100 items per operation"),
});

// Type exports
export type BulkUpdateInput = z.infer<typeof bulkUpdateSchema>;
export type BulkArchiveInput = z.infer<typeof bulkArchiveSchema>;
export type BoardStatus = z.infer<typeof boardStatusSchema>;
export type TargetRelease = z.infer<typeof targetReleaseSchema>;
