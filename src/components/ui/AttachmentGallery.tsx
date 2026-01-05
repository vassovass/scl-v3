/**
 * AttachmentGallery Component
 * 
 * Displays a grid of attachment thumbnails with lightbox and delete functionality.
 * 
 * @example
 * <AttachmentGallery 
 *   attachments={attachments}
 *   onDelete={handleDelete}
 *   canDelete={isAdmin}
 * />
 */

"use client";

import { useState, useCallback } from 'react';
import { Attachment, AttachmentWithMeta } from '@/types/attachments';

// =============================================================================
// Types
// =============================================================================

interface AttachmentGalleryProps {
    /** List of attachments to display */
    attachments: (Attachment | AttachmentWithMeta)[];
    /** Called when delete is clicked */
    onDelete?: (attachmentId: string) => Promise<void>;
    /** Whether user can delete attachments */
    canDelete?: boolean;
    /** Whether deletions are in progress */
    isDeleting?: boolean;
    /** Custom className */
    className?: string;
    /** Number of columns for grid */
    columns?: 2 | 3 | 4;
    /** Show empty state when no attachments */
    showEmpty?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function AttachmentGallery({
    attachments,
    onDelete,
    canDelete = false,
    isDeleting = false,
    className = '',
    columns = 3,
    showEmpty = false,
}: AttachmentGalleryProps) {
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Handle delete
    const handleDelete = useCallback(async (attachmentId: string) => {
        if (!onDelete || isDeleting) return;

        setDeletingId(attachmentId);
        try {
            await onDelete(attachmentId);
        } finally {
            setDeletingId(null);
        }
    }, [onDelete, isDeleting]);

    // Grid column class
    const gridClass = {
        2: 'grid-cols-2',
        3: 'grid-cols-2 sm:grid-cols-3',
        4: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
    }[columns];

    // Empty state
    if (attachments.length === 0) {
        if (!showEmpty) return null;
        return (
            <div className={`text-center py-8 text-slate-500 ${className}`}>
                <span className="text-3xl mb-2 block">🖼️</span>
                <p className="text-sm">No attachments</p>
            </div>
        );
    }

    return (
        <>
            {/* Gallery grid */}
            <div className={`grid ${gridClass} gap-2 ${className}`}>
                {attachments.map((attachment) => {
                    const isUploading = 'isUploading' in attachment && attachment.isUploading;
                    const imageUrl = 'previewUrl' in attachment && attachment.previewUrl
                        ? attachment.previewUrl
                        : attachment.file_url;

                    return (
                        <div
                            key={attachment.id}
                            className={`
                relative group rounded-lg overflow-hidden bg-slate-800 border border-slate-700
                aspect-video
                ${isUploading ? 'opacity-60' : 'cursor-pointer hover:border-slate-600'}
              `}
                            onClick={() => !isUploading && setLightboxImage(imageUrl)}
                        >
                            {/* Image */}
                            <img
                                src={imageUrl}
                                alt={attachment.file_name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />

                            {/* Uploading overlay */}
                            {isUploading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                    <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}

                            {/* Hover overlay with actions */}
                            {!isUploading && (
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <div className="flex gap-2">
                                        {/* Expand button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setLightboxImage(imageUrl);
                                            }}
                                            className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                                            title="View full size"
                                        >
                                            🔍
                                        </button>

                                        {/* Delete button */}
                                        {canDelete && onDelete && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(attachment.id);
                                                }}
                                                disabled={deletingId === attachment.id}
                                                className={`
                          p-2 rounded-full bg-red-500/30 hover:bg-red-500/50 text-white transition-colors
                          ${deletingId === attachment.id ? 'opacity-50' : ''}
                        `}
                                                title="Delete"
                                            >
                                                {deletingId === attachment.id ? '⏳' : '🗑️'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* File name tooltip */}
                            <div className="absolute bottom-0 left-0 right-0 p-1 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-[10px] text-white truncate px-1">
                                    {attachment.file_name}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Lightbox */}
            {lightboxImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
                    onClick={() => setLightboxImage(null)}
                >
                    {/* Close button */}
                    <button
                        onClick={() => setLightboxImage(null)}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xl transition-colors"
                    >
                        ✕
                    </button>

                    {/* Image */}
                    <img
                        src={lightboxImage}
                        alt="Full size preview"
                        className="max-w-full max-h-full object-contain rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </>
    );
}

export default AttachmentGallery;
