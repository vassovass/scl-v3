"use client";

import { useState, useEffect, useMemo } from "react";

interface EngagementState {
    /** Whether the user missed submitting yesterday */
    missedYesterday: boolean;
    /** Whether the user's current streak is at risk (evening + no today submission) */
    streakAtRisk: boolean;
    /** Yesterday's date formatted as YYYY-MM-DD */
    missedDate: string;
    /** Current streak length */
    currentStreak: number;
    /** Which prompts are dismissed this session */
    dismissed: Set<string>;
    /** Dismiss a prompt by key */
    dismiss: (key: string) => void;
}

interface UseEngagementOptions {
    hasSubmittedToday: boolean;
    hasSubmittedYesterday: boolean;
    currentStreak: number;
    /** Hour threshold for evening warning (default: 18 = 6PM) */
    eveningHour?: number;
}

const DISMISS_KEY = "scl_engagement_dismissed";

/**
 * Derives engagement prompt state from submission data.
 *
 * Builds on `useUserSubmissions` — takes its outputs as inputs
 * to avoid double-fetching. Manages dismiss state in sessionStorage.
 *
 * Used by: PRD 28 (missed-day prompt, streak warning)
 */
export function useEngagement({
    hasSubmittedToday,
    hasSubmittedYesterday,
    currentStreak,
    eveningHour = 18,
}: UseEngagementOptions): EngagementState {
    // Restore dismissed prompts from sessionStorage
    const [dismissed, setDismissed] = useState<Set<string>>(() => {
        if (typeof window === "undefined") return new Set();
        try {
            const stored = sessionStorage.getItem(DISMISS_KEY);
            return stored ? new Set(JSON.parse(stored)) : new Set();
        } catch {
            return new Set();
        }
    });

    // Calculate yesterday's date in local timezone
    const missedDate = useMemo(() => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().slice(0, 10);
    }, []);

    // Check if it's evening (client-side timezone)
    const [isEvening, setIsEvening] = useState(() => new Date().getHours() >= eveningHour);

    // Update evening check periodically (every 5 min)
    useEffect(() => {
        const interval = setInterval(() => {
            setIsEvening(new Date().getHours() >= eveningHour);
        }, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [eveningHour]);

    const dismiss = (key: string) => {
        setDismissed((prev) => {
            const next = new Set(prev);
            next.add(key);
            try {
                sessionStorage.setItem(DISMISS_KEY, JSON.stringify([...next]));
            } catch {
                // sessionStorage unavailable
            }
            return next;
        });
    };

    return {
        missedYesterday: !hasSubmittedYesterday,
        streakAtRisk: isEvening && !hasSubmittedToday && currentStreak > 0,
        missedDate,
        currentStreak,
        dismissed,
        dismiss,
    };
}
