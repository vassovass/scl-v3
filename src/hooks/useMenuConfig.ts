"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  MENUS,
  MENU_LOCATIONS,
  MenuDefinition,
  MenuItem,
  UserRole,
  MenuLocation,
  MenuLocationConfig,
  filterMenuByRole,
  prepareMenuItems,
  resolveMenuHrefs,
  filterByLeagueContext,
} from '@/lib/menuConfig';
import { menuCache, getCacheAge } from '@/lib/cache/menuCache';

/**
 * Hook to fetch menu configuration from database with multi-layer caching
 *
 * Features:
 * - Multi-layer caching (Memory → SessionStorage → IndexedDB → API)
 * - Stale-while-revalidate pattern for instant renders
 * - Cross-tab sync via BroadcastChannel
 * - Offline PWA support with IndexedDB
 * - Falls back to static MENUS if database is empty or errors
 *
 * @example
 * const { menus, locations, isLoading, isStale } = useMenuConfig();
 * const mainMenu = menus.main;
 */
export function useMenuConfig() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [isStale, setIsStale] = useState(false);
  const [cacheAge, setCacheAge] = useState<string | null>(null);

  const loadMenus = useCallback(async (skipCache = false) => {
    try {
      // Layer 1-3: Try cache first (unless explicitly skipping)
      let cached = null;
      if (!skipCache) {
        cached = await menuCache.get();
        if (cached) {
          setData(cached);
          setIsStale(menuCache.isStale(cached));
          setCacheAge(getCacheAge(cached.timestamp));

          // If cache is not expired, use it and optionally revalidate in background
          if (!menuCache.isExpired(cached)) {
            setIsLoading(false);
            setError(null);
            // Continue to fetch in background to check version
          } else {
            // Cache is expired, show stale data but fetch fresh in foreground
          }
        }
      }

      // Layer 4: Fetch from API
      setIsLoading(cached ? false : true); // Don't show loading if we have cached data
      const res = await fetch('/api/menus');
      const json = await res.json();

      // Check if server version differs from cached version (cache invalidation check)
      if (cached?.cacheVersion && json.cacheVersion && cached.cacheVersion !== json.cacheVersion) {
        if (process.env.NODE_ENV !== "production") {
          console.debug(
            `[Menu Cache] Version mismatch: ${cached.cacheVersion} vs ${json.cacheVersion} - refreshing cache`
          );
        }
        await menuCache.invalidate();
      }

      // Update cache with fresh data
      if (json.menus && json.locations) {
        await menuCache.set({
          menus: json.menus,
          locations: json.locations,
          cacheVersion: json.cacheVersion || new Date().toISOString(),
        });
      }

      setData(json);
      setIsStale(false);
      setCacheAge(null);
      setError(null);
    } catch (err) {
      setError(err);
      // Keep showing stale cache data if available
      if (!data) {
        setData(null);
      }
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- loadMenus should only run once on mount
  }, []);

  useEffect(() => {
    loadMenus();
  }, [loadMenus]);

  // Use database menus if available, otherwise fall back to static
  const menus: Record<string, MenuDefinition> = data?.menus || MENUS;
  const locations: Record<MenuLocation, MenuLocationConfig> = data?.locations || MENU_LOCATIONS;

  return {
    /** All menu definitions */
    menus,
    /** Menu location configurations */
    locations,
    /** Loading state */
    isLoading,
    /** Error if any */
    error,
    /** Whether cache is stale (> 1 minute old) */
    isStale,
    /** Human-readable cache age (e.g., "2m ago") */
    cacheAge,
    /** Manually refresh menus from database, bypassing cache */
    refresh: () => loadMenus(true),
    /** Clear all cache layers and reload */
    invalidate: async () => {
      await menuCache.invalidate();
      loadMenus(true);
    },
    /** Whether using static fallback */
    isUsingFallback: !data?.menus,

    // Re-export helper functions for convenience
    filterMenuByRole,
    prepareMenuItems,
    resolveMenuHrefs,
    filterByLeagueContext,
  };
}

/**
 * Hook to get a specific menu by ID
 *
 * @param menuId - The menu ID (e.g., 'main', 'help', 'user')
 * @example
 * const { menu, items } = useMenu('main', 'member', 'league-123');
 */
export function useMenu(
  menuId: keyof typeof MENUS,
  userRole: UserRole = 'guest',
  leagueId?: string
) {
  const { menus, isLoading, error } = useMenuConfig();

  const menu = menus[menuId];
  const items = menu ? prepareMenuItems(menu.items, userRole, leagueId) : [];

  return {
    menu,
    items,
    isLoading,
    error,
  };
}

/**
 * Hook to get menu location configuration
 *
 * @param location - The menu location (e.g., 'app_header', 'public_header')
 * @example
 * const { config, menuIds } = useMenuLocation('app_header');
 */
export function useMenuLocation(location: MenuLocation) {
  const { locations, isLoading, error } = useMenuConfig();

  const config = locations[location];
  const menuIds = config?.menus || [];

  return {
    config,
    menuIds,
    isLoading,
    error,
  };
}

