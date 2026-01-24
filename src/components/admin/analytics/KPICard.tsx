import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

/**
 * KPI Card Component
 * 
 * Reusable metric display card for analytics dashboards.
 * Shows value, label, and optional trend indicator.
 * 
 * Used across all analytics modules per PRD 32.
 */

export interface KPICardProps {
    /** Display label for the metric */
    label: string;
    /** Primary value to display */
    value: string | number;
    /** Optional trend percentage (positive = up, negative = down) */
    trend?: number;
    /** Optional trend comparison label (e.g., "vs last month") */
    trendLabel?: string;
    /** Optional icon to display */
    icon?: React.ReactNode;
    /** Visual variant for the card */
    variant?: "default" | "success" | "warning" | "danger";
    /** Loading state */
    loading?: boolean;
}

const variantStyles = {
    default: "border-border",
    success: "border-l-4 border-l-[hsl(var(--success))]",
    warning: "border-l-4 border-l-[hsl(var(--warning))]",
    danger: "border-l-4 border-l-destructive",
};

export function KPICard({
    label,
    value,
    trend,
    trendLabel = "vs last period",
    icon,
    variant = "default",
    loading = false,
}: KPICardProps) {
    const getTrendIcon = () => {
        if (trend === undefined || trend === 0) {
            return <Minus className="h-3 w-3 text-muted-foreground" />;
        }
        if (trend > 0) {
            return <TrendingUp className="h-3 w-3 text-[hsl(var(--success))]" />;
        }
        return <TrendingDown className="h-3 w-3 text-destructive" />;
    };

    const getTrendColor = () => {
        if (trend === undefined || trend === 0) return "text-muted-foreground";
        if (trend > 0) return "text-[hsl(var(--success))]";
        return "text-destructive";
    };

    if (loading) {
        return (
            <div className={cn(
                "bg-card rounded-lg border p-4 space-y-2",
                variantStyles[variant]
            )}>
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                <div className="h-3 w-24 bg-muted animate-pulse rounded" />
            </div>
        );
    }

    return (
        <div className={cn(
            "bg-card rounded-lg border p-4 space-y-1",
            variantStyles[variant]
        )}>
            <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{label}</span>
                {icon && <span className="text-muted-foreground">{icon}</span>}
            </div>

            <div className="text-2xl font-bold">{value}</div>

            {trend !== undefined && (
                <div className="flex items-center gap-1 text-xs">
                    {getTrendIcon()}
                    <span className={getTrendColor()}>
                        {trend > 0 ? "+" : ""}{trend.toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground">{trendLabel}</span>
                </div>
            )}
        </div>
    );
}
