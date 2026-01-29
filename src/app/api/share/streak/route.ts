/**
 * Share Streak API
 *
 * GET /api/share/streak
 * Returns the current user's share streak data.
 *
 * PRD-56: Sharing Encouragement System
 */

import { withApiHandler } from "@/lib/api/handler";
import {
    getStreakTier,
    getNextMilestone,
    getDaysToNextMilestone,
    DEFAULT_STREAK_DATA,
} from "@/lib/sharing/streaks";
import type { ShareStreak, ShareStreakResponse } from "@/lib/sharing/streaks";

/**
 * GET /api/share/streak
 * Returns streak data for the authenticated user
 */
export const GET = withApiHandler(
    { auth: 'required' },
    async ({ user, adminClient }) => {
        // Call the database function to get streak data
        const { data, error } = await adminClient.rpc('get_share_streak', {
            p_user_id: user!.id,
        });

        if (error) {
            console.error('Error fetching share streak:', error);
            // Return default data on error rather than failing
            const tier = getStreakTier(0);
            return {
                streak: DEFAULT_STREAK_DATA,
                tier,
                nextMilestone: getNextMilestone(0),
                daysToNextMilestone: getDaysToNextMilestone(0),
            } satisfies ShareStreakResponse;
        }

        // Database function returns a single row as array
        const streakData: ShareStreak = data?.[0] || DEFAULT_STREAK_DATA;

        // Get tier and milestone info
        const tier = getStreakTier(streakData.current_streak);
        const nextMilestone = getNextMilestone(streakData.current_streak);
        const daysToNextMilestone = getDaysToNextMilestone(streakData.current_streak);

        return {
            streak: streakData,
            tier,
            nextMilestone,
            daysToNextMilestone,
        } satisfies ShareStreakResponse;
    }
);
