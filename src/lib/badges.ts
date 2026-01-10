/**
 * Central Badge & Color Configuration
 * 
 * Single source of truth for all badge styling across the app.
 * Used by: KanbanBoard, RoadmapView, FeedbackList, Leaderboard
 * 
 * @module lib/badges
 */

export interface BadgeConfig {
    label: string;
    className: string;
    icon?: string;
    pulse?: boolean;
}

export type BadgeCategory = 'type' | 'status' | 'release' | 'achievement';

/**
 * Central badge configuration for all categories
 */
export const BADGE_CONFIG: Record<string, Record<string, BadgeConfig>> = {
    // Feedback/task types
    type: {
        bug: {
            label: '🐛 Bug',
            icon: '🐛',
            className: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
        },
        feature: {
            label: '✨ Feature',
            icon: '✨',
            className: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        },
        improvement: {
            label: '📈 Improvement',
            icon: '📈',
            className: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
        },
        general: {
            label: '💬 General',
            icon: '💬',
            className: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
        },
        positive: {
            label: '👍 Positive',
            icon: '👍',
            className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        },
        negative: {
            label: '👎 Negative',
            icon: '👎',
            className: 'bg-red-500/20 text-red-400 border-red-500/30',
        },
    },

    // Workflow statuses
    status: {
        backlog: {
            label: '📋 Backlog',
            icon: '📋',
            className: 'bg-slate-500/20 text-slate-500',
        },
        todo: {
            label: '📝 To Do',
            icon: '📝',
            className: 'bg-slate-500/20 text-slate-400',
        },
        in_progress: {
            label: '🔨 In Progress',
            icon: '🔨',
            className: 'bg-sky-500/20 text-sky-400',
            pulse: true,
        },
        review: {
            label: '👀 Review',
            icon: '👀',
            className: 'bg-amber-500/20 text-amber-400',
        },
        pending_review: {
            label: '⏳ Awaiting Review',
            icon: '⏳',
            className: 'bg-amber-500/20 text-amber-400',
        },
        verified: {
            label: '✓ Verified',
            icon: '✓',
            className: 'bg-[hsl(var(--success)/0.2)] text-[hsl(var(--success))]',
        },
        pending: {
            label: '⏳ Pending',
            icon: '⏳',
            className: 'bg-[hsl(var(--warning)/0.2)] text-[hsl(var(--warning))]',
        },
        failed: {
            label: '✗ Failed',
            icon: '✗',
            className: 'bg-destructive/20 text-destructive',
        },
        needs_work: {
            label: '⚠ Needs Work',
            icon: '⚠',
            className: 'bg-rose-500/20 text-rose-400',
        },
        done: {
            label: '✅ Done',
            icon: '✅',
            className: 'bg-emerald-500/20 text-emerald-400',
        },
    },

    // Release timelines (roadmap columns)
    release: {
        now: {
            label: '🔥 Now',
            icon: '🔥',
            className: 'bg-rose-500/20 text-rose-400',
        },
        next: {
            label: '⏭️ Next',
            icon: '⏭️',
            className: 'bg-amber-500/20 text-amber-400',
        },
        later: {
            label: '📅 Later',
            icon: '📅',
            className: 'bg-sky-500/20 text-sky-400',
        },
        future: {
            label: '🔮 Future',
            icon: '🔮',
            className: 'bg-slate-500/20 text-slate-400',
        },
    },

    // Leaderboard achievements
    achievement: {
        leader: {
            label: 'Leader',
            icon: '👑',
            className: 'text-[hsl(var(--warning))]',
        },
        most_improved: {
            label: 'Most Improved',
            icon: '🚀',
            className: 'text-[hsl(var(--success))]',
        },
        streak_30: {
            label: '30+ Day Streak',
            icon: '🔥',
            className: 'text-red-500',
        },
        streak_7: {
            label: '7+ Day Streak',
            icon: '🔥',
            className: 'text-orange-400',
        },
        streak_3: {
            label: '3+ Day Streak',
            icon: '🔥',
            className: 'text-orange-300',
        },
        million_club: {
            label: '1 Million Steps Club',
            icon: '💎',
            className: 'text-purple-400',
        },
        '500k_club': {
            label: '500k Steps Club',
            icon: '👟',
            className: 'text-indigo-400',
        },
        '100k_club': {
            label: '100k Steps Club',
            icon: '👟',
            className: 'text-[hsl(var(--info))]',
        },
        centurion: {
            label: '100+ Day Streak',
            icon: '💯',
            className: 'text-[hsl(var(--warning))]',
        },
        legend_365: {
            label: '365 Day Streak',
            icon: '🌟',
            className: 'text-[hsl(var(--warning))]',
        },
    },
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the className for a badge
 */
export function getBadgeClass(category: string, value: string): string {
    return BADGE_CONFIG[category]?.[value]?.className ?? '';
}

/**
 * Get the full badge config object
 */
export function getBadgeConfig(category: string, value: string): BadgeConfig | undefined {
    return BADGE_CONFIG[category]?.[value];
}

/**
 * Get the label for a badge
 */
export function getBadgeLabel(category: string, value: string): string {
    return BADGE_CONFIG[category]?.[value]?.label ?? value;
}

/**
 * Get the icon for a badge
 */
export function getBadgeIcon(category: string, value: string): string {
    return BADGE_CONFIG[category]?.[value]?.icon ?? '';
}

// ============================================================================
// Backward Compatibility Exports
// ============================================================================

/**
 * TYPE_COLORS - backward compatible export for existing code
 * @deprecated Use getBadgeClass('type', value) instead
 */
export const TYPE_COLORS: Record<string, string> = Object.fromEntries(
    Object.entries(BADGE_CONFIG.type).map(([key, config]) => [key, config.className])
);

/**
 * STATUS_COLORS - backward compatible export for existing code
 * @deprecated Use getBadgeClass('status', value) instead
 */
export const STATUS_COLORS: Record<string, string> = Object.fromEntries(
    Object.entries(BADGE_CONFIG.status).map(([key, config]) => [
        key,
        config.className.includes('text-')
            ? config.className.split(' ').find(c => c.startsWith('text-')) ?? ''
            : config.className
    ])
);

/**
 * RELEASE_OPTIONS - backward compatible export for KanbanBoard
 */
export const RELEASE_OPTIONS: { id: string; label: string; color: string }[] =
    Object.entries(BADGE_CONFIG.release).map(([id, config]) => ({
        id,
        label: config.label,
        color: config.className,
    }));

/**
 * BADGE_INFO - backward compatible export for leaderboard
 */
export const BADGE_INFO: Record<string, { icon: string; label: string; color: string }> =
    Object.fromEntries(
        Object.entries(BADGE_CONFIG.achievement).map(([key, config]) => [
            key,
            { icon: config.icon ?? '', label: config.label, color: config.className },
        ])
    );
