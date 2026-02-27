'use client';

import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SlowRequestFeedbackProps {
    /** Request is taking longer than the slow threshold. */
    isSlow: boolean;
    /** Request has timed out. */
    isTimeout: boolean;
    /** Request is still loading. */
    loading: boolean;
    /** Retry callback (shown as button after timeout). */
    onRetry?: () => void;
    className?: string;
}

/**
 * User feedback component for slow/timed-out requests.
 * Uses shadcn/ui components and semantic CSS variables.
 * Mobile-first — works on all viewports.
 */
export function SlowRequestFeedback({
    isSlow,
    isTimeout,
    loading,
    onRetry,
    className,
}: SlowRequestFeedbackProps) {
    if (!isSlow && !isTimeout) return null;

    return (
        <div className={cn(
            'flex items-center gap-2 rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground',
            className,
        )}>
            {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />}

            {isTimeout ? (
                <>
                    <span>Request timed out.</span>
                    {onRetry && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onRetry}
                            className="ml-auto"
                        >
                            <RefreshCw className="mr-1 h-3 w-3" />
                            Try again
                        </Button>
                    )}
                </>
            ) : (
                <span>Taking longer than usual...</span>
            )}
        </div>
    );
}
