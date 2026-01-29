/**
 * PRD-56: Share Streak Types
 *
 * TypeScript interfaces for the share streak tracking system.
 */

/**
 * Share streak data from database
 */
export interface ShareStreak {
    current_streak: number;
    longest_streak: number;
    last_share_date: string | null;
    total_shares: number;
    shares_this_week: number;
    streak_at_risk: boolean;
    hours_until_reset: number | null;
}

/**
 * Result from update_share_streak() database function
 */
export interface ShareStreakUpdateResult {
    new_streak: number;
    is_milestone: boolean;
    milestone_value: number;
}

/**
 * Streak tier for badge display
 */
export type StreakTier = 'none' | 'bronze' | 'silver' | 'gold' | 'diamond';

/**
 * Streak tier configuration
 */
export interface StreakTierConfig {
    tier: StreakTier;
    minDays: number;
    label: string;
    emoji: string;
    colorClass: string;
    bgClass: string;
}

/**
 * Share streak badge props
 */
export interface ShareStreakBadgeProps {
    streak: number;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
    showTier?: boolean;
    className?: string;
}

/**
 * Milestone celebration data
 */
export interface MilestoneCelebration {
    milestone: number;
    tier: StreakTier;
    message: string;
    emoji: string;
}

/**
 * API response for /api/share/streak
 */
export interface ShareStreakResponse {
    streak: ShareStreak;
    tier: StreakTierConfig;
    nextMilestone: number | null;
    daysToNextMilestone: number | null;
}

/**
 * API response for streak update (from share creation)
 */
export interface ShareStreakUpdateResponse {
    streak: ShareStreakUpdateResult;
    celebration: MilestoneCelebration | null;
}
