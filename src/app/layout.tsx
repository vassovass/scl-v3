import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import {
  GoogleTagManager,
  GoogleTagManagerNoscript,
  CookieConsentBanner
} from "@/components/analytics";
import { createAdminClient } from "@/lib/supabase/server";
import { DEFAULT_BRANDING, getFullLogoText } from "@/lib/branding";
import { getCachedBranding } from "@/lib/branding-server";


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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* GTM: Consent defaults + script (must be in head) */}
        <GoogleTagManager />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {/* GTM noscript fallback (immediately after body open) */}
        <GoogleTagManagerNoscript />

        <ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem>
          <AuthProvider>
            {children}
            <FeedbackWidget />
            <Toaster />
          </AuthProvider>
        </ThemeProvider>

        {/* Cookie consent banner (renders at bottom of page) */}
        <CookieConsentBanner />

        {/* Vercel Analytics (separate from GA4) */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
