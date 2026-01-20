/**
 * Attachment Types
 * 
 * Generic attachment system supporting any entity type.
 * Used by: useAttachments hook, /api/attachments, AttachmentGallery component
 */

// =============================================================================
// Entity Types
// =============================================================================

/** Supported entity types for attachments */
export type EntityType = 'feedback' | 'submission' | 'league' | 'user';

/** Map of entity types to their primary table names */
export const ENTITY_TABLES: Record<EntityType, string> = {
    feedback: 'feedback',
    submission: 'submissions',
    league: 'leagues',
    user: 'users',
} as const;

// =============================================================================
// Attachment Types
// =============================================================================

/** Attachment record from database */
export interface Attachment {
    id: string;
    entity_type: EntityType;
    entity_id: string;
    file_url: string;
    file_name: string;
    file_type: string;
    file_size: number | null;
    uploaded_by: string | null;
    created_at: string;
}

/** Data needed to create a new attachment */
export interface AttachmentInsert {
    entity_type: EntityType;
    entity_id: string;
    file_url: string;
    file_name: string;
    file_type: string;
    file_size?: number | null;
    uploaded_by?: string | null;
}

/** Attachment with upload metadata (used by useAttachments hook) */
export interface AttachmentWithMeta extends Attachment {
    /** True while upload is in progress */
    isUploading?: boolean;
    /** Upload progress 0-100 */
    uploadProgress?: number;
    /** Preview URL (for optimistic UI) */
    previewUrl?: string;
}

// =============================================================================
// Upload Configuration
// =============================================================================

/** Allowed MIME types for uploads */
export const ALLOWED_MIME_TYPES = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'image/webp',
] as const;

export type AllowedMimeType = typeof ALLOWED_MIME_TYPES[number];

/** Maximum file size in bytes (5MB) */
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/** Maximum file size in human readable format */
export const MAX_FILE_SIZE_DISPLAY = '5MB';

/** Storage bucket name */
export const STORAGE_BUCKET = 'uploads';

/** Generate storage path for an attachment */
export function getStoragePath(entityType: EntityType, entityId: string, fileName: string): string {
    const ext = fileName.split('.').pop() || 'png';
    const uuid = crypto.randomUUID();
    return `attachments/${entityType}/${entityId}/${uuid}.${ext}`;
}

// =============================================================================
// Validation Helpers
// =============================================================================

/** Check if a MIME type is allowed */
export function isAllowedMimeType(mimeType: string): mimeType is AllowedMimeType {
    return ALLOWED_MIME_TYPES.includes(mimeType as AllowedMimeType);
}

/** Check if file size is within limits */
export function isFileSizeValid(sizeBytes: number): boolean {
    return sizeBytes <= MAX_FILE_SIZE_BYTES;
}

/** Format bytes to human readable string */
export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// =============================================================================
// API Response Types
// =============================================================================

/** Response from GET /api/attachments */
export interface AttachmentsResponse {
    attachments: Attachment[];
    total: number;
}

/** Response from POST /api/attachments */
export interface AttachmentUploadResponse {
    success: boolean;
    attachment: Attachment;
}

/** Response from DELETE /api/attachments */
export interface AttachmentDeleteResponse {
    success: boolean;
    deleted: string; // ID of deleted attachment
}

