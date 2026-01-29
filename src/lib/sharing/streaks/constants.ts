/**
 * PRD-56: Share Streak Constants
 *
 * Configuration for streak milestones, tiers, and celebration messages.
 */

import type { StreakTier, StreakTierConfig, MilestoneCelebration } from './types';

/**
 * Milestone values that trigger celebrations
 * These are special streak lengths that earn rewards/recognition
 */
export const STREAK_MILESTONES = [7, 14, 30, 100] as const;
export type StreakMilestone = typeof STREAK_MILESTONES[number];

/**
 * Streak tier thresholds and configuration
 * Users earn tiers as they maintain longer streaks
 */
export const STREAK_TIERS: Record<StreakTier, StreakTierConfig> = {
    none: {
        tier: 'none',
        minDays: 0,
        label: 'No streak',
        emoji: '',
        colorClass: 'text-muted-foreground',
        bgClass: 'bg-muted',
    },
    bronze: {
        tier: 'bronze',
        minDays: 7,
        label: 'Bronze Sharer',
        emoji: '🔥',
        colorClass: 'text-orange-500',
        bgClass: 'bg-orange-500/10',
    },
    silver: {
        tier: 'silver',
        minDays: 14,
        label: 'Silver Sharer',
        emoji: '🔥',
        colorClass: 'text-slate-400',
        bgClass: 'bg-slate-400/10',
    },
    gold: {
        tier: 'gold',
        minDays: 30,
        label: 'Gold Sharer',
        emoji: '🔥',
        colorClass: 'text-yellow-500',
        bgClass: 'bg-yellow-500/10',
    },
    diamond: {
        tier: 'diamond',
        minDays: 100,
        label: 'Diamond Sharer',
        emoji: '💎',
        colorClass: 'text-cyan-400',
        bgClass: 'bg-cyan-400/10',
    },
};

/**
 * Get the tier for a given streak length
 */
export function getStreakTier(streak: number): StreakTierConfig {
    if (streak >= STREAK_TIERS.diamond.minDays) return STREAK_TIERS.diamond;
    if (streak >= STREAK_TIERS.gold.minDays) return STREAK_TIERS.gold;
    if (streak >= STREAK_TIERS.silver.minDays) return STREAK_TIERS.silver;
    if (streak >= STREAK_TIERS.bronze.minDays) return STREAK_TIERS.bronze;
    return STREAK_TIERS.none;
}

/**
 * Get the next milestone after current streak
 */
export function getNextMilestone(currentStreak: number): number | null {
    for (const milestone of STREAK_MILESTONES) {
        if (currentStreak < milestone) {
            return milestone;
        }
    }
    return null; // All milestones achieved
}

/**
 * Get days remaining until next milestone
 */
export function getDaysToNextMilestone(currentStreak: number): number | null {
    const nextMilestone = getNextMilestone(currentStreak);
    if (nextMilestone === null) return null;
    return nextMilestone - currentStreak;
}

/**
 * Milestone celebration messages
 */
export const MILESTONE_CELEBRATIONS: Record<StreakMilestone, MilestoneCelebration> = {
    7: {
        milestone: 7,
        tier: 'bronze',
        message: "One week of sharing! You're building a great habit.",
        emoji: '🔥',
    },
    14: {
        milestone: 14,
        tier: 'silver',
        message: "Two weeks strong! Your friends love seeing your progress.",
        emoji: '✨',
    },
    30: {
        milestone: 30,
        tier: 'gold',
        message: "A whole month! You're a sharing champion.",
        emoji: '🏆',
    },
    100: {
        milestone: 100,
        tier: 'diamond',
        message: "100 days! Legendary sharing streak achieved!",
        emoji: '💎',
    },
};

/**
 * Get celebration data for a milestone
 */
export function getMilestoneCelebration(milestone: number): MilestoneCelebration | null {
    if (milestone in MILESTONE_CELEBRATIONS) {
        return MILESTONE_CELEBRATIONS[milestone as StreakMilestone];
    }
    return null;
}

/**
 * Hours threshold before streak is considered "at risk"
 * User should share before this many hours pass to maintain streak
 */
export const STREAK_AT_RISK_HOURS = 20;

/**
 * Default streak data for users with no shares
 */
export const DEFAULT_STREAK_DATA = {
    current_streak: 0,
    longest_streak: 0,
    last_share_date: null,
    total_shares: 0,
    shares_this_week: 0,
    streak_at_risk: false,
    hours_until_reset: null,
} as const;
