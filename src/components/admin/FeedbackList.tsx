"use client";

import { useState, useEffect, useCallback } from "react";
import FeedbackFilters from "./FeedbackFilters";

interface FeedbackItem {
    id: string;
    type: string;
    subject: string | null;
    description: string;
    status: string;
    board_status: string;
    is_public: boolean;
    created_at: string;
    updated_at: string;
    page_url: string | null;
    screenshot_url: string | null;
    user_agent: string | null;
    user_id: string | null;
    users?: {
        display_name: string | null;
        nickname: string | null;
    } | null;
}

interface FilterState {
    type: string;
    status: string;
    search: string;
    dateFrom: string;
    dateTo: string;
    isPublic: string;
}

const TYPE_COLORS: Record<string, string> = {
    bug: "bg-rose-500/10 text-rose-400",
    feature: "bg-amber-500/10 text-amber-400",
    improvement: "bg-sky-500/10 text-sky-400",
    general: "bg-slate-500/10 text-slate-400",
    positive: "bg-emerald-500/10 text-emerald-400",
    negative: "bg-red-500/10 text-red-400",
};

const STATUS_COLORS: Record<string, string> = {
    backlog: "text-slate-500",
    todo: "text-slate-400",
    in_progress: "text-sky-400",
    review: "text-amber-400",
    done: "text-emerald-400",
};

export default function FeedbackList() {
    const [items, setItems] = useState<FeedbackItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
    });
    const [filters, setFilters] = useState<FilterState>({
        type: "",
        status: "",
        search: "",
        dateFrom: "",
        dateTo: "",
        isPublic: "",
    });

    const fetchFeedback = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            params.set("page", pagination.page.toString());
            params.set("limit", pagination.limit.toString());

            if (filters.type) params.set("type", filters.type);
            if (filters.status) params.set("status", filters.status);
            if (filters.search) params.set("search", filters.search);
            if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
            if (filters.dateTo) params.set("dateTo", filters.dateTo);

            const res = await fetch(`/api/admin/kanban?${params.toString()}`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to fetch feedback");
            }

            let filtered = data.data || [];

            // Client-side filter for isPublic (not in API yet)
            if (filters.isPublic) {
                const isPublicBool = filters.isPublic === "true";
                filtered = filtered.filter((item: FeedbackItem) => item.is_public === isPublicBool);
            }

            setItems(filtered);
            setPagination(prev => ({
                ...prev,
                total: data.pagination?.total || filtered.length,
                totalPages: data.pagination?.totalPages || 1,
            }));
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, filters]);

    useEffect(() => {
        fetchFeedback();
    }, [fetchFeedback]);

    const handleFiltersChange = useCallback((newFilters: FilterState) => {
        setFilters(newFilters);
        setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 on filter change
    }, []);

    if (error) {
        return (
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-4 text-rose-400">
                Error: {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filters */}
            <FeedbackFilters
                onFiltersChange={handleFiltersChange}
                totalCount={pagination.total}
                filteredCount={items.length}
            />

            {/* Loading state */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
                </div>
            )}

            {/* Feedback list */}
            {!loading && (
                <div className="grid gap-4">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 transition hover:border-slate-700"
                        >
                            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                                    {/* Type badge */}
                                    <span className={`rounded-md px-2 py-1 text-xs font-medium uppercase tracking-wider ${TYPE_COLORS[item.type] || TYPE_COLORS.general}`}>
                                        {item.type}
                                    </span>

                                    {/* Status badge */}
                                    <span className={`text-xs uppercase ${STATUS_COLORS[item.board_status] || STATUS_COLORS.backlog}`}>
                                        {item.board_status?.replace("_", " ")}
                                    </span>

                                    {/* Public indicator */}
                                    {item.is_public && (
                                        <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-xs text-sky-400">
                                            🌐 Public
                                        </span>
                                    )}

                                    {/* Date */}
                                    <span className="text-xs text-slate-500">
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </span>

                                    {/* User */}
                                    {item.user_id && item.users && (
                                        <span className="text-xs text-slate-400">
                                            by {item.users.nickname || item.users.display_name || "User"}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Subject */}
                            {item.subject && (
                                <h3 className="mb-2 font-semibold text-slate-200">{item.subject}</h3>
                            )}

                            {/* Description */}
                            <p className="whitespace-pre-wrap text-sm text-slate-300 line-clamp-3">
                                {item.description}
                            </p>

                            {/* Page URL */}
                            {item.page_url && (
                                <div className="mt-3 text-xs text-slate-500">
                                    Page:{" "}
                                    <a
                                        href={item.page_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:text-sky-400 hover:underline"
                                    >
                                        {item.page_url}
                                    </a>
                                </div>
                            )}

                            {/* Screenshot */}
                            {item.screenshot_url && (
                                <div className="mt-4">
                                    <details className="group">
                                        <summary className="cursor-pointer text-xs font-medium text-sky-500 hover:text-sky-400">
                                            View Screenshot
                                        </summary>
                                        <div className="mt-2 overflow-hidden rounded-lg border border-slate-700">
                                            <img
                                                src={item.screenshot_url}
                                                alt="Feedback screenshot"
                                                className="max-h-96 w-auto object-contain"
                                            />
                                        </div>
                                    </details>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Empty state */}
                    {items.length === 0 && (
                        <div className="py-12 text-center text-slate-500">
                            No feedback matches your filters.
                        </div>
                    )}
                </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.page === 1}
                        className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-300 disabled:opacity-50 hover:bg-slate-700 disabled:hover:bg-slate-800"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-slate-400">
                        Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={pagination.page >= pagination.totalPages}
                        className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-300 disabled:opacity-50 hover:bg-slate-700 disabled:hover:bg-slate-800"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
