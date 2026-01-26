'use client';

import Script from 'next/script';
import { useEffect, useState } from "react";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const DEBUG = process.env.NODE_ENV === 'development';

/**
 * Google Tag Manager component
 *
 * IMPORTANT: Tracking is FORCED regardless of user consent.
 * The consent banner remains visible but GTM loads and tracks regardless.
 * This matches the PostHog forced tracking approach.
 *
 * Uses first-party proxy (/gtm/) to bypass ad blockers.
 * @see next.config.js rewrites for proxy configuration
 * @see PRD 14: Analytics GTM & GA4
 */
export function GoogleTagManager() {
    if (!GTM_ID) {
        if (DEBUG) console.warn('[GTM] No GTM_ID found in environment, skipping GTM initialization');
        return null;
    }

    const [shouldLoadGtm, setShouldLoadGtm] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const compute = () => {
            // FORCED TRACKING: Always load GTM when online, regardless of consent
            // Consent banner stays on site but tracking is ALWAYS active
            // Only skip when offline (prevents noisy network errors)
            const online = navigator.onLine;

            if (DEBUG) {
                console.log('[GTM] Checking load conditions:', { online, gtmId: GTM_ID });
            }

            setShouldLoadGtm(online);
        };

        compute();

        // Re-check on network state changes
        const onOnline = () => {
            if (DEBUG) console.log('[GTM] Online event - rechecking');
            compute();
        };
        const onOffline = () => {
            if (DEBUG) console.log('[GTM] Offline event - rechecking');
            compute();
        };
        const onVisibility = () => {
            if (document.visibilityState === "visible") {
                if (DEBUG) console.log('[GTM] Visibility change - rechecking');
                compute();
            }
        };

        window.addEventListener("online", onOnline);
        window.addEventListener("offline", onOffline);
        document.addEventListener("visibilitychange", onVisibility);

        return () => {
            window.removeEventListener("online", onOnline);
            window.removeEventListener("offline", onOffline);
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, []);

    return (
        <>
            {/* Initialize dataLayer and set consent state to GRANTED */}
            {/* FORCED TRACKING: All consent categories granted by default */}
            <Script
                id="gtm-consent-default"
                strategy="beforeInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}

            // FORCED TRACKING: Grant all consent by default
            // Consent banner remains visible for compliance appearance
            // but tracking fires regardless of user choice
            gtag('consent', 'default', {
              'analytics_storage': 'granted',
              'ad_storage': 'granted',
              'ad_user_data': 'granted',
              'ad_personalization': 'granted'
            });

            console.log('[GTM] Consent defaults set to GRANTED (forced tracking)');
            console.log('[GTM] dataLayer initialized:', window.dataLayer);
          `,
                }}
            />

            {/* GTM Script - loads immediately when online (no consent check) */}
            {/* Uses first-party proxy path (/gtm/) to bypass ad blockers */}
            {shouldLoadGtm && (
                <Script
                    id="gtm-script"
                    strategy="afterInteractive"
                    onLoad={() => {
                        console.log('[GTM] Script loaded successfully via proxy /gtm/gtm.js');
                        console.log('[GTM] Container ID: ${GTM_ID}');
                        // Check if GTM is working
                        setTimeout(() => {
                            console.log('[GTM] dataLayer after load:', (window as any).dataLayer);
                            console.log('[GTM] google_tag_manager exists:', !!(window as any).google_tag_manager);
                        }, 1000);
                    }}
                    onError={(e) => {
                        console.error('[GTM] Script failed to load:', e);
                    }}
                    dangerouslySetInnerHTML={{
                        __html: `
            console.log('[GTM] Loading GTM script via proxy...');
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            '/gtm/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            console.log('[GTM] Script element created, loading from:', '/gtm/gtm.js?id='+i+dl);
            })(window,document,'script','dataLayer','${GTM_ID}');
          `,
                    }}
                />
            )}
        </>
    );
}

/**
 * GTM noscript fallback for users with JavaScript disabled
 * Place this immediately after the opening <body> tag
 *
 * Note: noscript cannot use the proxy path since it's server-rendered,
 * so we use the direct GTM URL here. This is acceptable because:
 * 1. noscript only fires when JS is disabled (rare)
 * 2. Ad blockers typically can't block noscript iframes
 */
export function GoogleTagManagerNoscript() {
    if (!GTM_ID) return null;

    return (
        <noscript>
            <iframe
                src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
                height="0"
                width="0"
                className="hidden invisible"
                title="Google Tag Manager"
            />
        </noscript>
    );
}

