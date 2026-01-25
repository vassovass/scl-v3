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
 * The feature flag acts as a master switch:
 * - When OFF: no tracking regardless of user consent
 * - When ON: consent-based tracking is in effect
 */

import { useEffect } from "react";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { setTrackingEnabled } from "@/lib/analytics";
import { PostHogProvider } from "./PostHogProvider";

interface AnalyticsGateProviderProps {
    children: React.ReactNode;
}

export function AnalyticsGateProvider({ children }: AnalyticsGateProviderProps) {
    const featureEnabled = useFeatureFlag("feature_user_tracking");

    // Sync the master toggle to analytics.ts for trackEvent() calls
    useEffect(() => {
        setTrackingEnabled(featureEnabled);
    }, [featureEnabled]);

    return (
        <PostHogProvider featureEnabled={featureEnabled}>
            {children}
        </PostHogProvider>
    );
}
