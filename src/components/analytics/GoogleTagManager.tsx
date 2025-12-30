'use client';

import Script from 'next/script';

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

/**
 * Google Tag Manager component
 * Loads GTM script with consent mode defaults
 * 
 * @see PRD 14: Analytics GTM & GA4
 */
export function GoogleTagManager() {
    if (!GTM_ID) return null;

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

            {/* GTM Script - loads after consent defaults are set */}
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
                style={{ display: 'none', visibility: 'hidden' }}
                title="Google Tag Manager"
            />
        </noscript>
    );
}
