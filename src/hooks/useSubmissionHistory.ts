"use client";

import { useState, useCallback } from "react";
import { SubmissionChange } from "@/types/database";

interface UseSubmissionHistoryOptions {
    submissionId: string;
    enabled?: boolean;
}

interface UseSubmissionHistoryResult {
    changes: SubmissionChange[];
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

/**
 * useSubmissionHistory - Fetches change history for a submission
 * 
 * Decoupled from UI for reusability across submission views and admin panels.
 */
export function useSubmissionHistory({
    submissionId,
    enabled = true,
}: UseSubmissionHistoryOptions): UseSubmissionHistoryResult {
    const [changes, setChanges] = useState<SubmissionChange[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasFetched, setHasFetched] = useState(false);

    const refetch = useCallback(async () => {
        if (!enabled || !submissionId) return;

        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/submissions/${submissionId}`);

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || `Failed to fetch history`);
            }

            const data = await res.json();
            setChanges(data.changes || []);
            setHasFetched(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setIsLoading(false);
        }
    }, [submissionId, enabled]);

    // Fetch on first access if enabled
    if (enabled && !hasFetched && !isLoading) {
        refetch();
    }

    return {
        changes,
        isLoading,
        error,
        refetch,
    };
}

