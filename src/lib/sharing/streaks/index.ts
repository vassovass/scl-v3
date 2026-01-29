/**
 * PRD-56: Share Streak System
 *
 * Exports for the share streak tracking module.
 */

// Types
export type {
    ShareStreak,
    ShareStreakUpdateResult,
    StreakTier,
    StreakTierConfig,
    ShareStreakBadgeProps,
    MilestoneCelebration,
    ShareStreakResponse,
    ShareStreakUpdateResponse,
} from './types';

// Constants and utilities
export {
    STREAK_MILESTONES,
    STREAK_TIERS,
    STREAK_AT_RISK_HOURS,
    DEFAULT_STREAK_DATA,
    getStreakTier,
    getNextMilestone,
    getDaysToNextMilestone,
    getMilestoneCelebration,
    MILESTONE_CELEBRATIONS,
} from './constants';

export type { StreakMilestone } from './constants';
