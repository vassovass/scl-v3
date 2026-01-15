"use client";

import { useEffect, useState } from "react";

/**
 * Recovery/Reset page - clears all local state and redirects to sign-in.
 * 
 * Use this when users get stuck on loading screens due to:
 * - Stale service worker cache
 * - Corrupted session state
 * - IndexedDB issues
 * 
 * URL: /reset
 */
export default function ResetPage() {
    const [status, setStatus] = useState("Initializing reset...");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const performReset = async () => {
            try {
                // 1. Unregister all service workers
                setStatus("Unregistering service workers...");
                if ("serviceWorker" in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    await Promise.all(registrations.map((r) => r.unregister()));
                    console.log(`[Reset] Unregistered ${registrations.length} service workers`);
                }

                // 2. Clear all caches
                setStatus("Clearing caches...");
                if ("caches" in window) {
                    const cacheNames = await caches.keys();
                    await Promise.all(cacheNames.map((c) => caches.delete(c)));
                    console.log(`[Reset] Deleted ${cacheNames.length} caches`);
                }

                // 3. Clear localStorage & sessionStorage
                setStatus("Clearing local storage...");
                localStorage.clear();
                sessionStorage.clear();
                console.log("[Reset] Cleared localStorage & sessionStorage");

                // 4. Clear IndexedDB databases (with timeout - can hang if DB in use)
                setStatus("Clearing IndexedDB...");
                if (indexedDB.databases) {
                    try {
                        const dbs = await indexedDB.databases();

                        // Wrap each delete in a timeout to prevent hanging
                        const deleteWithTimeout = (dbName: string): Promise<void> => {
                            return new Promise((resolve) => {
                                const timeout = setTimeout(() => {
                                    console.warn(`[Reset] IndexedDB ${dbName} delete timed out, skipping`);
                                    resolve();
                                }, 2000); // 2 second timeout per database

                                const req = indexedDB.deleteDatabase(dbName);
                                req.onsuccess = () => {
                                    clearTimeout(timeout);
                                    resolve();
                                };
                                req.onerror = () => {
                                    clearTimeout(timeout);
                                    console.warn(`[Reset] IndexedDB ${dbName} delete error, continuing`);
                                    resolve();
                                };
                                req.onblocked = () => {
                                    clearTimeout(timeout);
                                    console.warn(`[Reset] IndexedDB ${dbName} blocked (in use), skipping`);
                                    resolve();
                                };
                            });
                        };

                        await Promise.all(
                            dbs
                                .filter((db) => db.name)
                                .map((db) => deleteWithTimeout(db.name!))
                        );
                        console.log(`[Reset] Processed ${dbs.length} IndexedDB databases`);
                    } catch (e) {
                        console.warn("[Reset] IndexedDB cleanup failed (non-critical):", e);
                    }
                }

                // 5. Clear all cookies
                setStatus("Clearing cookies...");
                document.cookie.split(";").forEach((c) => {
                    const name = c.split("=")[0].trim();
                    // Clear for current path
                    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                    // Also try clearing with domain
                    const domain = window.location.hostname;
                    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain}`;
                    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${domain}`;
                });
                console.log("[Reset] Cleared cookies");

                // 6. Success - redirect to sign-in
                setStatus("Reset complete! Redirecting...");
                console.log("[Reset] Complete, redirecting to sign-in");

                // Small delay to show success message
                setTimeout(() => {
                    // Use location.href for hard navigation (no client router)
                    window.location.href = "/sign-in?reset=true";
                }, 500);
            } catch (e) {
                console.error("[Reset] Error during reset:", e);
                setError(e instanceof Error ? e.message : "Unknown error occurred");
                setStatus("Reset failed");
            }
        };

        performReset();
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center p-8 max-w-md">
                <h1 className="text-2xl font-bold mb-4">
                    {error ? "⚠️ Reset Error" : "🔄 Resetting App"}
                </h1>

                <div className="mb-6">
                    {!error && (
                        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                    )}
                    <p className="text-muted-foreground">{status}</p>
                </div>

                {error && (
                    <div className="space-y-4">
                        <p className="text-destructive text-sm">{error}</p>
                        <div className="flex gap-2 justify-center">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
                            >
                                Try Again
                            </button>
                            <a
                                href="/sign-in"
                                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90"
                            >
                                Go to Sign In
                            </a>
                        </div>
                    </div>
                )}

                <p className="text-xs text-muted-foreground mt-8">
                    This clears all local app data to fix loading issues.
                </p>
            </div>
        </div>
    );
}
