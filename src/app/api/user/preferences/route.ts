/**
 * User Preferences API
 * GET: Fetch user preferences (with defaults if not exists)
 * PATCH: Update user preferences
 *
 * Follows default/override pattern - only stores non-default values
 */

import { withApiHandler } from "@/lib/api/handler";
import { z } from "zod";
import { getUserPreferenceDefaults } from "@/lib/settings/userPreferences";

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

        // If no preferences exist, return defaults
        if (!preferences) {
            const defaults = getUserPreferenceDefaults();
            return {
                user_id: user!.id,
                ...defaults,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
        }

        return preferences;
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
                    ...body,
                })
                .select()
                .single();

            if (error) throw error;

            return { success: true, preferences: data };
        }
    }
);
