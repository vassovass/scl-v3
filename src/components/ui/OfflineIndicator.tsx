/**
 * OfflineIndicator Component
 * 
 * Visual indicator showing offline status and pending submission count.
 * Displays in the navigation header.
 */

"use client";

import { useState, useEffect } from 'react';
import { WifiOff, Cloud, CloudOff, Loader2 } from 'lucide-react';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { useOfflineSync } from '@/hooks/useOfflineSync';

export function OfflineIndicator() {
    const [isOffline, setIsOffline] = useState(false);
    const { pendingCount, isLoading } = useOfflineQueue();
    const { isSyncing } = useOfflineSync();

    useEffect(() => {
        if (typeof window === 'undefined') return;

        setIsOffline(!navigator.onLine);

        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Don't render anything if online and no pending items
    if (!isOffline && pendingCount === 0 && !isSyncing) {
        return null;
    }

    // Loading state
    if (isLoading) {
        return null;
    }

    return (
        <div className="flex items-center gap-3 text-sm">
            {/* Offline badge */}
            {isOffline && (
                <span className="flex items-center gap-1.5 rounded-full bg-amber-500/20 px-2.5 py-1 text-[hsl(var(--warning))]">
                    <WifiOff className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Offline</span>
                </span>
            )}

            {/* Syncing indicator */}
            {isSyncing && (
                <span className="flex items-center gap-1.5 rounded-full bg-[hsl(var(--info)/0.2)] px-2.5 py-1 text-[hsl(var(--info))]">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span className="hidden sm:inline">Syncing...</span>
                </span>
            )}

            {/* Pending count badge (when not syncing) */}
            {!isSyncing && pendingCount > 0 && (
                <span
                    className="flex items-center gap-1.5 rounded-full bg-[hsl(var(--info)/0.2)] px-2.5 py-1 text-[hsl(var(--info))]"
                    title={`${pendingCount} submission${pendingCount > 1 ? 's' : ''} waiting to sync`}
                >
                    {isOffline ? (
                        <CloudOff className="h-3.5 w-3.5" />
                    ) : (
                        <Cloud className="h-3.5 w-3.5" />
                    )}
                    <span>{pendingCount} pending</span>
                </span>
            )}
        </div>
    );
}

