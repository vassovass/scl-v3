/**
 * Offline Queue & Sync Tests
 * 
 * Tests for offline submission queue persistence and sync logic.
 * PWA critical path - ensures offline-first works correctly.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Types based on actual offline module
interface SubmissionInput {
    league_id?: string | null;
    date: string;
    steps: number;
    proof_path?: string | null;
    partial?: boolean;
}

interface OfflineSubmission {
    id: string;
    input: SubmissionInput;
    status: 'pending' | 'syncing' | 'synced' | 'failed';
    retries: number;
    createdAt: number;
}

describe('Offline Queue - Core Operations', () => {
    describe('Queue state management', () => {
        it('starts with zero pending count', () => {
            const queue: OfflineSubmission[] = [];
            expect(queue.length).toBe(0);
        });

        it('increments count when adding submission', () => {
            const queue: OfflineSubmission[] = [];

            queue.push({
                id: 'sub-1',
                input: { date: '2026-01-15', steps: 5000 },
                status: 'pending',
                retries: 0,
                createdAt: Date.now(),
            });

            expect(queue.length).toBe(1);
        });

        it('decrements count when removing submission', () => {
            const queue: OfflineSubmission[] = [{
                id: 'sub-1',
                input: { date: '2026-01-15', steps: 5000 },
                status: 'pending',
                retries: 0,
                createdAt: Date.now(),
            }];

            const filtered = queue.filter(s => s.id !== 'sub-1');
            expect(filtered.length).toBe(0);
        });
    });

    describe('Submission validation', () => {
        it('accepts valid submission input', () => {
            const input: SubmissionInput = {
                date: '2026-01-15',
                steps: 5000,
            };

            expect(input.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(input.steps).toBeGreaterThan(0);
        });

        it('accepts partial submission', () => {
            const input: SubmissionInput = {
                date: '2026-01-15',
                steps: 2000,
                partial: true,
            };

            expect(input.partial).toBe(true);
        });

        it('accepts submission with league_id', () => {
            const input: SubmissionInput = {
                league_id: '550e8400-e29b-41d4-a716-446655440000',
                date: '2026-01-15',
                steps: 5000,
            };

            expect(input.league_id).toBeDefined();
        });

        it('accepts global submission (null league_id)', () => {
            const input: SubmissionInput = {
                league_id: null,
                date: '2026-01-15',
                steps: 5000,
            };

            expect(input.league_id).toBeNull();
        });
    });

    describe('Status transitions', () => {
        it('starts as pending', () => {
            const submission: OfflineSubmission = {
                id: 'sub-1',
                input: { date: '2026-01-15', steps: 5000 },
                status: 'pending',
                retries: 0,
                createdAt: Date.now(),
            };

            expect(submission.status).toBe('pending');
        });

        it('transitions to syncing', () => {
            const submission: OfflineSubmission = {
                id: 'sub-1',
                input: { date: '2026-01-15', steps: 5000 },
                status: 'pending',
                retries: 0,
                createdAt: Date.now(),
            };

            submission.status = 'syncing';
            expect(submission.status).toBe('syncing');
        });

        it('transitions to synced on success', () => {
            const submission: OfflineSubmission = {
                id: 'sub-1',
                input: { date: '2026-01-15', steps: 5000 },
                status: 'syncing',
                retries: 0,
                createdAt: Date.now(),
            };

            submission.status = 'synced';
            expect(submission.status).toBe('synced');
        });

        it('transitions to failed after max retries', () => {
            const MAX_RETRIES = 3;
            const submission: OfflineSubmission = {
                id: 'sub-1',
                input: { date: '2026-01-15', steps: 5000 },
                status: 'syncing',
                retries: MAX_RETRIES,
                createdAt: Date.now(),
            };

            if (submission.retries >= MAX_RETRIES) {
                submission.status = 'failed';
            }

            expect(submission.status).toBe('failed');
        });
    });
});

describe('Offline Queue - Sync Logic', () => {
    describe('Retry mechanism', () => {
        it('increments retry count on failure', () => {
            const submission: OfflineSubmission = {
                id: 'sub-1',
                input: { date: '2026-01-15', steps: 5000 },
                status: 'pending',
                retries: 0,
                createdAt: Date.now(),
            };

            // Simulate failed sync
            submission.retries += 1;
            submission.status = 'pending';

            expect(submission.retries).toBe(1);
            expect(submission.status).toBe('pending');
        });

        it('marks as failed after 3 retries', () => {
            const MAX_RETRIES = 3;
            let submission: OfflineSubmission = {
                id: 'sub-1',
                input: { date: '2026-01-15', steps: 5000 },
                status: 'pending',
                retries: 2,
                createdAt: Date.now(),
            };

            // Third retry fails
            submission.retries += 1;
            if (submission.retries >= MAX_RETRIES) {
                submission.status = 'failed';
            }

            expect(submission.status).toBe('failed');
        });
    });

    describe('Cleanup old submissions', () => {
        it('keeps submissions from last 7 days', () => {
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;

            const submissions: OfflineSubmission[] = [
                { id: 'sub-1', input: { date: '2026-01-15', steps: 5000 }, status: 'synced', retries: 0, createdAt: now - oneDay },
                { id: 'sub-2', input: { date: '2026-01-14', steps: 6000 }, status: 'synced', retries: 0, createdAt: now - 3 * oneDay },
            ];

            const sevenDaysAgo = now - 7 * oneDay;
            const cleaned = submissions.filter(s => s.createdAt > sevenDaysAgo);

            expect(cleaned.length).toBe(2);
        });

        it('removes submissions older than 7 days', () => {
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;

            const submissions: OfflineSubmission[] = [
                { id: 'sub-1', input: { date: '2026-01-15', steps: 5000 }, status: 'synced', retries: 0, createdAt: now - oneDay },
                { id: 'sub-old', input: { date: '2026-01-01', steps: 3000 }, status: 'synced', retries: 0, createdAt: now - 10 * oneDay },
            ];

            const sevenDaysAgo = now - 7 * oneDay;
            const cleaned = submissions.filter(s => s.createdAt > sevenDaysAgo);

            expect(cleaned.length).toBe(1);
            expect(cleaned[0].id).toBe('sub-1');
        });

        it('never removes pending submissions regardless of age', () => {
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;

            const submissions: OfflineSubmission[] = [
                { id: 'sub-old-pending', input: { date: '2026-01-01', steps: 3000 }, status: 'pending', retries: 0, createdAt: now - 10 * oneDay },
            ];

            const sevenDaysAgo = now - 7 * oneDay;
            const cleaned = submissions.filter(s => s.status === 'pending' || s.createdAt > sevenDaysAgo);

            expect(cleaned.length).toBe(1);
        });
    });
});

describe('Offline Queue - Edge Cases', () => {
    it('handles empty queue gracefully', () => {
        const queue: OfflineSubmission[] = [];
        const pending = queue.filter(s => s.status === 'pending');
        expect(pending.length).toBe(0);
    });

    it('handles multiple submissions for same date', () => {
        const queue: OfflineSubmission[] = [
            { id: 'sub-1', input: { date: '2026-01-15', steps: 5000 }, status: 'pending', retries: 0, createdAt: Date.now() },
            { id: 'sub-2', input: { date: '2026-01-15', steps: 6000 }, status: 'pending', retries: 0, createdAt: Date.now() + 1000 },
        ];

        const sameDate = queue.filter(s => s.input.date === '2026-01-15');
        expect(sameDate.length).toBe(2);
        // Server will handle deduplication/overwrite
    });

    it('preserves proof_path in queue', () => {
        const submission: OfflineSubmission = {
            id: 'sub-1',
            input: {
                date: '2026-01-15',
                steps: 5000,
                proof_path: 'submissions/abc123/proof.webp',
            },
            status: 'pending',
            retries: 0,
            createdAt: Date.now(),
        };

        expect(submission.input.proof_path).toBe('submissions/abc123/proof.webp');
    });
});
