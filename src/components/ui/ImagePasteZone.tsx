/**
 * ImagePasteZone Component
 * 
 * Drop zone for pasting or dragging images.
 * Supports: clipboard paste, drag-and-drop, file picker.
 * 
 * @example
 * <ImagePasteZone 
 *   onUpload={handleUpload}
 *   onError={handleError}
 *   maxSize={5 * 1024 * 1024}
 * />
 */

"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { AppError, ErrorCode, normalizeError } from '@/lib/errors';
import {
    ALLOWED_MIME_TYPES,
    MAX_FILE_SIZE_BYTES,
    MAX_FILE_SIZE_DISPLAY,
    isAllowedMimeType,
    formatBytes,
} from '@/types/attachments';

// =============================================================================
// Types
// =============================================================================

interface ImagePasteZoneProps {
    /** Called when file is selected/pasted */
    onUpload: (file: File) => Promise<void>;
    /** Called when an error occurs */
    onError?: (error: AppError) => void;
    /** Maximum file size in bytes */
    maxSize?: number;
    /** Accepted MIME types */
    acceptTypes?: readonly string[];
    /** Whether the zone is disabled */
    disabled?: boolean;
    /** Whether an upload is in progress */
    isUploading?: boolean;
    /** Custom className */
    className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function ImagePasteZone({
    onUpload,
    onError,
    maxSize = MAX_FILE_SIZE_BYTES,
    acceptTypes = ALLOWED_MIME_TYPES,
    disabled = false,
    isUploading = false,
    className = '',
}: ImagePasteZoneProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [error, setError] = useState<AppError | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Validate file
    const validateFile = useCallback((file: File): AppError | null => {
        if (!isAllowedMimeType(file.type) && !acceptTypes.includes(file.type)) {
            return new AppError({
                code: ErrorCode.UPLOAD_INVALID_TYPE,
                message: `File type not allowed. Use: ${acceptTypes.join(', ')}`,
                context: { fileType: file.type },
                recoverable: true,
            });
        }

        if (file.size > maxSize) {
            return new AppError({
                code: ErrorCode.UPLOAD_TOO_LARGE,
                message: `File too large (${formatBytes(file.size)}). Max: ${formatBytes(maxSize)}`,
                context: { fileSize: file.size, maxSize },
                recoverable: true,
            });
        }

        return null;
    }, [acceptTypes, maxSize]);

    // Handle file selection
    const handleFile = useCallback(async (file: File) => {
        if (disabled || isUploading) return;

        setError(null);

        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            onError?.(validationError);
            return;
        }

        try {
            await onUpload(file);
        } catch (err) {
            const appError = normalizeError(err, ErrorCode.UPLOAD_FAILED);
            setError(appError);
            onError?.(appError);
        }
    }, [disabled, isUploading, validateFile, onUpload, onError]);

    // Clipboard paste handler
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            if (disabled || isUploading) return;

            const items = e.clipboardData?.items;
            if (!items) return;

            for (const item of Array.from(items)) {
                if (item.type.startsWith('image/')) {
                    e.preventDefault();
                    const file = item.getAsFile();
                    if (file) {
                        handleFile(file);
                    }
                    return;
                }
            }
        };

        // Listen on document for global paste
        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, [disabled, isUploading, handleFile]);

    // Drag handlers
    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled && !isUploading) {
            setIsDragOver(true);
        }
    }, [disabled, isUploading]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        if (disabled || isUploading) return;

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            // Handle first file only
            const file = files[0];
            if (file.type.startsWith('image/')) {
                handleFile(file);
            }
        }
    }, [disabled, isUploading, handleFile]);

    // File input handler
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFile(files[0]);
        }
        // Reset input so same file can be selected again
        e.target.value = '';
    }, [handleFile]);

    // Click to open file picker
    const handleClick = useCallback(() => {
        if (!disabled && !isUploading) {
            fileInputRef.current?.click();
        }
    }, [disabled, isUploading]);

    // Clear error
    const handleClearError = useCallback(() => {
        setError(null);
    }, []);

    return (
        <div className={`relative ${className}`}>
            {/* Error banner */}
            {error && (
                <div className="mb-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
                    <span className="text-red-400 flex-1 text-sm">{error.toUserMessage?.() || error.message}</span>
                    {error.recoverable && (
                        <button
                            onClick={handleClearError}
                            className="text-xs text-red-400 hover:text-red-300 underline"
                        >
                            Dismiss
                        </button>
                    )}
                </div>
            )}

            {/* Drop zone */}
            <div
                ref={containerRef}
                onClick={handleClick}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`
          relative flex flex-col items-center justify-center gap-2
          p-6 rounded-xl border-2 border-dashed transition-all cursor-pointer
          ${isDragOver
                        ? 'border-sky-500 bg-sky-500/10'
                        : 'border-slate-600 hover:border-slate-500 bg-slate-800/30 hover:bg-slate-800/50'
                    }
          ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
            >
                {/* Icons and text */}
                {isUploading ? (
                    <>
                        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-slate-400">Uploading...</span>
                    </>
                ) : (
                    <>
                        <div className="flex items-center gap-4 text-slate-500">
                            <span className="text-2xl">📋</span>
                            <span className="text-xl">+</span>
                            <span className="text-2xl">📁</span>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-slate-300">
                                <span className="font-medium text-sky-400">Paste</span> an image or{' '}
                                <span className="font-medium text-sky-400">drag & drop</span>
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                Ctrl+V / Cmd+V • Max {MAX_FILE_SIZE_DISPLAY}
                            </p>
                        </div>
                    </>
                )}

                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={acceptTypes.join(',')}
                    onChange={handleInputChange}
                    className="hidden"
                    disabled={disabled || isUploading}
                />
            </div>
        </div>
    );
}

export default ImagePasteZone;
