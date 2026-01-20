/**
 * World League Enrollment Utility
 * PRD 44: Auto-Enroll World League
 * 
 * Provides idempotent enrollment function for the World League.
 * Used by auth callback (new users) and proxy creation (new proxies).
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { WORLD_LEAGUE } from "@/lib/constants/league";

export type EnrollmentMethod = "auto" | "manual" | "proxy";

export interface EnrollmentResult {
    success: boolean;
    alreadyEnrolled: boolean;
    skipped?: boolean;
    error?: string;
}

interface EnrollmentOptions {
    /** How the enrollment was triggered */
    method?: EnrollmentMethod;
    /** Whether to check feature_auto_enroll_world_league setting (default: true) */
    checkSetting?: boolean;
}

/**
 * Enrolls a user in the World League.
 * 
 * Features:
 * - Idempotent (safe to call multiple times)
 * - Silent failure (logs but doesn't throw)
 * - Respects feature flag setting when checkSetting is true
 * 
 * @param adminClient - Supabase admin client (bypasses RLS)
 * @param userId - User ID to enroll
 * @param options - Enrollment options
 * @returns EnrollmentResult with success/status info
 */
export async function enrollInWorldLeague(
    adminClient: SupabaseClient,
    userId: string,
    options: EnrollmentOptions = {}
): Promise<EnrollmentResult> {
    const { method = "auto", checkSetting = true } = options;

    try {
        // Check feature flag if requested
        if (checkSetting) {
            const { data: setting } = await adminClient
                .from("app_settings")
                .select("value")
                .eq("key", "feature_auto_enroll_world_league")
                .single();

            // If setting exists and is explicitly false, skip enrollment
            if (setting && setting.value === "false") {
                console.log(`[WorldLeague] Skipped enrollment for ${userId} - feature disabled`);
                return { success: true, alreadyEnrolled: false, skipped: true };
            }
        }

        // Attempt to insert membership (idempotent via ON CONFLICT)
        const { error } = await adminClient
            .from("memberships")
            .insert({
                league_id: WORLD_LEAGUE.ID,
                user_id: userId,
                role: "member",
            })
            .select()
            .single();

        // Check for conflict (already enrolled)
        if (error?.code === "23505") {
            console.log(`[WorldLeague] User ${userId} already enrolled`);
            return { success: true, alreadyEnrolled: true };
        }

        if (error) {
            console.error(`[WorldLeague] Failed to enroll ${userId}:`, error.message);
            return { success: false, alreadyEnrolled: false, error: error.message };
        }

        console.log(`[WorldLeague] Enrolled ${userId} via ${method}`);
        return { success: true, alreadyEnrolled: false };
    } catch (err) {
        // Silent failure - log but don't throw
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error(`[WorldLeague] Unexpected error enrolling ${userId}:`, errorMessage);
        return { success: false, alreadyEnrolled: false, error: errorMessage };
    }
}
