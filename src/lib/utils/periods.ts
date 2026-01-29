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
    | "last_3_days"
    | "last_2_weeks"
    | "this_year"
    | "all_time"
    | "custom";

export type DayType = "all" | "weekday" | "weekend";

export interface DateRange {
    start: string; // YYYY-MM-DD
    end: string;   // YYYY-MM-DD
}

/**
 * Get the start of the week (Monday) for a given date.
 */
export function getWeekStart(date: Date): Date {
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
export function getWeekEnd(date: Date): Date {
    const weekStart = getWeekStart(date);
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    return d;
}

/**
 * Check if a date string is a weekend (Saturday or Sunday).
 */
export function isWeekend(dateStr: string): boolean {
    const d = new Date(dateStr + "T00:00:00");
    const day = d.getDay();
    return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

/**
 * Check if a date string is a weekday (Monday through Friday).
 */
export function isWeekday(dateStr: string): boolean {
    return !isWeekend(dateStr);
}

/**
 * Filter an array of date strings by day type.
 */
export function filterByDayType(dates: string[], dayType: DayType): string[] {
    if (dayType === "all") return dates;
    if (dayType === "weekend") return dates.filter(isWeekend);
    if (dayType === "weekday") return dates.filter(isWeekday);
    return dates;
}

/**
 * Get the day of week name for a date string.
 */
export function getDayOfWeekName(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[d.getDay()];
}

/**
 * Get the short day of week name for a date string.
 */
export function getDayOfWeekShort(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days[d.getDay()];
}

/**
 * Format a date as YYYY-MM-DD string using local timezone.
 * This avoids issues with toISOString() converting to UTC.
 */
export function formatDateYMD(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

/**
 * Convert a period preset to a date range.
 */
export function presetToDateRange(preset: PeriodPreset, referenceDate: Date = new Date()): DateRange | null {
    const today = new Date(referenceDate);
    today.setHours(0, 0, 0, 0);

    const formatDate = (d: Date) => formatDateYMD(d);

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

        case "last_3_days": {
            const start = new Date(today);
            start.setDate(today.getDate() - 2);
            return { start: formatDate(start), end: formatDate(today) };
        }

        case "last_2_weeks": {
            const start = new Date(today);
            start.setDate(today.getDate() - 13);
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
        last_3_days: "Last 3 Days",
        last_2_weeks: "Last 2 Weeks",
        this_year: "This Year",
        all_time: "All Time",
        custom: "Custom",
    };
    return labels[preset] || preset;
}

/**
 * Create a DateRange from custom start and end date strings.
 * Validates that start <= end.
 */
export function customRangeToDateRange(start: string, end: string): DateRange | null {
    // Validate date formats
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(start) || !dateRegex.test(end)) {
        return null;
    }

    // Validate start <= end
    if (start > end) {
        return null;
    }

    return { start, end };
}

/**
 * Format a custom date range as a human-readable label.
 * E.g., "Jan 15 - Jan 22" or "Jan 15 - Feb 2"
 */
export function formatCustomPeriodLabel(start: Date | string, end: Date | string): string {
    const startDate = typeof start === "string" ? new Date(start + "T00:00:00") : start;
    const endDate = typeof end === "string" ? new Date(end + "T00:00:00") : end;

    const startMonth = startDate.toLocaleDateString("en-US", { month: "short" });
    const startDay = startDate.getDate();
    const endMonth = endDate.toLocaleDateString("en-US", { month: "short" });
    const endDay = endDate.getDate();
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();

    // Same day
    if (startDate.getTime() === endDate.getTime()) {
        return `${startMonth} ${startDay}`;
    }

    // Same month and year
    if (startMonth === endMonth && startYear === endYear) {
        return `${startMonth} ${startDay}-${endDay}`;
    }

    // Different months, same year
    if (startYear === endYear) {
        return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
    }

    // Different years
    return `${startMonth} ${startDay}, ${startYear} - ${endMonth} ${endDay}, ${endYear}`;
}

/**
 * Calculate the number of days between two dates (inclusive).
 */
export function calculateDaysBetween(start: string, end: string): number {
    const startDate = new Date(start + "T00:00:00");
    const endDate = new Date(end + "T00:00:00");
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Generate an array of all dates between start and end (inclusive).
 */
export function getDatesBetween(start: string, end: string): string[] {
    const dates: string[] = [];
    const current = new Date(start + "T00:00:00");
    const endDate = new Date(end + "T00:00:00");

    while (current <= endDate) {
        dates.push(formatDateYMD(current));
        current.setDate(current.getDate() + 1);
    }

    return dates;
}

/**
 * Get relative date shortcuts for share modal.
 */
export const RELATIVE_DATE_SHORTCUTS: { label: string; preset: PeriodPreset }[] = [
    { label: "Today", preset: "today" },
    { label: "Yesterday", preset: "yesterday" },
    { label: "Last 3 Days", preset: "last_3_days" },
    { label: "This Week", preset: "this_week" },
    { label: "Last Week", preset: "last_week" },
    { label: "Last 2 Weeks", preset: "last_2_weeks" },
    { label: "This Month", preset: "this_month" },
    { label: "Last Month", preset: "last_month" },
];

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

    const refCopy = new Date(referenceDate);
    refCopy.setHours(0, 0, 0, 0);
    const today = formatDateYMD(refCopy);
    const yesterday = new Date(refCopy);
    yesterday.setDate(refCopy.getDate() - 1);
    const yesterdayStr = formatDateYMD(yesterday);

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
            expectedDate = formatDateYMD(d);
        } else if (date < expectedDate) {
            // Gap in dates, streak ends
            break;
        }
    }

    return streak;
}

