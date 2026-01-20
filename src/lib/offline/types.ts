/**
 * Offline Storage Types
 * 
 * Type definitions for offline submission queuing.
 */

export interface OfflineSubmission {
    id: string;
    userId: string;
    steps: number;
    date: string; // YYYY-MM-DD
    proofBlob?: Blob;
    createdAt: number; // timestamp
    status: 'pending' | 'syncing' | 'failed';
    retryCount: number;
    lastError?: string;
}

export interface SyncResult {
    synced: number;
    failed: number;
    errors: Array<{ id: string; error: string }>;
}

export type SubmissionInput = Omit<OfflineSubmission, 'id' | 'createdAt' | 'status' | 'retryCount' | 'lastError'>;

