'use client';

/**
 * ShareInsightsCard Component
 *
 * Displays sharing pattern insights in a card format.
 * Shows best sharing day/time, week-over-week comparison, and totals.
 *
 * PRD-56: Sharing Encouragement System
 *
 * @example
 * <ShareInsightsCard insights={insights} compact />
 */

import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, Calendar, Clock, Flame } from 'lucide-react';
import type { ShareInsights } from '@/lib/sharing/insights';

interface ShareInsightsCardProps {
    insights: ShareInsights;
    className?: string;
    compact?: boolean;
}

export function ShareInsightsCard({
    insights,
    className,
    compact = false,
}: ShareInsightsCardProps) {
    const { patterns, weekly, totals, suggestion } = insights;

    // Trend icon and color
    const TrendIcon = weekly.trend === 'up'
        ? TrendingUp
        : weekly.trend === 'down'
            ? TrendingDown
            : Minus;

    const trendColor = weekly.trend === 'up'
        ? 'text-[hsl(var(--success))]'
        : weekly.trend === 'down'
            ? 'text-[hsl(var(--destructive))]'
            : 'text-muted-foreground';

    return (
        <div
            className={cn(
                'bg-card border rounded-xl overflow-hidden',
                compact ? 'p-3' : 'p-4 md:p-6',
                className
            )}
        >
            {/* Header */}
            <div className={cn('mb-3', compact && 'mb-2')}>
                <h3 className={cn('font-bold flex items-center gap-2', compact ? 'text-base' : 'text-lg')}>
                    <Flame className="h-4 w-4 text-orange-500" />
                    Your Sharing Insights
                </h3>
                {!compact && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {suggestion}
                    </p>
                )}
            </div>

            {/* Stats Grid */}
            <div className={cn(
                'grid gap-3',
                compact ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'
            )}>
                {/* Best Day */}
                <StatBox
                    icon={<Calendar className="h-4 w-4" />}
                    label="Best Day"
                    value={patterns.bestDay.dayName}
                    subValue={`${patterns.bestDay.shares} shares`}
                    compact={compact}
                />

                {/* Best Time */}
                <StatBox
                    icon={<Clock className="h-4 w-4" />}
                    label="Best Time"
                    value={patterns.bestHour.formattedTime}
                    subValue={`${patterns.bestHour.shares} shares`}
                    compact={compact}
                />

                {/* This Week */}
                <StatBox
                    icon={<TrendIcon className={cn('h-4 w-4', trendColor)} />}
                    label="This Week"
                    value={weekly.thisWeek.toString()}
                    subValue={
                        weekly.lastWeek > 0
                            ? `${weekly.changePercent >= 0 ? '+' : ''}${weekly.changePercent}%`
                            : 'vs 0 last week'
                    }
                    subValueColor={trendColor}
                    compact={compact}
                />

                {/* 30-Day Total */}
                {!compact && (
                    <StatBox
                        icon={<Flame className="h-4 w-4 text-orange-500" />}
                        label="Last 30 Days"
                        value={totals.last30Days.toString()}
                        subValue={`${totals.daysShared} active days`}
                        compact={compact}
                    />
                )}
            </div>

            {/* Suggestion (compact mode) */}
            {compact && (
                <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                    {suggestion}
                </p>
            )}
        </div>
    );
}

/**
 * Individual stat box component
 */
function StatBox({
    icon,
    label,
    value,
    subValue,
    subValueColor,
    compact = false,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    subValue?: string;
    subValueColor?: string;
    compact?: boolean;
}) {
    return (
        <div className={cn(
            'bg-muted/50 rounded-lg',
            compact ? 'p-2' : 'p-3'
        )}>
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                {icon}
                <span className="text-xs">{label}</span>
            </div>
            <div className={cn('font-bold', compact ? 'text-base' : 'text-lg')}>
                {value}
            </div>
            {subValue && (
                <div className={cn('text-xs', subValueColor || 'text-muted-foreground')}>
                    {subValue}
                </div>
            )}
        </div>
    );
}

/**
 * Skeleton loader for ShareInsightsCard
 */
export function ShareInsightsCardSkeleton({ compact = false }: { compact?: boolean }) {
    return (
        <div
            className={cn(
                'bg-card border rounded-xl overflow-hidden animate-pulse',
                compact ? 'p-3' : 'p-4 md:p-6'
            )}
        >
            {/* Header skeleton */}
            <div className={cn('mb-3', compact && 'mb-2')}>
                <div className="h-5 w-40 bg-muted rounded" />
                {!compact && <div className="h-4 w-60 bg-muted rounded mt-2" />}
            </div>

            {/* Stats grid skeleton */}
            <div className={cn(
                'grid gap-3',
                compact ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'
            )}>
                {[...Array(compact ? 2 : 4)].map((_, i) => (
                    <div key={i} className={cn('bg-muted/50 rounded-lg', compact ? 'p-2' : 'p-3')}>
                        <div className="h-3 w-16 bg-muted rounded mb-2" />
                        <div className="h-6 w-12 bg-muted rounded mb-1" />
                        <div className="h-3 w-20 bg-muted rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ShareInsightsCard;
