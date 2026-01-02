"use client";

import { useState } from "react";
import PriorityVote from "./PriorityVote";
import Badge from "@/components/ui/Badge";

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

// TYPE_COLORS removed - now using Badge component from PRD 06

interface RoadmapCardProps {
    item: RoadmapItem;
    isLoggedIn: boolean;
    isCompleted?: boolean;
}

export default function RoadmapCard({ item, isLoggedIn, isCompleted }: RoadmapCardProps) {
    const [showComments, setShowComments] = useState(false);
    const [currentVote, setCurrentVote] = useState(item.user_vote);
    const [avgPriority, setAvgPriority] = useState(item.avg_priority);
    const [voteCount, setVoteCount] = useState(item.vote_count);

    const handleVoteUpdate = (newVote: number, newAvg: number, newCount: number) => {
        setCurrentVote(newVote);
        setAvgPriority(newAvg);
        setVoteCount(newCount);
    };

    return (
        <div
            className={`p-4 rounded-xl border transition-all ${isCompleted
                ? "bg-slate-900/30 border-slate-800/50"
                : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
                }`}
        >
            <div className="flex items-start gap-4">
                {/* Vote section */}
                <div className="flex-shrink-0">
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
                    </div>

                    <h3 className={`font-medium mb-1 ${isCompleted ? "text-slate-400" : "text-slate-200"}`}>
                        {item.subject}
                    </h3>

                    <p className="text-sm text-slate-400 line-clamp-2">{item.description}</p>

                    {/* Actions */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                        <button
                            onClick={() => setShowComments(!showComments)}
                            className="hover:text-slate-300 transition-colors"
                        >
                            💬 {item.comment_count} comments
                        </button>
                    </div>
                </div>
            </div>

            {/* Comments section (placeholder for now) */}
            {showComments && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                    <p className="text-sm text-slate-500">Comments coming soon...</p>
                </div>
            )}
        </div>
    );
}
