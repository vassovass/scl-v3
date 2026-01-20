'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { trackComponentView, trackInteraction } from '@/lib/analytics';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface EmptyStateAction {
    /** Button label */
    label: string;
    /** Navigation href (for links) */
    href?: string;
    /** Click handler (for buttons) */
    onClick?: () => void;
    /** Visual variant */
    variant?: 'primary' | 'secondary';
    /** Unique ID for analytics */
    id?: string;
}

export interface EmptyStateProps {
    /** Icon (emoji, SVG component, or image) */
    icon?: React.ReactNode;
    /** Main title */
    title: string;
    /** Description text */
    description?: string;
    /** Call-to-action */
    action?: EmptyStateAction;
    /** Secondary action */
    secondaryAction?: EmptyStateAction;
    /** Context identifier for analytics */
    context?: string;
    /** A/B test variant */
    testVariant?: string;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Additional CSS classes */
    className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function EmptyState({
    icon = '📭',
    title,
    description,
    action,
    secondaryAction,
    context = 'unknown',
    testVariant,
    size = 'md',
    className = '',
}: EmptyStateProps) {
    // Track when empty state is viewed
    useEffect(() => {
        trackComponentView('EmptyState', context);
    }, [context]);

    // Size variants
    const sizeClasses = {
        sm: 'py-8 px-6',
        md: 'py-12 px-8',
        lg: 'py-16 px-12',
    };

    const iconSizes = {
        sm: 'text-3xl',
        md: 'text-4xl',
        lg: 'text-5xl',
    };

    const titleSizes = {
        sm: 'text-base',
        md: 'text-lg',
        lg: 'text-xl',
    };

    // Handle action clicks
    const handleActionClick = (actionItem: EmptyStateAction, type: 'primary' | 'secondary') => {
        const actionId = actionItem.id || `empty_state_${type}_action`;
        trackInteraction('EmptyState', 'click', actionId, actionItem.label);
        actionItem.onClick?.();
    };

    // Render action button
    const renderAction = (actionItem: EmptyStateAction, type: 'primary' | 'secondary') => {
        const actionId = actionItem.id || `empty-state-${type}-action`;
        const isPrimary = actionItem.variant === 'primary' || (type === 'primary' && !actionItem.variant);

        const classes = isPrimary
            ? 'inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90'
            : 'inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground transition hover:border-border/80 hover:bg-accent';

        if (actionItem.href) {
            return (
                <Link
                    id={actionId}
                    href={actionItem.href}
                    className={classes}
                    data-track-click={`empty_state_action_${actionId}`}
                    data-track-context={context}
                >
                    {actionItem.label}
                </Link>
            );
        }

        return (
            <button
                id={actionId}
                type="button"
                className={classes}
                onClick={() => handleActionClick(actionItem, type)}
                data-track-click={`empty_state_action_${actionId}`}
                data-track-context={context}
            >
                {actionItem.label}
            </button>
        );
    };

    return (
        <div
            id={`empty-state-${context}`}
            className={`empty-state rounded-xl border border-border bg-card/50 text-center ${sizeClasses[size]} ${className}`}
            data-track-view={`empty_state_${context}`}
            data-variant={testVariant}
            data-context={context}
            role="status"
            aria-live="polite"
        >
            {/* Icon */}
            {icon && (
                <div className={`empty-state__icon mb-4 ${iconSizes[size]}`} aria-hidden="true">
                    {icon}
                </div>
            )}

            {/* Title */}
            <h3 className={`empty-state__title font-semibold text-foreground ${titleSizes[size]}`}>
                {title}
            </h3>

            {/* Description */}
            {description && (
                <p className="empty-state__description mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                    {description}
                </p>
            )}

            {/* Actions */}
            {(action || secondaryAction) && (
                <div className="empty-state__actions mt-6 flex flex-wrap items-center justify-center gap-3">
                    {action && renderAction(action, 'primary')}
                    {secondaryAction && renderAction(secondaryAction, 'secondary')}
                </div>
            )}
        </div>
    );
}

export default EmptyState;

