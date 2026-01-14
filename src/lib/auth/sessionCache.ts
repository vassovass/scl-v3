/**
 * Session cache singleton for bypassing hanging Supabase auth calls.
 * 
 * Background: Supabase's getUser() and getSession() can hang indefinitely
 * due to Web Locks API deadlocks in GoTrueClient. This module provides
 * a cached access token that can be used without network calls.
 * 
 * The AuthProvider writes to this cache on auth state changes.
 * The API client reads from this cache as the first source of truth.
 */

interface CachedSession {
    accessToken: string;
    userId: string;
    expiresAt: number; // Unix timestamp in seconds
}

let cachedSession: CachedSession | null = null;

/**
 * Store session token for use by API client.
 * Called by AuthProvider when session changes.
 */
export function setCachedSession(
    accessToken: string | null,
    userId: string | null,
    expiresAt: number | null
): void {
    if (accessToken && userId && expiresAt) {
        cachedSession = { accessToken, userId, expiresAt };
        console.log('[SessionCache] Session cached for user:', userId);
    } else {
        cachedSession = null;
        console.log('[SessionCache] Session cleared');
    }
}

/**
 * Get cached session if valid (not expired).
 * Returns null if no valid session is cached.
 */
export function getCachedSession(): CachedSession | null {
    if (!cachedSession) {
        return null;
    }

    // Check if expired (with 60s buffer for clock skew)
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (cachedSession.expiresAt < nowSeconds + 60) {
        console.log('[SessionCache] Cached session expired');
        cachedSession = null;
        return null;
    }

    return cachedSession;
}

/**
 * Clear the cached session.
 * Called on sign-out.
 */
export function clearCachedSession(): void {
    cachedSession = null;
    console.log('[SessionCache] Session cleared');
}
