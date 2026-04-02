"use client";

import { useState } from "react";
import { BOARD_STATUS_OPTIONS } from "@/lib/filters/feedbackFilters";

interface BulkActionsBarProps {
    selectedCount: number;
    onClear: () => void;
    onBulkStatusChange: (status: string) => Promise<void>;
    onBulkArchive: (hard?: boolean) => Promise<void>;
    onBulkTogglePublic: (isPublic: boolean) => Promise<void>;
    onMerge?: () => void;
}

/**
 * Floating action bar shown when items are selected.
 * Provides bulk operations like status change, archive, and visibility toggle.
 */
export default function BulkActionsBar({
    selectedCount,
    onClear,
    onBulkStatusChange,
    onBulkArchive,
    onBulkTogglePublic,
    onMerge,
}: BulkActionsBarProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);

    if (selectedCount === 0) return null;

    const handleStatusChange = async (status: string) => {
        setIsLoading(true);
        setShowStatusDropdown(false);
        try {
            await onBulkStatusChange(status);
        } finally {
            setIsLoading(false);
        }
    };

    const handleArchive = async (hard: boolean = false) => {
        setIsLoading(true);
        try {
            await onBulkArchive(hard);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTogglePublic = async (isPublic: boolean) => {
        setIsLoading(true);
        try {
            await onBulkTogglePublic(isPublic);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
            <div className="flex items-center gap-2 rounded-xl bg-background/95 backdrop-blur-sm border border-border shadow-xl shadow-black/20 px-4 py-2">
                {/* Selected count */}
                <span className="text-sm font-medium text-[hsl(var(--info))]">
                    {selectedCount} selected
                </span>

                <div className="w-px h-5 bg-border" />

                {/* Status dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                        disabled={isLoading}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-foreground bg-card hover:bg-accent rounded-lg transition disabled:opacity-50"
                    >
                        Status
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {showStatusDropdown && (
                        <div className="absolute bottom-full left-0 mb-2 w-40 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                            {BOARD_STATUS_OPTIONS.filter(opt => opt.value).map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => handleStatusChange(opt.value)}
                                    className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-accent transition"
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Merge button (2+ items) */}
                {selectedCount >= 2 && onMerge && (
                    <button
                        onClick={onMerge}
                        disabled={isLoading}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-[hsl(var(--brand-accent))] bg-[hsl(var(--brand-accent))]/20 hover:bg-[hsl(var(--brand-accent))]/30 rounded-lg transition disabled:opacity-50"
                        title="Merge selected items"
                    >
                        ⚡ Merge
                    </button>
                )}

                {/* Visibility buttons */}
                <button
                    onClick={() => handleTogglePublic(true)}
                    disabled={isLoading}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-success bg-success/20 hover:bg-success/30 rounded-lg transition disabled:opacity-50"
                    title="Make all selected public on roadmap"
                >
                    🌐
                </button>
                <button
                    onClick={() => handleTogglePublic(false)}
                    disabled={isLoading}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-muted-foreground bg-secondary/50 hover:bg-accent rounded-lg transition disabled:opacity-50"
                    title="Make all selected private"
                >
                    🔒
                </button>

                {/* Archive button (soft delete) */}
                <button
                    onClick={() => handleArchive(false)}
                    disabled={isLoading}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-warning bg-warning/20 hover:bg-warning/30 rounded-lg transition disabled:opacity-50"
                    title="Archive selected (can restore later)"
                >
                    📦 Archive
                </button>

                {/* Delete forever button (hard delete) */}
                <button
                    onClick={() => handleArchive(true)}
                    disabled={isLoading}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-destructive bg-destructive/20 hover:bg-destructive/30 rounded-lg transition disabled:opacity-50"
                    title="Delete forever (cannot undo)"
                >
                    🗑️
                </button>

                <div className="w-px h-5 bg-border" />

                {/* Clear selection */}
                <button
                    onClick={onClear}
                    disabled={isLoading}
                    className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition disabled:opacity-50"
                >
                    ✕ Clear
                </button>

                {/* Loading indicator */}
                {isLoading && (
                    <div className="ml-2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </div>
        </div>
    );
}

