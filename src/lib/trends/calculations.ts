/**
 * Trend Calculations (PRD-54)
 *
 * Utilities for calculating trends from submission data.
 */

import {
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    subWeeks,
    subMonths,
    format,
    eachDayOfInterval,
    eachWeekOfInterval,
    eachMonthOfInterval,
    differenceInDays,
    isWithinInterval,
    parseISO,
} from "date-fns";
import type {
    TrendPeriod,
    TrendDataPoint,
    TrendSummary,
    TrendComparisonPoint,
} from "./types";

export interface SubmissionData {
    for_date: string; // YYYY-MM-DD
    steps: number;
    calories?: number;
    distance?: number;
}

/**
 * Generate period ranges for trend calculation
 */
export function generatePeriodRanges(
    period: TrendPeriod,
    count: number,
    endDate: Date = new Date()
): Array<{ start: Date; end: Date; label: string }> {
    const ranges: Array<{ start: Date; end: Date; label: string }> = [];

    if (period === "daily") {
        // Last N days
        for (let i = count - 1; i >= 0; i--) {
            const date = new Date(endDate);
            date.setDate(date.getDate() - i);
            ranges.push({
                start: date,
                end: date,
                label: format(date, "EEE"), // Mon, Tue, etc.
            });
        }
    } else if (period === "weekly") {
        // Last N weeks
        for (let i = count - 1; i >= 0; i--) {
            const weekStart = startOfWeek(subWeeks(endDate, i), { weekStartsOn: 1 });
            const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
            ranges.push({
                start: weekStart,
                end: weekEnd,
                label: i === 0 ? "This Week" : i === 1 ? "Last Week" : `Week -${i}`,
            });
        }
    } else if (period === "monthly") {
        // Last N months
        for (let i = count - 1; i >= 0; i--) {
            const monthStart = startOfMonth(subMonths(endDate, i));
            const monthEnd = endOfMonth(monthStart);
            ranges.push({
                start: monthStart,
                end: monthEnd,
                label: format(monthStart, "MMM"),
            });
        }
    }

    return ranges;
}

/**
 * Aggregate submissions by period
 */
export function aggregateByPeriod(
    submissions: SubmissionData[],
    ranges: Array<{ start: Date; end: Date; label: string }>,
    metric: "steps" | "calories" | "distance" = "steps"
): TrendDataPoint[] {
    const points: TrendDataPoint[] = [];

    for (const range of ranges) {
        // Use string comparison for date-only values (more reliable across time zones)
        const rangeStart = format(range.start, "yyyy-MM-dd");
        const rangeEnd = format(range.end, "yyyy-MM-dd");

        // Find submissions within this period
        const periodSubmissions = submissions.filter((sub) => {
            return sub.for_date >= rangeStart && sub.for_date <= rangeEnd;
        });

        // Dedupe by date (take highest value per day)
        const byDate = new Map<string, number>();
        for (const sub of periodSubmissions) {
            const current = byDate.get(sub.for_date) || 0;
            const value = metric === "steps" ? sub.steps : metric === "calories" ? (sub.calories || 0) : (sub.distance || 0);
            byDate.set(sub.for_date, Math.max(current, value));
        }

        // Sum values
        const total = Array.from(byDate.values()).reduce((a, b) => a + b, 0);
        const totalDays = differenceInDays(range.end, range.start) + 1;

        points.push({
            label: range.label,
            value: total,
            date: format(range.start, "yyyy-MM-dd"),
            periodStart: format(range.start, "yyyy-MM-dd"),
            periodEnd: format(range.end, "yyyy-MM-dd"),
            daysWithData: byDate.size,
            totalDays,
        });
    }

    return points;
}

/**
 * Calculate trend summary statistics
 */
export function calculateTrendSummary(data: TrendDataPoint[]): TrendSummary {
    if (data.length === 0) {
        return {
            total: 0,
            average: 0,
            best: 0,
            bestPeriod: "",
            worst: 0,
            worstPeriod: "",
            trend: "stable",
            percentChange: 0,
        };
    }

    const values = data.map((d) => d.value);
    const total = values.reduce((a, b) => a + b, 0);
    const average = Math.round(total / values.length);

    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const bestPeriod = data.find((d) => d.value === maxValue)?.label || "";
    const worstPeriod = data.find((d) => d.value === minValue)?.label || "";

    // Calculate percent change from first to last
    const first = data[0].value;
    const last = data[data.length - 1].value;
    const percentChange = first > 0 ? Math.round(((last - first) / first) * 100) : 0;

    // Determine trend direction
    let trend: "up" | "down" | "stable" = "stable";
    if (percentChange > 5) {
        trend = "up";
    } else if (percentChange < -5) {
        trend = "down";
    }

    return {
        total,
        average,
        best: maxValue,
        bestPeriod,
        worst: minValue,
        worstPeriod,
        trend,
        percentChange,
    };
}

/**
 * Generate comparison data by shifting periods
 */
export function generateComparisonData(
    currentData: TrendDataPoint[],
    comparisonData: TrendDataPoint[]
): TrendComparisonPoint[] {
    return currentData.map((point, index) => {
        const comparison = comparisonData[index];
        const percentChange =
            comparison && comparison.value > 0
                ? Math.round(((point.value - comparison.value) / comparison.value) * 100)
                : 0;

        return {
            ...point,
            comparisonValue: comparison?.value,
            comparisonDate: comparison?.date,
            percentChange,
        };
    });
}

/**
 * Format trend data for chart display
 */
export function formatForChart(
    data: TrendDataPoint[],
    options: {
        showComparison?: boolean;
        comparisonData?: TrendDataPoint[];
    } = {}
): Array<{
    label: string;
    value: number;
    date?: string;
    comparisonValue?: number;
}> {
    return data.map((point, index) => ({
        label: point.label,
        value: point.value,
        date: point.date,
        comparisonValue: options.showComparison
            ? options.comparisonData?.[index]?.value
            : undefined,
    }));
}

/**
 * Get trend emoji based on direction
 */
export function getTrendEmoji(trend: "up" | "down" | "stable"): string {
    switch (trend) {
        case "up":
            return "📈";
        case "down":
            return "📉";
        case "stable":
            return "➡️";
    }
}

/**
 * Format percent change with sign
 */
export function formatPercentChange(change: number): string {
    if (change === 0) return "0%";
    const sign = change > 0 ? "+" : "";
    return `${sign}${change}%`;
}
