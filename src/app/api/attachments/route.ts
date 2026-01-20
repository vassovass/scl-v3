/**
 * Attachments API
 * 
 * Generic attachment management for any entity type.
 * 
 * GET  /api/attachments?entity_type=feedback&entity_id=xxx - List attachments
 * POST /api/attachments - Upload new attachment (base64 or form data)
 * DELETE /api/attachments?id=xxx - Delete attachment
 */

import { withApiHandler } from "@/lib/api/handler";
import { z } from "zod";
import { badRequest, notFound } from "@/lib/api";
import { AppError, ErrorCode, normalizeError, reportError } from "@/lib/errors";
import {
    EntityType,
    ALLOWED_MIME_TYPES,
    MAX_FILE_SIZE_BYTES,
    MAX_FILE_SIZE_DISPLAY,
    STORAGE_BUCKET,
    getStoragePath,
    isAllowedMimeType,
    formatBytes,
} from "@/types/attachments";

// =============================================================================
// Schemas
// =============================================================================

const querySchema = z.object({
    entity_type: z.enum(['feedback', 'submission', 'league', 'user']),
    entity_id: z.string().uuid(),
});

const uploadSchema = z.object({
    entity_type: z.enum(['feedback', 'submission', 'league', 'user']),
    entity_id: z.string().uuid(),
    file_name: z.string().min(1),
    file_type: z.string().min(1),
    file_data: z.string().min(1), // base64 encoded
});

const deleteSchema = z.object({
    id: z.string().uuid(),
});

// =============================================================================
// GET - List attachments for an entity
// =============================================================================

export async function GET(request: Request): Promise<Response> {
    try {
        const url = new URL(request.url);
        const entity_type = url.searchParams.get('entity_type');
        const entity_id = url.searchParams.get('entity_id');

        // Validate query params
        const parsed = querySchema.safeParse({ entity_type, entity_id });
        if (!parsed.success) {
            return badRequest('entity_type and entity_id are required');
        }

        // Import dynamically to avoid client bundling
        const { createAdminClient } = await import('@/lib/supabase/server');
        const adminClient = createAdminClient();

        const { data: attachments, error } = await adminClient
            .from('attachments')
            .select('*')
            .eq('entity_type', parsed.data.entity_type)
            .eq('entity_id', parsed.data.entity_id)
            .order('created_at', { ascending: false });

        if (error) {
            throw new AppError({
                code: ErrorCode.ATTACHMENT_FETCH_FAILED,
                message: 'Failed to fetch attachments',
                context: { error: error.message },
            });
        }

        return Response.json({
            attachments: attachments || [],
            total: attachments?.length || 0,
        });

    } catch (err) {
        const appError = normalizeError(err, ErrorCode.ATTACHMENT_FETCH_FAILED);
        await reportError(appError);
        return Response.json({ error: appError.message }, { status: 500 });
    }
}

// =============================================================================
// POST - Upload new attachment
// =============================================================================

export const POST = withApiHandler({
    auth: 'required',
    schema: uploadSchema,
}, async ({ user, body, adminClient }) => {
    const { entity_type, entity_id, file_name, file_type, file_data } = body;

    try {
        // Validate file type
        if (!isAllowedMimeType(file_type)) {
            throw new AppError({
                code: ErrorCode.UPLOAD_INVALID_TYPE,
                message: `File type "${file_type}" is not allowed. Use: ${ALLOWED_MIME_TYPES.join(', ')}`,
                context: { fileType: file_type, allowedTypes: ALLOWED_MIME_TYPES },
                recoverable: true,
            });
        }

        // Decode base64 and validate size
        const base64Data = file_data.replace(/^data:[^;]+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const fileSize = buffer.length;

        if (fileSize > MAX_FILE_SIZE_BYTES) {
            throw new AppError({
                code: ErrorCode.UPLOAD_TOO_LARGE,
                message: `File size ${formatBytes(fileSize)} exceeds ${MAX_FILE_SIZE_DISPLAY} limit`,
                context: { fileSize, maxSize: MAX_FILE_SIZE_BYTES },
                recoverable: true,
            });
        }

        // Generate storage path
        const storagePath = getStoragePath(entity_type as EntityType, entity_id, file_name);

        // Upload to storage
        const { data: uploadData, error: uploadError } = await adminClient.storage
            .from(STORAGE_BUCKET)
            .upload(storagePath, buffer, {
                contentType: file_type,
                upsert: false,
            });

        if (uploadError) {
            throw new AppError({
                code: ErrorCode.UPLOAD_STORAGE_ERROR,
                message: 'Failed to upload file to storage',
                context: { storageError: uploadError.message },
                recoverable: true,
            });
        }

        // Get public URL
        const { data: urlData } = adminClient.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(uploadData.path);

        // Insert attachment record
        const { data: attachment, error: insertError } = await adminClient
            .from('attachments')
            .insert({
                entity_type,
                entity_id,
                file_url: urlData.publicUrl,
                file_name,
                file_type,
                file_size: fileSize,
                uploaded_by: user?.id || null,
            })
            .select()
            .single();

        if (insertError) {
            // Try to clean up the uploaded file
            await adminClient.storage.from(STORAGE_BUCKET).remove([storagePath]);

            throw new AppError({
                code: ErrorCode.DB_INSERT_FAILED,
                message: 'Failed to save attachment record',
                context: { dbError: insertError.message },
                recoverable: true,
            });
        }

        return {
            success: true,
            attachment,
        };

    } catch (err) {
        const appError = normalizeError(err, ErrorCode.UPLOAD_FAILED);
        await reportError(appError, user?.id);

        // Return structured error
        return badRequest(appError.message);
    }
});

// =============================================================================
// DELETE - Remove attachment
// =============================================================================

export async function DELETE(request: Request): Promise<Response> {
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        // Validate
        const parsed = deleteSchema.safeParse({ id });
        if (!parsed.success) {
            return badRequest('Attachment ID is required');
        }

        // Auth check
        const { createServerSupabaseClient, createAdminClient } = await import('@/lib/supabase/server');
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const adminClient = createAdminClient();

        // Check if user is superadmin or owner
        const { data: userData } = await adminClient
            .from('users')
            .select('is_superadmin')
            .eq('id', user.id)
            .single();

        const isSuperAdmin = userData?.is_superadmin ?? false;

        // Get attachment
        const { data: attachment, error: fetchError } = await adminClient
            .from('attachments')
            .select('*')
            .eq('id', parsed.data.id)
            .single();

        if (fetchError || !attachment) {
            return notFound('Attachment not found');
        }

        // Check permission
        if (!isSuperAdmin && attachment.uploaded_by !== user.id) {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Extract storage path from URL
        const urlParts = attachment.file_url.split('/');
        const bucketIndex = urlParts.indexOf(STORAGE_BUCKET);
        const storagePath = urlParts.slice(bucketIndex + 1).join('/');

        // Delete from storage
        if (storagePath) {
            await adminClient.storage.from(STORAGE_BUCKET).remove([storagePath]);
        }

        // Delete record
        const { error: deleteError } = await adminClient
            .from('attachments')
            .delete()
            .eq('id', parsed.data.id);

        if (deleteError) {
            throw new AppError({
                code: ErrorCode.ATTACHMENT_DELETE_FAILED,
                message: 'Failed to delete attachment',
                context: { dbError: deleteError.message },
            });
        }

        return Response.json({
            success: true,
            deleted: parsed.data.id,
        });

    } catch (err) {
        const appError = normalizeError(err, ErrorCode.ATTACHMENT_DELETE_FAILED);
        await reportError(appError);
        return Response.json({ error: appError.message }, { status: 500 });
    }
}

