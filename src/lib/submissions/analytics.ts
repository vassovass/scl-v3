/**
 * Submission Analytics Utility
 * 
 * Pure functions for analyzing submission gaps and generating notifications.
 * Framework-agnostic, fully testable.
 */

export interface Submission {
    id: string;
    for_date: string; // YYYY-MM-DD
    steps: number;
    verified?: boolean;
}

export interface SubmissionGap {
    date: string;
    dayOfWeek: string;
    daysAgo: number;
}

export interface GapAnalysis {
    gaps: SubmissionGap[];
    missingDates: string[];
    gapCount: number;
    submittedCount: number;
    checkedDays: number;
    coveragePercent: number;
    streakStatus: "healthy" | "at_risk" | "broken";
    lastSubmissionDate: string | null;
}

export interface SubmissionNotification {
    type: "missing_yesterday" | "missing_multiple" | "streak_at_risk" | "great_streak" | "all_caught_up";
    severity: "info" | "warning" | "urgent" | "success";
    title: string;
    message: string;
    missingDates?: string[];
    actionHref: string;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Get an array of date strings for the last N days (excluding today)
 */
export function getDateRange(days: number): string[] {
    const dates: string[] = [];
    const today = new Date();

    for (let i = 1; i <= days; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        dates.push(date.toISOString().slice(0, 10));
    }

    return dates;
}

/**
 * Analyze submission gaps for a given date range
 */
export function analyzeSubmissionGaps(
    submissions: Submission[],
    days: number = 7
): GapAnalysis {
    const dateRange = getDateRange(days);
    const submittedDates = new Set(submissions.map(s => s.for_date));

    const gaps: SubmissionGap[] = [];
    const missingDates: string[] = [];

    dateRange.forEach((date, index) => {
        if (!submittedDates.has(date)) {
            const dateObj = new Date(date);
            gaps.push({
                date,
                dayOfWeek: DAY_NAMES[dateObj.getDay()],
                daysAgo: index + 1, // 1 = yesterday
            });
            missingDates.push(date);
        }
    });

    const gapCount = gaps.length;
    const submittedCount = days - gapCount;
    const coveragePercent = Math.round((submittedCount / days) * 100);

    // Determine streak status
    let streakStatus: "healthy" | "at_risk" | "broken";
    if (gapCount === 0) {
        streakStatus = "healthy";
    } else if (gapCount === 1 && gaps[0].daysAgo === 1) {
        streakStatus = "at_risk"; // Only yesterday missing
    } else {
        streakStatus = "broken";
    }

    // Find last submission date
    const sortedSubmissions = [...submissions].sort((a, b) =>
        b.for_date.localeCompare(a.for_date)
    );
    const lastSubmissionDate = sortedSubmissions[0]?.for_date || null;

    return {
        gaps,
        missingDates,
        gapCount,
        submittedCount,
        checkedDays: days,
        coveragePercent,
        streakStatus,
        lastSubmissionDate,
    };
}

/**
 * Format a date for user-friendly display (e.g., "Jan 8")
 */
function formatDateShort(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Generate notification based on gap analysis
 * Uses research-backed positive, encouraging wording
 */
export function getNotification(analysis: GapAnalysis, leagueName?: string): SubmissionNotification {
    const { gapCount, missingDates, streakStatus, coveragePercent } = analysis;
    const actionHref = "/submit-steps";

    // All caught up!
    if (gapCount === 0) {
        return {
            type: "all_caught_up",
            severity: "success",
            title: "You're all caught up! 🎉",
            message: "Great job keeping your streak alive.",
            actionHref,
        };
    }

    // Only yesterday missing
    if (gapCount === 1 && missingDates[0]) {
        const leagueContext = leagueName ? ` in ${leagueName}` : "";
        return {
            type: "missing_yesterday",
            severity: "warning",
            title: "Don't break your streak!",
            message: `Log yesterday's steps${leagueContext} – quick tap to catch up!`,
            missingDates,
            actionHref,
        };
    }

    // Multiple days missing
    const formattedDates = missingDates.slice(0, 3).map(formatDateShort).join(", ");
    const moreText = missingDates.length > 3 ? ` and ${missingDates.length - 3} more` : "";
    const leagueContext = leagueName ? ` for ${leagueName}` : "";

    return {
        type: "missing_multiple",
        severity: streakStatus === "broken" ? "urgent" : "warning",
        title: `${gapCount} days need logging`,
        message: `${formattedDates}${moreText}${leagueContext}. Quick tap to catch up!`,
        missingDates,
        actionHref,
    };
}
