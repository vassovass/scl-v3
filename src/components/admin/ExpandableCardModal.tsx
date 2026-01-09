/**
 * ExpandableCardModal Component
 * 
 * Full-detail modal for viewing/editing feedback items.
 * Features: editable fields, attachment gallery, image paste zone.
 * 
 * @example
 * <ExpandableCardModal
 *   item={selectedItem}
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   onUpdate={handleItemUpdate}
 *   canEdit={isSuperAdmin}
 * />
 */

"use client";

import { useState, useCallback, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { SystemBadge as Badge } from '@/components/ui/SystemBadge';
import { ImagePasteZone } from '@/components/ui/ImagePasteZone';
import { AttachmentGallery } from '@/components/ui/AttachmentGallery';
import { useAttachments } from '@/hooks/useAttachments';
import { TYPE_COLORS, RELEASE_OPTIONS } from '@/lib/badges';
import { BOARD_STATUS_OPTIONS } from '@/lib/filters/feedbackFilters';

// =============================================================================
// Types
// =============================================================================

export interface FeedbackItem {
    id: string;
    type: string;
    subject: string;
    description: string;
    board_status: string;
    is_public: boolean;
    priority_order: number;
    created_at: string;
    completed_at: string | null;
    target_release: string;
    user_id: string | null;
    users?: { nickname: string } | null;
    screenshot_url: string | null;
}

interface ExpandableCardModalProps {
    /** Item to display/edit */
    item: FeedbackItem | null;
    /** Whether modal is open */
    isOpen: boolean;
    /** Called when modal is closed */
    onClose: () => void;
    /** Called when item is updated */
    onUpdate?: (updatedItem: FeedbackItem) => void;
    /** Whether user can edit the item */
    canEdit?: boolean;
    /** Whether user can manage attachments */
    canManageAttachments?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function ExpandableCardModal({
    item,
    isOpen,
    onClose,
    onUpdate,
    canEdit = false,
    canManageAttachments = false,
}: ExpandableCardModalProps) {
    // Form state
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [boardStatus, setBoardStatus] = useState('');
    const [targetRelease, setTargetRelease] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Attachments
    const {
        attachments,
        isLoading: isLoadingAttachments,
        isUploading,
        upload,
        remove,
        error: attachmentError,
    } = useAttachments('feedback', item?.id || null, {
        autoFetch: isOpen && !!item?.id,
    });

    // Reset form when item changes
    useEffect(() => {
        if (item) {
            setSubject(item.subject || '');
            setDescription(item.description || '');
            setBoardStatus(item.board_status || 'backlog');
            setTargetRelease(item.target_release || 'later');
            setIsPublic(item.is_public || false);
            setHasChanges(false);
        }
    }, [item]);

    // Track changes
    const handleFieldChange = useCallback(() => {
        setHasChanges(true);
    }, []);

    // Save changes
    const handleSave = useCallback(async () => {
        if (!item || !canEdit || !hasChanges) return;

        setIsSaving(true);
        try {
            const response = await fetch('/api/admin/kanban', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: item.id,
                    subject,
                    description,
                    board_status: boardStatus,
                    target_release: targetRelease,
                    is_public: isPublic,
                }),
            });

            if (response.ok) {
                const updatedItem: FeedbackItem = {
                    ...item,
                    subject,
                    description,
                    board_status: boardStatus,
                    target_release: targetRelease,
                    is_public: isPublic,
                };
                onUpdate?.(updatedItem);
                setHasChanges(false);
            }
        } finally {
            setIsSaving(false);
        }
    }, [item, canEdit, hasChanges, subject, description, boardStatus, targetRelease, isPublic, onUpdate]);

    // Handle upload
    const handleUpload = useCallback(async (file: File) => {
        await upload(file);
    }, [upload]);

    // Handle delete attachment
    const handleDeleteAttachment = useCallback(async (attachmentId: string) => {
        await remove(attachmentId);
    }, [remove]);

    if (!item) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Badge category="type" value={item.type} size="sm" />
                        {canEdit ? (
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => { setSubject(e.target.value); handleFieldChange(); }}
                                className="flex-1 bg-transparent border-b border-transparent hover:border-slate-600 focus:border-sky-500 outline-none text-lg font-semibold"
                                placeholder="Title..."
                            />
                        ) : (
                            <span className="text-lg font-semibold text-slate-200">{item.subject}</span>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Metadata row */}
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                        {/* Status */}
                        {canEdit ? (
                            <select
                                value={boardStatus}
                                onChange={(e) => { setBoardStatus(e.target.value); handleFieldChange(); }}
                                className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 text-sm"
                            >
                                {BOARD_STATUS_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        ) : (
                            <Badge category="status" value={boardStatus} size="sm" />
                        )}

                        {/* Release target */}
                        {canEdit ? (
                            <select
                                value={targetRelease}
                                onChange={(e) => { setTargetRelease(e.target.value); handleFieldChange(); }}
                                className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 text-sm"
                            >
                                {RELEASE_OPTIONS.map((opt) => (
                                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                                ))}
                            </select>
                        ) : (
                            <span className={`px-2 py-0.5 rounded text-xs ${RELEASE_OPTIONS.find(r => r.id === targetRelease)?.color || ''}`}>
                                {RELEASE_OPTIONS.find(r => r.id === targetRelease)?.label || targetRelease}
                            </span>
                        )}

                        {/* Public toggle */}
                        {canEdit && (
                            <button
                                onClick={() => { setIsPublic(!isPublic); handleFieldChange(); }}
                                className={`px-2 py-0.5 rounded text-xs transition-colors ${isPublic
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-slate-700 text-slate-400'
                                    }`}
                            >
                                {isPublic ? '🌐 Public' : '🔒 Private'}
                            </button>
                        )}

                        {/* Date */}
                        <span className="text-slate-500 text-xs ml-auto">
                            Created: {new Date(item.created_at).toLocaleDateString()}
                        </span>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">Description</label>
                        {canEdit ? (
                            <textarea
                                value={description}
                                onChange={(e) => { setDescription(e.target.value); handleFieldChange(); }}
                                rows={4}
                                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 resize-none focus:border-sky-500 outline-none"
                                placeholder="Add a description..."
                            />
                        ) : (
                            <p className="text-slate-300 whitespace-pre-wrap">
                                {item.description || 'No description'}
                            </p>
                        )}
                    </div>

                    {/* Attachments section */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs text-slate-500">
                                Attachments {attachments.length > 0 && `(${attachments.length})`}
                            </label>
                            {isLoadingAttachments && (
                                <span className="text-xs text-slate-500">Loading...</span>
                            )}
                        </div>

                        {/* Existing attachments */}
                        <AttachmentGallery
                            attachments={attachments}
                            onDelete={canManageAttachments ? handleDeleteAttachment : undefined}
                            canDelete={canManageAttachments}
                            columns={3}
                            showEmpty={false}
                            className="mb-3"
                        />

                        {/* Legacy screenshot (if exists and not migrated) */}
                        {item.screenshot_url && attachments.length === 0 && (
                            <div className="mb-3">
                                <img
                                    src={item.screenshot_url}
                                    alt="Original screenshot"
                                    className="max-w-full max-h-48 rounded-lg border border-slate-700"
                                />
                                <p className="text-xs text-slate-500 mt-1">Original screenshot</p>
                            </div>
                        )}

                        {/* Upload zone */}
                        {canManageAttachments && (
                            <ImagePasteZone
                                onUpload={handleUpload}
                                isUploading={isUploading}
                                disabled={!item.id}
                            />
                        )}

                        {/* Attachment error */}
                        {attachmentError && (
                            <p className="text-sm text-red-400 mt-2">{attachmentError.message}</p>
                        )}
                    </div>

                    {/* Submitted by */}
                    {item.users?.nickname && (
                        <div className="text-xs text-slate-500">
                            Submitted by: <span className="text-slate-400">{item.users.nickname}</span>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                    >
                        {hasChanges ? 'Cancel' : 'Close'}
                    </button>
                    {canEdit && hasChanges && (
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-4 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-50 transition-colors"
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default ExpandableCardModal;
