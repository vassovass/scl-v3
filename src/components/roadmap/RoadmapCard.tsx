"use client";

import { useState, useCallback } from "react";
import PriorityVote from "./PriorityVote";
import { SystemBadge as Badge } from "@/components/ui/SystemBadge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { AttachmentGallery } from "@/components/ui/AttachmentGallery";
import { useAttachments } from "@/hooks/useAttachments";

interface RoadmapItem {
    id: string;
    type: string;
    subject: string;
    description: string;
    board_status: string;
    completed_at: string | null;
    created_at: string;
    avg_priority: number;
    vote_count: number;
    comment_count: number;
    user_vote: number | null;
}

interface RoadmapCardProps {
    item: RoadmapItem;
    isLoggedIn: boolean;
    isCompleted?: boolean;
}

export default function RoadmapCard({ item, isLoggedIn, isCompleted }: RoadmapCardProps) {
    const [showComments, setShowComments] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [currentVote, setCurrentVote] = useState(item.user_vote);
    const [avgPriority, setAvgPriority] = useState(item.avg_priority);
    const [voteCount, setVoteCount] = useState(item.vote_count);

    // Attachments (view-only for roadmap)
    const { attachments, isLoading: isLoadingAttachments } = useAttachments(
        'feedback',
        showDetailModal ? item.id : null,
        { autoFetch: true }
    );

    const handleVoteUpdate = (newVote: number, newAvg: number, newCount: number) => {
        setCurrentVote(newVote);
        setAvgPriority(newAvg);
        setVoteCount(newCount);
    };

    const handleCardClick = useCallback(() => {
        setShowDetailModal(true);
    }, []);

    return (
        <>
            <div
                onClick={handleCardClick}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${isCompleted
                    ? "bg-slate-900/30 border-slate-800/50 hover:border-slate-700/50"
                    : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
                    }`}
                title="Click to view details"
            >
                <div className="flex items-start gap-4">
                    {/* Vote section */}
                    <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        {!isCompleted ? (
                            <PriorityVote
                                feedbackId={item.id}
                                currentVote={currentVote}
                                avgPriority={avgPriority}
                                voteCount={voteCount}
                                isLoggedIn={isLoggedIn}
                                onVoteUpdate={handleVoteUpdate}
                            />
                        ) : (
                            <div className="w-12 h-12 flex items-center justify-center text-2xl">
                                ✅
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <Badge category="type" value={item.type} size="sm" />
                            {isCompleted && item.completed_at && (
                                <span className="text-xs text-slate-500">
                                    {new Date(item.completed_at).toLocaleDateString()}
                                </span>
                            )}
                            {/* Attachment indicator */}
                            {attachments.length > 0 && (
                                <span className="text-xs text-[hsl(var(--info))]" title={`${attachments.length} attachment(s)`}>
                                    🖼️ {attachments.length}
                                </span>
                            )}
                        </div>

                        <h3 className={`font-medium mb-1 ${isCompleted ? "text-slate-400" : "text-slate-200"}`}>
                            {item.subject}
                        </h3>

                        <p className="text-sm text-slate-400 line-clamp-2">{item.description}</p>

                        {/* Actions */}
                        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowComments(!showComments);
                                }}
                                className="hover:text-slate-300 transition-colors"
                            >
                                💬 {item.comment_count} comments
                            </button>
                        </div>
                    </div>
                </div>

                {/* Comments section (placeholder for now) */}
                {showComments && (
                    <div className="mt-4 pt-4 border-t border-slate-800" onClick={(e) => e.stopPropagation()}>
                        <p className="text-sm text-slate-500">Comments coming soon...</p>
                    </div>
                )}
            </div>

            {/* Detail Modal (View Only) */}
            <Dialog open={showDetailModal} onOpenChange={(open) => !open && setShowDetailModal(false)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Badge category="type" value={item.type} size="sm" />
                            <span className="text-lg font-semibold text-slate-200">{item.subject}</span>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Metadata row */}
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                            {isCompleted ? (
                                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs">
                                    ✅ Completed
                                </span>
                            ) : (
                                <span className="px-2 py-0.5 rounded bg-[hsl(var(--info)/0.2)] text-[hsl(var(--info))] text-xs">
                                    In Progress
                                </span>
                            )}
                            <span className="text-slate-500 text-xs">
                                Created: {new Date(item.created_at).toLocaleDateString()}
                            </span>
                            {isCompleted && item.completed_at && (
                                <span className="text-slate-500 text-xs">
                                    Completed: {new Date(item.completed_at).toLocaleDateString()}
                                </span>
                            )}
                        </div>

                        {/* Full Description */}
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Description</label>
                            <p className="text-slate-300 whitespace-pre-wrap">
                                {item.description || 'No description'}
                            </p>
                        </div>

                        {/* Voting (interactive if logged in) */}
                        {!isCompleted && (
                            <div className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg">
                                <PriorityVote
                                    feedbackId={item.id}
                                    currentVote={currentVote}
                                    avgPriority={avgPriority}
                                    voteCount={voteCount}
                                    isLoggedIn={isLoggedIn}
                                    onVoteUpdate={handleVoteUpdate}
                                />
                                <div className="text-sm text-slate-400">
                                    {isLoggedIn
                                        ? "Click to vote on priority"
                                        : "Sign in to vote on priority"}
                                </div>
                            </div>
                        )}

                        {/* Attachments section (view-only) */}
                        {(attachments.length > 0 || isLoadingAttachments) && (
                            <div>
                                <label className="block text-xs text-slate-500 mb-2">
                                    Attachments {attachments.length > 0 && `(${attachments.length})`}
                                </label>
                                {isLoadingAttachments ? (
                                    <p className="text-sm text-slate-500">Loading attachments...</p>
                                ) : (
                                    <AttachmentGallery
                                        attachments={attachments}
                                        canDelete={false}
                                        columns={3}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}


