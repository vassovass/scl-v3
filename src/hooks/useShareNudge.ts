'use client';

/**
 * useShareNudge Hook
 *
 * Manages share nudge logic including:
 * - Fetching streak data
 * - Checking user preferences
 * - Calculating streak-at-risk status
 * - Managing dismissal state (localStorage)
 *
 * PRD-56: Sharing Encouragement System
 *
 * @example
 * const { shouldShowNudge, nudgeType, streak, dismiss, snooze } = useShareNudge();
 *
 * if (shouldShowNudge) {
 *   return <ShareReminder type={nudgeType} streak={streak} ... />;
 * }
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ShareStreak } from '@/lib/sharing/streaks';
import { STREAK_AT_RISK_HOURS, DEFAULT_STREAK_DATA } from '@/lib/sharing/streaks';

// Storage keys
const NUDGE_DISMISSED_KEY = 'share_nudge_dismissed';
const NUDGE_SNOOZED_KEY = 'share_nudge_snoozed';

export type NudgeType = 'streak_at_risk' | 'encourage_share' | null;

export interface UseShareNudgeOptions {
    /** Auto-fetch streak data on mount */
    autoFetch?: boolean;
    /** User's nudge frequency preference */
    nudgeFrequency?: 'daily' | 'weekly' | 'off';
    /** Manually provide streak data instead of fetching */
    streakData?: ShareStreak | null;
}

export interface UseShareNudgeResult {
    /** Whether to show any nudge */
    shouldShowNudge: boolean;
    /** Type of nudge to show */
    nudgeType: NudgeType;
    /** Current streak data */
    streak: ShareStreak;
    /** Hours until streak resets */
    hoursUntilReset: number | null;
    /** Days since last share */
    daysSinceLastShare: number;
    /** Loading state */
    isLoading: boolean;
    /** Dismiss the nudge (hides for 24 hours) */
    dismiss: () => void;
    /** Snooze the nudge for N hours */
    snooze: (hours: number) => void;
    /** Refresh streak data */
    refresh: () => Promise<void>;
}

/**
 * Check if a timestamp is expired
 */
function isExpired(timestamp: number | null): boolean {
    if (!timestamp) return true;
    return Date.now() > timestamp;
}

/**
 * Get value from localStorage safely
 */
function getStoredTimestamp(key: string): number | null {
    if (typeof window === 'undefined') return null;
    try {
        const value = localStorage.getItem(key);
        return value ? parseInt(value, 10) : null;
    } catch {
        return null;
    }
}

/**
 * Set value in localStorage safely
 */
function setStoredTimestamp(key: string, value: number): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(key, value.toString());
    } catch {
        // Storage quota exceeded or not available
    }
}

export function useShareNudge(options: UseShareNudgeOptions = {}): UseShareNudgeResult {
    const {
        autoFetch = true,
        nudgeFrequency = 'daily',
        streakData: providedStreakData,
    } = options;

    const [streak, setStreak] = useState<ShareStreak>(DEFAULT_STREAK_DATA);
    const [isLoading, setIsLoading] = useState(autoFetch);
    const [dismissedUntil, setDismissedUntil] = useState<number | null>(null);
    const [snoozedUntil, setSnoozedUntil] = useState<number | null>(null);

    // Load dismissed/snoozed state from localStorage
    useEffect(() => {
        setDismissedUntil(getStoredTimestamp(NUDGE_DISMISSED_KEY));
        setSnoozedUntil(getStoredTimestamp(NUDGE_SNOOZED_KEY));
    }, []);

    // Fetch streak data
    const fetchStreak = useCallback(async () => {
        if (providedStreakData) {
            setStreak(providedStreakData);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch('/api/share/streak');
            if (response.ok) {
                const data = await response.json();
                setStreak(data.streak || DEFAULT_STREAK_DATA);
            }
        } catch (error) {
            console.error('Failed to fetch streak data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [providedStreakData]);

    // Auto-fetch on mount
    useEffect(() => {
        if (autoFetch) {
            fetchStreak();
        }
    }, [autoFetch, fetchStreak]);

    // Update if providedStreakData changes
    useEffect(() => {
        if (providedStreakData) {
            setStreak(providedStreakData);
        }
    }, [providedStreakData]);

    // Calculate days since last share
    const daysSinceLastShare = useMemo(() => {
        if (!streak.last_share_date) return 999;
        const lastShare = new Date(streak.last_share_date);
        const today = new Date();
        const diffTime = today.getTime() - lastShare.getTime();
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }, [streak.last_share_date]);

    // Determine nudge type
    const { shouldShowNudge, nudgeType } = useMemo(() => {
        // Nudges disabled by user
        if (nudgeFrequency === 'off') {
            return { shouldShowNudge: false, nudgeType: null };
        }

        // Currently snoozed
        if (!isExpired(snoozedUntil)) {
            return { shouldShowNudge: false, nudgeType: null };
        }

        // Currently dismissed (24 hours)
        if (!isExpired(dismissedUntil)) {
            return { shouldShowNudge: false, nudgeType: null };
        }

        // Still loading
        if (isLoading) {
            return { shouldShowNudge: false, nudgeType: null };
        }

        // Streak at risk (has streak and approaching reset)
        if (streak.current_streak > 0 && streak.streak_at_risk) {
            return { shouldShowNudge: true, nudgeType: 'streak_at_risk' as const };
        }

        // Weekly frequency - only show if 7+ days since last share
        if (nudgeFrequency === 'weekly' && daysSinceLastShare < 7) {
            return { shouldShowNudge: false, nudgeType: null };
        }

        // Daily frequency - show if 1+ days since last share
        if (daysSinceLastShare >= 1) {
            return { shouldShowNudge: true, nudgeType: 'encourage_share' as const };
        }

        return { shouldShowNudge: false, nudgeType: null };
    }, [
        nudgeFrequency,
        snoozedUntil,
        dismissedUntil,
        isLoading,
        streak.current_streak,
        streak.streak_at_risk,
        daysSinceLastShare,
    ]);

    // Dismiss handler (24 hours)
    const dismiss = useCallback(() => {
        const dismissUntil = Date.now() + 24 * 60 * 60 * 1000;
        setDismissedUntil(dismissUntil);
        setStoredTimestamp(NUDGE_DISMISSED_KEY, dismissUntil);
    }, []);

    // Snooze handler
    const snooze = useCallback((hours: number) => {
        const snoozeUntil = Date.now() + hours * 60 * 60 * 1000;
        setSnoozedUntil(snoozeUntil);
        setStoredTimestamp(NUDGE_SNOOZED_KEY, snoozeUntil);
    }, []);

    return {
        shouldShowNudge,
        nudgeType,
        streak,
        hoursUntilReset: streak.hours_until_reset,
        daysSinceLastShare,
        isLoading,
        dismiss,
        snooze,
        refresh: fetchStreak,
    };
}

export default useShareNudge;
