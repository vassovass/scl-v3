"use client";

/**
 * TrendChart Component (PRD-54)
 *
 * Displays a line/bar chart showing progress over time.
 * Supports weekly, monthly views and comparison overlays.
 *
 * Design System:
 * - Uses semantic CSS variables for theming
 * - Mobile-first responsive design
 * - Accessible colors with proper contrast
 */

import { useMemo } from "react";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";

export interface TrendDataPoint {
    label: string; // e.g., "Week 1", "Jan 15", "Mon"
    value: number;
    date?: string; // ISO date for tooltip
    comparisonValue?: number; // For comparison overlay
}

interface TrendChartProps {
    data: TrendDataPoint[];
    type?: "line" | "bar";
    showComparison?: boolean;
    comparisonLabel?: string;
    valueLabel?: string;
    showAverage?: boolean;
    showGoal?: number;
    height?: number;
    className?: string;
    formatValue?: (value: number) => string;
    color?: "primary" | "success" | "warning";
}

// Custom tooltip component
function CustomTooltip({
    active,
    payload,
    label,
    formatValue,
    valueLabel,
    comparisonLabel,
}: {
    active?: boolean;
    payload?: Array<{ value: number; dataKey: string; color: string }>;
    label?: string;
    formatValue: (value: number) => string;
    valueLabel: string;
    comparisonLabel?: string;
}) {
    if (!active || !payload || payload.length === 0) return null;

    return (
        <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
            <p className="font-medium text-popover-foreground mb-1">{label}</p>
            {payload.map((entry, index) => (
                <p key={index} className="text-muted-foreground">
                    <span
                        className="inline-block w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: entry.color }}
                    />
                    {entry.dataKey === "value" ? valueLabel : comparisonLabel}:{" "}
                    <span className="font-medium text-popover-foreground">
                        {formatValue(entry.value)}
                    </span>
                </p>
            ))}
        </div>
    );
}

export function TrendChart({
    data,
    type = "line",
    showComparison = false,
    comparisonLabel = "Previous Period",
    valueLabel = "Steps",
    showAverage = false,
    showGoal,
    height = 200,
    className,
    formatValue = (v) => v.toLocaleString(),
    color = "primary",
}: TrendChartProps) {
    // Calculate average
    const average = useMemo(() => {
        if (!showAverage || data.length === 0) return null;
        const sum = data.reduce((acc, d) => acc + d.value, 0);
        return Math.round(sum / data.length);
    }, [data, showAverage]);

    // Color mapping to CSS variables
    const colorMap = {
        primary: "hsl(var(--primary))",
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
    };

    const mainColor = colorMap[color];
    const comparisonColor = "hsl(var(--muted-foreground))";
    const gridColor = "hsl(var(--border))";
    const textColor = "hsl(var(--muted-foreground))";

    if (data.length === 0) {
        return (
            <div
                className={cn(
                    "flex items-center justify-center text-muted-foreground",
                    className
                )}
                style={{ height }}
            >
                No data available
            </div>
        );
    }

    const ChartComponent = type === "bar" ? BarChart : LineChart;

    return (
        <div className={cn("w-full", className)}>
            <ResponsiveContainer width="100%" height={height}>
                <ChartComponent
                    data={data}
                    margin={{ top: 5, right: 5, left: -10, bottom: 5 }}
                >
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={gridColor}
                        vertical={false}
                    />
                    <XAxis
                        dataKey="label"
                        tick={{ fill: textColor, fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: gridColor }}
                    />
                    <YAxis
                        tick={{ fill: textColor, fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) =>
                            value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value.toString()
                        }
                    />
                    <Tooltip
                        content={
                            <CustomTooltip
                                formatValue={formatValue}
                                valueLabel={valueLabel}
                                comparisonLabel={comparisonLabel}
                            />
                        }
                    />

                    {/* Average line */}
                    {average !== null && (
                        <ReferenceLine
                            y={average}
                            stroke="hsl(var(--muted-foreground))"
                            strokeDasharray="5 5"
                            label={{
                                value: `Avg: ${formatValue(average)}`,
                                position: "insideTopRight",
                                fill: textColor,
                                fontSize: 11,
                            }}
                        />
                    )}

                    {/* Goal line */}
                    {showGoal && (
                        <ReferenceLine
                            y={showGoal}
                            stroke="hsl(var(--success))"
                            strokeDasharray="3 3"
                            label={{
                                value: `Goal: ${formatValue(showGoal)}`,
                                position: "insideTopRight",
                                fill: "hsl(var(--success))",
                                fontSize: 11,
                            }}
                        />
                    )}

                    {/* Comparison data (if enabled) */}
                    {showComparison && (
                        type === "bar" ? (
                            <Bar
                                dataKey="comparisonValue"
                                fill={comparisonColor}
                                opacity={0.5}
                                radius={[2, 2, 0, 0]}
                                name={comparisonLabel}
                            />
                        ) : (
                            <Line
                                type="monotone"
                                dataKey="comparisonValue"
                                stroke={comparisonColor}
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={false}
                                name={comparisonLabel}
                            />
                        )
                    )}

                    {/* Main data */}
                    {type === "bar" ? (
                        <Bar
                            dataKey="value"
                            fill={mainColor}
                            radius={[4, 4, 0, 0]}
                            name={valueLabel}
                        />
                    ) : (
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke={mainColor}
                            strokeWidth={3}
                            dot={{ fill: mainColor, strokeWidth: 0, r: 4 }}
                            activeDot={{ r: 6, fill: mainColor }}
                            name={valueLabel}
                        />
                    )}

                    {showComparison && <Legend />}
                </ChartComponent>
            </ResponsiveContainer>
        </div>
    );
}
