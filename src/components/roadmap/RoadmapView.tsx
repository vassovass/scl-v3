"use client";

import { useState } from "react";

interface RoadmapItem {
    id: string;
    type: string;
    subject: string;
    description: string;
    board_status: string;
    target_release: string;
    completed_at: string | null;
    created_at: string;
    avg_priority: number;
    vote_count: number;
    comment_count: number;
    user_vote: number | null;
}

const COLUMNS = [
    { id: "now", label: "🔥 Now", description: "In active development" },
    { id: "next", label: "⏭️ Next", description: "Coming soon" },
    { id: "later", label: "📅 Later", description: "On the roadmap" },
    { id: "done", label: "✅ Done", description: "Recently shipped" },
];

const TYPE_BADGES: Record<string, string> = {
    feature: "text-amber-400",
    improvement: "text-sky-400",
    bug: "text-rose-400",
};

interface RoadmapViewProps {
    items: RoadmapItem[];
    isLoggedIn: boolean;
    isSuperAdmin?: boolean;
}

export default function RoadmapView({ items, isLoggedIn, isSuperAdmin = false }: RoadmapViewProps) {
    const [expandedCard, setExpandedCard] = useState<string | null>(null);

    // Group items by release target
    const getColumnItems = (columnId: string) => {
        if (columnId === "done") {
            return items
                .filter((i) => i.board_status === "done")
                .sort((a, b) => {
                    if (a.completed_at && b.completed_at) {
                        return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime();
                    }
                    return 0;
                })
                .slice(0, 10); // Show last 10 completed
        }

        if (columnId === "now") {
            // Items in progress OR marked as "now"
            return items.filter(
                (i) => i.board_status !== "done" && (i.target_release === "now" || i.board_status === "in_progress")
            );
        }

        return items
            .filter((i) => i.board_status !== "done" && i.target_release === columnId)
            .sort((a, b) => b.avg_priority - a.avg_priority);
    };

    const handleVote = async (itemId: string, priority: number) => {
        if (!isLoggedIn) {
            window.location.href = "/sign-in?redirect=/roadmap";
            return;
        }

        try {
            await fetch("/api/roadmap/vote", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ feedback_id: itemId, priority }),
            });
            window.location.reload();
        } catch (error) {
            console.error("Vote error:", error);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950">
            {/* Header */}
            <div className="border-b border-slate-800 bg-slate-900/50">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-100">🗺️ Product Roadmap</h1>
                        <p className="text-sm text-slate-400">
                            See what we're building. {!isLoggedIn && <a href="/sign-in?redirect=/roadmap" className="text-sky-400 hover:underline">Sign in</a>} to vote on features.
                        </p>
                    </div>
                    {isSuperAdmin && (
                        <a
                            href="/admin/kanban"
                            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors"
                        >
                            ✏️ Edit Roadmap
                        </a>
                    )}
                </div>
            </div>

            {/* Kanban Board */}
            <div className="overflow-x-auto">
                <div className="flex gap-3 p-4 min-w-max">
                    {COLUMNS.map((column) => {
                        const columnItems = getColumnItems(column.id);
                        return (
                            <div
                                key={column.id}
                                className="w-72 flex-shrink-0 bg-slate-900/30 rounded-lg border border-slate-800"
                            >
                                {/* Column Header */}
                                <div className="p-3 border-b border-slate-800/50">
                                    <div className="flex items-center justify-between">
                                        <h2 className="font-semibold text-slate-200 text-sm">{column.label}</h2>
                                        <span className="text-xs text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                                            {columnItems.length}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-0.5">{column.description}</p>
                                </div>

                                {/* Cards */}
                                <div className="p-2 space-y-2 max-h-[70vh] overflow-y-auto">
                                    {columnItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className="bg-slate-800/60 rounded-md border border-slate-700/50 hover:border-slate-600 transition-colors cursor-pointer"
                                            onClick={() => setExpandedCard(expandedCard === item.id ? null : item.id)}
                                        >
                                            <div className="p-2.5">
                                                {/* Type badge */}
                                                <span className={`text-[9px] uppercase font-medium ${TYPE_BADGES[item.type] || "text-slate-400"}`}>
                                                    {item.type}
                                                </span>

                                                {/* Title */}
                                                <h3 className="text-sm text-slate-200 font-medium mt-0.5 line-clamp-2">
                                                    {item.subject}
                                                </h3>

                                                {/* Expanded content */}
                                                {expandedCard === item.id && (
                                                    <div className="mt-2 pt-2 border-t border-slate-700/50">
                                                        <p className="text-xs text-slate-400 mb-2">{item.description}</p>

                                                        {/* Vote buttons */}
                                                        {column.id !== "done" && (
                                                            <div className="flex items-center gap-1 mt-2">
                                                                <span className="text-[10px] text-slate-500 mr-1">Priority:</span>
                                                                {[1, 3, 5, 7, 10].map((p) => (
                                                                    <button
                                                                        key={p}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleVote(item.id, p);
                                                                        }}
                                                                        className={`w-6 h-6 text-[10px] rounded transition-colors ${item.user_vote === p
                                                                            ? "bg-sky-500 text-white"
                                                                            : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                                                                            }`}
                                                                    >
                                                                        {p}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Footer */}
                                                <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500">
                                                    <div className="flex items-center gap-2">
                                                        {item.vote_count > 0 && (
                                                            <span title="Average priority">
                                                                ⭐ {item.avg_priority}
                                                            </span>
                                                        )}
                                                        {item.comment_count > 0 && (
                                                            <span>💬 {item.comment_count}</span>
                                                        )}
                                                    </div>
                                                    {column.id === "done" && item.completed_at && (
                                                        <span>{new Date(item.completed_at).toLocaleDateString()}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {columnItems.length === 0 && (
                                        <div className="text-center py-6 text-xs text-slate-600">
                                            No items
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="border-t border-slate-800 p-4 text-center text-xs text-slate-500">
                Click a card to expand • {isLoggedIn ? "Click priority buttons to vote" : <a href="/sign-in?redirect=/roadmap" className="text-sky-400 hover:underline">Sign in to vote</a>}
            </div>
        </div>
    );
}
