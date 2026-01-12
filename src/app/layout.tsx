import type { Metadata } from "next";
import dynamic from "next/dynamic";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import {
  GoogleTagManager,
  GoogleTagManagerNoscript,
} from "@/components/analytics";
import { createAdminClient } from "@/lib/supabase/server";
import { DEFAULT_BRANDING, getFullLogoText } from "@/lib/branding";
import { getCachedBranding } from "@/lib/branding-server";
import { SafeLazy } from "@/components/ui/SafeLazy";

// Lazy load heavy widgets with SafeLazy protection
const FeedbackWidget = dynamic(
  () => import("@/components/feedback/FeedbackWidget").then((mod) => mod.FeedbackWidget),
  { ssr: false } // Client-side only
);

const CookieConsentBanner = dynamic(
  () => import("@/components/analytics/CookieConsent").then((mod) => mod.CookieConsentBanner),
  { ssr: false }
);

/**
 * Generate dynamic metadata based on brand settings from database.
 * Falls back to defaults if database is unavailable.
 */
export async function generateMetadata(): Promise<Metadata> {
  const branding = await getCachedBranding();

  return {
    title: getFullLogoText(branding),
    description: "Step competition with friends",
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://stepleague.app"),

    icons: {
      icon: [
        { url: branding.favicon.favicon16, sizes: '16x16', type: 'image/png' },
        { url: branding.favicon.favicon32, sizes: '32x32', type: 'image/png' },
      ],
      apple: [
        { url: branding.favicon.appleTouchIcon, sizes: '180x180', type: 'image/png' },
      ],
    },
    themeColor: [
      { media: '(prefers-color-scheme: light)', color: branding.themeColorLight },
      { media: '(prefers-color-scheme: dark)', color: branding.themeColorDark },
    ],
  };
}

/**
 * Hybrid Sync Bridge
 * Passes the server-side cache version to the client cache manager.
 */
import { HybridCacheSync } from "@/components/providers/HybridCacheSync";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Generate a version hash based on branding update time (or a global system tick)
  // For now, using branding timestamp as proxy for "System Config Version"
  const branding = await getCachedBranding();
  // Simple hash or timestamp string
  const serverVersion = branding.updated_at || new Date().toISOString().slice(0, 10);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* GTM: Consent defaults + script (must be in head) */}
        <GoogleTagManager />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {/* GTM noscript fallback (immediately after body open) */}
        <GoogleTagManagerNoscript />

        {/* Hybrid Sync: Bridges Server Cache -> Client Cache */}
        <HybridCacheSync serverVersion={serverVersion} />

        <ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem>
          <AuthProvider>
            {children}

            <SafeLazy>
              <FeedbackWidget />
            </SafeLazy>

            <Toaster />
          </AuthProvider>
        </ThemeProvider>

        {/* Cookie consent banner (renders at bottom of page) */}
        <SafeLazy>
          <CookieConsentBanner />
        </SafeLazy>

        {/* Vercel Analytics (separate from GA4) */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
