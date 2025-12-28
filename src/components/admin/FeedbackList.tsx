"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import UniversalFilters, { FILTER_PRESETS } from "@/components/shared/UniversalFilters";
import { FeedbackFilterState, DEFAULT_FILTER_STATE, BOARD_STATUS_OPTIONS } from "@/lib/filters/feedbackFilters";
import { useFetch } from "@/hooks/useFetch";
import { Badge } from "@/components/ui/Badge";
import BulkActionsBar from "./BulkActionsBar";

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

interface ApiResponse {
    data: FeedbackItem[];
    pagination: {
        total: number;
        totalPages: number;
        page: number;
        limit: number;
    };
    error?: string;
}

interface FeedbackListProps {
    /** When true, only shows user-submitted feedback (user_id IS NOT NULL) */
    userFeedbackOnly?: boolean;
}

// Check if item is new (created in last 24 hours)
function isNewItem(createdAt: string): boolean {
    const created = new Date(createdAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    return hoursDiff < 24;
}

// Skeleton loader component
function FeedbackSkeleton() {
    return (
        <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="h-5 w-16 bg-slate-700 rounded" />
                        <div className="h-5 w-20 bg-slate-700 rounded" />
                        <div className="h-5 w-24 bg-slate-700 rounded" />
                    </div>
                    <div className="h-5 w-3/4 bg-slate-700 rounded mb-2" />
                    <div className="h-4 w-full bg-slate-800 rounded" />
                    <div className="h-4 w-2/3 bg-slate-800 rounded mt-1" />
                </div>
            ))}
        </div>
    );
}

export default function FeedbackList({ userFeedbackOnly = false }: FeedbackListProps) {
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 50,
    });
    const [filters, setFilters] = useState<FeedbackFilterState>(DEFAULT_FILTER_STATE);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Toggle selection for a single item
    const toggleSelection = useCallback((id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    // Select/deselect all visible items
    const toggleSelectAll = useCallback(() => {
        setSelectedIds(prev => {
            if (prev.size === items.length && items.length > 0) {
                return new Set();
            }
            return new Set(items.map((item: FeedbackItem) => item.id));
        });
    }, []);

    // Clear selection
    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                clearSelection();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                e.preventDefault();
                toggleSelectAll();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [clearSelection, toggleSelectAll]);

    const queryParams = useMemo(() => {
        const params = new URLSearchParams();
        params.set("page", pagination.page.toString());
        params.set("limit", pagination.limit.toString());

        if (filters.type) params.set("type", filters.type);
        if (filters.status) params.set("status", filters.status);
        if (filters.search) params.set("search", filters.search);
        if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
        if (filters.dateTo) params.set("dateTo", filters.dateTo);

        // Always filter to user-submitted only when userFeedbackOnly is true
        if (userFeedbackOnly) {
            params.set("source", "user_submitted");
        }

        return params.toString();
    }, [pagination.page, pagination.limit, filters, userFeedbackOnly]);

    const { data: apiData, loading, error: fetchError, refetch } = useFetch<ApiResponse>(`/api/admin/kanban?${queryParams}`);
    const error = fetchError ? fetchError.message : null;

    const items = useMemo(() => {
        let filtered = apiData?.data || [];

        // Client-side filter for isPublic (not in API yet)
        if (filters.isPublic) {
            const isPublicBool = filters.isPublic === "true";
            filtered = filtered.filter((item: FeedbackItem) => item.is_public === isPublicBool);
        }

        // Client-side filter for source if needed (when not using userFeedbackOnly)
        if (!userFeedbackOnly && filters.source) {
            if (filters.source === "user_submitted") {
                filtered = filtered.filter((item: FeedbackItem) => item.user_id !== null);
            } else if (filters.source === "admin_created") {
                filtered = filtered.filter((item: FeedbackItem) => item.user_id === null);
            }
        }
        return filtered;
    }, [apiData, filters.isPublic, filters.source, userFeedbackOnly]);

    const totalCount = apiData?.pagination?.total || items.length;
    const totalPages = apiData?.pagination?.totalPages || 1;

    const handleFiltersChange = useCallback((newFilters: FeedbackFilterState) => {
        setFilters(newFilters);
        setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 on filter change
    }, []);

    // Quick action: Toggle public visibility
    const togglePublic = async (itemId: string, currentState: boolean) => {
        setUpdatingId(itemId);
        try {
            await fetch("/api/admin/kanban", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: itemId, is_public: !currentState }),
            });
            refetch();
        } catch (error) {
            console.error("Failed to toggle public:", error);
        }
        setUpdatingId(null);
    };

    // Quick action: Change status
    const changeStatus = async (itemId: string, newStatus: string) => {
        setUpdatingId(itemId);
        try {
            const completedAt = newStatus === "done" ? new Date().toISOString() : null;
            await fetch("/api/admin/kanban", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: itemId,
                    board_status: newStatus,
                    completed_at: completedAt,
                }),
            });
            refetch();
        } catch (error) {
            console.error("Failed to change status:", error);
        }
        setUpdatingId(null);
    };

    // Bulk actions using PRD 10 API
    const handleBulkStatusChange = async (status: string) => {
        const ids = Array.from(selectedIds);
        await fetch("/api/admin/feedback/bulk", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids, updates: { board_status: status } }),
        });
        clearSelection();
        refetch();
    };

    const handleBulkArchive = async () => {
        const ids = Array.from(selectedIds);
        await fetch("/api/admin/feedback/bulk/archive", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids }),
        });
        clearSelection();
        refetch();
    };

    const handleBulkTogglePublic = async (isPublic: boolean) => {
        const ids = Array.from(selectedIds);
        await fetch("/api/admin/feedback/bulk", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids, updates: { is_public: isPublic } }),
        });
        clearSelection();
        refetch();
    };

    if (error) {
        return (
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-4 text-rose-400">
                Error: {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filters - use userFeedbackOnly preset when applicable */}
            <UniversalFilters
                config={userFeedbackOnly ? FILTER_PRESETS.userFeedbackOnly : FILTER_PRESETS.adminFeedback}
                onFiltersChange={handleFiltersChange}
                totalCount={totalCount}
                filteredCount={items.length}
            />

            {/* Loading state with skeleton */}
            {loading && <FeedbackSkeleton />}

            {/* Select All Header */}
            {!loading && items.length > 0 && (
                <div className="flex items-center gap-3 text-sm text-slate-400">
                    <label className="flex items-center gap-2 cursor-pointer hover:text-slate-200 transition">
                        <input
                            type="checkbox"
                            checked={selectedIds.size === items.length && items.length > 0}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-sky-500 focus:ring-sky-500 focus:ring-offset-0"
                        />
                        Select All ({items.length})
                    </label>
                    {selectedIds.size > 0 && (
                        <span className="text-sky-400">
                            {selectedIds.size} selected
                        </span>
                    )}
                </div>
            )}

            {/* Feedback list */}
            {!loading && (
                <div className="grid gap-4">
                    {items.map((item) => {
                        const isNew = isNewItem(item.created_at);
                        const isUpdating = updatingId === item.id;
                        const isSelected = selectedIds.has(item.id);

                        return (
                            <div
                                key={item.id}
                                className={`rounded-xl border bg-slate-900/50 p-5 transition hover:border-slate-700 ${isNew
                                    ? "border-sky-500/50 ring-1 ring-sky-500/20"
                                    : isSelected
                                        ? "border-sky-500 ring-1 ring-sky-500/30 bg-sky-500/5"
                                        : "border-slate-800"
                                    } ${isUpdating ? "opacity-60" : ""}`}
                            >
                                <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                                        {/* Checkbox */}
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleSelection(item.id)}
                                            className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-sky-500 focus:ring-sky-500 focus:ring-offset-0 cursor-pointer"
                                            onClick={(e) => e.stopPropagation()}
                                        />

                                        {/* NEW badge */}
                                        {isNew && (
                                            <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-400 animate-pulse">
                                                NEW
                                            </span>
                                        )}

                                        {/* Type badge using Badge component */}
                                        <Badge category="type" value={item.type} size="sm" />

                                        {/* Status - inline editable dropdown */}
                                        <select
                                            value={item.board_status || "backlog"}
                                            onChange={(e) => changeStatus(item.id, e.target.value)}
                                            disabled={isUpdating}
                                            className="text-xs uppercase bg-slate-800/80 border border-slate-700 rounded px-2 py-1 text-slate-300 focus:border-sky-500 focus:outline-none cursor-pointer hover:border-slate-600 transition"
                                            title="Change status"
                                        >
                                            {BOARD_STATUS_OPTIONS.filter(opt => opt.value).map(opt => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>

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

                                    {/* Quick actions */}
                                    <div className="flex items-center gap-2">
                                        {/* Toggle roadmap visibility */}
                                        <button
                                            onClick={() => togglePublic(item.id, item.is_public)}
                                            disabled={isUpdating}
                                            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition ${item.is_public
                                                ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                                                : "bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-slate-300"
                                                }`}
                                            title={item.is_public ? "Remove from roadmap" : "Add to roadmap"}
                                        >
                                            {item.is_public ? "🌐 Public" : "🔒 Private"}
                                        </button>
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
                        );
                    })}

                    {/* Empty state */}
                    {items.length === 0 && (
                        <div className="py-12 text-center">
                            <div className="text-4xl mb-3">📭</div>
                            <p className="text-slate-400 font-medium">No feedback found</p>
                            <p className="text-sm text-slate-500 mt-1">
                                {userFeedbackOnly
                                    ? "No user feedback matches your filters."
                                    : "Try adjusting your filters to see more items."}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.page === 1}
                        className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-300 disabled:opacity-50 hover:bg-slate-700 disabled:hover:bg-slate-800"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-slate-400">
                        Page {pagination.page} of {totalPages}
                    </span>
                    <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={pagination.page >= totalPages}
                        className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-300 disabled:opacity-50 hover:bg-slate-700 disabled:hover:bg-slate-800"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Bulk Actions Bar */}
            <BulkActionsBar
                selectedCount={selectedIds.size}
                onClear={clearSelection}
                onBulkStatusChange={handleBulkStatusChange}
                onBulkArchive={handleBulkArchive}
                onBulkTogglePublic={handleBulkTogglePublic}
            />
        </div>
    );
}
