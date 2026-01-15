/**
 * useFilterPersistence Hook
 * 
 * A universal hook for persisting filter state across page refreshes.
 * Uses URL search params as primary source (shareable, bookmarkable)
 * with localStorage fallback for user preferences.
 * 
 * @module hooks/useFilterPersistence
 */

'use client';

import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { getStoredFilters, setStoredFilters } from '@/lib/filters/filterStorage';

export interface UseFilterPersistenceOptions<T extends Record<string, string>> {
    /** Storage key for localStorage (e.g., 'leaderboard', 'feedback') */
    storageKey: string;
    /** Context ID for scoped persistence (e.g., leagueId) */
    contextId?: string;
    /** Default filter values */
    defaults: T;
    /** 
     * Which keys to sync to URL. If not provided, all keys are synced.
     * Use this to exclude noisy or transient filters from URL.
     */
    urlParamKeys?: (keyof T)[];
    /**
     * Whether to persist to localStorage on change.
     * Default: true
     */
    persistToStorage?: boolean;
}

export interface UseFilterPersistenceResult<T extends Record<string, string>> {
    /** Current filter state */
    filters: T;
    /** Update a single filter */
    setFilter: (key: keyof T, value: string) => void;
    /** Update multiple filters at once */
    setFilters: (updates: Partial<T>) => void;
    /** Reset all filters to defaults */
    resetFilters: () => void;
    /** Whether initial hydration is complete (use to prevent flash) */
    isHydrated: boolean;
    /** URL with current filters (for sharing) */
    shareableUrl: string;
}

export function useFilterPersistence<T extends Record<string, string>>(
    options: UseFilterPersistenceOptions<T>
): UseFilterPersistenceResult<T> {
    const {
        storageKey,
        contextId = 'default',
        defaults,
        urlParamKeys,
        persistToStorage = true,
    } = options;

    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const [isHydrated, setIsHydrated] = useState(false);

    // Flag to prevent re-sync when we update URL ourselves (prevents infinite loop)
    const selfUpdateRef = useRef(false);

    // Determine which keys to sync to URL
    const syncKeys = useMemo(
        () => urlParamKeys || (Object.keys(defaults) as (keyof T)[]),
        [urlParamKeys, defaults]
    );

    // Helper to compute current filters from sources
    const computeFilters = useCallback(() => {
        const result = { ...defaults };

        // Try URL params first (highest priority)
        let hasUrlParams = false;
        syncKeys.forEach((key) => {
            const urlValue = searchParams.get(String(key));
            if (urlValue !== null) {
                result[key] = urlValue as T[keyof T];
                hasUrlParams = true;
            }
        });

        // If no URL params, try localStorage (only on client)
        if (!hasUrlParams && typeof window !== 'undefined') {
            const stored = getStoredFilters<T>(storageKey, contextId);
            if (stored) {
                Object.keys(stored).forEach((key) => {
                    if (key in defaults && stored[key as keyof T]) {
                        result[key as keyof T] = stored[key as keyof T] as T[keyof T];
                    }
                });
            }
        }
        return result;
    }, [searchParams, defaults, syncKeys, storageKey, contextId]);

    // Optimistic state
    const [filters, setFiltersState] = useState<T>(defaults);

    // Sync from URL/Storage on mount and when params change
    useEffect(() => {
        // Skip if this is a self-triggered URL update
        if (selfUpdateRef.current) {
            selfUpdateRef.current = false;
            return;
        }
        setFiltersState(computeFilters());
    }, [computeFilters]);

    // Mark as hydrated after first render
    useEffect(() => {
        setIsHydrated(true);
    }, []);

    // Update URL and optionally localStorage
    const updateFilters = useCallback(
        (newFilters: T) => {
            console.log("useFilterPersistence: Updating filters:", newFilters);
            // Optimistic update
            setFiltersState(newFilters);

            // Build new URL params
            const params = new URLSearchParams();
            syncKeys.forEach((key) => {
                const value = newFilters[key];
                // Only add non-default values to URL to keep it clean
                if (value && value !== defaults[key]) {
                    params.set(String(key), value);
                }
            });

            // Update URL without scroll
            // Set flag to prevent sync effect from re-processing this update
            selfUpdateRef.current = true;
            const newUrl = params.toString()
                ? `${pathname}?${params.toString()}`
                : pathname;
            router.push(newUrl, { scroll: false });

            // Persist to localStorage
            if (persistToStorage) {
                setStoredFilters(storageKey, newFilters, contextId);
            }
        },
        [syncKeys, defaults, pathname, router, persistToStorage, storageKey, contextId]
    );

    const setFilter = useCallback(
        (key: keyof T, value: string) => {
            const newFilters = { ...filters, [key]: value };
            updateFilters(newFilters);
        },
        [filters, updateFilters]
    );

    const setFilters = useCallback(
        (updates: Partial<T>) => {
            const newFilters = { ...filters, ...updates };
            updateFilters(newFilters as T);
        },
        [filters, updateFilters]
    );

    const resetFilters = useCallback(() => {
        updateFilters(defaults);
    }, [defaults, updateFilters]);

    // Build shareable URL
    const shareableUrl = useMemo(() => {
        if (typeof window === 'undefined') return '';
        const params = new URLSearchParams();
        syncKeys.forEach((key) => {
            const value = filters[key];
            if (value && value !== defaults[key]) {
                params.set(String(key), value);
            }
        });
        const queryString = params.toString();
        return queryString
            ? `${window.location.origin}${pathname}?${queryString}`
            : `${window.location.origin}${pathname}`;
    }, [filters, defaults, syncKeys, pathname]);

    return {
        filters,
        setFilter,
        setFilters,
        resetFilters,
        isHydrated,
        shareableUrl,
    };
}

export default useFilterPersistence;
