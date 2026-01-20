'use client';

import Script from 'next/script';
import { hasAnalyticsConsent } from "@/lib/consent/cookieConsent";
import { useEffect, useState } from "react";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

/**
 * Google Tag Manager component
 * Loads GTM script with consent mode defaults
 * 
 * @see PRD 14: Analytics GTM & GA4
 */
export function GoogleTagManager() {
    if (!GTM_ID) return null;

    const [shouldLoadGtm, setShouldLoadGtm] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const compute = () => {
            // Only load GTM after explicit analytics consent.
            // Also skip loading when offline (prevents noisy network errors).
            const consented = hasAnalyticsConsent();
            const online = navigator.onLine;
            setShouldLoadGtm(consented && online);
        };

        compute();

        // Keep in sync when user changes consent or network changes.
        // CookieConsent doesn't guarantee event names, so we listen to common ones + fallback to focus.
        const onOnline = () => compute();
        const onOffline = () => compute();
        const onFocus = () => compute();
        const onVisibility = () => {
            if (document.visibilityState === "visible") compute();
        };

        window.addEventListener("online", onOnline);
        window.addEventListener("offline", onOffline);
        window.addEventListener("focus", onFocus);
        document.addEventListener("visibilitychange", onVisibility);

        // Quick short-lived poll for initial consent banner interactions
        const poll = window.setInterval(compute, 1000);
        const stopPoll = window.setTimeout(() => window.clearInterval(poll), 15000);

        return () => {
            window.removeEventListener("online", onOnline);
            window.removeEventListener("offline", onOffline);
            window.removeEventListener("focus", onFocus);
            document.removeEventListener("visibilitychange", onVisibility);
            window.clearInterval(poll);
            window.clearTimeout(stopPoll);
        };
    }, []);

    return (
        <>
            {/* Initialize dataLayer and set default consent state FIRST */}
            <Script
                id="gtm-consent-default"
                strategy="beforeInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            
            // Default consent state - deny all until user consents
            // This MUST run before GTM loads
            gtag('consent', 'default', {
              'analytics_storage': 'denied',
              'ad_storage': 'denied',
              'ad_user_data': 'denied',
              'ad_personalization': 'denied',
              'wait_for_update': 500
            });
          `,
                }}
            />

            {/* GTM Script - ONLY after analytics consent is granted */}
            {shouldLoadGtm && (
                <Script
                    id="gtm-script"
                    strategy="afterInteractive"
                    dangerouslySetInnerHTML={{
                        __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
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

