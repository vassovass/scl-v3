"use client";

import { useAppSettings } from "@/hooks/useAppSettings";
import {
  DEFAULT_THEME_SETTINGS,
  getThemeSettingsFromValues,
  ThemeMode,
  ThemeSettings,
} from "@/lib/settings/themeSettings";

interface UseThemeSettingsResult extends ThemeSettings {
  isLoading: boolean;
}

export function useThemeSettings(): UseThemeSettingsResult {
  const { getSetting, isLoading } = useAppSettings();

  const themeSettings = getThemeSettingsFromValues({
    defaultMode: getSetting<ThemeMode>("default_theme_mode", DEFAULT_THEME_SETTINGS.defaultMode),
    allowDark: getSetting<boolean>("allow_theme_dark", true),
    allowLight: getSetting<boolean>("allow_theme_light", true),
    allowSystem: getSetting<boolean>("allow_theme_system", true),
  });

  return {
    ...themeSettings,
    isLoading,
  };
}

