"use client";

import { useState, useEffect } from "react";
import FeedbackList from "./FeedbackList";
import dynamic from "next/dynamic";
import { safeGetItem, safeSetItem } from "@/lib/utils/safeStorage";

// Dynamic import to avoid SSR issues with drag-and-drop
const KanbanBoard = dynamic(() => import("./KanbanBoard"), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    ),
});

interface FeedbackItem {
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
    users?: { display_name: string | null } | null;
    screenshot_url: string | null;
}

interface AdminFeedbackClientProps {
    initialItems: FeedbackItem[];
}

type ViewType = "list" | "kanban";

const VIEW_STORAGE_KEY = "admin-feedback-view";

export default function AdminFeedbackClient({ initialItems }: AdminFeedbackClientProps) {
    const [view, setView] = useState<ViewType>("list");
    const [isHydrated, setIsHydrated] = useState(false);

    // Load saved view preference on mount
    useEffect(() => {
        const saved = safeGetItem(VIEW_STORAGE_KEY);
        if (saved === "list" || saved === "kanban") {
            setView(saved);
        }
        setIsHydrated(true);
    }, []);

    const handleViewChange = (newView: ViewType) => {
        setView(newView);
        safeSetItem(VIEW_STORAGE_KEY, newView);
    };

    // Don't render until hydrated to prevent flash
    if (!isHydrated) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* View Toggle */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 p-1 bg-card/50 rounded-lg border border-border">
                    <button
                        onClick={() => handleViewChange("list")}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === "list"
                            ? "bg-primary/20 text-primary border border-primary/30"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                            }`}
                        title="List View"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                        <span className="hidden sm:inline">List</span>
                    </button>
                    <button
                        onClick={() => handleViewChange("kanban")}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === "kanban"
                            ? "bg-primary/20 text-primary border border-primary/30"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                            }`}
                        title="Kanban View"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                        </svg>
                        <span className="hidden sm:inline">Kanban</span>
                    </button>
                </div>

                <div className="text-sm text-muted-foreground">
                    {initialItems.length} user feedback items
                </div>
            </div>

            {/* Content */}
            {view === "list" ? (
                <FeedbackList userFeedbackOnly />
            ) : (
                <KanbanBoard initialItems={initialItems} />
            )}
        </div>
    );
}

