'use client';

/**
 * ShareAnalyticsDashboard Component
 *
 * Composed dashboard showing all sharing-related analytics:
 * - Share streak badge
 * - Share insights card
 * - Share history list
 * - Best share highlight
 *
 * PRD-56: Sharing Encouragement System
 *
 * @example
 * <ShareAnalyticsDashboard onShareClick={() => setShowShareModal(true)} />
 */

import { useState, useEffect, useCallback } from 'react';
import { Flame, Share2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ShareStreakBadge } from './ShareStreakBadge';
import { ShareInsightsCard, ShareInsightsCardSkeleton } from './ShareInsightsCard';
import { ShareHistoryList, ShareHistoryListSkeleton, type ShareHistoryItem } from './ShareHistoryList';
import type { ShareStreak } from '@/lib/sharing/streaks';
import type { ShareInsights } from '@/lib/sharing/insights';
import { DEFAULT_STREAK_DATA } from '@/lib/sharing/streaks';

interface ShareAnalyticsDashboardProps {
    /** Called when user clicks to share */
    onShareClick?: () => void;
    /** Optional pre-loaded data */
    initialData?: {
        streak?: ShareStreak;
        insights?: ShareInsights;
        history?: ShareHistoryItem[];
    };
    /** Show in compact mode */
    compact?: boolean;
    className?: string;
}

export function ShareAnalyticsDashboard({
    onShareClick,
    initialData,
    compact = false,
    className,
}: ShareAnalyticsDashboardProps) {
    const [isLoading, setIsLoading] = useState(!initialData);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [streak, setStreak] = useState<ShareStreak>(initialData?.streak || DEFAULT_STREAK_DATA);
    const [insights, setInsights] = useState<ShareInsights | null>(initialData?.insights || null);
    const [history, setHistory] = useState<ShareHistoryItem[]>(initialData?.history || []);
    const [bestPerformingId, setBestPerformingId] = useState<string | undefined>();

    // Fetch all data
    const fetchData = useCallback(async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        else setIsRefreshing(true);

        try {
            // Fetch in parallel
            const [streakRes, insightsRes, historyRes] = await Promise.all([
                fetch('/api/share/streak'),
                fetch('/api/share/insights'),
                fetch('/api/share/history?limit=5'),
            ]);

            if (streakRes.ok) {
                const data = await streakRes.json();
                setStreak(data.streak || DEFAULT_STREAK_DATA);
            }

            if (insightsRes.ok) {
                const data = await insightsRes.json();
                setInsights(data.insights || null);
            }

            if (historyRes.ok) {
                const data = await historyRes.json();
                setHistory(data.history || []);
                setBestPerformingId(data.bestPerforming?.id);
            }
        } catch (error) {
            console.error('Failed to fetch share analytics:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        if (!initialData) {
            fetchData();
        }
    }, [fetchData, initialData]);

    // Loading state
    if (isLoading) {
        return <ShareAnalyticsDashboardSkeleton compact={compact} className={className} />;
    }

    const hasShares = streak.total_shares > 0;

    return (
        <div className={cn('space-y-4', className)}>
            {/* Header with streak and refresh */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Flame className="h-5 w-5 text-orange-500" />
                        <h3 className="font-semibold">Your Sharing</h3>
                    </div>
                    {streak.current_streak > 0 && (
                        <ShareStreakBadge
                            streak={streak.current_streak}
                            size="sm"
                            showLabel
                        />
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => fetchData(false)}
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
                    </Button>
                    {onShareClick && (
                        <Button size="sm" onClick={onShareClick} className="gap-1.5">
                            <Share2 className="h-3.5 w-3.5" />
                            Share
                        </Button>
                    )}
                </div>
            </div>

            {/* Empty state */}
            {!hasShares && (
                <div className="text-center py-8 bg-muted/50 rounded-lg">
                    <Share2 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <h4 className="font-medium mb-1">No shares yet</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                        Share your achievements to start building your streak!
                    </p>
                    {onShareClick && (
                        <Button onClick={onShareClick} className="gap-1.5">
                            <Share2 className="h-4 w-4" />
                            Share your first achievement
                        </Button>
                    )}
                </div>
            )}

            {/* Insights card */}
            {hasShares && insights && (
                <ShareInsightsCard
                    insights={insights}
                    compact={compact}
                />
            )}

            {/* History list */}
            {hasShares && (
                <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        Recent Shares
                    </h4>
                    <ShareHistoryList
                        items={history}
                        bestPerformingId={bestPerformingId}
                        limit={compact ? 3 : 5}
                        compact={compact}
                        onReShare={(shortCode) => {
                            // Could implement re-share logic here
                            const baseUrl = window.location.origin;
                            window.open(`${baseUrl}/s/${shortCode}`, '_blank');
                        }}
                    />
                </div>
            )}

            {/* Stats summary for users with shares */}
            {hasShares && (
                <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                    <StatItem label="Total Shares" value={streak.total_shares.toString()} />
                    <StatItem label="Longest Streak" value={`${streak.longest_streak} days`} />
                    <StatItem label="This Week" value={streak.shares_this_week.toString()} />
                </div>
            )}
        </div>
    );
}

/**
 * Simple stat item for summary row
 */
function StatItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="text-center">
            <div className="text-lg font-bold">{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
        </div>
    );
}

/**
 * Skeleton loader for ShareAnalyticsDashboard
 */
export function ShareAnalyticsDashboardSkeleton({
    compact = false,
    className,
}: {
    compact?: boolean;
    className?: string;
}) {
    return (
        <div className={cn('space-y-4 animate-pulse', className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-5 w-32 bg-muted rounded" />
                    <div className="h-6 w-16 bg-muted rounded-full" />
                </div>
                <div className="h-8 w-20 bg-muted rounded" />
            </div>

            {/* Insights card skeleton */}
            <ShareInsightsCardSkeleton compact={compact} />

            {/* History skeleton */}
            <div>
                <div className="h-4 w-24 bg-muted rounded mb-2" />
                <ShareHistoryListSkeleton count={compact ? 3 : 5} />
            </div>
        </div>
    );
}

export default ShareAnalyticsDashboard;
