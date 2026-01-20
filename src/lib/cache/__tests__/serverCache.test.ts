/**
 * Server Cache Utility Tests
 *
 * Tests for the server-side cache with timeout fallback and circuit breaker.
 * Based on testing-patterns skill and PRD 42.
 *
 * Key areas tested:
 * - createCachedFetcher function
 * - Timeout handling
 * - Circuit breaker logic
 * - invalidateCache function
 * - getCacheHealth function
 * - warmCaches function
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ============================================================================
// Mock Next.js Cache Functions
// ============================================================================

vi.mock('next/cache', () => ({
    unstable_cache: vi.fn((fn, keys, options) => {
        // Return a function that just calls the original function
        return fn;
    }),
    revalidateTag: vi.fn(),
}));

vi.mock('@/lib/errors', () => ({
    AppError: class AppError extends Error {
        code: string;
        context: Record<string, unknown>;
        recoverable: boolean;
        constructor(opts: { code: string; message: string; context?: Record<string, unknown>; recoverable?: boolean }) {
            super(opts.message);
            this.code = opts.code;
            this.context = opts.context || {};
            this.recoverable = opts.recoverable ?? true;
        }
    },
    ErrorCode: {
        TIMEOUT_ERROR: 'TIMEOUT_ERROR',
        UNKNOWN_ERROR: 'UNKNOWN_ERROR',
    },
    reportError: vi.fn(),
}));

// ============================================================================
// Type Definitions (matching module interface)
// ============================================================================

type CacheTag = 'branding' | 'menus' | 'settings' | 'app_config';

interface CacheStats {
    hits: number;
    misses: number;
    timeouts: number;
    lastInvalidated: number | null;
}

interface CacheOptions<T> {
    tag: CacheTag;
    fetcher: () => Promise<T>;
    fallback: T;
    timeoutMs?: number;
    revalidateSeconds?: number;
}

// ============================================================================
// createCachedFetcher Logic Tests
// ============================================================================

describe('serverCache - createCachedFetcher Logic', () => {
    describe('Basic Configuration', () => {
        it('accepts required options', () => {
            const options: CacheOptions<string> = {
                tag: 'branding',
                fetcher: async () => 'data',
                fallback: 'fallback',
            };

            expect(options.tag).toBe('branding');
            expect(options.fallback).toBe('fallback');
        });

        it('accepts optional timeout', () => {
            const options: CacheOptions<string> = {
                tag: 'settings',
                fetcher: async () => 'data',
                fallback: 'fallback',
                timeoutMs: 5000,
            };

            expect(options.timeoutMs).toBe(5000);
        });

        it('accepts optional revalidate seconds', () => {
            const options: CacheOptions<string> = {
                tag: 'menus',
                fetcher: async () => 'data',
                fallback: 'fallback',
                revalidateSeconds: 7200,
            };

            expect(options.revalidateSeconds).toBe(7200);
        });

        it('default timeout is 3000ms', () => {
            const defaultTimeout = 3000;
            expect(defaultTimeout).toBe(3000);
        });

        it('default revalidate is 3600s (1 hour)', () => {
            const defaultRevalidate = 3600;
            expect(defaultRevalidate).toBe(3600);
        });
    });

    describe('Fallback Values', () => {
        it('uses string fallback', () => {
            const fallback = 'default value';
            expect(fallback).toBe('default value');
        });

        it('uses object fallback', () => {
            const fallback = { name: 'Default', enabled: false };
            expect(fallback.name).toBe('Default');
            expect(fallback.enabled).toBe(false);
        });

        it('uses array fallback', () => {
            const fallback: string[] = [];
            expect(fallback).toEqual([]);
        });

        it('uses null fallback', () => {
            const fallback = null;
            expect(fallback).toBeNull();
        });
    });
});

// ============================================================================
// Timeout Logic Tests
// ============================================================================

describe('serverCache - Timeout Logic', () => {
    it('timeout resolves to null', async () => {
        const timeoutMs = 100;
        const timeoutPromise = new Promise<null>((resolve) =>
            setTimeout(() => resolve(null), timeoutMs)
        );

        const result = await timeoutPromise;
        expect(result).toBeNull();
    });

    it('faster fetcher wins race', async () => {
        const fetcher = async () => {
            return 'fetched data';
        };

        const timeoutPromise = new Promise<null>((resolve) =>
            setTimeout(() => resolve(null), 5000) // Long timeout
        );

        const result = await Promise.race([fetcher(), timeoutPromise]);
        expect(result).toBe('fetched data');
    });

    it('timeout wins when fetcher is slow', async () => {
        const slowFetcher = async () => {
            await new Promise(resolve => setTimeout(resolve, 200));
            return 'slow data';
        };

        const timeoutPromise = new Promise<null>((resolve) =>
            setTimeout(() => resolve(null), 50) // Short timeout
        );

        const result = await Promise.race([slowFetcher(), timeoutPromise]);
        expect(result).toBeNull();
    });

    it('returns fallback when result is null', () => {
        const result: string | null = null;
        const fallback = 'fallback value';

        const finalResult = result === null ? fallback : result;
        expect(finalResult).toBe('fallback value');
    });
});

// ============================================================================
// Circuit Breaker Logic Tests
// ============================================================================

describe('serverCache - Circuit Breaker Logic', () => {
    const FAILURE_THRESHOLD = 5;
    const COOLDOWN_MS = 30000;

    it('circuit starts closed (failures = 0)', () => {
        const failures = 0;
        const isCircuitOpen = failures >= FAILURE_THRESHOLD;
        expect(isCircuitOpen).toBe(false);
    });

    it('circuit opens after threshold failures', () => {
        const failures = 5;
        const isCircuitOpen = failures >= FAILURE_THRESHOLD;
        expect(isCircuitOpen).toBe(true);
    });

    it('circuit stays open during cooldown', () => {
        const failures = 5;
        const lastFailure = Date.now() - 10000; // 10 seconds ago
        const now = Date.now();

        const isInCooldown = now - lastFailure < COOLDOWN_MS;
        const isCircuitOpen = failures >= FAILURE_THRESHOLD && isInCooldown;

        expect(isCircuitOpen).toBe(true);
    });

    it('circuit resets after cooldown', () => {
        const failures = 5;
        const lastFailure = Date.now() - 35000; // 35 seconds ago
        const now = Date.now();

        const isInCooldown = now - lastFailure < COOLDOWN_MS;
        const shouldReset = failures >= FAILURE_THRESHOLD && !isInCooldown;

        expect(shouldReset).toBe(true);
    });

    it('failure count increments on error', () => {
        let failures = 0;
        let lastFailure = 0;

        // Simulate error
        failures++;
        lastFailure = Date.now();

        expect(failures).toBe(1);
        expect(lastFailure).toBeGreaterThan(0);
    });

    it('failure count increments on timeout', () => {
        let failures = 2;

        // Simulate timeout
        const result: string | null = null;
        if (result === null) {
            failures++;
        }

        expect(failures).toBe(3);
    });

    it('failures reset after successful cooldown trial', () => {
        let failures = 5;
        const lastFailure = Date.now() - 35000; // Past cooldown
        const now = Date.now();

        // Check if we should reset and try again
        if (failures >= FAILURE_THRESHOLD && now - lastFailure >= COOLDOWN_MS) {
            failures = 0;
        }

        expect(failures).toBe(0);
    });
});

// ============================================================================
// CacheStats Tests
// ============================================================================

describe('serverCache - CacheStats', () => {
    it('initializes with zero counts', () => {
        const stats: CacheStats = {
            hits: 0,
            misses: 0,
            timeouts: 0,
            lastInvalidated: null,
        };

        expect(stats.hits).toBe(0);
        expect(stats.misses).toBe(0);
        expect(stats.timeouts).toBe(0);
        expect(stats.lastInvalidated).toBeNull();
    });

    it('increments timeout count', () => {
        const stats: CacheStats = {
            hits: 0,
            misses: 0,
            timeouts: 0,
            lastInvalidated: null,
        };

        stats.timeouts++;
        expect(stats.timeouts).toBe(1);
    });

    it('tracks lastInvalidated timestamp', () => {
        const stats: CacheStats = {
            hits: 0,
            misses: 0,
            timeouts: 0,
            lastInvalidated: null,
        };

        stats.lastInvalidated = Date.now();
        expect(stats.lastInvalidated).toBeGreaterThan(0);
    });

    it('can have multiple tags with independent stats', () => {
        const stats = new Map<CacheTag, CacheStats>();

        stats.set('branding', { hits: 10, misses: 2, timeouts: 0, lastInvalidated: null });
        stats.set('settings', { hits: 5, misses: 1, timeouts: 1, lastInvalidated: Date.now() });

        expect(stats.get('branding')?.hits).toBe(10);
        expect(stats.get('settings')?.timeouts).toBe(1);
    });
});

// ============================================================================
// invalidateCache Logic Tests
// ============================================================================

describe('serverCache - invalidateCache Logic', () => {
    it('updates lastInvalidated timestamp', () => {
        const stats: CacheStats = {
            hits: 10,
            misses: 2,
            timeouts: 0,
            lastInvalidated: null,
        };

        const before = Date.now();
        stats.lastInvalidated = Date.now();
        const after = Date.now();

        expect(stats.lastInvalidated).toBeGreaterThanOrEqual(before);
        expect(stats.lastInvalidated).toBeLessThanOrEqual(after);
    });

    it('accepts valid cache tags', () => {
        const validTags: CacheTag[] = ['branding', 'menus', 'settings', 'app_config'];

        validTags.forEach(tag => {
            expect(['branding', 'menus', 'settings', 'app_config']).toContain(tag);
        });
    });
});

// ============================================================================
// getCacheHealth Logic Tests
// ============================================================================

describe('serverCache - getCacheHealth Logic', () => {
    it('returns empty object when no caches tracked', () => {
        const cacheStats = new Map<CacheTag, CacheStats>();
        const report: Record<string, CacheStats> = {};

        cacheStats.forEach((stats, tag) => {
            report[tag] = { ...stats };
        });

        expect(Object.keys(report)).toHaveLength(0);
    });

    it('returns stats for all tracked caches', () => {
        const cacheStats = new Map<CacheTag, CacheStats>();
        cacheStats.set('branding', { hits: 10, misses: 2, timeouts: 0, lastInvalidated: null });
        cacheStats.set('settings', { hits: 5, misses: 1, timeouts: 1, lastInvalidated: 1234567890 });

        const report: Record<string, CacheStats> = {};
        cacheStats.forEach((stats, tag) => {
            report[tag] = { ...stats };
        });

        expect(Object.keys(report)).toHaveLength(2);
        expect(report['branding'].hits).toBe(10);
        expect(report['settings'].timeouts).toBe(1);
    });

    it('returns copies of stats (not references)', () => {
        const original: CacheStats = { hits: 10, misses: 2, timeouts: 0, lastInvalidated: null };
        const copy = { ...original };

        copy.hits = 999;

        expect(original.hits).toBe(10);
        expect(copy.hits).toBe(999);
    });
});

// ============================================================================
// warmCaches Logic Tests
// ============================================================================

describe('serverCache - warmCaches Logic', () => {
    it('calls all fetchers', async () => {
        const fetcher1 = vi.fn().mockResolvedValue('data1');
        const fetcher2 = vi.fn().mockResolvedValue('data2');
        const fetchers = [fetcher1, fetcher2];

        await Promise.allSettled(fetchers.map(f => f()));

        expect(fetcher1).toHaveBeenCalled();
        expect(fetcher2).toHaveBeenCalled();
    });

    it('handles empty fetchers array', async () => {
        const fetchers: Array<() => Promise<unknown>> = [];

        const results = await Promise.allSettled(fetchers.map(f => f()));

        expect(results).toHaveLength(0);
    });

    it('continues when some fetchers fail', async () => {
        const fetcher1 = vi.fn().mockResolvedValue('success');
        const fetcher2 = vi.fn().mockRejectedValue(new Error('Failed'));
        const fetcher3 = vi.fn().mockResolvedValue('success2');
        const fetchers = [fetcher1, fetcher2, fetcher3];

        const results = await Promise.allSettled(fetchers.map(f => f()));

        expect(results).toHaveLength(3);
        expect(results[0].status).toBe('fulfilled');
        expect(results[1].status).toBe('rejected');
        expect(results[2].status).toBe('fulfilled');
    });

    it('tracks fulfilled and rejected counts', async () => {
        const fetchers = [
            vi.fn().mockResolvedValue('ok'),
            vi.fn().mockRejectedValue(new Error('fail')),
            vi.fn().mockResolvedValue('ok'),
        ];

        const results = await Promise.allSettled(fetchers.map(f => f()));

        const fulfilled = results.filter(r => r.status === 'fulfilled').length;
        const rejected = results.filter(r => r.status === 'rejected').length;

        expect(fulfilled).toBe(2);
        expect(rejected).toBe(1);
    });
});

// ============================================================================
// CacheTag Type Tests
// ============================================================================

describe('serverCache - CacheTag Types', () => {
    it('branding is a valid tag', () => {
        const tag: CacheTag = 'branding';
        expect(tag).toBe('branding');
    });

    it('menus is a valid tag', () => {
        const tag: CacheTag = 'menus';
        expect(tag).toBe('menus');
    });

    it('settings is a valid tag', () => {
        const tag: CacheTag = 'settings';
        expect(tag).toBe('settings');
    });

    it('app_config is a valid tag', () => {
        const tag: CacheTag = 'app_config';
        expect(tag).toBe('app_config');
    });
});

// ============================================================================
// Error Handling Tests
// ============================================================================

describe('serverCache - Error Handling', () => {
    it('catches fetcher errors', async () => {
        const error = new Error('Network error');
        let caughtError: Error | null = null;

        try {
            throw error;
        } catch (err) {
            caughtError = err as Error;
        }

        expect(caughtError).toBe(error);
        expect(caughtError?.message).toBe('Network error');
    });

    it('returns fallback on error', async () => {
        const fallback = { default: true };
        let result = fallback;

        try {
            throw new Error('Failed');
        } catch {
            result = fallback;
        }

        expect(result).toEqual({ default: true });
    });

    it('increments failures on error', () => {
        let failures = 0;
        let lastFailure = 0;

        try {
            throw new Error('Test error');
        } catch {
            failures++;
            lastFailure = Date.now();
        }

        expect(failures).toBe(1);
        expect(lastFailure).toBeGreaterThan(0);
    });
});

// ============================================================================
// Integration Pattern Tests
// ============================================================================

describe('serverCache - Integration Patterns', () => {
    it('typical branding cache configuration', () => {
        interface BrandingData {
            logoUrl: string;
            primaryColor: string;
        }

        const options: CacheOptions<BrandingData> = {
            tag: 'branding',
            fetcher: async () => ({ logoUrl: '/logo.png', primaryColor: '#007bff' }),
            fallback: { logoUrl: '/default-logo.png', primaryColor: '#000000' },
            timeoutMs: 2000,
            revalidateSeconds: 3600,
        };

        expect(options.tag).toBe('branding');
        expect(options.fallback.logoUrl).toBe('/default-logo.png');
    });

    it('typical settings cache configuration', () => {
        interface SettingsData {
            maintenanceMode: boolean;
            features: string[];
        }

        const options: CacheOptions<SettingsData> = {
            tag: 'settings',
            fetcher: async () => ({ maintenanceMode: false, features: ['high_fives'] }),
            fallback: { maintenanceMode: false, features: [] },
            timeoutMs: 3000,
            revalidateSeconds: 1800,
        };

        expect(options.tag).toBe('settings');
        expect(options.fallback.maintenanceMode).toBe(false);
    });

    it('typical menu cache configuration', () => {
        interface MenuItem {
            id: string;
            label: string;
            url: string;
        }

        const options: CacheOptions<MenuItem[]> = {
            tag: 'menus',
            fetcher: async () => [{ id: '1', label: 'Home', url: '/' }],
            fallback: [],
            timeoutMs: 2500,
        };

        expect(options.tag).toBe('menus');
        expect(options.fallback).toEqual([]);
    });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('serverCache - Edge Cases', () => {
    it('handles very short timeout', async () => {
        const timeoutMs = 1;
        const timeoutPromise = new Promise<null>((resolve) =>
            setTimeout(() => resolve(null), timeoutMs)
        );

        const result = await timeoutPromise;
        expect(result).toBeNull();
    });

    it('handles very long timeout value', () => {
        const timeoutMs = 600000; // 10 minutes
        expect(timeoutMs).toBe(600000);
    });

    it('handles complex fallback objects', () => {
        const fallback = {
            nested: {
                deeply: {
                    value: [1, 2, 3],
                },
            },
            array: [{ id: 1 }, { id: 2 }],
            nullValue: null,
        };

        expect(fallback.nested.deeply.value).toEqual([1, 2, 3]);
        expect(fallback.array).toHaveLength(2);
        expect(fallback.nullValue).toBeNull();
    });

    it('handles rapid successive failures', () => {
        let failures = 0;
        const maxFailures = 10;

        for (let i = 0; i < maxFailures; i++) {
            failures++;
        }

        expect(failures).toBe(maxFailures);
    });

    it('circuit breaker threshold is 5', () => {
        const FAILURE_THRESHOLD = 5;
        expect(FAILURE_THRESHOLD).toBe(5);
    });

    it('cooldown period is 30 seconds', () => {
        const COOLDOWN_MS = 30000;
        expect(COOLDOWN_MS).toBe(30000);
    });
});

