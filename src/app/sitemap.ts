import { MetadataRoute } from "next";
import { getAllCompetitorSlugs } from "@/lib/compare/comparisons";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://stepleague.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  // Static public pages with SEO tuning
  const staticPages: MetadataRoute.Sitemap = [
    // Homepage — highest priority
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },

    // SEO landing pages — high priority
    { url: `${BASE_URL}/step-challenge-app`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/walking-challenge-with-friends`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/workplace-step-challenge`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },

    // Core public pages
    { url: `${BASE_URL}/how-it-works`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/teams`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/compare`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },

    // Secondary pages
    { url: `${BASE_URL}/teams/features`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/teams/waitlist`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/why-upload`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/how-to-share`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },

    // Informational
    { url: `${BASE_URL}/stage-info`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/roadmap`, lastModified: now, changeFrequency: "weekly", priority: 0.4 },

    // Legal — low priority, rarely changes
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/security`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  // Dynamic comparison pages from competitor registry
  const comparisonPages: MetadataRoute.Sitemap = getAllCompetitorSlugs().map(
    (slug) => ({
      url: `${BASE_URL}/compare/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })
  );

  return [...staticPages, ...comparisonPages];
}
