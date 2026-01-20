/**
 * Session Cache Tests
 * 
 * Based on auth-patterns skill - these utilities bypass Supabase Web Locks deadlocks.
 * Critical for batch operations where getSession() can hang.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
    setCachedSession,
    getCachedSession,
    clearCachedSession
} from '../sessionCache';

describe('sessionCache', () => {
    beforeEach(() => {
        // Clear cache before each test
        clearCachedSession();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('setCachedSession', () => {
        it('stores session when all params provided', () => {
            const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

            setCachedSession('token-123', 'user-456', futureTime);

            const cached = getCachedSession();
            expect(cached).not.toBeNull();
            expect(cached?.accessToken).toBe('token-123');
            expect(cached?.userId).toBe('user-456');
            expect(cached?.expiresAt).toBe(futureTime);
        });

        it('clears session when any param is null', () => {
            // First set a valid session
            const futureTime = Math.floor(Date.now() / 1000) + 3600;
            setCachedSession('token-123', 'user-456', futureTime);
            expect(getCachedSession()).not.toBeNull();

            // Now clear with null token
            setCachedSession(null, 'user-456', futureTime);
            expect(getCachedSession()).toBeNull();
        });

        it('clears session when userId is null', () => {
            const futureTime = Math.floor(Date.now() / 1000) + 3600;
            setCachedSession('token-123', null, futureTime);
            expect(getCachedSession()).toBeNull();
        });

        it('clears session when expiresAt is null', () => {
            setCachedSession('token-123', 'user-456', null);
            expect(getCachedSession()).toBeNull();
        });
    });

    describe('getCachedSession', () => {
        it('returns null when no session cached', () => {
            expect(getCachedSession()).toBeNull();
        });

        it('returns session when valid and not expired', () => {
            const futureTime = Math.floor(Date.now() / 1000) + 3600;
            setCachedSession('token-123', 'user-456', futureTime);

            const cached = getCachedSession();
            expect(cached).not.toBeNull();
            expect(cached?.accessToken).toBe('token-123');
        });

        it('returns null and clears when session expired', () => {
            // Set a session that expires in the past
            const pastTime = Math.floor(Date.now() / 1000) - 100;
            setCachedSession('token-123', 'user-456', pastTime);

            expect(getCachedSession()).toBeNull();
        });

        it('returns null when session expires within 60s buffer', () => {
            // Session expires in 30 seconds (within 60s buffer)
            const soonTime = Math.floor(Date.now() / 1000) + 30;
            setCachedSession('token-123', 'user-456', soonTime);

            expect(getCachedSession()).toBeNull();
        });

        it('returns session when expires just beyond 60s buffer', () => {
            // Session expires in 90 seconds (beyond 60s buffer)
            const safeTime = Math.floor(Date.now() / 1000) + 90;
            setCachedSession('token-123', 'user-456', safeTime);

            expect(getCachedSession()).not.toBeNull();
        });
    });

    describe('clearCachedSession', () => {
        it('clears existing session', () => {
            const futureTime = Math.floor(Date.now() / 1000) + 3600;
            setCachedSession('token-123', 'user-456', futureTime);
            expect(getCachedSession()).not.toBeNull();

            clearCachedSession();
            expect(getCachedSession()).toBeNull();
        });

        it('is safe to call when no session exists', () => {
            expect(() => clearCachedSession()).not.toThrow();
            expect(getCachedSession()).toBeNull();
        });
    });
});

