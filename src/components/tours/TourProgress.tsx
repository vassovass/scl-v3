/**
 * Tour Progress Indicator
 * 
 * Visual progress indicator showing current step.
 * Can be rendered standalone or integrated into tour UI.
 * 
 * @see PRD 50: Modular Tour System v2.0
 */

'use client';

import { useTourState } from '@/hooks/useTour';
import { t } from '@/lib/tours/i18n';
import { cn } from '@/lib/utils';

interface TourProgressProps {
    /** Show step numbers */
    showNumbers?: boolean;
    /** Compact mode (single line) */
    compact?: boolean;
    /** Custom class name */
    className?: string;
}

export function TourProgress({
    showNumbers = true,
    compact = false,
    className,
}: TourProgressProps) {
    const { isRunning, activeTour, currentStepIndex, totalSteps } = useTourState();

    if (!isRunning || !activeTour) {
        return null;
    }

    const progress = ((currentStepIndex + 1) / totalSteps) * 100;

    if (compact) {
        return (
            <div className={cn('flex items-center gap-2 text-sm', className)}>
                <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                {showNumbers && (
                    <span className="text-muted-foreground text-xs whitespace-nowrap">
                        {t('common.progress.step', {
                            current: currentStepIndex + 1,
                            total: totalSteps,
                        })}
                    </span>
                )}
            </div>
        );
    }

    return (
        <div className={cn('space-y-2', className)}>
            <div className="flex justify-between items-center text-sm">
                <span className="font-medium">{activeTour.nameKey}</span>
                {showNumbers && (
                    <span className="text-muted-foreground">
                        {t('common.progress.step', {
                            current: currentStepIndex + 1,
                            total: totalSteps,
                        })}
                    </span>
                )}
            </div>

            {/* Step dots */}
            <div className="flex gap-1.5">
                {Array.from({ length: totalSteps }).map((_, index) => (
                    <div
                        key={index}
                        className={cn(
                            'h-1.5 rounded-full transition-all duration-300',
                            index === currentStepIndex
                                ? 'bg-primary w-6'
                                : index < currentStepIndex
                                    ? 'bg-primary/70 w-1.5'
                                    : 'bg-muted w-1.5'
                        )}
                    />
                ))}
            </div>
        </div>
    );
}

/**
 * Tour Progress Bar (alternative design)
 */
interface TourProgressBarProps {
    /** Custom class name */
    className?: string;
}

export function TourProgressBar({ className }: TourProgressBarProps) {
    const { isRunning, currentStepIndex, totalSteps } = useTourState();

    if (!isRunning) {
        return null;
    }

    const progress = ((currentStepIndex + 1) / totalSteps) * 100;

    return (
        <div className={cn('w-full', className)}>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div
                    className="h-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}
