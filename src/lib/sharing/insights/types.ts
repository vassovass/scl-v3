/**
 * PRD-56: Share Insights Types
 *
 * TypeScript interfaces for share pattern analytics and insights.
 */

/**
 * Day of week names mapped to PostgreSQL DOW (0=Sunday)
 */
export const DAY_NAMES = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
] as const;

export type DayOfWeek = typeof DAY_NAMES[number];

/**
 * Share pattern data from database
 */
export interface SharePattern {
    day_of_week: number;
    day_name: string;
    hour_of_day: number;
    total_shares: number;
    avg_shares_per_day: number;
}

/**
 * Share insights from database function
 */
export interface ShareInsightsRaw {
    best_day_of_week: number;
    best_day_name: string;
    best_day_shares: number;
    best_hour_of_day: number;
    best_hour_shares: number;
    shares_this_week: number;
    shares_last_week: number;
    week_over_week_pct: number;
    total_shares_30d: number;
    total_days_shared_30d: number;
    avg_shares_per_active_day: number;
}

/**
 * Formatted share insights for API response
 */
export interface ShareInsights {
    patterns: {
        bestDay: {
            dayOfWeek: number;
            dayName: string;
            shares: number;
        };
        bestHour: {
            hour: number;
            formattedTime: string;
            shares: number;
        };
    };
    weekly: {
        thisWeek: number;
        lastWeek: number;
        changePercent: number;
        trend: 'up' | 'down' | 'same';
    };
    totals: {
        last30Days: number;
        daysShared: number;
        avgPerActiveDay: number;
    };
    suggestion: string;
}

/**
 * API response for /api/share/insights
 */
export interface ShareInsightsResponse {
    insights: ShareInsights;
    streakSummary: {
        current: number;
        longest: number;
        tier: string;
    } | null;
}

/**
 * Format hour (0-23) to human readable time
 */
export function formatHour(hour: number): string {
    if (hour === 0) return '12am';
    if (hour === 12) return '12pm';
    if (hour < 12) return `${hour}am`;
    return `${hour - 12}pm`;
}

/**
 * Generate insight suggestion based on patterns
 */
export function generateSuggestion(insights: ShareInsightsRaw): string {
    const dayName = insights.best_day_name;
    const hour = formatHour(insights.best_hour_of_day);

    if (insights.total_shares_30d === 0) {
        return "Share your first achievement to start tracking your patterns!";
    }

    if (insights.week_over_week_pct > 0) {
        return `You're on fire! ${insights.week_over_week_pct}% more shares this week.`;
    }

    if (insights.best_day_shares > 0) {
        return `You share most on ${dayName}s around ${hour}. Perfect timing!`;
    }

    return "Keep sharing to discover your best times!";
}
