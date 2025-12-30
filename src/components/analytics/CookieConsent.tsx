'use client';

import { useEffect } from 'react';
import 'vanilla-cookieconsent/dist/cookieconsent.css';
import * as CookieConsent from 'vanilla-cookieconsent';

/**
 * Cookie Consent Banner component
 * Uses vanilla-cookieconsent (v3.0.1 - pinned)
 * Integrates with Google Consent Mode v2
 * 
 * @see PRD 14: Analytics GTM & GA4
 * @see https://github.com/orestbida/cookieconsent
 */
export function CookieConsentBanner() {
    useEffect(() => {
        CookieConsent.run({
            guiOptions: {
                consentModal: {
                    layout: 'box',
                    position: 'bottom left',
                    equalWeightButtons: true,
                    flipButtons: false,
                },
                preferencesModal: {
                    layout: 'box',
                    position: 'right',
                    equalWeightButtons: true,
                    flipButtons: false,
                },
            },

            categories: {
                necessary: {
                    enabled: true,
                    readOnly: true,
                },
                analytics: {
                    enabled: false,
                    readOnly: false,
                    autoClear: {
                        cookies: [
                            { name: /^_ga/ },
                            { name: '_gid' },
                        ],
                    },
                },
                marketing: {
                    enabled: false,
                    readOnly: false,
                },
            },

            language: {
                default: 'en',
                translations: {
                    en: {
                        consentModal: {
                            title: 'We use cookies 🍪',
                            description:
                                'We use cookies to improve your experience and analyze site usage. You can customize your preferences below.',
                            acceptAllBtn: 'Accept all',
                            acceptNecessaryBtn: 'Reject all',
                            showPreferencesBtn: 'Manage preferences',
                        },
                        preferencesModal: {
                            title: 'Cookie preferences',
                            acceptAllBtn: 'Accept all',
                            acceptNecessaryBtn: 'Reject all',
                            savePreferencesBtn: 'Save preferences',
                            closeIconLabel: 'Close',
                            sections: [
                                {
                                    title: 'Cookie usage',
                                    description:
                                        'We use cookies to ensure basic site functionality and to improve your experience.',
                                },
                                {
                                    title: 'Strictly necessary cookies',
                                    description:
                                        'These cookies are essential for the website to function properly.',
                                    linkedCategory: 'necessary',
                                },
                                {
                                    title: 'Analytics cookies',
                                    description:
                                        'These cookies help us understand how visitors interact with the site.',
                                    linkedCategory: 'analytics',
                                },
                                {
                                    title: 'Marketing cookies',
                                    description:
                                        'These cookies are used to show you relevant ads (not currently used).',
                                    linkedCategory: 'marketing',
                                },
                            ],
                        },
                    },
                },
            },

            // Google Consent Mode v2 integration
            onFirstConsent: ({ cookie }) => {
                updateGoogleConsent(cookie.categories);
            },
            onConsent: ({ cookie }) => {
                updateGoogleConsent(cookie.categories);
            },
            onChange: ({ cookie }) => {
                updateGoogleConsent(cookie.categories);
            },
        });
    }, []);

    return null;
}

/**
 * Update Google Consent Mode based on user cookie choices
 * Called whenever consent state changes
 */
function updateGoogleConsent(categories: string[]) {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;

    const hasAnalytics = categories.includes('analytics');
    const hasMarketing = categories.includes('marketing');

    window.gtag('consent', 'update', {
        analytics_storage: hasAnalytics ? 'granted' : 'denied',
        ad_storage: hasMarketing ? 'granted' : 'denied',
        ad_user_data: hasMarketing ? 'granted' : 'denied',
        ad_personalization: hasMarketing ? 'granted' : 'denied',
    });
}

// Add gtag type declaration
declare global {
    interface Window {
        gtag: (...args: unknown[]) => void;
        dataLayer: Record<string, unknown>[];
    }
}
