"use client";

import { useState, useEffect, useCallback } from "react";

interface FilterState {
    type: string;
    status: string;
    search: string;
    dateFrom: string;
    dateTo: string;
    isPublic: string;
}

interface FeedbackFiltersProps {
    onFiltersChange: (filters: FilterState) => void;
    totalCount?: number;
    filteredCount?: number;
}

const TYPE_OPTIONS = [
    { value: "", label: "All Types" },
    { value: "bug", label: "🐛 Bug" },
    { value: "feature", label: "✨ Feature" },
    { value: "improvement", label: "📈 Improvement" },
    { value: "general", label: "💬 General" },
    { value: "positive", label: "👍 Positive" },
    { value: "negative", label: "👎 Negative" },
];

const STATUS_OPTIONS = [
    { value: "", label: "All Statuses" },
    { value: "backlog", label: "📋 Backlog" },
    { value: "todo", label: "📝 To Do" },
    { value: "in_progress", label: "🔨 In Progress" },
    { value: "review", label: "👀 Review" },
    { value: "done", label: "✅ Done" },
];

const VISIBILITY_OPTIONS = [
    { value: "", label: "All Items" },
    { value: "true", label: "🌐 Public (Roadmap)" },
    { value: "false", label: "🔒 Internal Only" },
];

const DATE_PRESETS = [
    { value: "", label: "All Time" },
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "custom", label: "Custom Range" },
];

export default function FeedbackFilters({ onFiltersChange, totalCount, filteredCount }: FeedbackFiltersProps) {
    const [filters, setFilters] = useState<FilterState>({
        type: "",
        status: "",
        search: "",
        dateFrom: "",
        dateTo: "",
        isPublic: "",
    });
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
    const handleDatePreset = (preset: string) => {
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
        }

        setFilters(prev => ({ ...prev, dateFrom, dateTo }));
    };

    const clearAllFilters = () => {
        setFilters({
            type: "",
            status: "",
            search: "",
            dateFrom: "",
            dateTo: "",
            isPublic: "",
        });
        setSearchInput("");
        setDatePreset("");
    };

    const activeFilterCount = [
        filters.type,
        filters.status,
        filters.search,
        filters.dateFrom || filters.dateTo,
        filters.isPublic,
    ].filter(Boolean).length;

    return (
        <div className="space-y-4">
            {/* Search bar */}
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

            {/* Filter row */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Type filter */}
                <select
                    value={filters.type}
                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                    className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
                >
                    {TYPE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>

                {/* Status filter */}
                <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
                >
                    {STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>

                {/* Visibility filter */}
                <select
                    value={filters.isPublic}
                    onChange={(e) => setFilters(prev => ({ ...prev, isPublic: e.target.value }))}
                    className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
                >
                    {VISIBILITY_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>

                {/* Date preset */}
                <select
                    value={datePreset}
                    onChange={(e) => handleDatePreset(e.target.value)}
                    className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
                >
                    {DATE_PRESETS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>

                {/* Custom date inputs (show when custom selected) */}
                {datePreset === "custom" && (
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                            className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
                        />
                        <span className="text-slate-500">to</span>
                        <input
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                            className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
                        />
                    </div>
                )}

                {/* Clear all button */}
                {activeFilterCount > 0 && (
                    <button
                        onClick={clearAllFilters}
                        className="flex items-center gap-1 rounded-lg bg-slate-700/50 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Clear All
                    </button>
                )}
            </div>

            {/* Active filters summary */}
            {activeFilterCount > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-500">Active filters:</span>
                    {filters.type && (
                        <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-xs text-sky-400">
                            Type: {TYPE_OPTIONS.find(o => o.value === filters.type)?.label}
                        </span>
                    )}
                    {filters.status && (
                        <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">
                            Status: {STATUS_OPTIONS.find(o => o.value === filters.status)?.label}
                        </span>
                    )}
                    {filters.search && (
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
                            Search: "{filters.search}"
                        </span>
                    )}
                    {(filters.dateFrom || filters.dateTo) && (
                        <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-xs text-purple-400">
                            Date: {filters.dateFrom || "..."} → {filters.dateTo || "..."}
                        </span>
                    )}
                    {filters.isPublic && (
                        <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-xs text-rose-400">
                            {filters.isPublic === "true" ? "Public Only" : "Internal Only"}
                        </span>
                    )}
                </div>
            )}

            {/* Results count */}
            {filteredCount !== undefined && totalCount !== undefined && (
                <div className="text-xs text-slate-500">
                    Showing {filteredCount} of {totalCount} items
                </div>
            )}
        </div>
    );
}
