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
import { hasAnalyticsConsent } from '@/lib/consent/cookieConsent';

// PostHog config from environment
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

// Debug mode in development
const DEBUG = process.env.NODE_ENV === 'development';

/**
 * Initialize PostHog with session replay and feature flags
 */
function initPostHog() {
    if (typeof window === 'undefined') return;
    if (!POSTHOG_KEY) {
        if (DEBUG) console.warn('[PostHog] No API key found, skipping initialization');
        return;
    }

    // Check if already initialized
    if (posthog.__loaded) return;

    posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        
        // Session Replay - MUST HAVE
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
            if (DEBUG) {
                console.log('[PostHog] Initialized with session replay');
            }
        },
        
        // Debug mode in development
        debug: DEBUG,
        
        // Respect Do Not Track browser setting initially
        // But we override with explicit consent below
        respect_dnt: false,
    });
}

/**
 * PostHog Provider Component
 * 
 * Wraps the app and manages PostHog lifecycle based on consent.
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
    const [isReady, setIsReady] = useState(false);
    const [hasConsent, setHasConsent] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const checkConsent = () => {
            const consented = hasAnalyticsConsent();
            const online = navigator.onLine;
            
            if (consented && online && !isReady) {
                initPostHog();
                setIsReady(true);
                setHasConsent(true);
            } else if (!consented && isReady) {
                // User revoked consent - opt out
                posthog.opt_out_capturing();
                setHasConsent(false);
            } else if (consented && isReady && !hasConsent) {
                // User granted consent after previously revoking
                posthog.opt_in_capturing();
                setHasConsent(true);
            }
        };

        // Check immediately
        checkConsent();

        // Re-check on focus, online state, and periodically for consent banner
        const onOnline = () => checkConsent();
        const onFocus = () => checkConsent();
        const onVisibility = () => {
            if (document.visibilityState === 'visible') checkConsent();
        };

        window.addEventListener('online', onOnline);
        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', onVisibility);

        // Poll briefly for initial consent banner interactions
        const poll = window.setInterval(checkConsent, 1000);
        const stopPoll = window.setTimeout(() => window.clearInterval(poll), 15000);

        return () => {
            window.removeEventListener('online', onOnline);
            window.removeEventListener('focus', onFocus);
            document.removeEventListener('visibilitychange', onVisibility);
            window.clearInterval(poll);
            window.clearTimeout(stopPoll);
        };
    }, [isReady, hasConsent]);

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
