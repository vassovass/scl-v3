/**
 * Trend Types (PRD-54)
 *
 * Type definitions for trend visualization and calculations.
 */

export type TrendPeriod = "daily" | "weekly" | "monthly";

export type TrendMetric = "steps" | "calories" | "distance";

export interface TrendDataPoint {
    label: string; // Display label (e.g., "Week 1", "Jan 15")
    value: number; // Metric value
    date: string; // ISO date string for the period start
    periodStart: string; // ISO date string
    periodEnd: string; // ISO date string
    daysWithData: number; // Number of days with submissions
    totalDays: number; // Total days in period
}

export interface TrendComparisonPoint extends TrendDataPoint {
    comparisonValue?: number; // Value from comparison period
    comparisonDate?: string; // Date from comparison period
    percentChange?: number; // Percent change from comparison
}

export interface TrendSummary {
    total: number;
    average: number;
    best: number;
    bestPeriod: string;
    worst: number;
    worstPeriod: string;
    trend: "up" | "down" | "stable"; // Overall direction
    percentChange: number; // Change from first to last period
}

export interface TrendRequest {
    userId: string;
    metric: TrendMetric;
    period: TrendPeriod;
    weeks?: number; // Number of weeks/months to fetch (default: 8)
    startDate?: string; // Optional start date override
    endDate?: string; // Optional end date override
    includeComparison?: boolean; // Include previous period for comparison
}

export interface TrendResponse {
    data: TrendDataPoint[];
    comparison?: TrendDataPoint[]; // Previous period data if requested
    summary: TrendSummary;
    period: TrendPeriod;
    metric: TrendMetric;
}

export interface TrendChartConfig {
    showAverage?: boolean;
    showGoal?: number;
    showComparison?: boolean;
    chartType?: "line" | "bar";
    color?: "primary" | "success" | "warning";
}
