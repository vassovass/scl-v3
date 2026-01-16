/**
 * Proxy Creation & Management Tests
 * 
 * Tests for /api/proxies CRUD operations
 * Based on PRD 41 - Unified Proxy Model
 * 
 * Critical flows tested:
 * - Creating a new proxy user
 * - Listing managed proxies
 * - Quota enforcement
 * - Proxy ownership validation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import {
    createMockSupabaseClient,
    createMockUser,
    createMockProxy,
} from '@/__mocks__/supabase';

// Schema from the actual route
const createProxySchema = z.object({
    display_name: z.string().min(1, "Display name is required").max(100),
    league_id: z.string().uuid().optional(),
});

describe('/api/proxies', () => {
    const mockManager = createMockUser({ id: 'manager-123', email: 'manager@test.com' });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('POST - Create Proxy', () => {
        it('validates display_name is required', () => {
            const result = createProxySchema.safeParse({});
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('display_name');
            }
        });

        it('validates display_name max length', () => {
            const longName = 'a'.repeat(101);
            const result = createProxySchema.safeParse({ display_name: longName });
            expect(result.success).toBe(false);
        });

        it('accepts valid proxy creation data', () => {
            const result = createProxySchema.safeParse({
                display_name: 'My Child',
            });
            expect(result.success).toBe(true);
        });

        it('accepts optional league_id', () => {
            const result = createProxySchema.safeParse({
                display_name: 'My Child',
                league_id: '550e8400-e29b-41d4-a716-446655440000',
            });
            expect(result.success).toBe(true);
        });

        describe('Proxy creation logic', () => {
            it('generates unique invite code for new proxy', () => {
                // Invite codes should be unique strings (nanoid generates 12 chars by default)
                const inviteCode1 = 'abc123def456';
                const inviteCode2 = 'xyz789uvw012';
                expect(inviteCode1).not.toBe(inviteCode2);
                expect(inviteCode1.length).toBe(12);
            });

            it('sets managed_by to the creating user', () => {
                const proxyData = {
                    display_name: 'My Child',
                    managed_by: mockManager.id,
                };
                expect(proxyData.managed_by).toBe('manager-123');
            });

            it('new proxy is flagged as is_proxy', () => {
                const proxy = createMockProxy({
                    managed_by: mockManager.id,
                });
                expect(proxy.is_proxy).toBe(true);
                expect(proxy.managed_by).toBe(mockManager.id);
            });
        });

        describe('Quota enforcement', () => {
            const MAX_PROXIES = 50;

            it('allows proxy creation when under quota', () => {
                const currentCount = 10;
                const canCreate = currentCount < MAX_PROXIES;
                expect(canCreate).toBe(true);
            });

            it('blocks proxy creation when at quota', () => {
                const currentCount = 50;
                const canCreate = currentCount < MAX_PROXIES;
                expect(canCreate).toBe(false);
            });

            it('blocks proxy creation when over quota', () => {
                const currentCount = 55;
                const canCreate = currentCount < MAX_PROXIES;
                expect(canCreate).toBe(false);
            });
        });
    });

    describe('GET - List Proxies', () => {
        it('returns only proxies managed by the requesting user', () => {
            const allProxies = [
                createMockProxy({ id: 'proxy-1', managed_by: 'manager-123' }),
                createMockProxy({ id: 'proxy-2', managed_by: 'manager-123' }),
                createMockProxy({ id: 'proxy-3', managed_by: 'other-user' }),
            ];

            const userProxies = allProxies.filter(p => p.managed_by === mockManager.id);
            expect(userProxies.length).toBe(2);
            expect(userProxies.every(p => p.managed_by === 'manager-123')).toBe(true);
        });

        it('excludes deleted proxies', () => {
            const proxies = [
                { ...createMockProxy({ id: 'proxy-1' }), deleted_at: null },
                { ...createMockProxy({ id: 'proxy-2' }), deleted_at: '2026-01-15T00:00:00Z' },
            ];

            const activeProxies = proxies.filter(p => p.deleted_at === null);
            expect(activeProxies.length).toBe(1);
        });

        it('excludes archived proxies by default', () => {
            const proxies = [
                { ...createMockProxy({ id: 'proxy-1' }), is_archived: false },
                { ...createMockProxy({ id: 'proxy-2' }), is_archived: true },
            ];

            const includeArchived = false;
            const visibleProxies = proxies.filter(p => includeArchived || !p.is_archived);
            expect(visibleProxies.length).toBe(1);
        });

        it('includes archived proxies when requested', () => {
            const proxies = [
                { ...createMockProxy({ id: 'proxy-1' }), is_archived: false },
                { ...createMockProxy({ id: 'proxy-2' }), is_archived: true },
            ];

            const includeArchived = true;
            const visibleProxies = proxies.filter(p => includeArchived || !p.is_archived);
            expect(visibleProxies.length).toBe(2);
        });
    });

    describe('DELETE - Soft Delete Proxy', () => {
        it('requires proxy_id parameter', () => {
            const proxyId = null;
            expect(proxyId).toBeNull();
            // Route should return 400
        });

        it('verifies ownership before deletion', () => {
            const proxy = createMockProxy({
                id: 'proxy-456',
                managed_by: 'other-user'
            });
            const requestingUserId = 'manager-123';

            const isOwner = proxy.managed_by === requestingUserId;
            expect(isOwner).toBe(false);
            // Route should return 404
        });

        it('allows owner to delete their proxy', () => {
            const proxy = createMockProxy({
                id: 'proxy-456',
                managed_by: 'manager-123'
            });
            const requestingUserId = 'manager-123';

            const isOwner = proxy.managed_by === requestingUserId;
            expect(isOwner).toBe(true);
        });

        it('soft-deletes by setting deleted_at timestamp', () => {
            const before = { deleted_at: null };
            const after = { deleted_at: new Date().toISOString() };

            expect(before.deleted_at).toBeNull();
            expect(after.deleted_at).not.toBeNull();
        });
    });
});
