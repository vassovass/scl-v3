'use client';

import React, { useEffect } from 'react';
import { trackComponentView } from '@/lib/analytics';
import { PageHeader, type PageAction, type Breadcrumb } from './PageHeader';
import { EmptyState, type EmptyStateAction } from './EmptyState';
import { LoadingSkeleton } from './LoadingSkeleton';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface PageEmptyConfig {
    /** Icon (emoji, SVG, or component) */
    icon?: React.ReactNode;
    /** Main title */
    title: string;
    /** Description text */
    description?: string;
    /** Primary action */
    action?: EmptyStateAction;
    /** Secondary action */
    secondaryAction?: EmptyStateAction;
}

export interface PageLoadingConfig {
    /** Skeleton variant */
    variant?: 'list' | 'cards' | 'table' | 'content' | 'custom';
    /** Number of skeleton rows */
    rows?: number;
    /** Number of columns for cards */
    columns?: number;
    /** Custom loading content */
    children?: React.ReactNode;
}

export interface PageLayoutProps {
    /** Page title */
    title: string;
    /** Optional subtitle */
    subtitle?: string;
    /** Action buttons */
    actions?: PageAction[];
    /** Breadcrumb trail */
    breadcrumbs?: Breadcrumb[];
    /** Loading state */
    loading?: boolean;
    /** Loading configuration */
    loadingConfig?: PageLoadingConfig;
    /** Empty state (shows when isEmpty is true and not loading) */
    empty?: PageEmptyConfig;
    /** Force show empty state (overrides children detection) */
    isEmpty?: boolean;
    /** Page identifier for analytics */
    pageId?: string;
    /** A/B test variant */
    testVariant?: string;
    /** Slot for additional header content */
    headerSlot?: React.ReactNode;
    /** Slot for content before main children */
    beforeContent?: React.ReactNode;
    /** Slot for content after main children */
    afterContent?: React.ReactNode;
    /** Padding variant */
    padding?: 'none' | 'sm' | 'md' | 'lg';
    /** Max width constraint */
    maxWidth?: 'none' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
    /** Additional CSS classes for wrapper */
    className?: string;
    /** Additional CSS classes for content area */
    contentClassName?: string;
    /** Page content */
    children?: React.ReactNode;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function PageLayout({
    title,
    subtitle,
    actions = [],
    breadcrumbs = [],
    loading = false,
    loadingConfig = {},
    empty,
    isEmpty = false,
    pageId,
    testVariant,
    headerSlot,
    beforeContent,
    afterContent,
    padding = 'md',
    maxWidth = 'none',
    className = '',
    contentClassName = '',
    children,
}: PageLayoutProps) {
    // Generate stable page ID for analytics
    const analyticsPageId = pageId || title.toLowerCase().replace(/\s+/g, '_');

    // Track page layout view
    useEffect(() => {
        trackComponentView('PageLayout', analyticsPageId);
    }, [analyticsPageId]);

    // Padding classes
    const paddingClasses = {
        none: '',
        sm: 'p-4',
        md: 'p-4 md:p-6',
        lg: 'p-6 md:p-8',
    };

    // Max width classes
    const maxWidthClasses = {
        none: '',
        md: 'max-w-3xl mx-auto',
        lg: 'max-w-4xl mx-auto',
        xl: 'max-w-5xl mx-auto',
        '2xl': 'max-w-6xl mx-auto',
        full: 'max-w-full',
    };

    // Determine if we should show empty state
    const showEmpty = !loading && isEmpty && empty;

    return (
        <div
            id={`page-${analyticsPageId}`}
            className={`page-layout ${paddingClasses[padding]} ${className}`}
            data-page-id={analyticsPageId}
            data-variant={testVariant}
            data-loading={loading ? 'true' : undefined}
            data-empty={showEmpty ? 'true' : undefined}
        >
            {/* Page Header */}
            <PageHeader
                title={title}
                subtitle={subtitle}
                actions={actions}
                breadcrumbs={breadcrumbs}
                pageId={analyticsPageId}
                headerSlot={headerSlot}
                testVariant={testVariant}
            />

            {/* Content Area */}
            <main
                id={`page-content-${analyticsPageId}`}
                className={`page-layout__content mt-6 ${maxWidthClasses[maxWidth]} ${contentClassName}`}
                role="main"
                aria-busy={loading}
            >
                {/* Before content slot */}
                {beforeContent && (
                    <div className="page-layout__before-content mb-6">
                        {beforeContent}
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <LoadingSkeleton
                        variant={loadingConfig.variant || 'list'}
                        rows={loadingConfig.rows || 5}
                        columns={loadingConfig.columns || 3}
                        context={analyticsPageId}
                        testVariant={testVariant}
                    >
                        {loadingConfig.children}
                    </LoadingSkeleton>
                )}

                {/* Empty State */}
                {showEmpty && empty && (
                    <EmptyState
                        icon={empty.icon}
                        title={empty.title}
                        description={empty.description}
                        action={empty.action}
                        secondaryAction={empty.secondaryAction}
                        context={analyticsPageId}
                        testVariant={testVariant}
                    />
                )}

                {/* Main Content */}
                {!loading && !showEmpty && children}

                {/* After content slot */}
                {afterContent && (
                    <div className="page-layout__after-content mt-6">
                        {afterContent}
                    </div>
                )}
            </main>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// RE-EXPORTS for convenience
// ═══════════════════════════════════════════════════════════════════════════

export { PageHeader, EmptyState, LoadingSkeleton };
export type { PageAction, Breadcrumb, EmptyStateAction };

export default PageLayout;
