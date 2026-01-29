/**
 * Trends Module (PRD-54)
 *
 * Central exports for trend visualization and calculations.
 */

// Types
export type {
    TrendPeriod,
    TrendMetric,
    TrendDataPoint,
    TrendComparisonPoint,
    TrendSummary,
    TrendRequest,
    TrendResponse,
    TrendChartConfig,
} from "./types";

// Calculations
export {
    generatePeriodRanges,
    aggregateByPeriod,
    calculateTrendSummary,
    generateComparisonData,
    formatForChart,
    getTrendEmoji,
    formatPercentChange,
} from "./calculations";
export type { SubmissionData } from "./calculations";
