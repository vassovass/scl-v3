/**
 * Offline Storage
 * 
 * IndexedDB-based storage for offline step submissions.
 * Uses the `idb` library for a cleaner Promise-based API.
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { OfflineSubmission, SubmissionInput } from './types';

// Database schema for TypeScript type safety
interface StepLeagueDB extends DBSchema {
    offlineSubmissions: {
        key: string;
        value: OfflineSubmission;
        indexes: { 'by-status': string };
    };
}

const DB_NAME = 'stepleague-offline';
const DB_VERSION = 1;
const MAX_QUEUE_SIZE = 10;
const RETENTION_PERIOD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Database singleton
let dbPromise: Promise<IDBPDatabase<StepLeagueDB>> | null = null;

/**
 * Get or create the database connection
 */
export async function getDB(): Promise<IDBPDatabase<StepLeagueDB>> {
    if (!dbPromise) {
        dbPromise = openDB<StepLeagueDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                // Create the submissions store with status index
                if (!db.objectStoreNames.contains('offlineSubmissions')) {
                    const store = db.createObjectStore('offlineSubmissions', { keyPath: 'id' });
                    store.createIndex('by-status', 'status');
                }
            },
        });
    }
    return dbPromise;
}

/**
 * Generate a UUID for new submissions
 */
function generateId(): string {
    return crypto.randomUUID();
}

/**
 * Add a new offline submission to the queue
 */
export async function addOfflineSubmission(input: SubmissionInput): Promise<string> {
    const db = await getDB();

    // Check queue usage
    const count = await db.count('offlineSubmissions');
    if (count >= MAX_QUEUE_SIZE) {
        throw new Error(`Offline queue is full (max ${MAX_QUEUE_SIZE} items). Please go online to sync.`);
    }

    const id = generateId();

    const submission: OfflineSubmission = {
        ...input,
        id,
        createdAt: Date.now(),
        status: 'pending',
        retryCount: 0,
    };

    await db.put('offlineSubmissions', submission);
    return id;
}

/**
 * Get all pending submissions (status = 'pending' or 'failed')
 */
export async function getPendingSubmissions(): Promise<OfflineSubmission[]> {
    const db = await getDB();
    const all = await db.getAll('offlineSubmissions');

    // Return pending and failed (for retry)
    return all.filter(s => s.status === 'pending' || s.status === 'failed');
}

/**
 * Get all submissions regardless of status
 */
export async function getAllSubmissions(): Promise<OfflineSubmission[]> {
    const db = await getDB();
    return db.getAll('offlineSubmissions');
}

/**
 * Update submission status
 */
export async function updateSubmissionStatus(
    id: string,
    status: OfflineSubmission['status'],
    error?: string
): Promise<void> {
    const db = await getDB();
    const submission = await db.get('offlineSubmissions', id);

    if (!submission) {
        console.warn(`[OfflineStorage] Submission ${id} not found`);
        return;
    }

    const updated: OfflineSubmission = {
        ...submission,
        status,
        retryCount: status === 'failed' ? submission.retryCount + 1 : submission.retryCount,
        lastError: error,
    };

    await db.put('offlineSubmissions', updated);
}

/**
 * Remove a submission from the queue (after successful sync)
 */
export async function removeSubmission(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('offlineSubmissions', id);
}

/**
 * Get count of pending submissions
 */
export async function getPendingCount(): Promise<number> {
    const pending = await getPendingSubmissions();
    return pending.length;
}

/**
 * Clear all submissions (for debugging/reset)
 */
export async function clearAllSubmissions(): Promise<void> {
    const db = await getDB();
    await db.clear('offlineSubmissions');
}

/**
 * Cleanup submissions older than RETENTION_PERIOD_MS
 * This prevents orphaned data from accumulating forever
 */
export async function cleanupOldSubmissions(): Promise<number> {
    const db = await getDB();
    const all = await db.getAll('offlineSubmissions');
    const now = Date.now();
    let deletedCount = 0;

    for (const sub of all) {
        if (now - sub.createdAt > RETENTION_PERIOD_MS) {
            await db.delete('offlineSubmissions', sub.id);
            deletedCount++;
        }
    }

    if (deletedCount > 0) {
        console.log(`[OfflineStorage] Cleaned up ${deletedCount} old submissions`);
    }

    return deletedCount;
}

// Re-export types for convenience
export type { OfflineSubmission, SubmissionInput, SyncResult } from './types';

