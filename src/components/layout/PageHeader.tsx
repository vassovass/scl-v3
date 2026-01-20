'use client';

import React from 'react';
import Link from 'next/link';
import { trackInteraction } from '@/lib/analytics';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES - Modular, extensible action system
// ═══════════════════════════════════════════════════════════════════════════

export interface PageAction {
    /** Unique ID for analytics/testing (auto-generated if not provided) */
    id?: string;
    /** Button label */
    label: string;
    /** Optional icon (emoji or component) */
    icon?: React.ReactNode;
    /** Click handler (for buttons) */
    onClick?: () => void;
    /** Navigation href (for links) */
    href?: string;
    /** Visual variant */
    variant?: 'primary' | 'secondary' | 'ghost';
    /** Disabled state */
    disabled?: boolean;
    /** A/B test variant identifier */
    testVariant?: string;
    /** Accessible label for screen readers */
    ariaLabel?: string;
}

export interface Breadcrumb {
    label: string;
    href?: string;
}

export interface PageHeaderProps {
    /** Page title (renders as h1) */
    title: string;
    /** Optional subtitle/description */
    subtitle?: string;
    /** Action buttons (right side) */
    actions?: PageAction[];
    /** Breadcrumb trail */
    breadcrumbs?: Breadcrumb[];
    /** Page identifier for analytics (defaults to title slug) */
    pageId?: string;
    /** Slot for additional content between header and actions */
    headerSlot?: React.ReactNode;
    /** A/B test variant for entire header */
    testVariant?: string;
    /** Additional CSS classes */
    className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function PageHeader({
    title,
    subtitle,
    actions = [],
    breadcrumbs = [],
    pageId,
    headerSlot,
    testVariant,
    className = '',
}: PageHeaderProps) {
    // Generate stable page ID for analytics
    const analyticsPageId = pageId || title.toLowerCase().replace(/\s+/g, '_');

    // Handle action click with analytics
    const handleActionClick = (action: PageAction, index: number) => {
        const actionId = action.id || `action_${index}`;
        trackInteraction('PageHeader', 'click', actionId, action.label);
        action.onClick?.();
    };

    return (
        <header
            id={`page-header-${analyticsPageId}`}
            className={`page-header ${className}`}
            data-page-id={analyticsPageId}
            data-track-view={`page_header_${analyticsPageId}`}
            data-variant={testVariant}
            role="banner"
            aria-labelledby={`page-title-${analyticsPageId}`}
        >
            {/* Breadcrumbs */}
            {breadcrumbs.length > 0 && (
                <nav
                    className="page-header__breadcrumbs flex items-center gap-2 text-sm text-muted-foreground mb-2"
                    aria-label="Breadcrumb"
                >
                    {breadcrumbs.map((crumb, idx) => (
                        <React.Fragment key={idx}>
                            {crumb.href ? (
                                <Link
                                    href={crumb.href}
                                    className="hover:text-primary transition-colors"
                                    data-track-click={`breadcrumb_${crumb.label.toLowerCase().replace(/\s+/g, '_')}`}
                                >
                                    {crumb.label}
                                </Link>
                            ) : (
                                <span>{crumb.label}</span>
                            )}
                            {idx < breadcrumbs.length - 1 && (
                                <span className="text-muted-foreground/50" aria-hidden="true">›</span>
                            )}
                        </React.Fragment>
                    ))}
                </nav>
            )}

            {/* Main header content */}
            <div className="page-header__content flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                {/* Title section */}
                <div className="page-header__title-section">
                    <h1
                        id={`page-title-${analyticsPageId}`}
                        className="text-2xl font-bold text-foreground"
                    >
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-sm text-muted-foreground mt-1">
                            {subtitle}
                        </p>
                    )}
                </div>

                {/* Custom slot */}
                {headerSlot && (
                    <div className="page-header__slot">
                        {headerSlot}
                    </div>
                )}

                {/* Actions */}
                {actions.length > 0 && (
                    <div
                        className="page-header__actions flex flex-wrap items-center gap-3"
                        role="group"
                        aria-label="Page actions"
                    >
                        {actions.map((action, idx) => {
                            const actionId = action.id || `action-${idx}`;
                            const baseClasses = 'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition';

                            const variantClasses = {
                                primary: 'bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed',
                                secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border',
                                ghost: 'text-primary hover:text-primary/80 hover:bg-accent',
                            };

                            const classes = `${baseClasses} ${variantClasses[action.variant || 'secondary']}`;

                            // Link action
                            if (action.href) {
                                return (
                                    <Link
                                        key={actionId}
                                        id={actionId}
                                        href={action.href}
                                        className={classes}
                                        data-track-click={`page_action_${actionId}`}
                                        data-track-label={action.label}
                                        data-variant={action.testVariant}
                                        aria-label={action.ariaLabel || action.label}
                                    >
                                        {action.icon && <span aria-hidden="true">{action.icon}</span>}
                                        {action.label}
                                    </Link>
                                );
                            }

                            // Button action
                            return (
                                <button
                                    key={actionId}
                                    id={actionId}
                                    type="button"
                                    className={classes}
                                    onClick={() => handleActionClick(action, idx)}
                                    disabled={action.disabled}
                                    data-track-click={`page_action_${actionId}`}
                                    data-track-label={action.label}
                                    data-variant={action.testVariant}
                                    aria-label={action.ariaLabel || action.label}
                                >
                                    {action.icon && <span aria-hidden="true">{action.icon}</span>}
                                    {action.label}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </header>
    );
}

export default PageHeader;

