"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import UniversalFilters, { FILTER_PRESETS } from "@/components/shared/UniversalFilters";
import { FeedbackFilterState, DEFAULT_FILTER_STATE } from "@/lib/filters/feedbackFilters";
import { BADGE_CONFIG, getBadgeClass, getBadgeConfig } from "@/lib/badges";
import { useExport } from "@/hooks/useExport";
import { ROADMAP_COLUMNS } from "@/lib/export/presets";
import { useConfetti } from "@/components/ui/Confetti";
import RoadmapSubscribe from "./RoadmapSubscribe";
import CompletionMiniChart from "./CompletionMiniChart";

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

const COLUMNS = [
    { id: "now", label: "🔥 Now", description: "In active development" },
    { id: "next", label: "⏭️ Next", description: "Coming soon" },
    { id: "later", label: "📅 Later", description: "On the roadmap" },
    { id: "done", label: "✅ Done", description: "Recently shipped" },
];

// Theme-aware column accent colors (PRD 17)
const COLUMN_STYLES: Record<string, string> = {
    now: 'border-t-2 border-rose-500',
    next: 'border-t-2 border-amber-500',
    later: 'border-t-2 border-sky-500',
    done: 'border-t-2 border-emerald-500',
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
    const [filters, setFilters] = useState<FeedbackFilterState>(DEFAULT_FILTER_STATE);

    // Celebrate shipped features on first visit (PRD 17)
    const hasDoneItems = items.some(i => i.board_status === 'done');
    useConfetti({
        triggerOnMount: hasDoneItems,
        onceKey: 'roadmap_shipped',
        preset: 'roadmap_shipped',
    });

    // Handle filter changes
    const handleFiltersChange = useCallback((newFilters: FeedbackFilterState) => {
        setFilters(newFilters);
    }, []);

    // Filter items by type (if selected)
    const filteredItems = useMemo(() => {
        if (!filters.type) return items;
        return items.filter(item => item.type === filters.type);
    }, [items, filters.type]);

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
            result = filteredItems
                .filter((i) => i.board_status === "done")
                .sort((a, b) => {
                    if (a.completed_at && b.completed_at) {
                        return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime();
                    }
                    return 0;
                });
        } else if (columnId === "now") {
            // Items in progress OR marked as "now" - agent work items first
            result = filteredItems
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
            result = filteredItems
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

    // Export using PRD 16 hook (replaces 55 lines of inline code)
    const { exportCSV, isExporting: isExportingCSV } = useExport<RoadmapItem>({
        filename: 'roadmap-export',
        columns: ROADMAP_COLUMNS,
    });

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-border bg-card/50">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold text-foreground">🗺️ Product Roadmap</h1>
                            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full border border-border">
                                {filteredItems.length} features
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            See what we're building. {!isLoggedIn && <a href="/sign-in?redirect=/roadmap" className="text-primary hover:underline">Sign in</a>} to vote on features.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* PRD 17: Subscribe Component */}
                        <RoadmapSubscribe />

                        <button
                            onClick={() => exportCSV(items)}
                            disabled={isExportingCSV}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg border border-border transition-colors disabled:opacity-50"
                            title="Export roadmap to CSV"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            {isExportingCSV ? 'Exporting...' : 'Export CSV'}
                        </button>
                        {isSuperAdmin && (
                            <a
                                href="/admin/kanban"
                                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
                            >
                                ✏️ Edit Roadmap
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* Filter bar */}
            <div className="border-b border-border bg-muted/30">
                <div className="max-w-7xl mx-auto px-4 py-2">
                    <UniversalFilters
                        config={FILTER_PRESETS.publicRoadmap}
                        onFiltersChange={handleFiltersChange}
                        compact
                    />
                </div>
            </div>

            {/* Kanban Board */}
            <div className="overflow-x-auto roadmap-columns pb-4">
                <div className="flex gap-3 p-4 min-w-max">
                    {COLUMNS.map((column) => {
                        const columnItems = getColumnItems(column.id);
                        return (
                            <div
                                key={column.id}
                                className={`w-72 flex-shrink-0 roadmap-column bg-card/30 rounded-lg border border-border ${COLUMN_STYLES[column.id]}`}
                                role="region"
                                aria-label={`${column.label} column`}
                            >
                                {/* Column Header */}
                                <div className="p-3 border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <h2 className="font-semibold text-foreground text-sm">{column.label}</h2>
                                            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                {columnItems.length}
                                            </span>
                                        </div>
                                        {/* PRD 17: Completion Velocity Chart i "Done" column */}
                                        {column.id === 'done' && (
                                            <CompletionMiniChart completedItems={columnItems.map(i => ({ completed_at: i.completed_at }))} />
                                        )}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">{column.description}</p>
                                </div>

                                {/* Cards */}
                                <div className="p-2 space-y-2 max-h-[70vh] overflow-y-auto">
                                    {columnItems.map((item) => (
                                        <div
                                            key={item.id}
                                            role="article"
                                            tabIndex={0}
                                            className={`rounded-md border transition-colors cursor-pointer roadmap-card ${item.is_agent_working
                                                ? "bg-primary/20 border-primary/50 hover:border-primary ring-1 ring-primary/30"
                                                : "bg-card border-border hover:border-foreground/50"
                                                }`}
                                            onClick={() => setExpandedCard(expandedCard === item.id ? null : item.id)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    setExpandedCard(expandedCard === item.id ? null : item.id);
                                                }
                                            }}
                                        >
                                            <div className="p-2.5">
                                                {/* Status badge */}
                                                {item.is_agent_working && (
                                                    <span className="inline-flex items-center gap-1 text-[9px] uppercase font-medium text-primary bg-primary/20 px-1.5 py-0.5 rounded mb-1">
                                                        <span className="animate-pulse">●</span> Building Now
                                                    </span>
                                                )}
                                                {!item.is_agent_working && getBadgeConfig('status', item.completion_status) && item.completion_status !== "backlog" && item.completion_status !== "done" && (
                                                    <span className={`inline-flex items-center gap-1 text-[9px] uppercase font-medium px-1.5 py-0.5 rounded mb-1 ${getBadgeClass('status', item.completion_status)}`}>
                                                        {getBadgeConfig('status', item.completion_status)?.pulse && <span className="animate-pulse">●</span>}
                                                        {getBadgeConfig('status', item.completion_status)?.label.replace("● ", "")}
                                                    </span>
                                                )}

                                                {/* Type badge */}
                                                <span className={`text-[9px] uppercase font-medium ${getBadgeClass('type', item.type) || "text-muted-foreground"}`}>
                                                    {item.type}
                                                </span>

                                                {/* Title */}
                                                <h3 className="text-sm text-foreground font-medium mt-0.5 line-clamp-2">
                                                    {item.subject}
                                                </h3>

                                                {/* Expanded content */}
                                                {expandedCard === item.id && (
                                                    <div className="mt-2 pt-2 border-t border-border">
                                                        <p className="text-xs text-muted-foreground mb-2">{item.description}</p>

                                                        {/* Vote buttons */}
                                                        {column.id !== "done" && (
                                                            <div className="flex items-center gap-1 mt-2">
                                                                <span className="text-[10px] text-muted-foreground mr-1">Priority:</span>
                                                                {[1, 3, 5, 7, 10].map((p) => (
                                                                    <button
                                                                        key={p}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleVote(item.id, p);
                                                                        }}
                                                                        className={`w-6 h-6 text-[10px] rounded transition-colors ${item.user_vote === p
                                                                            ? "bg-primary text-primary-foreground"
                                                                            : "bg-secondary text-muted-foreground hover:bg-secondary/80"
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
                                                <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
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
                                        <div className="text-center py-6 text-xs text-muted-foreground">
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
            <div className="border-t border-border p-4 text-center text-xs text-muted-foreground">
                Click a card to expand • {isLoggedIn ? "Click priority buttons to vote" : <a href="/sign-in?redirect=/roadmap" className="text-primary hover:underline">Sign in to vote</a>}
            </div>
        </div>
    );
}
