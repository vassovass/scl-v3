"use client";

import { useState, useEffect, useCallback } from "react";

interface UserSubmissionState {
    /** Total count of submissions across all leagues */
    totalSubmissions: number;
    /** Whether the user has submitted for today */
    hasSubmittedToday: boolean;
    /** Whether the user has submitted for yesterday */
    hasSubmittedYesterday: boolean;
    /** Today's step count (if submitted) */
    todaySteps?: number;
    /** Yesterday's step count (if submitted) */
    yesterdaySteps?: number;
    /** Current streak count */
    currentStreak: number;
    /** Loading state */
    isLoading: boolean;
    /** Error message */
    error?: string;
    /** Manually refetch */
    refetch: () => Promise<void>;
}

interface UseUserSubmissionsOptions {
    /** User ID to check */
    userId?: string;
    /** Skip fetching (e.g., before auth resolves) */
    skip?: boolean;
}

/**
 * Get today and yesterday date strings in user's local timezone.
 */
function getLocalDates() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    return {
        today: today.toISOString().slice(0, 10),
        yesterday: yesterday.toISOString().slice(0, 10),
    };
}

/**
 * Calculate current streak from a list of submission dates (YYYY-MM-DD).
 * Streak = consecutive days going backwards from yesterday (or today if submitted).
 */
function calculateStreak(dates: string[]): number {
    if (dates.length === 0) return 0;

    const sorted = [...dates].sort().reverse();
    const { today, yesterday } = getLocalDates();

    // Streak can start from today or yesterday
    let streakDate = sorted[0] === today ? today : yesterday;
    if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

    let streak = 0;
    const dateSet = new Set(sorted);
    const current = new Date(streakDate);

    while (dateSet.has(current.toISOString().slice(0, 10))) {
        streak++;
        current.setDate(current.getDate() - 1);
    }

    return streak;
}

/**
 * Global submission state hook for the current user.
 *
 * Unlike `useSubmissionStatus` (which is league-scoped), this checks
 * across all leagues for onboarding, engagement, and progress features.
 *
 * Used by: PRD 60 (onboarding), PRD 28 (missed-day), PRD 29 (progress)
 */
export function useUserSubmissions({
    userId,
    skip = false,
}: UseUserSubmissionsOptions): UserSubmissionState {
    const [state, setState] = useState<Omit<UserSubmissionState, "refetch">>({
        totalSubmissions: 0,
        hasSubmittedToday: false,
        hasSubmittedYesterday: false,
        currentStreak: 0,
        isLoading: true,
    });

    const fetchData = useCallback(async () => {
        if (skip || !userId) {
            setState(prev => ({ ...prev, isLoading: false }));
            return;
        }

        setState(prev => ({ ...prev, isLoading: true, error: undefined }));

        try {
            const { today, yesterday } = getLocalDates();

            // Fetch recent submissions (last 60 days) to calculate streak + today/yesterday
            const sixtyDaysAgo = new Date();
            sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
            const fromDate = sixtyDaysAgo.toISOString().slice(0, 10);

            const [recentRes, countRes] = await Promise.all([
                fetch(
                    `/api/submissions?user_id=${userId}&from=${fromDate}&to=${today}&limit=100&order_by=for_date&exclude_proxy=true`
                ),
                // Get total count with minimal data
                fetch(
                    `/api/submissions?user_id=${userId}&limit=1&exclude_proxy=true`
                ),
            ]);

            if (!recentRes.ok || !countRes.ok) {
                throw new Error("Failed to fetch submission data");
            }

            const [recentData, countData] = await Promise.all([
                recentRes.json(),
                countRes.json(),
            ]);

            const submissions = recentData.submissions || [];
            const total = countData.total || 0;

            // Check today and yesterday
            const todaySub = submissions.find((s: { for_date: string }) => s.for_date === today);
            const yesterdaySub = submissions.find((s: { for_date: string }) => s.for_date === yesterday);

            // Calculate streak from dates
            const dates = submissions.map((s: { for_date: string }) => s.for_date);
            const streak = calculateStreak(dates);

            setState({
                totalSubmissions: total,
                hasSubmittedToday: !!todaySub,
                hasSubmittedYesterday: !!yesterdaySub,
                todaySteps: todaySub?.steps,
                yesterdaySteps: yesterdaySub?.steps,
                currentStreak: streak,
                isLoading: false,
            });
        } catch (err) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: err instanceof Error ? err.message : "Unknown error",
            }));
        }
    }, [userId, skip]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        ...state,
        refetch: fetchData,
    };
}
