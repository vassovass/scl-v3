/**
 * useOfflineSync Hook
 * 
 * Handles automatic synchronization of offline submissions when online.
 * Listens for online events and processes the queue.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
    getPendingSubmissions,
    updateSubmissionStatus,
    removeSubmission,
    type OfflineSubmission,
    type SyncResult,
} from '@/lib/offline';

const MAX_RETRIES = 3;

export function useOfflineSync() {
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
    const { toast } = useToast();
    const syncInProgress = useRef(false);

    /**
     * Upload a proof image blob and return the storage path
     */
    const uploadProofImage = async (blob: Blob, userId: string, date: string): Promise<string> => {
        const formData = new FormData();
        const filename = `${userId}_${date}_${Date.now()}.jpg`;
        formData.append('file', blob, filename);

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Failed to upload proof image');
        }

        const data = await response.json();
        return data.path;
    };

    /**
     * Process the offline queue and sync to server
     */
    const processQueue = useCallback(async (): Promise<SyncResult> => {
        // Prevent concurrent syncs
        if (syncInProgress.current) {
            return { synced: 0, failed: 0, errors: [] };
        }

        syncInProgress.current = true;
        setIsSyncing(true);

        const result: SyncResult = {
            synced: 0,
            failed: 0,
            errors: [],
        };

        try {
            const pending = await getPendingSubmissions();

            if (pending.length === 0) {
                return result;
            }

            console.log(`[OfflineSync] Processing ${pending.length} pending submissions`);

            for (const submission of pending) {
                // Skip if max retries exceeded
                if (submission.retryCount >= MAX_RETRIES) {
                    console.warn(`[OfflineSync] Skipping ${submission.id} - max retries exceeded`);
                    result.failed++;
                    result.errors.push({
                        id: submission.id,
                        error: 'Max retries exceeded'
                    });
                    continue;
                }

                try {
                    await updateSubmissionStatus(submission.id, 'syncing');

                    // Upload proof image if present
                    let proofPath: string | undefined;
                    if (submission.proofBlob) {
                        proofPath = await uploadProofImage(
                            submission.proofBlob,
                            submission.userId,
                            submission.date
                        );
                    }

                    // Submit to API
                    const response = await fetch('/api/submissions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            steps: submission.steps,
                            for_date: submission.date,
                            proof_path: proofPath,
                        }),
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.error || `HTTP ${response.status}`);
                    }

                    // Success - remove from queue
                    await removeSubmission(submission.id);
                    result.synced++;
                    console.log(`[OfflineSync] Synced submission ${submission.id}`);

                } catch (err) {
                    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                    console.error(`[OfflineSync] Failed to sync ${submission.id}:`, errorMessage);

                    await updateSubmissionStatus(submission.id, 'failed', errorMessage);
                    result.failed++;
                    result.errors.push({ id: submission.id, error: errorMessage });
                }
            }

            // Show toast notification
            if (result.synced > 0) {
                toast({
                    title: 'Offline submissions synced!',
                    description: `${result.synced} submission${result.synced > 1 ? 's' : ''} uploaded successfully.`,
                });
            }

            if (result.failed > 0 && result.synced === 0) {
                toast({
                    variant: 'destructive',
                    title: 'Sync failed',
                    description: `${result.failed} submission${result.failed > 1 ? 's' : ''} could not be synced.`,
                });
            }

        } finally {
            setIsSyncing(false);
            syncInProgress.current = false;
            setLastSyncResult(result);
        }

        return result;
    }, [toast]);

    // Auto-sync when coming online
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleOnline = () => {
            console.log('[OfflineSync] Online detected, starting sync...');
            processQueue();
        };

        window.addEventListener('online', handleOnline);

        // Also sync on mount if online
        if (navigator.onLine) {
            // Delay slightly to let the app initialize
            const timer = setTimeout(() => {
                processQueue();
            }, 1000);
            return () => {
                clearTimeout(timer);
                window.removeEventListener('online', handleOnline);
            };
        }

        return () => {
            window.removeEventListener('online', handleOnline);
        };
    }, [processQueue]);

    return {
        /** Whether sync is currently in progress */
        isSyncing,
        /** Result of the last sync operation */
        lastSyncResult,
        /** Manually trigger queue processing */
        processQueue,
    };
}
