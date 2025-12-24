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
    is_agent_working: boolean;
    completion_status: string;
}

// Status badge styling
const STATUS_BADGES: Record<string, { label: string; className: string; pulse?: boolean }> = {
    in_progress: { label: "● Building Now", className: "text-sky-400 bg-sky-500/20", pulse: true },
    pending_review: { label: "⏳ Awaiting Review", className: "text-amber-400 bg-amber-500/20" },
    verified: { label: "✓ Verified", className: "text-emerald-400 bg-emerald-500/20" },
    needs_work: { label: "⚠ Needs Work", className: "text-rose-400 bg-rose-500/20" },
};

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
    const [showAllLater, setShowAllLater] = useState(false);
    const [showAllDone, setShowAllDone] = useState(false);

    // Item limits per column for clean UX
    const COLUMN_LIMITS = {
        now: 10,
        next: 8,
        later: showAllLater ? 100 : 6,
        done: showAllDone ? 100 : 10,
    };

    // Group items by release target
    const getColumnItems = (columnId: string, withLimit = true) => {
        let result: RoadmapItem[] = [];

        if (columnId === "done") {
            result = items
                .filter((i) => i.board_status === "done")
                .sort((a, b) => {
                    if (a.completed_at && b.completed_at) {
                        return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime();
                    }
                    return 0;
                });
        } else if (columnId === "now") {
            // Items in progress OR marked as "now" - agent work items first
            result = items
                .filter(
                    (i) => i.board_status !== "done" && (i.target_release === "now" || i.board_status === "in_progress" || i.is_agent_working)
                )
                .sort((a, b) => {
                    // Agent work items always first
                    if (a.is_agent_working && !b.is_agent_working) return -1;
                    if (!a.is_agent_working && b.is_agent_working) return 1;
                    return 0;
                });
        } else {
            result = items
                .filter((i) => i.board_status !== "done" && i.target_release === columnId)
                .sort((a, b) => b.avg_priority - a.avg_priority);
        }

        const limit = COLUMN_LIMITS[columnId as keyof typeof COLUMN_LIMITS] || 10;
        return withLimit ? result.slice(0, limit) : result;
    };

    const getTotalCount = (columnId: string) => getColumnItems(columnId, false).length;

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
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold text-slate-100">🗺️ Product Roadmap</h1>
                            <span className="text-xs font-medium text-slate-500 bg-slate-800/50 px-2 py-1 rounded-full border border-slate-700/50">
                                {items.length} features
                            </span>
                        </div>
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
                                            className={`rounded-md border transition-colors cursor-pointer ${item.is_agent_working
                                                ? "bg-sky-900/40 border-sky-500/50 hover:border-sky-400 ring-1 ring-sky-500/30"
                                                : "bg-slate-800/60 border-slate-700/50 hover:border-slate-600"
                                                }`}
                                            onClick={() => setExpandedCard(expandedCard === item.id ? null : item.id)}
                                        >
                                            <div className="p-2.5">
                                                {/* Status badge */}
                                                {item.is_agent_working && (
                                                    <span className="inline-flex items-center gap-1 text-[9px] uppercase font-medium text-sky-400 bg-sky-500/20 px-1.5 py-0.5 rounded mb-1">
                                                        <span className="animate-pulse">●</span> Building Now
                                                    </span>
                                                )}
                                                {!item.is_agent_working && STATUS_BADGES[item.completion_status] && item.completion_status !== "backlog" && item.completion_status !== "done" && (
                                                    <span className={`inline-flex items-center gap-1 text-[9px] uppercase font-medium px-1.5 py-0.5 rounded mb-1 ${STATUS_BADGES[item.completion_status].className}`}>
                                                        {STATUS_BADGES[item.completion_status].pulse && <span className="animate-pulse">●</span>}
                                                        {STATUS_BADGES[item.completion_status].label.replace("● ", "")}
                                                    </span>
                                                )}

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

                                    {/* Show more button for Later column */}
                                    {column.id === "later" && getTotalCount("later") > 6 && (
                                        <button
                                            onClick={() => setShowAllLater(!showAllLater)}
                                            className="w-full text-center py-2 text-xs text-sky-400 hover:text-sky-300 transition-colors"
                                        >
                                            {showAllLater
                                                ? "Show less ↑"
                                                : `Show ${getTotalCount("later") - 6} more →`
                                            }
                                        </button>
                                    )}

                                    {/* Show more button for Done column */}
                                    {column.id === "done" && getTotalCount("done") > 10 && (
                                        <button
                                            onClick={() => setShowAllDone(!showAllDone)}
                                            className="w-full text-center py-2 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                                        >
                                            {showAllDone
                                                ? "Show less ↑"
                                                : `Show all ${getTotalCount("done")} completed →`
                                            }
                                        </button>
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
