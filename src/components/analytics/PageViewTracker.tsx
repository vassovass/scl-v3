'use client';

import { useEffect, useRef } from 'react';
import { analytics } from '@/lib/analytics';

interface PageViewTrackerProps {
    pageName: string;
    pageType?: string;
}

/**
 * Drop-in client component to track page views.
 * Place inside any page component (works in both server and client pages).
 * Uses ref to prevent double-firing in StrictMode.
 */
export function PageViewTracker({ pageName, pageType }: PageViewTrackerProps) {
    const tracked = useRef(false);

    useEffect(() => {
        if (tracked.current) return;
        tracked.current = true;
        analytics.pageView(pageName, pageType);
    }, [pageName, pageType]);

    return null;
}
