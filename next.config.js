/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strict mode for better development experience
  reactStrictMode: true,

  // Optimize images from Supabase storage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },

  // Expose version and commit hash to the client
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '0.0.0',
    NEXT_PUBLIC_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA || 'dev',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ANALYTICS PROXY REWRITES
  // ═══════════════════════════════════════════════════════════════════════════
  // Route analytics through first-party domain to bypass ad blockers.
  // Ad blockers maintain lists of known tracking domains (posthog.com,
  // googletagmanager.com). By proxying through our own domain, these requests
  // appear as first-party and are not blocked.
  // Expected improvement: 10-30% more events captured.
  async rewrites() {
    return [
      // ─────────────────────────────────────────────────────────────────────────
      // PostHog Proxy
      // Proxies /ingest/* to PostHog's ingestion endpoint
      // ─────────────────────────────────────────────────────────────────────────
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },

      // ─────────────────────────────────────────────────────────────────────────
      // GTM/GA4 Proxy
      // Proxies /gtm/* to Google Tag Manager
      // IMPORTANT: Query strings are automatically forwarded by Next.js rewrites
      // ─────────────────────────────────────────────────────────────────────────
      {
        source: '/gtm/gtm.js',
        destination: 'https://www.googletagmanager.com/gtm.js',
      },
      {
        source: '/gtm/gtag/js',
        destination: 'https://www.googletagmanager.com/gtag/js',
      },
      // GA4 data collection endpoints - CRITICAL for realtime data
      // These endpoints receive the actual analytics data from the browser
      // The transport_url in GTM is set to https://stepleague.com/ga
      {
        source: '/ga/g/collect',
        destination: 'https://www.google-analytics.com/g/collect',
      },
      {
        source: '/ga/j/collect',
        destination: 'https://www.google-analytics.com/j/collect',
      },
      // Catch-all for any GA4 collection path variations
      {
        source: '/ga/:path*',
        destination: 'https://www.google-analytics.com/:path*',
      },
    ];
  },
};

// Default Workbox runtime caching rules from @ducanh2912/next-pwa
// We prepend a few "NetworkOnly" rules for third-party/telemetry scripts that are
// commonly blocked (adblock, privacy settings). This prevents noisy Workbox
// "no-response" errors when those requests fail.
const nextPwa = require("@ducanh2912/next-pwa");

const withPWA = nextPwa.default({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  // Exclude API and Admin routes from SW caching to avoid stale administrative data
  buildExcludes: [/middleware-manifest\.json$/],
  publicExcludes: ['!api/**/*', '!admin/**/*'],
  workboxOptions: {
    runtimeCaching: [
      // ============ AUTH ROUTES - NEVER CACHE ============
      // Supabase auth - MUST bypass service worker to prevent session issues
      { urlPattern: /^https:\/\/.*\.supabase\.co\/auth\//i, handler: "NetworkOnly" },
      { urlPattern: /^https:\/\/.*\.supabase\.co\/rest\//i, handler: "NetworkOnly" },
      { urlPattern: /^https:\/\/.*\.supabase\.co\/storage\//i, handler: "NetworkOnly" },

      // Local auth routes - sign-in, sign-out, callbacks, reset
      { urlPattern: /\/sign-in/i, handler: "NetworkOnly" },
      { urlPattern: /\/sign-up/i, handler: "NetworkOnly" },
      { urlPattern: /\/sign-out/i, handler: "NetworkOnly" },
      { urlPattern: /\/reset$/i, handler: "NetworkOnly" },
      { urlPattern: /\/api\/auth\//i, handler: "NetworkOnly" },
      { urlPattern: /\/claim\//i, handler: "NetworkOnly" },

      // ============ API ROUTES - NETWORK ONLY ============
      // OG images - always fetch fresh to avoid broken image caching
      { urlPattern: /\/api\/og/i, handler: "NetworkOnly" },
      // All other API routes should be network-first
      { urlPattern: /\/api\//i, handler: "NetworkOnly" },

      // ============ THIRD-PARTY - NETWORK ONLY ============
      // Third-party analytics (often blocked)
      { urlPattern: /^https:\/\/www\.googletagmanager\.com\/gtm\.js/i, handler: "NetworkOnly" },
      { urlPattern: /^https:\/\/www\.googletagmanager\.com\/gtag\/js/i, handler: "NetworkOnly" },

      // Vercel telemetry endpoints (can be blocked by privacy tools)
      { urlPattern: /\/_vercel\/(insights|speed-insights)\//i, handler: "NetworkOnly" },
      { urlPattern: /\/\.well-known\/vercel\/jwe$/i, handler: "NetworkOnly" },

      // Everything else: fall back to package defaults
      ...(nextPwa.runtimeCaching || []),
    ],
  },
});

module.exports = withPWA(nextConfig);
