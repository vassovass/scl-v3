'use client';

import { useEffect, useRef } from 'react';

/**
 * Track page load time via Navigation Timing API.
 * Uses requestIdleCallback to avoid blocking rendering.
 * Fires analytics.performance.pageLoaded() with timing data.
 */
export function usePagePerformance(pageName: string) {
    const tracked = useRef(false);

    useEffect(() => {
        if (tracked.current) return;
        tracked.current = true;

        const measure = () => {
            try {
                const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
                if (nav?.loadEventEnd > 0) {
                    const loadTimeMs = Math.round(nav.loadEventEnd - nav.startTime);
                    import('@/lib/analytics').then(({ analytics }) => {
                        analytics.performance.pageLoaded(pageName, loadTimeMs);
                    }).catch(() => {});
                }
            } catch {
                // Navigation Timing API not available
            }
        };

        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(measure, { timeout: 5000 });
        } else {
            setTimeout(measure, 1000);
        }
    }, [pageName]);
}
