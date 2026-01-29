'use client';

/**
 * ShareReminder Component
 *
 * Non-intrusive inline card reminding users to share.
 * Shows when streak is at risk or after extended inactivity.
 *
 * PRD-56: Sharing Encouragement System
 *
 * @example
 * <ShareReminder
 *   type="streak_at_risk"
 *   streak={7}
 *   hoursUntilReset={4}
 *   onShare={() => setShowShareModal(true)}
 *   onDismiss={() => setDismissed(true)}
 * />
 */

import { useState } from 'react';
import { X, Share2, Flame, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ShareStreakBadge } from './ShareStreakBadge';

export type ShareReminderType = 'streak_at_risk' | 'encourage_share' | 'post_submission';

interface ShareReminderProps {
    type: ShareReminderType;
    streak?: number;
    hoursUntilReset?: number;
    daysSinceLastShare?: number;
    onShare: () => void;
    onDismiss: () => void;
    onSnooze?: (hours: number) => void;
    className?: string;
}

/**
 * Get reminder content based on type
 */
function getReminderContent(props: ShareReminderProps) {
    const { type, streak, hoursUntilReset, daysSinceLastShare } = props;

    switch (type) {
        case 'streak_at_risk':
            return {
                icon: <Flame className="h-5 w-5 text-orange-500" />,
                title: 'Streak at risk!',
                description: streak && streak > 0
                    ? `Share today to keep your ${streak}-day streak! Only ${Math.round(hoursUntilReset || 0)} hours left.`
                    : 'Start a sharing streak today!',
                variant: 'warning' as const,
                primaryAction: 'Share Now',
                showBadge: true,
            };

        case 'encourage_share':
            return {
                icon: <Share2 className="h-5 w-5 text-primary" />,
                title: 'Share your progress',
                description: daysSinceLastShare && daysSinceLastShare > 1
                    ? `You haven't shared in ${daysSinceLastShare} days. Your friends would love to see your achievements!`
                    : 'Share your achievements with friends!',
                variant: 'default' as const,
                primaryAction: 'Share',
                showBadge: false,
            };

        case 'post_submission':
            return {
                icon: <Share2 className="h-5 w-5 text-[hsl(var(--success))]" />,
                title: 'Share your steps?',
                description: "You just submitted your steps! Share this achievement with friends.",
                variant: 'success' as const,
                primaryAction: 'Share',
                showBadge: false,
            };

        default:
            return {
                icon: <Share2 className="h-5 w-5" />,
                title: 'Share your progress',
                description: 'Share your achievements with friends!',
                variant: 'default' as const,
                primaryAction: 'Share',
                showBadge: false,
            };
    }
}

export function ShareReminder({
    type,
    streak = 0,
    hoursUntilReset,
    daysSinceLastShare,
    onShare,
    onDismiss,
    onSnooze,
    className,
}: ShareReminderProps) {
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);

    const content = getReminderContent({
        type,
        streak,
        hoursUntilReset,
        daysSinceLastShare,
        onShare,
        onDismiss,
    });

    const handleDismiss = () => {
        setIsAnimatingOut(true);
        setTimeout(onDismiss, 200);
    };

    const handleSnooze = () => {
        setIsAnimatingOut(true);
        setTimeout(() => {
            onSnooze?.(4); // Snooze for 4 hours
        }, 200);
    };

    // Variant-specific background colors
    const variantBg = {
        default: 'bg-card border',
        warning: 'bg-[hsl(var(--warning)/.1)] border-[hsl(var(--warning)/.3)]',
        success: 'bg-[hsl(var(--success)/.1)] border-[hsl(var(--success)/.3)]',
    };

    return (
        <div
            className={cn(
                'relative rounded-lg border p-4',
                'transition-all duration-200',
                isAnimatingOut && 'opacity-0 transform scale-95',
                variantBg[content.variant],
                className
            )}
            role="alert"
        >
            {/* Dismiss button */}
            <button
                onClick={handleDismiss}
                className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Dismiss"
            >
                <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5">
                    {content.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm">
                            {content.title}
                        </h4>
                        {content.showBadge && streak > 0 && (
                            <ShareStreakBadge streak={streak} size="sm" />
                        )}
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">
                        {content.description}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            onClick={onShare}
                            className="gap-1.5"
                        >
                            <Share2 className="h-3.5 w-3.5" />
                            {content.primaryAction}
                        </Button>

                        {type === 'streak_at_risk' && onSnooze && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleSnooze}
                                className="gap-1.5 text-muted-foreground"
                            >
                                <Clock className="h-3.5 w-3.5" />
                                Later
                            </Button>
                        )}

                        {type !== 'post_submission' && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleDismiss}
                                className="text-muted-foreground"
                            >
                                Not now
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Minimal inline prompt for post-submission
 */
export function SharePromptInline({
    onShare,
    onDismiss,
}: {
    onShare: () => void;
    onDismiss: () => void;
}) {
    return (
        <div className="flex items-center justify-between gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
                <Share2 className="h-4 w-4 text-muted-foreground" />
                <span>Share this achievement?</span>
            </div>
            <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={onDismiss}>
                    Skip
                </Button>
                <Button size="sm" onClick={onShare}>
                    Share
                </Button>
            </div>
        </div>
    );
}

export default ShareReminder;
