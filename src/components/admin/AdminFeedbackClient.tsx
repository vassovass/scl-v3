"use client";

import { useState, useEffect } from "react";
import FeedbackList from "./FeedbackList";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with drag-and-drop
const KanbanBoard = dynamic(() => import("./KanbanBoard"), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
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
    users?: { nickname: string } | null;
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
        const saved = localStorage.getItem(VIEW_STORAGE_KEY);
        if (saved === "list" || saved === "kanban") {
            setView(saved);
        }
        setIsHydrated(true);
    }, []);

    const handleViewChange = (newView: ViewType) => {
        setView(newView);
        localStorage.setItem(VIEW_STORAGE_KEY, newView);
    };

    // Don't render until hydrated to prevent flash
    if (!isHydrated) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* View Toggle */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 p-1 bg-slate-800/50 rounded-lg border border-slate-700">
                    <button
                        onClick={() => handleViewChange("list")}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === "list"
                            ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
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
                            ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                            }`}
                        title="Kanban View"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                        </svg>
                        <span className="hidden sm:inline">Kanban</span>
                    </button>
                </div>

                <div className="text-sm text-slate-500">
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
