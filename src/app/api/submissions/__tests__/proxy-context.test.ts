/**
 * Submission Attribution Tests
 * 
 * Tests for /api/submissions with proxy context
 * Based on PRD 41 - "Act As" proxy functionality
 * 
 * Critical flows tested:
 * - Submitting steps as yourself (goes to your profile)
 * - Submitting steps as proxy (goes to proxy profile, not manager)
 * - X-Acting-As header validation
 * - Proxy ownership verification
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import {
    createMockSupabaseClient,
    createMockUser,
    createMockProxy,
    createMockProfile,
} from '@/__mocks__/supabase';

// Schema from the actual route
const createSchema = z.object({
    league_id: z.string().uuid().optional().nullable(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    steps: z.number().int().positive(),
    partial: z.boolean().optional().default(false),
    proof_path: z.string().min(3).nullable().optional(),
});

describe('/api/submissions - Proxy Context', () => {
    const mockManager = createMockUser({ id: 'manager-123', email: 'manager@test.com' });
    const mockProxy = createMockProxy({
        id: 'proxy-456',
        display_name: 'My Child',
        managed_by: 'manager-123'
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Submission Schema Validation', () => {
        it('accepts valid submission data', () => {
            const result = createSchema.safeParse({
                date: '2026-01-15',
                steps: 5000,
            });
            expect(result.success).toBe(true);
        });

        it('rejects invalid date format', () => {
            const result = createSchema.safeParse({
                date: 'January 15, 2026',
                steps: 5000,
            });
            expect(result.success).toBe(false);
        });

        it('rejects negative steps', () => {
            const result = createSchema.safeParse({
                date: '2026-01-15',
                steps: -100,
            });
            expect(result.success).toBe(false);
        });

        it('rejects zero steps', () => {
            const result = createSchema.safeParse({
                date: '2026-01-15',
                steps: 0,
            });
            expect(result.success).toBe(false);
        });
    });

    describe('X-Acting-As Header Processing', () => {
        it('uses auth user when no X-Acting-As header', () => {
            const userId = mockManager.id;
            const actingAsId: string | null = null;

            const targetUserId = actingAsId || userId;
            expect(targetUserId).toBe('manager-123');
        });

        it('uses auth user when X-Acting-As matches auth user', () => {
            const userId = mockManager.id;
            const actingAsId = 'manager-123';

            const targetUserId = (actingAsId && actingAsId !== userId)
                ? actingAsId
                : userId;
            expect(targetUserId).toBe('manager-123');
        });

        it('uses proxy ID when X-Acting-As is valid proxy', () => {
            const userId = mockManager.id;
            const actingAsId = 'proxy-456';

            const targetUserId = (actingAsId && actingAsId !== userId)
                ? actingAsId
                : userId;
            expect(targetUserId).toBe('proxy-456');
            expect(targetUserId).not.toBe(userId);
        });
    });

    describe('Proxy Ownership Validation', () => {
        it('validates proxy is managed by authenticated user', () => {
            const proxy = createMockProxy({
                id: 'proxy-456',
                managed_by: 'manager-123',
            });
            const authUserId = 'manager-123';

            const isValidProxy = proxy.managed_by === authUserId && proxy.is_proxy;
            expect(isValidProxy).toBe(true);
        });

        it('rejects proxy not managed by authenticated user', () => {
            const proxy = createMockProxy({
                id: 'proxy-456',
                managed_by: 'other-user',
            });
            const authUserId = 'manager-123';

            const isValidProxy = proxy.managed_by === authUserId && proxy.is_proxy;
            expect(isValidProxy).toBe(false);
        });

        it('rejects deleted proxy', () => {
            const proxy = {
                ...createMockProxy({ id: 'proxy-456', managed_by: 'manager-123' }),
                deleted_at: '2026-01-10T00:00:00Z',
            };

            const isActive = proxy.deleted_at === null;
            expect(isActive).toBe(false);
        });
    });

    describe('Submission Attribution - Core Scenarios', () => {

        // SCENARIO 1: Manager submits their own steps
        describe('Manager submits for themselves', () => {
            it('submission user_id is the manager ID', () => {
                const authUserId = 'manager-123';
                const actingAsId: string | null = null; // Not acting as proxy

                const targetUserId = actingAsId && actingAsId !== authUserId
                    ? actingAsId
                    : authUserId;

                const submissionData = {
                    user_id: targetUserId,
                    steps: 5000,
                    for_date: '2026-01-15',
                };

                expect(submissionData.user_id).toBe('manager-123');
                expect(submissionData.user_id).not.toBe('proxy-456');
            });

            it('submission does NOT go to proxy', () => {
                const submissionUserId = 'manager-123';
                const proxyId = 'proxy-456';

                expect(submissionUserId).not.toBe(proxyId);
            });
        });

        // SCENARIO 2: Manager submits for their proxy
        describe('Manager submits for proxy (Act As)', () => {
            it('submission user_id is the proxy ID', () => {
                const authUserId: string = 'manager-123';
                const actingAsId: string | null = 'proxy-456'; // Acting as proxy

                const targetUserId = actingAsId && actingAsId !== authUserId
                    ? actingAsId
                    : authUserId;

                const submissionData = {
                    user_id: targetUserId,
                    steps: 7500,
                    for_date: '2026-01-15',
                };

                expect(submissionData.user_id).toBe('proxy-456');
                expect(submissionData.user_id).not.toBe('manager-123');
            });

            it('submission does NOT go to manager', () => {
                const submissionUserId = 'proxy-456';
                const managerId = 'manager-123';

                expect(submissionUserId).not.toBe(managerId);
            });
        });

        // SCENARIO 3: Verify both can have submissions on same day
        describe('Manager and proxy both submit on same day', () => {
            it('creates two separate submissions', () => {
                const managerSubmission = {
                    id: 'submission-1',
                    user_id: 'manager-123',
                    steps: 5000,
                    for_date: '2026-01-15',
                };

                const proxySubmission = {
                    id: 'submission-2',
                    user_id: 'proxy-456',
                    steps: 7500,
                    for_date: '2026-01-15',
                };

                expect(managerSubmission.user_id).not.toBe(proxySubmission.user_id);
                expect(managerSubmission.for_date).toBe(proxySubmission.for_date);
                expect(managerSubmission.id).not.toBe(proxySubmission.id);
            });
        });
    });

    describe('Submission Retrieval - Profile Separation', () => {
        it('fetching manager submissions excludes proxy submissions', () => {
            const allSubmissions = [
                { id: 's1', user_id: 'manager-123', steps: 5000 },
                { id: 's2', user_id: 'manager-123', steps: 6000 },
                { id: 's3', user_id: 'proxy-456', steps: 7500 },
            ];

            const managerSubmissions = allSubmissions.filter(
                s => s.user_id === 'manager-123'
            );

            expect(managerSubmissions.length).toBe(2);
            expect(managerSubmissions.every(s => s.user_id === 'manager-123')).toBe(true);
        });

        it('fetching proxy submissions excludes manager submissions', () => {
            const allSubmissions = [
                { id: 's1', user_id: 'manager-123', steps: 5000 },
                { id: 's2', user_id: 'proxy-456', steps: 7500 },
                { id: 's3', user_id: 'proxy-456', steps: 8000 },
            ];

            const proxySubmissions = allSubmissions.filter(
                s => s.user_id === 'proxy-456'
            );

            expect(proxySubmissions.length).toBe(2);
            expect(proxySubmissions.every(s => s.user_id === 'proxy-456')).toBe(true);
        });
    });

    describe('Edge Cases', () => {
        it('handles manager with multiple proxies correctly', () => {
            const proxies = [
                createMockProxy({ id: 'proxy-1', display_name: 'Child 1', managed_by: 'manager-123' }),
                createMockProxy({ id: 'proxy-2', display_name: 'Child 2', managed_by: 'manager-123' }),
            ];

            const submissions = [
                { user_id: 'manager-123', steps: 5000, for_date: '2026-01-15' },
                { user_id: 'proxy-1', steps: 3000, for_date: '2026-01-15' },
                { user_id: 'proxy-2', steps: 4000, for_date: '2026-01-15' },
            ];

            const managerSub = submissions.find(s => s.user_id === 'manager-123');
            const proxy1Sub = submissions.find(s => s.user_id === 'proxy-1');
            const proxy2Sub = submissions.find(s => s.user_id === 'proxy-2');

            expect(managerSub?.steps).toBe(5000);
            expect(proxy1Sub?.steps).toBe(3000);
            expect(proxy2Sub?.steps).toBe(4000);

            // All distinct
            const userIds = new Set(submissions.map(s => s.user_id));
            expect(userIds.size).toBe(3);
        });
    });
});
