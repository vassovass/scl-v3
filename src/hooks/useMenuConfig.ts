"use client";

import { useState, useEffect } from 'react';
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

/**
 * Hook to fetch menu configuration from database with fallback to static config
 *
 * Features:
 * - Fetches menus from /api/menus
 * - Falls back to static MENUS if database is empty or errors
 * - Provides helper functions for role filtering and href resolution
 * - Client-side caching
 *
 * @example
 * const { menus, locations, isLoading } = useMenuConfig();
 * const mainMenu = menus.main;
 */
export function useMenuConfig() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const loadMenus = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/menus');
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMenus();
  }, []);

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
    /** Manually refresh menus from database */
    refresh: loadMenus,
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
