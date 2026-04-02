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
            className: 'bg-destructive/20 text-destructive border-destructive/30',
        },
        feature: {
            label: '✨ Feature',
            icon: '✨',
            className: 'bg-warning/20 text-warning border-warning/30',
        },
        improvement: {
            label: '📈 Improvement',
            icon: '📈',
            className: 'bg-info/20 text-info border-info/30',
        },
        general: {
            label: '💬 General',
            icon: '💬',
            className: 'bg-muted text-muted-foreground border-border',
        },
        positive: {
            label: '👍 Positive',
            icon: '👍',
            className: 'bg-success/20 text-success border-success/30',
        },
        negative: {
            label: '👎 Negative',
            icon: '👎',
            className: 'bg-destructive/20 text-destructive border-destructive/30',
        },
    },

    // Workflow statuses
    status: {
        backlog: {
            label: '📋 Backlog',
            icon: '📋',
            className: 'bg-muted text-muted-foreground',
        },
        todo: {
            label: '📝 To Do',
            icon: '📝',
            className: 'bg-muted text-muted-foreground',
        },
        in_progress: {
            label: '🔨 In Progress',
            icon: '🔨',
            className: 'bg-info/20 text-info',
            pulse: true,
        },
        review: {
            label: '👀 Review',
            icon: '👀',
            className: 'bg-warning/20 text-warning',
        },
        pending_review: {
            label: '⏳ Awaiting Review',
            icon: '⏳',
            className: 'bg-warning/20 text-warning',
        },
        verified: {
            label: '✓ Verified',
            icon: '✓',
            className: 'bg-success/20 text-success',
        },
        pending: {
            label: '⏳ Pending',
            icon: '⏳',
            className: 'bg-warning/20 text-warning',
        },
        failed: {
            label: '✗ Failed',
            icon: '✗',
            className: 'bg-destructive/20 text-destructive',
        },
        needs_work: {
            label: '⚠ Needs Work',
            icon: '⚠',
            className: 'bg-destructive/20 text-destructive',
        },
        done: {
            label: '✅ Done',
            icon: '✅',
            className: 'bg-success/20 text-success',
        },
    },

    // Release timelines (roadmap columns)
    release: {
        now: {
            label: '🔥 Now',
            icon: '🔥',
            className: 'bg-destructive/20 text-destructive',
        },
        next: {
            label: '⏭️ Next',
            icon: '⏭️',
            className: 'bg-warning/20 text-warning',
        },
        later: {
            label: '📅 Later',
            icon: '📅',
            className: 'bg-info/20 text-info',
        },
        future: {
            label: '🔮 Future',
            icon: '🔮',
            className: 'bg-muted text-muted-foreground',
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
            className: 'text-destructive',
        },
        streak_7: {
            label: '7+ Day Streak',
            icon: '🔥',
            className: 'text-warning',
        },
        streak_3: {
            label: '3+ Day Streak',
            icon: '🔥',
            className: 'text-warning/75',
        },
        million_club: {
            label: '1 Million Steps Club',
            icon: '💎',
            className: 'text-[hsl(var(--brand-accent))]',
        },
        '500k_club': {
            label: '500k Steps Club',
            icon: '👟',
            className: 'text-info',
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

