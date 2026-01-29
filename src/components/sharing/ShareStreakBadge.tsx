'use client';

/**
 * ShareStreakBadge Component
 *
 * Displays a user's share streak with visual tier indicators.
 * Shows a fire/diamond emoji badge with streak count and optional tier label.
 *
 * PRD-56: Sharing Encouragement System
 *
 * @example
 * // Simple badge
 * <ShareStreakBadge streak={7} />
 *
 * @example
 * // With tier label and larger size
 * <ShareStreakBadge streak={30} size="lg" showLabel showTier />
 */

import { cn } from '@/lib/utils';
import { getStreakTier } from '@/lib/sharing/streaks';
import type { ShareStreakBadgeProps } from '@/lib/sharing/streaks';

/**
 * Size configurations for the badge
 */
const sizeClasses = {
    sm: {
        container: 'gap-1 px-1.5 py-0.5 text-xs',
        emoji: 'text-sm',
        count: 'text-xs font-medium',
        label: 'text-[10px]',
    },
    md: {
        container: 'gap-1.5 px-2 py-1 text-sm',
        emoji: 'text-base',
        count: 'text-sm font-semibold',
        label: 'text-xs',
    },
    lg: {
        container: 'gap-2 px-3 py-1.5 text-base',
        emoji: 'text-xl',
        count: 'text-base font-bold',
        label: 'text-sm',
    },
};

export function ShareStreakBadge({
    streak,
    size = 'md',
    showLabel = false,
    showTier = false,
    className,
}: ShareStreakBadgeProps) {
    // Don't render anything for zero streak
    if (streak <= 0) {
        return null;
    }

    const tier = getStreakTier(streak);
    const sizeConfig = sizeClasses[size];

    // Get tier-specific colors
    const tierColors = {
        none: 'bg-muted text-muted-foreground',
        bronze: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
        silver: 'bg-slate-400/10 text-slate-400 border-slate-400/20',
        gold: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
        diamond: 'bg-cyan-400/10 text-cyan-400 border-cyan-400/20',
    };

    return (
        <div
            className={cn(
                'inline-flex items-center rounded-full border',
                sizeConfig.container,
                tierColors[tier.tier],
                // Add subtle pulse animation for active streaks
                streak >= 7 && 'animate-pulse-subtle',
                className
            )}
            title={`${streak} day share streak${tier.tier !== 'none' ? ` - ${tier.label}` : ''}`}
        >
            {/* Emoji indicator */}
            <span className={sizeConfig.emoji} role="img" aria-label="streak">
                {tier.emoji || '🔥'}
            </span>

            {/* Streak count */}
            <span className={sizeConfig.count}>
                {streak}
            </span>

            {/* Optional "day streak" label */}
            {showLabel && (
                <span className={cn(sizeConfig.label, 'text-current/70')}>
                    day{streak !== 1 ? 's' : ''}
                </span>
            )}

            {/* Optional tier label */}
            {showTier && tier.tier !== 'none' && (
                <span className={cn(
                    sizeConfig.label,
                    'ml-1 rounded-full px-1.5 py-0.5',
                    'bg-current/10'
                )}>
                    {tier.label.split(' ')[0]}
                </span>
            )}
        </div>
    );
}

/**
 * Compact streak indicator for inline use
 */
export function ShareStreakIndicator({
    streak,
    className,
}: {
    streak: number;
    className?: string;
}) {
    if (streak <= 0) return null;

    const tier = getStreakTier(streak);

    return (
        <span
            className={cn('inline-flex items-center gap-0.5', tier.colorClass, className)}
            title={`${streak} day share streak`}
        >
            <span className="text-sm">{tier.emoji || '🔥'}</span>
            <span className="text-xs font-medium">{streak}</span>
        </span>
    );
}

export default ShareStreakBadge;
