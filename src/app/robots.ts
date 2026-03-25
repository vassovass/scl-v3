import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://stepleague.app";

// Auth and dashboard routes that should never be indexed
const PRIVATE_ROUTES = [
  "/dashboard",
  "/admin",
  "/settings",
  "/api/",
  "/submit-steps",
  "/my-stats",
  "/progress",
  "/join",
  "/league/",
  "/challenges",
  "/reset",
  "/beta",
  "/feedback",
  "/sign-in",
  "/sign-up",
  "/reset-password",
  "/update-password",
  "/claim/",
  "/invite/",
];

// Minimal disallow list for AI crawlers (they only need public content)
const AI_PRIVATE_ROUTES = ["/dashboard", "/admin", "/api/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Default rules for all crawlers
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE_ROUTES,
      },
      // AI crawlers — explicitly welcomed with minimal restrictions
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: AI_PRIVATE_ROUTES,
      },
      {
        userAgent: "ClaudeBot",
        allow: "/",
        disallow: AI_PRIVATE_ROUTES,
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: AI_PRIVATE_ROUTES,
      },
      {
        userAgent: "Applebot-Extended",
        allow: "/",
        disallow: AI_PRIVATE_ROUTES,
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
        disallow: AI_PRIVATE_ROUTES,
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
