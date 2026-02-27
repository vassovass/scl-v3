"use client";

/**
 * Analytics Gate Provider
 * 
 * Unified component that manages the master tracking toggle from SuperAdmin settings.
 * This component:
 * 1. Reads feature_user_tracking setting
 * 2. Calls setTrackingEnabled() to gate analytics.ts events
 * 3. Passes featureEnabled to PostHogProvider
 * 
 * IMPORTANT: Tracking is FORCED regardless of user consent.
 * The consent banner remains visible but tracking fires regardless.
 * Only the master toggle can disable tracking.
 */

import { useEffect, useRef } from "react";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { setTrackingEnabled } from "@/lib/analytics";
import { initWebVitals } from "@/lib/performance/webVitals";
import { PostHogProvider } from "./PostHogProvider";

interface AnalyticsGateProviderProps {
    children: React.ReactNode;
}

export function AnalyticsGateProvider({ children }: AnalyticsGateProviderProps) {
    const featureEnabled = useFeatureFlag("feature_user_tracking");

    const vitalsInitialized = useRef(false);

    // Sync the master toggle to analytics.ts for trackEvent() calls
    // Initialize Web Vitals collection when tracking becomes enabled (PRD 64)
    useEffect(() => {
        setTrackingEnabled(featureEnabled);

        if (featureEnabled && !vitalsInitialized.current) {
            vitalsInitialized.current = true;
            initWebVitals();
        }
    }, [featureEnabled]);

    return (
        <PostHogProvider featureEnabled={featureEnabled}>
            {children}
        </PostHogProvider>
    );
}
