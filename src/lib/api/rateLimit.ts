/**
 * In-Memory Sliding Window Rate Limiter
 *
 * Tracks request timestamps per key (user ID or IP) and enforces
 * configurable limits. Acceptable for alpha (Vercel serverless resets
 * on cold start). For production, upgrade to Upstash Redis.
 *
 * @example
 * // In withApiHandler config:
 * export const POST = withApiHandler({
 *   auth: 'required',
 *   rateLimit: { maxRequests: 5, windowMs: 60_000 },
 * }, handler);
 *
 * @example
 * // Standalone usage in manual routes:
 * const result = checkRateLimit(getRateLimitKey(request, user), { maxRequests: 5, windowMs: 60_000 });
 * if (!result.allowed) return tooManyRequests(result.retryAfterMs, result.remaining, result.limit);
 */

import type { User } from "@supabase/supabase-js";

// =============================================================================
// Types
// =============================================================================

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Window duration in milliseconds (e.g., 60_000 for 1 minute) */
  windowMs: number;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Remaining requests in the current window */
  remaining: number;
  /** Milliseconds until the client can retry (0 if allowed) */
  retryAfterMs: number;
  /** The configured limit */
  limit: number;
}

// =============================================================================
// Storage (module-level, resets on cold start — acceptable for alpha)
// =============================================================================

// Map<key, timestamps[]>
const store = new Map<string, number[]>();

// Cleanup stale entries every 60 seconds to prevent memory leaks
let cleanupScheduled = false;
const CLEANUP_INTERVAL_MS = 60_000;

function scheduleCleanup() {
  if (cleanupScheduled) return;
  cleanupScheduled = true;

  setTimeout(() => {
    cleanupScheduled = false;
    const now = Date.now();

    for (const [key, timestamps] of store.entries()) {
      // Remove entries where all timestamps are older than the longest reasonable window (5 min)
      const maxWindow = 5 * 60_000;
      const filtered = timestamps.filter((t) => now - t < maxWindow);
      if (filtered.length === 0) {
        store.delete(key);
      } else {
        store.set(key, filtered);
      }
    }

    // Re-schedule if store still has entries
    if (store.size > 0) {
      scheduleCleanup();
    }
  }, CLEANUP_INTERVAL_MS);
}

// =============================================================================
// Core
// =============================================================================

/**
 * Check if a request is within rate limits using sliding window algorithm.
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Get existing timestamps and filter to current window
  const timestamps = (store.get(key) || []).filter((t) => t > windowStart);

  if (timestamps.length >= config.maxRequests) {
    // Blocked — calculate when the oldest request in window expires
    const oldestInWindow = timestamps[0];
    const retryAfterMs = oldestInWindow + config.windowMs - now;

    // Update store with filtered timestamps (no new entry)
    store.set(key, timestamps);

    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(retryAfterMs, 1000), // At least 1 second
      limit: config.maxRequests,
    };
  }

  // Allowed — record this request
  timestamps.push(now);
  store.set(key, timestamps);

  // Schedule cleanup on first usage
  scheduleCleanup();

  return {
    allowed: true,
    remaining: config.maxRequests - timestamps.length,
    retryAfterMs: 0,
    limit: config.maxRequests,
  };
}

/**
 * Extract a rate limit key from the request.
 * Uses user ID for authenticated requests, IP address for anonymous.
 */
export function getRateLimitKey(
  request: Request,
  user: User | null
): string {
  if (user) {
    return `user:${user.id}`;
  }

  // Extract IP from headers (Vercel sets x-forwarded-for)
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";

  return `ip:${ip}`;
}

/**
 * Reset the rate limit store. Used in tests only.
 * @internal
 */
export function _resetStore() {
  store.clear();
}
