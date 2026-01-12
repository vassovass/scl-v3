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

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  // Exclude API and Admin routes from SW caching to avoid stale administrative data
  buildExcludes: [/middleware-manifest\.json$/],
  publicExcludes: ['!api/**/*', '!admin/**/*'],
});

module.exports = withPWA(nextConfig);
