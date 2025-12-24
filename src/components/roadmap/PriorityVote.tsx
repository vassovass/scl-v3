"use client";

import { useState } from "react";

interface PriorityVoteProps {
    feedbackId: string;
    currentVote: number | null;
    avgPriority: number;
    voteCount: number;
    isLoggedIn: boolean;
    onVoteUpdate: (newVote: number, newAvg: number, newCount: number) => void;
}

export default function PriorityVote({
    feedbackId,
    currentVote,
    avgPriority,
    voteCount,
    isLoggedIn,
    onVoteUpdate,
}: PriorityVoteProps) {
    const [isVoting, setIsVoting] = useState(false);
    const [showSlider, setShowSlider] = useState(false);
    const [sliderValue, setSliderValue] = useState(currentVote || 5);

    const handleVote = async () => {
        if (!isLoggedIn) return;

        setIsVoting(true);
        try {
            const response = await fetch("/api/roadmap/vote", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    feedback_id: feedbackId,
                    priority: sliderValue,
                }),
            });

            const data = await response.json();
            if (data.success) {
                onVoteUpdate(sliderValue, data.avg_priority, data.vote_count);
                setShowSlider(false);
            }
        } catch (error) {
            console.error("Vote error:", error);
        }
        setIsVoting(false);
    };

    // Determine color based on average priority
    const getPriorityColor = (priority: number) => {
        if (priority >= 7) return "text-emerald-400";
        if (priority >= 4) return "text-amber-400";
        return "text-slate-400";
    };

    return (
        <div className="flex flex-col items-center">
            {/* Priority display */}
            <button
                onClick={() => isLoggedIn && setShowSlider(!showSlider)}
                disabled={!isLoggedIn}
                className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center transition-all ${isLoggedIn
                        ? "hover:bg-slate-800 cursor-pointer"
                        : "cursor-not-allowed opacity-60"
                    } ${currentVote ? "bg-sky-500/20 border border-sky-500/30" : "bg-slate-800/50"}`}
                title={isLoggedIn ? "Click to vote" : "Sign in to vote"}
            >
                <span className={`text-lg font-bold ${getPriorityColor(avgPriority)}`}>
                    {avgPriority > 0 ? avgPriority.toFixed(1) : "—"}
                </span>
            </button>
            <span className="text-[10px] text-slate-500 mt-1">
                {voteCount} {voteCount === 1 ? "vote" : "votes"}
            </span>

            {/* Slider popup */}
            {showSlider && (
                <div className="absolute mt-16 z-10 bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
                    <p className="text-xs text-slate-400 mb-2">
                        How important is this? (1-10)
                    </p>
                    <div className="flex items-center gap-3">
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={sliderValue}
                            onChange={(e) => setSliderValue(parseInt(e.target.value))}
                            className="w-24 accent-sky-500"
                        />
                        <span className="text-lg font-bold text-sky-400 w-6 text-center">
                            {sliderValue}
                        </span>
                    </div>
                    <div className="flex gap-2 mt-3">
                        <button
                            onClick={handleVote}
                            disabled={isVoting}
                            className="px-3 py-1 text-xs bg-sky-500 text-white rounded hover:bg-sky-600 disabled:opacity-50"
                        >
                            {isVoting ? "..." : "Vote"}
                        </button>
                        <button
                            onClick={() => setShowSlider(false)}
                            className="px-3 py-1 text-xs text-slate-400 hover:text-slate-300"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
