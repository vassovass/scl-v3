"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
    FEEDBACK_TYPES,
    BOARD_STATUS_OPTIONS,
    VISIBILITY_OPTIONS,
    SOURCE_OPTIONS,
    DATE_PRESETS,
    TARGET_RELEASE_OPTIONS,
    FeedbackFilterState,
    DEFAULT_FILTER_STATE,
} from "@/lib/filters/feedbackFilters";

/**
 * Configuration for which filters to show on a given page.
 * Set to true to enable that filter.
 */
export interface FilterConfig {
    type?: boolean;
    status?: boolean;
    visibility?: boolean;
    source?: boolean;
    date?: boolean;
    search?: boolean;
    targetRelease?: boolean;
}

// Preset configurations for common pages
export const FILTER_PRESETS = {
    // Admin Feedback page - all filters
    adminFeedback: {
        type: true,
        status: true,
        visibility: true,
        source: true,
        date: true,
        search: true,
    } as FilterConfig,

    // Admin Kanban - source, type, visibility
    adminKanban: {
        type: true,
        source: true,
        visibility: true,
    } as FilterConfig,

    // Public Roadmap - type only (simple for users)
    publicRoadmap: {
        type: true,
    } as FilterConfig,

    // Full admin - everything
    fullAdmin: {
        type: true,
        status: true,
        visibility: true,
        source: true,
        date: true,
        search: true,
        targetRelease: true,
    } as FilterConfig,
};

interface UniversalFiltersProps {
    /** Configuration for which filters to show */
    config: FilterConfig;
    /** Callback when filters change */
    onFiltersChange: (filters: FeedbackFilterState) => void;
    /** Total count of items (for display) */
    totalCount?: number;
    /** Filtered count of items (for display) */
    filteredCount?: number;
    /** Optional class name for styling */
    className?: string;
    /** Compact mode for smaller spaces */
    compact?: boolean;
}

export default function UniversalFilters({
    config,
    onFiltersChange,
    totalCount,
    filteredCount,
    className = "",
    compact = false,
}: UniversalFiltersProps) {
    const [filters, setFilters] = useState<FeedbackFilterState>(DEFAULT_FILTER_STATE);
    const [datePreset, setDatePreset] = useState("");
    const [searchInput, setSearchInput] = useState("");

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInput !== filters.search) {
                setFilters(prev => ({ ...prev, search: searchInput }));
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput, filters.search]);

    // Notify parent when filters change
    useEffect(() => {
        onFiltersChange(filters);
    }, [filters, onFiltersChange]);

    // Handle date preset changes
    const handleDatePreset = useCallback((preset: string) => {
        setDatePreset(preset);
        const now = new Date();
        let dateFrom = "";
        let dateTo = "";

        if (preset === "today") {
            dateFrom = now.toISOString().split("T")[0];
            dateTo = dateFrom;
        } else if (preset === "week") {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            dateFrom = weekAgo.toISOString().split("T")[0];
            dateTo = now.toISOString().split("T")[0];
        } else if (preset === "month") {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            dateFrom = monthAgo.toISOString().split("T")[0];
            dateTo = now.toISOString().split("T")[0];
        } else {
            // Clear dates
            dateFrom = "";
            dateTo = "";
        }

        setFilters(prev => ({ ...prev, dateFrom, dateTo }));
    }, []);

    const clearAllFilters = useCallback(() => {
        setFilters(DEFAULT_FILTER_STATE);
        setSearchInput("");
        setDatePreset("");
    }, []);

    // Count active filters
    const activeFilterCount = useMemo(() => {
        return [
            config.type && filters.type,
            config.status && filters.status,
            config.search && filters.search,
            config.date && (filters.dateFrom || filters.dateTo),
            config.visibility && filters.isPublic,
            config.source && filters.source,
            config.targetRelease && filters.targetRelease,
        ].filter(Boolean).length;
    }, [filters, config]);

    const selectClass = compact
        ? "rounded-lg border border-slate-700 bg-slate-800/50 px-2 py-1 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
        : "rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none";

    return (
        <div className={`space-y-3 ${className}`}>
            {/* Search bar (if enabled) */}
            {config.search && (
                <div className="relative">
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Search in title and description..."
                        className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 pl-10 text-sm text-slate-200 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                    <svg
                        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            )}

            {/* Filter row */}
            <div className="flex flex-wrap items-center gap-2">
                {/* Type filter */}
                {config.type && (
                    <select
                        value={filters.type}
                        onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                        className={selectClass}
                        title="Filter by type"
                    >
                        {FEEDBACK_TYPES.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                )}

                {/* Status filter */}
                {config.status && (
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        className={selectClass}
                        title="Filter by status"
                    >
                        {BOARD_STATUS_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                )}

                {/* Source filter */}
                {config.source && (
                    <select
                        value={filters.source}
                        onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))}
                        className={selectClass}
                        title="Filter by source"
                    >
                        {SOURCE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                )}

                {/* Visibility filter */}
                {config.visibility && (
                    <select
                        value={filters.isPublic}
                        onChange={(e) => setFilters(prev => ({ ...prev, isPublic: e.target.value }))}
                        className={selectClass}
                        title="Filter by visibility"
                    >
                        {VISIBILITY_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                )}

                {/* Target Release filter */}
                {config.targetRelease && (
                    <select
                        value={filters.targetRelease || ""}
                        onChange={(e) => setFilters(prev => ({ ...prev, targetRelease: e.target.value }))}
                        className={selectClass}
                        title="Filter by target release"
                    >
                        {TARGET_RELEASE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                )}

                {/* Date preset */}
                {config.date && (
                    <>
                        <select
                            value={datePreset}
                            onChange={(e) => handleDatePreset(e.target.value)}
                            className={selectClass}
                            title="Filter by date"
                        >
                            {DATE_PRESETS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>

                        {/* Custom date inputs */}
                        {datePreset === "custom" && (
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    value={filters.dateFrom}
                                    onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                                    className={selectClass}
                                />
                                <span className="text-slate-500 text-xs">to</span>
                                <input
                                    type="date"
                                    value={filters.dateTo}
                                    onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                                    className={selectClass}
                                />
                            </div>
                        )}
                    </>
                )}

                {/* Clear all button */}
                {activeFilterCount > 0 && (
                    <button
                        onClick={clearAllFilters}
                        className="flex items-center gap-1 rounded-lg bg-slate-700/50 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition"
                    >
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Clear
                    </button>
                )}
            </div>

            {/* Results count */}
            {filteredCount !== undefined && totalCount !== undefined && (
                <div className="text-xs text-slate-500">
                    Showing {filteredCount} of {totalCount} items
                    {activeFilterCount > 0 && ` (${activeFilterCount} filter${activeFilterCount > 1 ? "s" : ""} active)`}
                </div>
            )}
        </div>
    );
}
