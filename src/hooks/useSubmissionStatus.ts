"use client";

import { useState, useEffect, useCallback } from "react";

interface SubmissionStatus {
    /** Whether the user has submitted steps for the target date */
    hasSubmitted: boolean;
    /** Step count for the target date (if submitted) */
    steps?: number;
    /** The date being checked (YYYY-MM-DD format) */
    targetDate: string;
    /** Loading state */
    isLoading: boolean;
    /** Error message if fetch failed */
    error?: string;
    /** Refetch function to manually refresh the status */
    refetch: () => Promise<void>;
}

interface UseSubmissionStatusOptions {
    /** User ID to check submissions for */
    userId?: string;
    /** 
     * Which date to check. Defaults to "yesterday" since users need a full day's 
     * worth of steps before submitting. Can also be "today" or a specific date string.
     */
    targetDate?: "yesterday" | "today" | string;
    /** League ID to scope the query (required for now due to API constraints) */
    leagueId?: string;
    /** Whether to skip fetching (e.g., when userId is not yet available) */
    skip?: boolean;
}

/**
 * Hook to check if a user has submitted steps for a given date.
 * 
 * By default, checks for yesterday's submission since users need a full day's 
 * worth of steps before they can submit. This is the core business logic.
 * 
 * @example
 * ```tsx
 * const { hasSubmitted, steps, isLoading } = useSubmissionStatus({
 *   userId: session?.user?.id,
 *   leagueId: leagueId,
 * });
 * 
 * if (!isLoading && !hasSubmitted) {
 *   // Show "Submit your steps" prompt
 * }
 * ```
 */
export function useSubmissionStatus({
    userId,
    targetDate = "yesterday",
    leagueId,
    skip = false,
}: UseSubmissionStatusOptions): SubmissionStatus {
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [steps, setSteps] = useState<number | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | undefined>(undefined);

    // Calculate the target date string
    const getTargetDateString = useCallback((): string => {
        if (targetDate === "yesterday") {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            return yesterday.toISOString().slice(0, 10);
        }
        if (targetDate === "today") {
            return new Date().toISOString().slice(0, 10);
        }
        // Assume it's already a date string
        return targetDate;
    }, [targetDate]);

    const dateStr = getTargetDateString();

    const fetchStatus = useCallback(async () => {
        if (skip || !userId || !leagueId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(undefined);

        try {
            // Query submissions for the specific date
            const res = await fetch(
                `/api/submissions?league_id=${leagueId}&user_id=${userId}&from=${dateStr}&to=${dateStr}&limit=1`
            );

            if (!res.ok) {
                throw new Error("Failed to fetch submission status");
            }

            const data = await res.json();

            if (data.submissions && data.submissions.length > 0) {
                setHasSubmitted(true);
                setSteps(data.submissions[0].steps);
            } else {
                setHasSubmitted(false);
                setSteps(undefined);
            }
        } catch (err) {
            console.error("Error checking submission status:", err);
            setError(err instanceof Error ? err.message : "Unknown error");
            setHasSubmitted(false);
            setSteps(undefined);
        } finally {
            setIsLoading(false);
        }
    }, [userId, leagueId, dateStr, skip]);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    return {
        hasSubmitted,
        steps,
        targetDate: dateStr,
        isLoading,
        error,
        refetch: fetchStatus,
    };
}
