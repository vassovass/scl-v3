import { unstable_cache, revalidateTag } from 'next/cache';
import { AppError, ErrorCode, reportError } from '@/lib/errors';

// 1. Type-safe cache tags
export type CacheTag = 'branding' | 'menus' | 'settings' | 'app_config';

interface CacheStats {
    hits: number;
    misses: number;
    timeouts: number;
    lastInvalidated: number | null;
}

// In-memory stats tracking (per serverless instance)
const cacheStats = new Map<CacheTag, CacheStats>();

function getStats(tag: CacheTag): CacheStats {
    if (!cacheStats.has(tag)) {
        cacheStats.set(tag, { hits: 0, misses: 0, timeouts: 0, lastInvalidated: null });
    }
    return cacheStats.get(tag)!;
}

export interface CacheOptions<T> {
    tag: CacheTag;
    fetcher: () => Promise<T>;
    fallback: T;
    timeoutMs?: number;     // Default: 3000ms
    revalidateSeconds?: number; // Default: 3600s (1 hour)
}

/**
 * Create a cached fetcher with timeout fallback and tag-based invalidation.
 * Wraps Next.js unstable_cache with observability and error handling.
 */
export function createCachedFetcher<T>({
    tag,
    fetcher,
    fallback,
    timeoutMs = 3000,
    revalidateSeconds = 3600
}: CacheOptions<T>): () => Promise<T> {

    // Circuit Breaker State (Closure-based per fetcher instance)
    let failures = 0;
    let lastFailure = 0;
    const FAILURE_THRESHOLD = 5;
    const COOLDOWN_MS = 30000; // 30 seconds

    // The actual data fetcher wrapped with timeout
    const cachedFn = unstable_cache(
        async () => {
            const stats = getStats(tag);

            // 1. Check Circuit Breaker
            if (failures >= FAILURE_THRESHOLD) {
                const now = Date.now();
                if (now - lastFailure < COOLDOWN_MS) {
                    console.warn(`[Cache] Circuit open for ${tag}. Returning fallback.`);
                    return fallback;
                }
                // Reset trial
                failures = 0;
            }

            // Timeout promise
            const timeoutPromise = new Promise<null>((resolve) =>
                setTimeout(() => resolve(null), timeoutMs)
            );

            try {
                // Race fetcher against timeout
                const result = await Promise.race([fetcher(), timeoutPromise]);

                if (result === null) {
                    stats.timeouts++;
                    failures++;
                    lastFailure = Date.now();
                    // Log timeout as a warning, not critical error
                    console.warn(`[Cache] Timeout for ${tag} (${timeoutMs}ms), using fallback`);

                    // Report to error system but don't crash
                    reportError(new AppError({
                        code: ErrorCode.TIMEOUT_ERROR,
                        message: `Cache fetch timed out for ${tag}`,
                        context: { tag, timeoutMs },
                        recoverable: true
                    }));

                    return fallback;
                }

                return result;
            } catch (err: any) {
                console.error(`[Cache] Fetch failed for ${tag}:`, err);
                failures++;
                lastFailure = Date.now();

                // Report actual errors
                reportError(new AppError({
                    code: ErrorCode.UNKNOWN_ERROR,
                    message: `Cache fetch failed for ${tag}`,
                    context: { tag, originalError: err.message },
                    recoverable: true
                }));

                return fallback;
            }
        },
        [tag], // Cache key parts
        {
            tags: [tag], // Invalidation tags
            revalidate: revalidateSeconds
        }
    );

    // Wrapper to track hits (approximation)
    return async () => {
        // Note: We can't easily track hits perfectly because unstable_cache 
        // handles the hit logic internally without invoking our callback.
        // However, if the cachedFn returns quickly without logging 'miss', it's effectively a hit from the consumer perspective.
        return cachedFn();
    };
}

/**
 * Invalidate a cache by tag.
 * Call this after updating settings in admin.
 */
export function invalidateCache(tag: CacheTag): void {
    const stats = getStats(tag);
    stats.lastInvalidated = Date.now();
    revalidateTag(tag);
    console.log(`[Cache] Invalidated tag: ${tag}`);
}

/**
 * Get current cache health stats
 */
export function getCacheHealth(): Record<string, CacheStats> {
    const report: Record<string, CacheStats> = {};
    cacheStats.forEach((stats, tag) => {
        report[tag] = { ...stats };
    });
    return report;
}

/**
 * Manually warm specific caches
 * Useful for deployment hooks
 */
export async function warmCaches(fetchers: Array<() => Promise<any>>): Promise<void> {
    console.log(`[Cache] Warming ${fetchers.length} caches...`);
    await Promise.allSettled(fetchers.map(f => f()));
    console.log(`[Cache] Warming complete`);
}

