/**
 * Tour Trigger Button
 * 
 * Reusable button for manually launching tours.
 * Can be used in Help menus, empty states, etc.
 * 
 * @see PRD 50: Modular Tour System v2.0
 */

'use client';

import { Button, type ButtonProps } from '@/components/ui/button';
import { HelpCircle, PlayCircle } from 'lucide-react';
import { useTour } from '@/hooks/useTour';
import { cn } from '@/lib/utils';
import { t } from '@/lib/tours/i18n';

interface TourTriggerProps extends Omit<ButtonProps, 'onClick'> {
    /** Tour ID to launch */
    tourId: string;
    /** Button text (defaults to "Take Tour") */
    label?: string;
    /** Show icon */
    showIcon?: boolean;
    /** Icon to use */
    icon?: 'help' | 'play';
}

export function TourTrigger({
    tourId,
    label,
    showIcon = true,
    icon = 'play',
    className,
    variant = 'outline',
    size = 'sm',
    ...props
}: TourTriggerProps) {
    const { startTour, isRunning } = useTour();

    const handleClick = () => {
        if (!isRunning) {
            startTour(tourId);
        }
    };

    const Icon = icon === 'help' ? HelpCircle : PlayCircle;
    const resolvedLabel = label ?? t('common.buttons.takeTour');

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleClick}
            disabled={isRunning}
            className={cn('gap-2', className)}
            {...props}
        >
            {showIcon && <Icon className="w-4 h-4" />}
            {resolvedLabel}
        </Button>
    );
}

/**
 * Tour Menu Item
 * 
 * For use in dropdown menus
 */
interface TourMenuItemProps {
    tourId: string;
    label: string;
    description?: string;
    icon?: string;
    onTrigger?: () => void;
}

export function TourMenuItem({
    tourId,
    label,
    description,
    icon,
    onTrigger,
}: TourMenuItemProps) {
    const { startTour, hasCompletedTour, isRunning } = useTour();

    const handleClick = () => {
        if (!isRunning) {
            startTour(tourId);
            onTrigger?.();
        }
    };

    const isCompleted = hasCompletedTour(tourId);

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={isRunning}
            className={cn(
                'flex items-start gap-3 w-full p-2 rounded-md text-left',
                'hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
        >
            {icon && <span className="text-lg flex-shrink-0">{icon}</span>}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{label}</span>
                    {isCompleted && (
                        <span className="text-xs text-muted-foreground">{t('common.labels.completed')}</span>
                    )}
                </div>
                {description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {description}
                    </p>
                )}
            </div>
        </button>
    );
}
