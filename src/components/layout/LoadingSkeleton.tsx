'use client';

import React from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface LoadingSkeletonProps {
    /** Type of skeleton layout */
    variant?: 'list' | 'cards' | 'table' | 'content' | 'custom';
    /** Number of skeleton rows/cards to show */
    rows?: number;
    /** Number of columns for card grid */
    columns?: number;
    /** Show header skeleton */
    showHeader?: boolean;
    /** Context identifier for analytics */
    context?: string;
    /** A/B test variant */
    testVariant?: string;
    /** Custom skeleton content (when variant='custom') */
    children?: React.ReactNode;
    /** Additional CSS classes */
    className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// SKELETON PRIMITIVES
// ═══════════════════════════════════════════════════════════════════════════

export function SkeletonLine({ width = '100%', height = '1rem' }: { width?: string; height?: string }) {
    return (
        <div
            className="skeleton-line animate-pulse rounded bg-muted"
            style={{ width, height }}
            aria-hidden="true"
        />
    );
}

export function SkeletonCard() {
    return (
        <div className="skeleton-card rounded-xl border border-border bg-card/30 p-6 animate-pulse">
            <SkeletonLine width="60%" height="1.25rem" />
            <div className="mt-3 space-y-2">
                <SkeletonLine width="100%" height="0.875rem" />
                <SkeletonLine width="80%" height="0.875rem" />
            </div>
            <div className="mt-4 flex gap-2">
                <SkeletonLine width="4rem" height="1.5rem" />
                <SkeletonLine width="4rem" height="1.5rem" />
            </div>
        </div>
    );
}

export function SkeletonRow() {
    return (
        <div className="skeleton-row flex items-center gap-4 rounded-lg border border-border bg-card/30 p-4 animate-pulse">
            <SkeletonLine width="2rem" height="2rem" />
            <div className="flex-1 space-y-2">
                <SkeletonLine width="40%" height="1rem" />
                <SkeletonLine width="60%" height="0.75rem" />
            </div>
            <SkeletonLine width="5rem" height="1.5rem" />
        </div>
    );
}

export function SkeletonTableRow({ columns = 4 }: { columns?: number }) {
    return (
        <tr className="skeleton-table-row animate-pulse">
            {Array.from({ length: columns }).map((_, idx) => (
                <td key={idx} className="px-4 py-3">
                    <SkeletonLine width={idx === 0 ? '60%' : '80%'} height="1rem" />
                </td>
            ))}
        </tr>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function LoadingSkeleton({
    variant = 'list',
    rows = 5,
    columns = 3,
    showHeader = false,
    context = 'page',
    testVariant,
    children,
    className = '',
}: LoadingSkeletonProps) {
    return (
        <div
            id={`loading-skeleton-${context}`}
            className={`loading-skeleton ${className}`}
            data-variant={testVariant}
            data-context={context}
            role="status"
            aria-busy="true"
            aria-label="Loading content"
        >
            {/* Optional header skeleton */}
            {showHeader && (
                <div className="loading-skeleton__header mb-6 animate-pulse">
                    <SkeletonLine width="200px" height="2rem" />
                    <div className="mt-2">
                        <SkeletonLine width="300px" height="1rem" />
                    </div>
                </div>
            )}

            {/* Custom skeleton */}
            {variant === 'custom' && children}

            {/* List skeleton */}
            {variant === 'list' && (
                <div className="loading-skeleton__list space-y-3">
                    {Array.from({ length: rows }).map((_, idx) => (
                        <SkeletonRow key={idx} />
                    ))}
                </div>
            )}

            {/* Cards skeleton */}
            {variant === 'cards' && (
                <div
                    className="loading-skeleton__cards grid gap-4"
                    style={{
                        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                    }}
                >
                    {Array.from({ length: rows * columns }).map((_, idx) => (
                        <SkeletonCard key={idx} />
                    ))}
                </div>
            )}

            {/* Table skeleton */}
            {variant === 'table' && (
                <div className="loading-skeleton__table overflow-hidden rounded-lg border border-border">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                {Array.from({ length: columns }).map((_, idx) => (
                                    <th key={idx} className="px-4 py-3 text-left">
                                        <SkeletonLine width="60%" height="0.875rem" />
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {Array.from({ length: rows }).map((_, idx) => (
                                <SkeletonTableRow key={idx} columns={columns} />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Content skeleton */}
            {variant === 'content' && (
                <div className="loading-skeleton__content space-y-4 animate-pulse">
                    <SkeletonLine width="80%" height="1.5rem" />
                    <div className="space-y-2">
                        <SkeletonLine width="100%" height="1rem" />
                        <SkeletonLine width="100%" height="1rem" />
                        <SkeletonLine width="60%" height="1rem" />
                    </div>
                    <div className="pt-4 space-y-2">
                        <SkeletonLine width="100%" height="1rem" />
                        <SkeletonLine width="90%" height="1rem" />
                        <SkeletonLine width="75%" height="1rem" />
                    </div>
                </div>
            )}

            {/* Screen reader announcement */}
            <span className="sr-only">Loading, please wait...</span>
        </div>
    );
}

export default LoadingSkeleton;
