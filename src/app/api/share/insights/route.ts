/**
 * Share Insights API
 *
 * GET /api/share/insights
 * Returns sharing pattern insights and analytics for the authenticated user.
 *
 * PRD-56: Sharing Encouragement System
 */

import { withApiHandler } from "@/lib/api/handler";
import { getStreakTier, DEFAULT_STREAK_DATA } from "@/lib/sharing/streaks";
import {
    formatHour,
    generateSuggestion,
} from "@/lib/sharing/insights";
import type { ShareInsightsRaw, ShareInsights, ShareInsightsResponse } from "@/lib/sharing/insights";
import type { ShareStreak } from "@/lib/sharing/streaks";

/**
 * GET /api/share/insights
 * Returns comprehensive sharing insights for the authenticated user
 */
export const GET = withApiHandler(
    { auth: 'required' },
    async ({ user, adminClient }) => {
        // Fetch share insights from database function
        const { data: insightsData, error: insightsError } = await adminClient.rpc(
            'get_share_insights',
            { p_user_id: user!.id }
        );

        if (insightsError) {
            console.error('Error fetching share insights:', insightsError);
        }

        // Fetch streak data for summary
        const { data: streakData, error: streakError } = await adminClient.rpc(
            'get_share_streak',
            { p_user_id: user!.id }
        );

        if (streakError) {
            console.error('Error fetching share streak:', streakError);
        }

        // Process insights data
        const rawInsights: ShareInsightsRaw = insightsData?.[0] || {
            best_day_of_week: 0,
            best_day_name: 'N/A',
            best_day_shares: 0,
            best_hour_of_day: 12,
            best_hour_shares: 0,
            shares_this_week: 0,
            shares_last_week: 0,
            week_over_week_pct: 0,
            total_shares_30d: 0,
            total_days_shared_30d: 0,
            avg_shares_per_active_day: 0,
        };

        // Determine trend
        let trend: 'up' | 'down' | 'same' = 'same';
        if (rawInsights.week_over_week_pct > 0) {
            trend = 'up';
        } else if (rawInsights.week_over_week_pct < 0) {
            trend = 'down';
        }

        // Format insights for response
        const insights: ShareInsights = {
            patterns: {
                bestDay: {
                    dayOfWeek: rawInsights.best_day_of_week,
                    dayName: rawInsights.best_day_name,
                    shares: rawInsights.best_day_shares,
                },
                bestHour: {
                    hour: rawInsights.best_hour_of_day,
                    formattedTime: formatHour(rawInsights.best_hour_of_day),
                    shares: rawInsights.best_hour_shares,
                },
            },
            weekly: {
                thisWeek: rawInsights.shares_this_week,
                lastWeek: rawInsights.shares_last_week,
                changePercent: rawInsights.week_over_week_pct,
                trend,
            },
            totals: {
                last30Days: rawInsights.total_shares_30d,
                daysShared: rawInsights.total_days_shared_30d,
                avgPerActiveDay: rawInsights.avg_shares_per_active_day,
            },
            suggestion: generateSuggestion(rawInsights),
        };

        // Process streak data for summary
        const streak: ShareStreak = streakData?.[0] || DEFAULT_STREAK_DATA;
        const tier = getStreakTier(streak.current_streak);

        const streakSummary = streak.total_shares > 0 ? {
            current: streak.current_streak,
            longest: streak.longest_streak,
            tier: tier.label,
        } : null;

        return {
            insights,
            streakSummary,
        } satisfies ShareInsightsResponse;
    }
);
