/**
 * User Preferences API
 * GET: Fetch user preferences (with defaults if not exists)
 * PATCH: Update user preferences
 *
 * Follows default/override pattern - only stores non-default values
 */

import { withApiHandler } from "@/lib/api/handler";
import { badRequest } from "@/lib/api";
import { z } from "zod";
import { getUserPreferenceDefaults } from "@/lib/settings/userPreferences";
import type { createAdminClient } from "@/lib/supabase/server";
import {
    DEFAULT_THEME_SETTINGS,
    getThemeSettingsFromValues,
    ThemeMode,
} from "@/lib/settings/themeSettings";

// Validation schema for PATCH request
const patchSchema = z.object({
    default_landing: z.enum(["dashboard", "submit", "progress", "rankings"]).optional(),
    primary_league_id: z.string().uuid().nullable().optional(),
    reminder_style: z.enum(["floating", "badge", "card"]).optional(),
    reminder_dismissed_until: z.string().datetime().nullable().optional(),
    theme: z.enum(["dark", "light", "system"]).optional(),
    email_daily_reminder: z.boolean().optional(),
    email_weekly_digest: z.boolean().optional(),
    push_enabled: z.boolean().optional(),
});

const THEME_SETTING_KEYS = [
    "default_theme_mode",
    "allow_theme_dark",
    "allow_theme_light",
    "allow_theme_system",
];

async function fetchThemeSettings(adminClient: ReturnType<typeof createAdminClient>) {
    const { data, error } = await adminClient
        .from("app_settings")
        .select("key, value")
        .in("key", THEME_SETTING_KEYS);

    if (error) {
        console.error("Failed to load theme settings:", error);
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
}

/**
 * GET /api/user/preferences
 * Returns user preferences, merging with defaults if not yet saved
 */
export const GET = withApiHandler(
    {
        auth: "required",
    },
    async ({ user, adminClient }) => {
        // Try to fetch existing preferences
        const { data: preferences, error } = await adminClient
            .from("user_preferences")
            .select("*")
            .eq("user_id", user!.id)
            .single();

        if (error && error.code !== "PGRST116") {
            // PGRST116 = no rows found, which is ok
            throw error;
        }

        const themeSettings = await fetchThemeSettings(adminClient);

        // If no preferences exist, return defaults
        if (!preferences) {
            const defaults = getUserPreferenceDefaults();
            return {
                user_id: user!.id,
                ...defaults,
                theme: themeSettings.defaultMode,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
        }

        const resolvedTheme = themeSettings.allowedModes.includes(preferences.theme as ThemeMode)
            ? preferences.theme
            : themeSettings.defaultMode;

        return {
            ...preferences,
            theme: resolvedTheme,
        };
    }
);

/**
 * PATCH /api/user/preferences
 * Updates user preferences (creates if not exists)
 */
export const PATCH = withApiHandler(
    {
        auth: "required",
        schema: patchSchema,
    },
    async ({ user, body, adminClient }) => {
        const themeSettings = await fetchThemeSettings(adminClient);

        if (body.theme && !themeSettings.allowedModes.includes(body.theme as ThemeMode)) {
            return badRequest("Theme mode is not allowed by admin settings");
        }

        // Check if preferences exist
        const { data: existing } = await adminClient
            .from("user_preferences")
            .select("user_id")
            .eq("user_id", user!.id)
            .single();

        if (existing) {
            // Update existing preferences
            const { data, error } = await adminClient
                .from("user_preferences")
                .update({
                    ...body,
                    updated_at: new Date().toISOString(),
                })
                .eq("user_id", user!.id)
                .select()
                .single();

            if (error) throw error;

            return { success: true, preferences: data };
        } else {
            // Create new preferences with defaults + overrides
            const defaults = getUserPreferenceDefaults();
            const { data, error } = await adminClient
                .from("user_preferences")
                .insert({
                    user_id: user!.id,
                    ...defaults,
                    theme: themeSettings.defaultMode,
                    ...body,
                })
                .select()
                .single();

            if (error) throw error;

            return { success: true, preferences: data };
        }
    }
);
