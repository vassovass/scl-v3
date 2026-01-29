'use client';

/**
 * ShareHistoryList Component
 *
 * Displays a list of past shares with performance metrics.
 * Shows views, clicks, CTR per share with ability to re-share.
 *
 * PRD-56: Sharing Encouragement System
 *
 * @example
 * <ShareHistoryList
 *   items={history}
 *   limit={5}
 *   onReShare={(shortCode) => openShareModal(shortCode)}
 * />
 */

import { formatDistanceToNow } from 'date-fns';
import { Eye, MousePointer, ExternalLink, TrendingUp, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

/**
 * Share history item structure
 */
export interface ShareHistoryItem {
    id: string;
    shortCode: string;
    cardType: string;
    metricType: string;
    value: number;
    createdAt: string;
    stats: {
        views: number;
        clicks: number;
        ctr: number;
    };
}

interface ShareHistoryListProps {
    items: ShareHistoryItem[];
    bestPerformingId?: string;
    limit?: number;
    showLoadMore?: boolean;
    onLoadMore?: () => void;
    onReShare?: (shortCode: string) => void;
    className?: string;
    compact?: boolean;
}

/**
 * Format card type for display
 */
function formatCardType(cardType: string): string {
    const typeMap: Record<string, string> = {
        daily: 'Daily',
        weekly: 'Weekly',
        personal_best: 'Personal Best',
        streak: 'Streak',
        rank: 'Rank',
        challenge: 'Challenge',
        rank_change: 'Rank Change',
        custom_period: 'Custom Period',
    };
    return typeMap[cardType] || cardType;
}

/**
 * Format metric value with commas
 */
function formatValue(value: number, metricType: string): string {
    const formatted = value.toLocaleString();
    const unitMap: Record<string, string> = {
        steps: 'steps',
        calories: 'cal',
        distance: 'km',
        slp: 'SLP',
    };
    return `${formatted} ${unitMap[metricType] || ''}`.trim();
}

export function ShareHistoryList({
    items,
    bestPerformingId,
    limit,
    showLoadMore = false,
    onLoadMore,
    onReShare,
    className,
    compact = false,
}: ShareHistoryListProps) {
    const displayItems = limit ? items.slice(0, limit) : items;

    if (displayItems.length === 0) {
        return (
            <div className={cn(
                'text-center py-8 text-muted-foreground',
                className
            )}>
                <p className="text-sm">No shares yet</p>
                <p className="text-xs mt-1">Share your first achievement to see it here!</p>
            </div>
        );
    }

    return (
        <div className={cn('space-y-2', className)}>
            {displayItems.map((item) => (
                <ShareHistoryItem
                    key={item.id}
                    item={item}
                    isBestPerforming={item.id === bestPerformingId}
                    onReShare={onReShare}
                    compact={compact}
                />
            ))}

            {showLoadMore && items.length > (limit || 0) && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-muted-foreground"
                    onClick={onLoadMore}
                >
                    Load more
                </Button>
            )}
        </div>
    );
}

/**
 * Individual share history item
 */
function ShareHistoryItem({
    item,
    isBestPerforming,
    onReShare,
    compact,
}: {
    item: ShareHistoryItem;
    isBestPerforming: boolean;
    onReShare?: (shortCode: string) => void;
    compact: boolean;
}) {
    const baseUrl = typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL || 'https://stepleague.app';
    const shareUrl = `${baseUrl}/s/${item.shortCode}`;

    return (
        <div
            className={cn(
                'flex items-center gap-3 p-3 bg-muted/50 rounded-lg',
                'hover:bg-muted transition-colors',
                isBestPerforming && 'ring-1 ring-[hsl(var(--success)/.5)]',
                compact && 'p-2'
            )}
        >
            {/* Card info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className={cn('font-medium', compact ? 'text-sm' : 'text-base')}>
                        {formatValue(item.value, item.metricType)}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                        {formatCardType(item.cardType)}
                    </Badge>
                    {isBestPerforming && (
                        <Badge variant="outline" className="text-xs gap-1 text-[hsl(var(--success))]">
                            <Award className="h-3 w-3" />
                            Top
                        </Badge>
                    )}
                </div>
                <div className={cn(
                    'flex items-center gap-3 text-muted-foreground',
                    compact ? 'text-xs mt-0.5' : 'text-sm mt-1'
                )}>
                    {/* Time ago */}
                    <span>
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </span>
                    {/* Stats */}
                    <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {item.stats.views}
                    </span>
                    <span className="flex items-center gap-1">
                        <MousePointer className="h-3 w-3" />
                        {item.stats.clicks}
                    </span>
                    {item.stats.ctr > 0 && (
                        <span className="flex items-center gap-1 text-[hsl(var(--success))]">
                            <TrendingUp className="h-3 w-3" />
                            {item.stats.ctr}%
                        </span>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => window.open(shareUrl, '_blank')}
                    title="View share"
                >
                    <ExternalLink className="h-4 w-4" />
                </Button>
                {onReShare && (
                    <Button
                        variant="outline"
                        size="sm"
                        className={compact ? 'h-7 px-2 text-xs' : ''}
                        onClick={() => onReShare(item.shortCode)}
                    >
                        Re-share
                    </Button>
                )}
            </div>
        </div>
    );
}

/**
 * Skeleton loader for ShareHistoryList
 */
export function ShareHistoryListSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-2 animate-pulse">
            {[...Array(count)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                        <div className="h-5 w-24 bg-muted rounded mb-2" />
                        <div className="h-4 w-40 bg-muted rounded" />
                    </div>
                    <div className="h-8 w-20 bg-muted rounded" />
                </div>
            ))}
        </div>
    );
}

export default ShareHistoryList;
