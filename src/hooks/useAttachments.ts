/**
 * useAttachments Hook
 * 
 * Generic hook for managing attachments on any entity.
 * Provides: fetch, upload, delete, and error handling.
 * 
 * @example
 * const { attachments, isLoading, upload, remove, error } = useAttachments('feedback', feedbackId);
 */

"use client";

import { useState, useEffect, useCallback } from 'react';
import {
    Attachment,
    AttachmentWithMeta,
    EntityType,
    ALLOWED_MIME_TYPES,
    MAX_FILE_SIZE_BYTES,
    MAX_FILE_SIZE_DISPLAY,
    isAllowedMimeType,
    formatBytes,
} from '@/types/attachments';
import {
    AppError,
    ErrorCode,
    normalizeError,
    reportErrorClient,
} from '@/lib/errors';

// =============================================================================
// Types
// =============================================================================

interface UseAttachmentsOptions {
    /** Auto-fetch on mount */
    autoFetch?: boolean;
    /** Called when upload succeeds */
    onUploadSuccess?: (attachment: Attachment) => void;
    /** Called when any error occurs */
    onError?: (error: AppError) => void;
}

interface UseAttachmentsReturn {
    /** List of attachments */
    attachments: AttachmentWithMeta[];
    /** Loading state */
    isLoading: boolean;
    /** Uploading state */
    isUploading: boolean;
    /** Current error (null if none) */
    error: AppError | null;
    /** Upload a new file */
    upload: (file: File) => Promise<Attachment | null>;
    /** Remove an attachment */
    remove: (attachmentId: string) => Promise<boolean>;
    /** Refresh attachment list */
    refresh: () => Promise<void>;
    /** Clear current error */
    clearError: () => void;
    /** Check if a file is valid for upload */
    validateFile: (file: File) => AppError | null;
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useAttachments(
    entityType: EntityType,
    entityId: string | null,
    options: UseAttachmentsOptions = {}
): UseAttachmentsReturn {
    const { autoFetch = true, onUploadSuccess, onError } = options;

    const [attachments, setAttachments] = useState<AttachmentWithMeta[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<AppError | null>(null);

    // Handle errors consistently
    const handleError = useCallback((err: unknown, fallbackCode?: ErrorCode) => {
        const appError = normalizeError(err, fallbackCode);
        setError(appError);
        reportErrorClient(appError);
        onError?.(appError);
        return appError;
    }, [onError]);

    // Clear error
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Validate file before upload
    const validateFile = useCallback((file: File): AppError | null => {
        // Check type
        if (!isAllowedMimeType(file.type)) {
            return new AppError({
                code: ErrorCode.UPLOAD_INVALID_TYPE,
                message: `File type "${file.type}" is not allowed. Use: ${ALLOWED_MIME_TYPES.join(', ')}`,
                context: { fileType: file.type },
                recoverable: true,
            });
        }

        // Check size
        if (file.size > MAX_FILE_SIZE_BYTES) {
            return new AppError({
                code: ErrorCode.UPLOAD_TOO_LARGE,
                message: `File size ${formatBytes(file.size)} exceeds ${MAX_FILE_SIZE_DISPLAY} limit`,
                context: { fileSize: file.size, maxSize: MAX_FILE_SIZE_BYTES },
                recoverable: true,
            });
        }

        return null;
    }, []);

    // Fetch attachments
    const refresh = useCallback(async () => {
        if (!entityId) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `/api/attachments?entity_type=${entityType}&entity_id=${entityId}`
            );

            if (!response.ok) {
                const data = await response.json();
                throw new AppError({
                    code: ErrorCode.ATTACHMENT_FETCH_FAILED,
                    message: data.error || 'Failed to fetch attachments',
                    context: { status: response.status },
                });
            }

            const data = await response.json();
            setAttachments(data.attachments || []);

        } catch (err) {
            handleError(err, ErrorCode.ATTACHMENT_FETCH_FAILED);
        } finally {
            setIsLoading(false);
        }
    }, [entityType, entityId, handleError]);

    // Upload a file
    const upload = useCallback(async (file: File): Promise<Attachment | null> => {
        if (!entityId) {
            handleError(new AppError({
                code: ErrorCode.VALIDATION_FAILED,
                message: 'Entity ID is required for upload',
            }));
            return null;
        }

        // Validate first
        const validationError = validateFile(file);
        if (validationError) {
            handleError(validationError);
            return null;
        }

        setIsUploading(true);
        setError(null);

        // Create optimistic preview
        const previewId = `preview-${Date.now()}`;
        const previewUrl = URL.createObjectURL(file);

        const optimisticAttachment: AttachmentWithMeta = {
            id: previewId,
            entity_type: entityType,
            entity_id: entityId,
            file_url: previewUrl,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            uploaded_by: null,
            created_at: new Date().toISOString(),
            isUploading: true,
            previewUrl,
        };

        setAttachments(prev => [optimisticAttachment, ...prev]);

        try {
            // Convert to base64
            const base64 = await fileToBase64(file);

            const response = await fetch('/api/attachments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    entity_type: entityType,
                    entity_id: entityId,
                    file_name: file.name,
                    file_type: file.type,
                    file_data: base64,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new AppError({
                    code: ErrorCode.UPLOAD_FAILED,
                    message: data.error || 'Upload failed',
                    context: { status: response.status },
                    recoverable: true,
                });
            }

            const data = await response.json();
            const newAttachment = data.attachment as Attachment;

            // Replace optimistic with real
            setAttachments(prev =>
                prev.map(a => a.id === previewId ? newAttachment : a)
            );

            // Cleanup preview URL
            URL.revokeObjectURL(previewUrl);

            onUploadSuccess?.(newAttachment);
            return newAttachment;

        } catch (err) {
            // Remove optimistic on failure
            setAttachments(prev => prev.filter(a => a.id !== previewId));
            URL.revokeObjectURL(previewUrl);

            handleError(err, ErrorCode.UPLOAD_FAILED);
            return null;

        } finally {
            setIsUploading(false);
        }
    }, [entityType, entityId, validateFile, handleError, onUploadSuccess]);

    // Remove an attachment
    const remove = useCallback(async (attachmentId: string): Promise<boolean> => {
        setError(null);

        // Optimistic removal
        const previousAttachments = attachments;
        setAttachments(prev => prev.filter(a => a.id !== attachmentId));

        try {
            const response = await fetch(`/api/attachments?id=${attachmentId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const data = await response.json();
                throw new AppError({
                    code: ErrorCode.ATTACHMENT_DELETE_FAILED,
                    message: data.error || 'Delete failed',
                    context: { attachmentId, status: response.status },
                });
            }

            return true;

        } catch (err) {
            // Restore on failure
            setAttachments(previousAttachments);
            handleError(err, ErrorCode.ATTACHMENT_DELETE_FAILED);
            return false;
        }
    }, [attachments, handleError]);

    // Auto-fetch on mount
    useEffect(() => {
        if (autoFetch && entityId) {
            refresh();
        }
    }, [autoFetch, entityId, refresh]);

    return {
        attachments,
        isLoading,
        isUploading,
        error,
        upload,
        remove,
        refresh,
        clearError,
        validateFile,
    };
}

// =============================================================================
// Helpers
// =============================================================================

function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

export default useAttachments;

