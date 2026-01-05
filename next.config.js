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
