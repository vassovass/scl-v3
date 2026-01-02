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
    "merged",
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

// =============================================================================
// Merge & AI Operations
// =============================================================================

/**
 * Schema for merge operation
 * POST /api/admin/feedback/merge
 */
export const mergeSchema = z.object({
    primaryId: z.string().uuid("Invalid primary ID"),
    secondaryIds: z
        .array(z.string().uuid())
        .min(1, "At least one item to merge is required")
        .max(99, "Maximum 99 items to merge"),
    mergedDescription: z.string().optional(),
    useAI: z.boolean().optional(),
    preview: z.boolean().optional(),
});

// =============================================================================
// Import Operations
// =============================================================================

/**
 * Schema for individual import item
 */
export const importItemSchema = z.object({
    id: z.string().optional(), // If present, update; if empty, create
    type: z.enum(['bug', 'feature', 'general', 'positive', 'negative']).optional(),
    subject: z.string().min(1).optional(),
    description: z.string().optional(),
    board_status: boardStatusSchema.optional(),
    is_public: z.boolean().optional(),
    priority_order: z.number().int().optional(),
    target_release: targetReleaseSchema.nullable().optional(),
    completed_at: z.string().nullable().optional(),
});

/**
 * Schema for bulk import operations
 * POST /api/admin/feedback/import
 */
export const bulkImportSchema = z.object({
    items: z
        .array(importItemSchema)
        .min(1, "At least one item required")
        .max(500, "Maximum 500 items per import"),
});

export type ImportItem = z.infer<typeof importItemSchema>;
export type BulkImportInput = z.infer<typeof bulkImportSchema>;

/**
 * Schema for AI chat
 * POST /api/ai/chat
 */
export const aiChatSchema = z.object({
    message: z.string().min(1, "Message is required"),
    conversationHistory: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
    })).optional(),
});

export type MergeInput = z.infer<typeof mergeSchema>;
export type AIChatInput = z.infer<typeof aiChatSchema>;
