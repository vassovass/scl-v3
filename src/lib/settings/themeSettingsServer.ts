import { createAdminClient } from "@/lib/supabase/server";
import { createCachedFetcher } from "@/lib/cache/serverCache";
import {
  DEFAULT_THEME_SETTINGS,
  getThemeSettingsFromValues,
  ThemeSettings,
} from "@/lib/settings/themeSettings";

const THEME_SETTING_KEYS = [
  "default_theme_mode",
  "allow_theme_dark",
  "allow_theme_light",
  "allow_theme_system",
];

export const getCachedThemeSettings = createCachedFetcher<ThemeSettings>({
  tag: "settings",
  fetcher: async () => {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from("app_settings")
      .select("key, value")
      .in("key", THEME_SETTING_KEYS);

    if (error) {
      console.error("Error fetching theme settings:", error);
      return DEFAULT_THEME_SETTINGS;
    }

    const settingsMap = (data || []).reduce<Record<string, unknown>>((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});

    return getThemeSettingsFromValues({
      defaultMode: settingsMap.default_theme_mode,
      allowDark: settingsMap.allow_theme_dark,
      allowLight: settingsMap.allow_theme_light,
      allowSystem: settingsMap.allow_theme_system,
    });
  },
  fallback: DEFAULT_THEME_SETTINGS,
  timeoutMs: 3000,
  revalidateSeconds: 3600,
});
