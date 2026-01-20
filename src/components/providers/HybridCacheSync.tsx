"use client";

import { useEffect } from "react";
import { menuCache } from "@/lib/cache/menuCache";

/**
 * HybridCacheSync
 * 
 * Non-visual component that bridges the Server Cache state with the Client Cache.
 * It receives the current `serverVersion` from the Root Layout (RSC).
 * 
 * Logic:
 * 1. On mount, compare `serverVersion` with `menuCache` stored version.
 * 2. If mismatch, trigger a silent re-validation of client data.
 */
export function HybridCacheSync({ serverVersion }: { serverVersion: string }) {
    useEffect(() => {
        // Fire and forget - don't block main thread
        const sync = async () => {
            try {
                const isFresh = await menuCache.checkVersion(serverVersion);
                if (!isFresh) {
                    // Avoid noisy console logs in production (this can happen naturally after deploys)
                    if (process.env.NODE_ENV !== "production") {
                        console.debug("[HybridSync] Version mismatch detected. Cache marked stale.");
                    }
                    // Note: The actual re-fetching logic typically happens when the Menu component mounts
                    // OR we can trigger a proactive fetch here if we have a global fetcher available.
                    // For now, `checkVersion` returning false simply ensures the *next* read misses.

                    // If we want proactive aggressive sync:
                    // invalidate triggers the listeners in useMenu logic to refetch
                    await menuCache.invalidate();
                }
            } catch (err) {
                console.error("[HybridSync] Error syncing:", err);
            }
        };

        // Use requestIdleCallback if available for zero TBT impact
        if ("requestIdleCallback" in window) {
            requestIdleCallback(() => sync());
        } else {
            setTimeout(sync, 1000);
        }
    }, [serverVersion]);

    return null;
}

