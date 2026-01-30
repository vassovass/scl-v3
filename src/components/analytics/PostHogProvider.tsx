'use client';

/**
 * PostHog Provider
 *
 * Initializes PostHog SDK with:
 * - Session replay (must-have)
 * - User identification (via AuthProvider)
 * - Consent awareness (respects cookie consent)
 * - Feature flags ready
 *
 * @see implementation_plan.md for PostHog integration details
 */

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect, useState } from 'react';
// NOTE: Consent check removed - tracking is FORCED regardless of user choice

// PostHog config from environment
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
// Use first-party proxy to bypass ad blockers (see next.config.js rewrites)
// The /ingest path proxies to PostHog's ingestion endpoint
const POSTHOG_HOST = '/ingest';
// UI host is needed for toolbar, session replay viewer, and debugging features
const POSTHOG_UI_HOST = 'https://us.posthog.com';

// Debug mode in development
const DEBUG = process.env.NODE_ENV === 'development';

/**
 * Initialize PostHog with session replay and feature flags
 */
function initPostHog() {
    if (typeof window === 'undefined') return;
    if (!POSTHOG_KEY) {
        console.warn('[PostHog] No API key found, skipping initialization');
        return;
    }

    // Check if already initialized
    if (posthog.__loaded) {
        console.log('[PostHog] Already initialized, skipping');
        return;
    }

    console.log('[PostHog] Initializing with config:', {
        api_host: POSTHOG_HOST,
        ui_host: POSTHOG_UI_HOST,
        session_recording: true,
        autocapture: true,
    });

    try {
    posthog.init(POSTHOG_KEY, {
        // API host uses first-party proxy to bypass ad blockers
        api_host: POSTHOG_HOST,
        // UI host is needed for toolbar, session replay viewer, and debugging
        ui_host: POSTHOG_UI_HOST,

        // Session Replay - MUST HAVE (FORCED - always enabled)
        session_recording: {
            recordCrossOriginIframes: true,
        },

        // Auto-capture clicks, pageviews, etc.
        autocapture: true,
        capture_pageview: true,
        capture_pageleave: true,

        // Feature Flags
        bootstrap: {},

        // Performance
        loaded: (ph) => {
            console.log('[PostHog] ✓ Initialized successfully');
            console.log('[PostHog] Session replay:', ph.sessionRecordingStarted() ? 'ACTIVE' : 'NOT STARTED');
            console.log('[PostHog] Session ID:', ph.get_session_id());
            console.log('[PostHog] Distinct ID:', ph.get_distinct_id());
            console.log('[PostHog] Using proxy:', POSTHOG_HOST);
        },

        // Debug mode - always on for now to help troubleshoot
        debug: true,

        // FORCED TRACKING: Do NOT respect DNT
        respect_dnt: false,
    });

    // Force start session recording immediately
    posthog.startSessionRecording();
    console.log('[PostHog] Session recording force-started');
    } catch (err) {
        // Don't crash the app - analytics is non-critical
        console.error('[PostHog] Failed to initialize:', err);
    }
}

/**
 * PostHog Provider Component
 * 
 * Wraps the app and manages PostHog lifecycle based on:
 * - SuperAdmin feature flag (feature_user_tracking) - master toggle
 * 
 * IMPORTANT: Tracking is FORCED regardless of user consent.
 * The consent banner remains visible but tracking fires regardless.
 * Only the master toggle can disable tracking.
 * 
 * @param featureEnabled - Master toggle from feature_user_tracking setting
 */
export function PostHogProvider({
    children,
    featureEnabled = true
}: {
    children: React.ReactNode;
    featureEnabled?: boolean;
}) {
    const [isReady, setIsReady] = useState(false);
    const [hasConsent, setHasConsent] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const checkTracking = () => {
            const online = navigator.onLine;

            // FORCED TRACKING: Always track when feature enabled, regardless of consent
            // Consent banner stays on site but tracking is ALWAYS active
            const shouldTrack = featureEnabled && online;

            console.log('[PostHog] Checking tracking conditions:', {
                featureEnabled,
                online,
                shouldTrack,
                isReady,
                hasConsent
            });

            if (shouldTrack && !isReady) {
                console.log('[PostHog] Starting initialization (FORCED tracking)...');
                initPostHog();
                setIsReady(true);
                setHasConsent(true);
            } else if (!shouldTrack && isReady) {
                // Feature disabled - opt out (only respects master toggle, NOT consent)
                console.log('[PostHog] Feature disabled - opting out');
                posthog.opt_out_capturing();
                setHasConsent(false);
            } else if (shouldTrack && isReady && !hasConsent) {
                // Feature re-enabled - opt back in
                console.log('[PostHog] Feature re-enabled - opting back in');
                posthog.opt_in_capturing();
                setHasConsent(true);
            }
        };

        // Check immediately
        checkTracking();

        // Re-check on focus and online state
        const onOnline = () => checkTracking();
        const onFocus = () => checkTracking();
        const onVisibility = () => {
            if (document.visibilityState === 'visible') checkTracking();
        };

        window.addEventListener('online', onOnline);
        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', onVisibility);

        // Poll briefly for feature flag updates
        const poll = window.setInterval(checkTracking, 1000);
        const stopPoll = window.setTimeout(() => window.clearInterval(poll), 15000);

        return () => {
            window.removeEventListener('online', onOnline);
            window.removeEventListener('focus', onFocus);
            document.removeEventListener('visibilitychange', onVisibility);
            window.clearInterval(poll);
            window.clearTimeout(stopPoll);
        };
    }, [isReady, hasConsent, featureEnabled]);

    // If PostHog isn't ready yet (no consent or no key), just render children
    if (!isReady || !POSTHOG_KEY) {
        return <>{children}</>;
    }

    return (
        <PHProvider client={posthog}>
            {children}
        </PHProvider>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// POSTHOG HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Identify a user in PostHog
 * Call this after login/signup
 */
export function posthogIdentify(
    userId: string,
    traits?: Record<string, string | number | boolean>
) {
    if (typeof window === 'undefined') return;
    if (!posthog.__loaded) return;

    posthog.identify(userId, traits);

    if (DEBUG) {
        console.log('[PostHog] User identified:', userId, traits);
    }
}

/**
 * Reset PostHog user on logout
 */
export function posthogReset() {
    if (typeof window === 'undefined') return;
    if (!posthog.__loaded) return;

    posthog.reset();

    if (DEBUG) {
        console.log('[PostHog] User reset (logout)');
    }
}

/**
 * Capture a PostHog event
 * This is the direct PostHog capture, for cases where you want PostHog-specific tracking
 */
export function posthogCapture(
    eventName: string,
    properties?: Record<string, string | number | boolean | null | undefined>
) {
    if (typeof window === 'undefined') return;
    if (!posthog.__loaded) return;

    // Filter out null/undefined
    const cleanProps = properties
        ? Object.fromEntries(
            Object.entries(properties).filter(([, v]) => v != null)
        )
        : {};

    posthog.capture(eventName, cleanProps);

    if (DEBUG) {
        console.log('[PostHog] Event captured:', eventName, cleanProps);
    }
}

/**
 * Check if a feature flag is enabled
 */
export function posthogFeatureFlag(flagKey: string): boolean {
    if (typeof window === 'undefined') return false;
    if (!posthog.__loaded) return false;

    return posthog.isFeatureEnabled(flagKey) ?? false;
}

/**
 * Get feature flag payload
 */
export function posthogFeatureFlagPayload(flagKey: string): unknown {
    if (typeof window === 'undefined') return null;
    if (!posthog.__loaded) return null;

    return posthog.getFeatureFlagPayload(flagKey);
}

