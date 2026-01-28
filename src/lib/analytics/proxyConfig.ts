/**
 * Analytics Proxy Configuration
 *
 * Central registry of all analytics services and their proxy paths.
 * This enables ad blocker bypass by routing requests through first-party domain.
 *
 * HOW IT WORKS:
 * Ad blockers maintain lists of known tracking domains (posthog.com, googletagmanager.com).
 * By proxying through our own domain paths (/ingest, /gtm), these requests appear as
 * first-party and are not blocked. Expected improvement: 10-30% more events captured.
 *
 * ADDING NEW SERVICES:
 * 1. Add entry to ANALYTICS_PROXIES below
 * 2. Add corresponding rewrite rules in next.config.js
 * 3. Update the service's initialization to use proxyPath
 *
 * @see next.config.js - rewrites() function
 * @see PostHogProvider.tsx - uses posthog.proxyPath
 * @see GoogleTagManager.tsx - uses gtm.proxyPath
 */

export const ANALYTICS_PROXIES = {
  /**
   * PostHog - Product Analytics, Session Replay, Feature Flags
   * Proxy: /ingest/* -> us.i.posthog.com/*
   */
  posthog: {
    name: 'PostHog',
    proxyPath: '/ingest',
    originalHost: 'https://us.i.posthog.com',
    staticPath: '/ingest/static',
    staticHost: 'https://us-assets.i.posthog.com/static',
    // UI host is NOT proxied - needed for toolbar and session replay viewer
    uiHost: 'https://us.posthog.com',
  },

  /**
   * Google Tag Manager - Tag management and GA4 integration
   * Proxy: /gtm/* -> www.googletagmanager.com/*
   */
  gtm: {
    name: 'Google Tag Manager',
    proxyPath: '/gtm',
    originalHost: 'https://www.googletagmanager.com',
  },

  /**
   * Google Analytics 4 - Web analytics
   * Proxy: /ga/* -> www.google-analytics.com/*
   *
   * IMPORTANT: GTM GA4 Configuration tag has transport_url set to
   * https://stepleague.com/ga to route all collection requests through proxy.
   * This is configured in GTM (version 11+).
   */
  ga4: {
    name: 'Google Analytics 4',
    proxyPath: '/ga',
    originalHost: 'https://www.google-analytics.com',
    // The full transport URL used in GTM configuration
    transportUrl: 'https://stepleague.com/ga',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // FUTURE SERVICES
  // Add new analytics services here following the same pattern
  // ─────────────────────────────────────────────────────────────────────────

  // Example for future service:
  // amplitude: {
  //   name: 'Amplitude',
  //   proxyPath: '/amp',
  //   originalHost: 'https://api2.amplitude.com',
  // },

  // mixpanel: {
  //   name: 'Mixpanel',
  //   proxyPath: '/mp',
  //   originalHost: 'https://api-js.mixpanel.com',
  // },
} as const;

export type AnalyticsService = keyof typeof ANALYTICS_PROXIES;

/**
 * Get proxy configuration for a specific service
 */
export function getProxyConfig(service: AnalyticsService) {
  return ANALYTICS_PROXIES[service];
}

/**
 * Get all configured analytics services
 */
export function getAllProxyConfigs() {
  return Object.entries(ANALYTICS_PROXIES).map(([key, config]) => ({
    id: key as AnalyticsService,
    ...config,
  }));
}

/**
 * Check if a URL should be proxied
 * Useful for debugging or logging
 */
export function isProxiedUrl(url: string): { isProxied: boolean; service?: AnalyticsService } {
  for (const [service, config] of Object.entries(ANALYTICS_PROXIES)) {
    if (url.startsWith(config.proxyPath)) {
      return { isProxied: true, service: service as AnalyticsService };
    }
  }
  return { isProxied: false };
}
