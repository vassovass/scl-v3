/**
 * Rate Limiter Tests
 *
 * Tests for the in-memory sliding window rate limiter.
 * Covers: allow/block logic, sliding window expiry, remaining/retryAfter
 * values, key extraction (user ID vs IP), and store cleanup.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkRateLimit, getRateLimitKey, _resetStore } from '../rateLimit';

// Reset store between each test to avoid cross-contamination
beforeEach(() => {
    _resetStore();
    vi.restoreAllMocks();
});

// ============================================================================
// Core Sliding Window
// ============================================================================

describe('checkRateLimit', () => {
    const config = { maxRequests: 3, windowMs: 60_000 };

    it('allows requests under the limit', () => {
        const r1 = checkRateLimit('test-key', config);
        expect(r1.allowed).toBe(true);
        expect(r1.remaining).toBe(2);
        expect(r1.retryAfterMs).toBe(0);
        expect(r1.limit).toBe(3);
    });

    it('allows up to maxRequests', () => {
        checkRateLimit('test-key', config);
        checkRateLimit('test-key', config);
        const r3 = checkRateLimit('test-key', config);

        expect(r3.allowed).toBe(true);
        expect(r3.remaining).toBe(0);
    });

    it('blocks requests exceeding the limit', () => {
        checkRateLimit('test-key', config);
        checkRateLimit('test-key', config);
        checkRateLimit('test-key', config);
        const r4 = checkRateLimit('test-key', config);

        expect(r4.allowed).toBe(false);
        expect(r4.remaining).toBe(0);
        expect(r4.retryAfterMs).toBeGreaterThan(0);
    });

    it('retryAfterMs is at least 1000ms when blocked', () => {
        for (let i = 0; i < 3; i++) checkRateLimit('test-key', config);
        const blocked = checkRateLimit('test-key', config);

        expect(blocked.retryAfterMs).toBeGreaterThanOrEqual(1000);
    });

    it('tracks keys independently', () => {
        // Fill up key-A
        for (let i = 0; i < 3; i++) checkRateLimit('key-A', config);

        // key-B should still be allowed
        const result = checkRateLimit('key-B', config);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(2);
    });

    it('sliding window resets after windowMs elapses', () => {
        // Use Date.now mock to simulate time passing
        const realNow = Date.now;
        let fakeTime = realNow.call(Date);

        vi.spyOn(Date, 'now').mockImplementation(() => fakeTime);

        // Fill up the limit
        for (let i = 0; i < 3; i++) checkRateLimit('test-key', config);
        const blocked = checkRateLimit('test-key', config);
        expect(blocked.allowed).toBe(false);

        // Advance past the window
        fakeTime += 61_000;

        // Should be allowed again
        const afterWindow = checkRateLimit('test-key', config);
        expect(afterWindow.allowed).toBe(true);
        expect(afterWindow.remaining).toBe(2);

        vi.spyOn(Date, 'now').mockRestore();
    });

    it('returns correct remaining count', () => {
        const r1 = checkRateLimit('test-key', config);
        expect(r1.remaining).toBe(2);

        const r2 = checkRateLimit('test-key', config);
        expect(r2.remaining).toBe(1);

        const r3 = checkRateLimit('test-key', config);
        expect(r3.remaining).toBe(0);
    });
});

// ============================================================================
// Key Extraction
// ============================================================================

describe('getRateLimitKey', () => {
    it('uses user ID for authenticated requests', () => {
        const user = { id: 'user-abc-123' } as any;
        const request = new Request('https://example.com/api/test');

        const key = getRateLimitKey(request, user);
        expect(key).toBe('user:user-abc-123');
    });

    it('uses IP from x-forwarded-for for anonymous requests', () => {
        const request = new Request('https://example.com/api/test', {
            headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
        });

        const key = getRateLimitKey(request, null);
        expect(key).toBe('ip:1.2.3.4');
    });

    it('uses x-real-ip as fallback', () => {
        const request = new Request('https://example.com/api/test', {
            headers: { 'x-real-ip': '10.0.0.1' },
        });

        const key = getRateLimitKey(request, null);
        expect(key).toBe('ip:10.0.0.1');
    });

    it('falls back to "unknown" when no IP headers', () => {
        const request = new Request('https://example.com/api/test');

        const key = getRateLimitKey(request, null);
        expect(key).toBe('ip:unknown');
    });

    it('prefers user ID over IP when authenticated', () => {
        const user = { id: 'user-xyz' } as any;
        const request = new Request('https://example.com/api/test', {
            headers: { 'x-forwarded-for': '1.2.3.4' },
        });

        const key = getRateLimitKey(request, user);
        expect(key).toBe('user:user-xyz');
    });
});

// ============================================================================
// 429 Response Helper
// ============================================================================

describe('tooManyRequests response helper', () => {
    it('returns 429 status with correct headers', async () => {
        // Import directly to test the response helper
        const { tooManyRequests } = await import('@/lib/api');

        const response = tooManyRequests(5000, 0, 10);

        expect(response.status).toBe(429);
        expect(response.headers.get('Retry-After')).toBe('5');
        expect(response.headers.get('X-RateLimit-Limit')).toBe('10');
        expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
        expect(response.headers.get('Cache-Control')).toBe('no-store');

        const body = await response.json();
        expect(body.error).toContain('Too many requests');
    });

    it('rounds Retry-After up to nearest second', async () => {
        const { tooManyRequests } = await import('@/lib/api');

        const response = tooManyRequests(1500);
        expect(response.headers.get('Retry-After')).toBe('2');
    });
});
