/**
 * useOfflineQueue Hook
 * 
 * Manages the offline submission queue state.
 * Provides methods to add to queue and check pending count.
 */

"use client";

import { useState, useEffect, useCallback } from 'react';
import {
    getPendingSubmissions,
    addOfflineSubmission,
    getPendingCount,
    cleanupOldSubmissions,
    type OfflineSubmission,
    type SubmissionInput,
} from '@/lib/offline';

export function useOfflineQueue() {
    const [pendingCount, setPendingCount] = useState(0);
    const [queue, setQueue] = useState<OfflineSubmission[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    /**
     * Refresh the queue state from IndexedDB
     */
    const refreshQueue = useCallback(async () => {
        try {
            await cleanupOldSubmissions();
            const pending = await getPendingSubmissions();
            setQueue(pending);
            setPendingCount(pending.length);
        } catch (error) {
            console.error('[useOfflineQueue] Failed to refresh queue:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Check queue on mount
    useEffect(() => {
        // Only run on client
        if (typeof window === 'undefined') return;

        refreshQueue();
    }, [refreshQueue]);

    /**
     * Add a submission to the offline queue
     */
    const addToQueue = useCallback(async (input: SubmissionInput): Promise<string> => {
        const id = await addOfflineSubmission(input);
        await refreshQueue();
        return id;
    }, [refreshQueue]);

    /**
     * Get just the pending count (lightweight)
     */
    const checkPendingCount = useCallback(async (): Promise<number> => {
        const count = await getPendingCount();
        setPendingCount(count);
        return count;
    }, []);

    return {
        /** Number of pending submissions */
        pendingCount,
        /** Full queue of pending submissions */
        queue,
        /** Whether the queue is still loading */
        isLoading,
        /** Add a submission to the queue */
        addToQueue,
        /** Refresh the queue from storage */
        refreshQueue,
        /** Quick check of pending count */
        checkPendingCount,
    };
}

