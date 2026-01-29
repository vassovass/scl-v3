"use client";

/**
 * TrendCard Component (PRD-54)
 *
 * Shareable card showing trend visualization.
 * Designed to match other share card styles.
 *
 * Design System:
 * - Matches existing ShareCard patterns
 * - Uses semantic CSS variables
 * - Mobile-first responsive
 */

import { TrendChart, type TrendDataPoint } from "./TrendChart";
import type { TrendSummary } from "@/lib/trends";
import { getTrendEmoji, formatPercentChange } from "@/lib/trends";
import { cn } from "@/lib/utils";

interface TrendCardProps {
    data: TrendDataPoint[];
    summary: TrendSummary;
    title?: string;
    subtitle?: string;
    metricLabel?: string;
    userName?: string;
    showComparison?: boolean;
    comparisonData?: TrendDataPoint[];
    chartType?: "line" | "bar";
    className?: string;
    compact?: boolean;
}

export function TrendCard({
    data,
    summary,
    title = "My Progress Trend",
    subtitle,
    metricLabel = "Steps",
    userName,
    showComparison = false,
    comparisonData,
    chartType = "line",
    className,
    compact = false,
}: TrendCardProps) {
    const trendEmoji = getTrendEmoji(summary.trend);
    const trendColor =
        summary.trend === "up"
            ? "text-[hsl(var(--success))]"
            : summary.trend === "down"
                ? "text-[hsl(var(--destructive))]"
                : "text-muted-foreground";

    return (
        <div
            className={cn(
                "bg-card border rounded-xl overflow-hidden",
                compact ? "p-3" : "p-4 md:p-6",
                className
            )}
        >
            {/* Header */}
            <div className={cn("mb-3", compact && "mb-2")}>
                <h3 className={cn("font-bold", compact ? "text-base" : "text-lg")}>
                    {title}
                </h3>
                {subtitle && (
                    <p className="text-sm text-muted-foreground">{subtitle}</p>
                )}
                {userName && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {userName}
                    </p>
                )}
            </div>

            {/* Chart */}
            <div className={cn(compact ? "h-[120px]" : "h-[160px] md:h-[200px]")}>
                <TrendChart
                    data={data.map((d) => ({
                        label: d.label,
                        value: d.value,
                        comparisonValue: showComparison
                            ? comparisonData?.find((c) => c.label === d.label)?.value
                            : undefined,
                    }))}
                    type={chartType}
                    showComparison={showComparison}
                    valueLabel={metricLabel}
                    showAverage
                    height={compact ? 120 : undefined}
                />
            </div>

            {/* Summary Stats */}
            <div
                className={cn(
                    "grid grid-cols-3 gap-2 mt-3 pt-3 border-t",
                    compact && "grid-cols-2 gap-1 mt-2 pt-2"
                )}
            >
                {/* Total */}
                <div className="text-center">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className={cn("font-bold", compact ? "text-sm" : "text-base")}>
                        {summary.total.toLocaleString()}
                    </p>
                </div>

                {/* Average */}
                <div className="text-center">
                    <p className="text-xs text-muted-foreground">Avg/Period</p>
                    <p className={cn("font-bold", compact ? "text-sm" : "text-base")}>
                        {summary.average.toLocaleString()}
                    </p>
                </div>

                {/* Trend */}
                {!compact && (
                    <div className="text-center">
                        <p className="text-xs text-muted-foreground">Trend</p>
                        <p className={cn("font-bold", trendColor)}>
                            {trendEmoji} {formatPercentChange(summary.percentChange)}
                        </p>
                    </div>
                )}
            </div>

            {/* Best Period */}
            {!compact && summary.bestPeriod && (
                <div className="mt-2 text-center text-xs text-muted-foreground">
                    Best: <span className="font-medium">{summary.bestPeriod}</span> with{" "}
                    <span className="font-medium">{summary.best.toLocaleString()}</span>{" "}
                    {metricLabel.toLowerCase()}
                </div>
            )}

            {/* Compact trend indicator */}
            {compact && (
                <div className="mt-2 text-center">
                    <span className={cn("text-sm font-medium", trendColor)}>
                        {trendEmoji} {formatPercentChange(summary.percentChange)}
                    </span>
                </div>
            )}
        </div>
    );
}
