/**
 * Shared filter configuration for feedback/kanban systems
 * 
 * This module provides centralized filter options that can be reused
 * across the Admin Feedback page, Kanban board, and any future
 * feedback-related UI components.
 * 
 * @module lib/filters/feedbackFilters
 */

export const FEEDBACK_TYPES = [
    { value: "", label: "All Types" },
    { value: "bug", label: "🐛 Bug" },
    { value: "feature", label: "✨ Feature" },
    { value: "improvement", label: "📈 Improvement" },
    { value: "general", label: "💬 General" },
    { value: "positive", label: "👍 Positive" },
    { value: "negative", label: "👎 Negative" },
] as const;

export const BOARD_STATUS_OPTIONS = [
    { value: "", label: "All Statuses" },
    { value: "backlog", label: "📋 Backlog" },
    { value: "todo", label: "📝 To Do" },
    { value: "in_progress", label: "🔨 In Progress" },
    { value: "review", label: "👀 Review" },
    { value: "done", label: "✅ Done" },
] as const;

export const VISIBILITY_OPTIONS = [
    { value: "", label: "All Items" },
    { value: "true", label: "🌐 Public (Roadmap)" },
    { value: "false", label: "🔒 Internal Only" },
] as const;

export const SOURCE_OPTIONS = [
    { value: "", label: "All Sources" },
    { value: "user_submitted", label: "👤 User Submitted" },
    { value: "admin_created", label: "🛠️ Admin Created" },
] as const;

export const DATE_PRESETS = [
    { value: "", label: "All Time" },
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "custom", label: "Custom Range" },
] as const;

export const TARGET_RELEASE_OPTIONS = [
    { value: "", label: "All Releases" },
    { value: "now", label: "🔥 Now" },
    { value: "next", label: "📅 Next" },
    { value: "later", label: "📌 Later" },
    { value: "future", label: "💭 Future" },
] as const;

// Color mappings for badges - re-exported from central config
export { TYPE_COLORS, STATUS_COLORS } from '@/lib/badges';

// Type definitions
export interface FeedbackFilterState {
    type: string;
    status: string;
    search: string;
    dateFrom: string;
    dateTo: string;
    isPublic: string;
    source: string;
    targetRelease?: string;
}

export const DEFAULT_FILTER_STATE: FeedbackFilterState = {
    type: "",
    status: "",
    search: "",
    dateFrom: "",
    dateTo: "",
    isPublic: "",
    source: "",
    targetRelease: "",
};

/**
 * Determines if an item is user-submitted based on user_id presence
 */
export function isUserSubmitted(item: { user_id: string | null }): boolean {
    return item.user_id !== null;
}

/**
 * Filters items by source (user_submitted or admin_created)
 */
export function filterBySource<T extends { user_id: string | null }>(
    items: T[],
    source: string
): T[] {
    if (!source) return items;

    if (source === "user_submitted") {
        return items.filter(item => item.user_id !== null);
    } else if (source === "admin_created") {
        return items.filter(item => item.user_id === null);
    }

    return items;
}

