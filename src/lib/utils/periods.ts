/**
 * Period preset utilities for leaderboard.
 * Converts preset names to date ranges.
 */

export type PeriodPreset =
    | "today"
    | "yesterday"
    | "this_week"
    | "last_week"
    | "this_month"
    | "last_month"
    | "last_7_days"
    | "last_30_days"
    | "last_90_days"
    | "this_year"
    | "all_time"
    | "custom";

export interface DateRange {
    start: string; // YYYY-MM-DD
    end: string;   // YYYY-MM-DD
}

/**
 * Get the start of the week (Monday) for a given date.
 */
function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

/**
 * Get the end of the week (Sunday) for a given date.
 */
function getWeekEnd(date: Date): Date {
    const weekStart = getWeekStart(date);
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    return d;
}

/**
 * Convert a period preset to a date range.
 */
export function presetToDateRange(preset: PeriodPreset, referenceDate: Date = new Date()): DateRange | null {
    const today = new Date(referenceDate);
    today.setHours(0, 0, 0, 0);

    const formatDate = (d: Date) => d.toISOString().slice(0, 10);

    switch (preset) {
        case "today":
            return { start: formatDate(today), end: formatDate(today) };

        case "yesterday": {
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            return { start: formatDate(yesterday), end: formatDate(yesterday) };
        }

        case "this_week": {
            const weekStart = getWeekStart(today);
            const weekEnd = new Date(today); // Up to today, not future
            return { start: formatDate(weekStart), end: formatDate(weekEnd) };
        }

        case "last_week": {
            const lastWeekEnd = new Date(getWeekStart(today));
            lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
            const lastWeekStart = getWeekStart(lastWeekEnd);
            return { start: formatDate(lastWeekStart), end: formatDate(lastWeekEnd) };
        }

        case "this_month": {
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            return { start: formatDate(monthStart), end: formatDate(today) };
        }

        case "last_month": {
            const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
            const lastMonthStart = new Date(lastMonthEnd.getFullYear(), lastMonthEnd.getMonth(), 1);
            return { start: formatDate(lastMonthStart), end: formatDate(lastMonthEnd) };
        }

        case "last_7_days": {
            const start = new Date(today);
            start.setDate(today.getDate() - 6);
            return { start: formatDate(start), end: formatDate(today) };
        }

        case "last_30_days": {
            const start = new Date(today);
            start.setDate(today.getDate() - 29);
            return { start: formatDate(start), end: formatDate(today) };
        }

        case "last_90_days": {
            const start = new Date(today);
            start.setDate(today.getDate() - 89);
            return { start: formatDate(start), end: formatDate(today) };
        }

        case "this_year": {
            const yearStart = new Date(today.getFullYear(), 0, 1);
            return { start: formatDate(yearStart), end: formatDate(today) };
        }

        case "all_time":
            return null; // Indicates no date filter

        case "custom":
            return null; // Caller must provide dates

        default:
            return null;
    }
}

/**
 * Get the previous period for comparison.
 * E.g., this_week → last_week, this_month → last_month
 */
export function getPreviousPeriod(preset: PeriodPreset): PeriodPreset | null {
    switch (preset) {
        case "today": return "yesterday";
        case "this_week": return "last_week";
        case "this_month": return "last_month";
        case "last_7_days": return "last_7_days"; // Will need offset
        case "last_30_days": return "last_30_days";
        default: return null;
    }
}

/**
 * Get human-readable label for a preset.
 */
export function getPresetLabel(preset: PeriodPreset): string {
    const labels: Record<PeriodPreset, string> = {
        today: "Today",
        yesterday: "Yesterday",
        this_week: "This Week",
        last_week: "Last Week",
        this_month: "This Month",
        last_month: "Last Month",
        last_7_days: "Last 7 Days",
        last_30_days: "Last 30 Days",
        last_90_days: "Last 90 Days",
        this_year: "This Year",
        all_time: "All Time",
        custom: "Custom",
    };
    return labels[preset] || preset;
}

/**
 * Calculate streak for a user given their submission dates.
 * @param submissionDates Array of YYYY-MM-DD strings, sorted descending (most recent first)
 * @param referenceDate The date to calculate streak from (typically today)
 * @returns Current streak count
 */
export function calculateStreak(
    submissionDates: string[],
    referenceDate: Date = new Date()
): number {
    if (submissionDates.length === 0) return 0;

    const today = referenceDate.toISOString().slice(0, 10);
    const yesterday = new Date(referenceDate);
    yesterday.setDate(referenceDate.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    // Streak must start from today or yesterday
    const sortedDates = Array.from(new Set(submissionDates)).sort().reverse();

    if (sortedDates[0] !== today && sortedDates[0] !== yesterdayStr) {
        return 0; // Streak broken
    }

    let streak = 0;
    let expectedDate = sortedDates[0] === today ? today : yesterdayStr;

    for (const date of sortedDates) {
        if (date === expectedDate) {
            streak++;
            // Move to previous day
            const d = new Date(expectedDate + "T00:00:00");
            d.setDate(d.getDate() - 1);
            expectedDate = d.toISOString().slice(0, 10);
        } else if (date < expectedDate) {
            // Gap in dates, streak ends
            break;
        }
    }

    return streak;
}

