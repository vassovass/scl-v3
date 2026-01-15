/**
 * Utility to clear all app state (caches, service workers, storage).
 * Used by sign-out flow and /reset page.
 */

/**
 * Clear service worker caches via postMessage.
 * This is non-blocking and best-effort.
 */
export async function clearServiceWorkerCaches(): Promise<void> {
    if (!("serviceWorker" in navigator)) return;

    try {
        const registration = await navigator.serviceWorker.ready;
        if (registration.active) {
            registration.active.postMessage({ type: "CLEAR_CACHES" });
            console.log("[clearAppState] Sent CLEAR_CACHES to service worker");
        }
    } catch (e) {
        console.warn("[clearAppState] Failed to message service worker:", e);
    }
}

/**
 * Clear browser caches (Cache API).
 */
export async function clearBrowserCaches(): Promise<void> {
    if (!("caches" in window)) return;

    try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((c) => caches.delete(c)));
        console.log(`[clearAppState] Cleared ${cacheNames.length} browser caches`);
    } catch (e) {
        console.warn("[clearAppState] Failed to clear browser caches:", e);
    }
}

/**
 * Clear localStorage entries related to the app.
 * Preserves other site data if needed.
 */
export function clearAppStorage(): void {
    try {
        // Clear all app-related keys
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith("stepleague") || key.startsWith("sb-") || key.startsWith("supabase"))) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
        console.log(`[clearAppState] Removed ${keysToRemove.length} localStorage keys`);
    } catch (e) {
        console.warn("[clearAppState] Failed to clear localStorage:", e);
    }
}

/**
 * Clear Supabase-related cookies.
 */
export function clearAuthCookies(): void {
    try {
        document.cookie.split(";").forEach((c) => {
            const name = c.split("=")[0].trim();
            if (name.startsWith("sb-") || name.includes("supabase") || name.includes("auth")) {
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                const domain = window.location.hostname;
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain}`;
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${domain}`;
            }
        });
        console.log("[clearAppState] Cleared auth cookies");
    } catch (e) {
        console.warn("[clearAppState] Failed to clear cookies:", e);
    }
}

/**
 * Comprehensive cleanup - call on sign-out.
 */
export async function clearAllAppState(): Promise<void> {
    await clearServiceWorkerCaches();
    await clearBrowserCaches();
    clearAppStorage();
    clearAuthCookies();
}
