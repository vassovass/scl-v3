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
      // Supabase auth - MUST bypass service worker to prevent session issues
      { urlPattern: /^https:\/\/.*\.supabase\.co\/auth\//i, handler: "NetworkOnly" },
      { urlPattern: /^https:\/\/.*\.supabase\.co\/rest\//i, handler: "NetworkOnly" },
      { urlPattern: /^https:\/\/.*\.supabase\.co\/storage\//i, handler: "NetworkOnly" },

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
