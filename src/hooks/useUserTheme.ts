/**
 * useUserTheme - Database-synced theme management hook
 *
 * Integrates next-themes with user_preferences database persistence.
 *
 * Features:
 * - Client-side theme management via next-themes
 * - Automatic database sync when logged in
 * - Loads user's saved theme preference on mount
 * - Falls back to localStorage for anonymous users
 *
 * Usage:
 * ```tsx
 * const { theme, updateTheme, isLoading } = useUserTheme();
 *
 * <button onClick={() => updateTheme('light')}>
 *   Switch to light mode
 * </button>
 * ```
 */

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import { useThemeSettings } from "@/hooks/useThemeSettings";

type Theme = "dark" | "light" | "system";

interface UseUserThemeReturn {
  /** Current theme value */
  theme: Theme | undefined;
  /** Update theme (syncs to database if logged in) */
  updateTheme: (newTheme: Theme) => Promise<void>;
  /** Whether theme is being loaded from database */
  isLoading: boolean;
  /** Whether theme has been synced from database */
  isSynced: boolean;
}

export function useUserTheme(): UseUserThemeReturn {
  const { theme, setTheme } = useTheme();
  const { allowedModes, defaultMode, isLoading: isSettingsLoading } = useThemeSettings();
  const [isLoading, setIsLoading] = useState(true);
  const [isSynced, setIsSynced] = useState(false);

  const resolveTheme = (value: Theme | undefined): Theme => {
    if (value && allowedModes.includes(value)) {
      return value;
    }
    return defaultMode;
  };

  // Load user's saved theme preference on mount
  useEffect(() => {
    async function loadUserTheme() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          // Not logged in - use localStorage via next-themes
          setIsLoading(false);
          setIsSynced(true);
          return;
        }

        // Fetch user preferences from database
        const response = await fetch("/api/user/preferences");
        if (!response.ok) {
          console.error("[useUserTheme] Failed to fetch preferences:", response.statusText);
          setIsLoading(false);
          return;
        }

        const preferences = await response.json();
        const savedTheme = preferences.theme as Theme | undefined;
        const resolvedTheme = resolveTheme(savedTheme ?? defaultMode);

        if (resolvedTheme && resolvedTheme !== theme) {
          // Apply saved theme from database
          setTheme(resolvedTheme);
        }

        setIsSynced(true);
      } catch (error) {
        console.error("[useUserTheme] Error loading theme:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (!isSettingsLoading) {
      loadUserTheme();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSettingsLoading]); // Only run on mount once settings are ready

  useEffect(() => {
    if (isSettingsLoading) return;
    if (theme && !allowedModes.includes(theme as Theme)) {
      setTheme(defaultMode);
    }
  }, [allowedModes, defaultMode, isSettingsLoading, setTheme, theme]);

  /**
   * Update theme and sync to database if logged in
   */
  const updateTheme = async (newTheme: Theme) => {
    if (!allowedModes.includes(newTheme)) {
      setTheme(defaultMode);
      return;
    }
    // Update client-side theme immediately (optimistic update)
    setTheme(newTheme);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Not logged in - next-themes will handle localStorage
        return;
      }

      // Sync to database
      const response = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: newTheme }),
      });

      if (!response.ok) {
        console.error("[useUserTheme] Failed to save theme:", response.statusText);
        // Don't revert the theme - local change is still valid
      }
    } catch (error) {
      console.error("[useUserTheme] Error saving theme:", error);
      // Don't revert the theme - local change is still valid
    }
  };

  return {
    theme: theme as Theme | undefined,
    updateTheme,
    isLoading,
    isSynced,
  };
}

