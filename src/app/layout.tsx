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

/**
 * Generate dynamic metadata based on brand settings from database.
 * Falls back to defaults if database is unavailable.
 */
export async function generateMetadata(): Promise<Metadata> {
  let branding = DEFAULT_BRANDING;

  try {
    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from('brand_settings')
      .select('*')
      .single();

    if (data) {
      branding = {
        logo: {
          emoji: data.logo_emoji,
          textPrimary: data.logo_text_primary,
          textSecondary: data.logo_text_secondary,
          imageUrl: data.logo_image_url || undefined,
          imageUrlDark: data.logo_image_url_dark || undefined,
        },
        favicon: {
          favicon32: data.favicon_32,
          favicon16: data.favicon_16,
          faviconSvg: data.favicon_svg || undefined,
          appleTouchIcon: data.apple_touch_icon,
          icon192: data.icon_192,
          icon512: data.icon_512,
          iconMaskable: data.icon_maskable || undefined,
        },
        themeColorLight: data.theme_color_light,
        themeColorDark: data.theme_color_dark,
      };
    }
  } catch (error) {
    console.warn('Failed to fetch branding metadata, using defaults:', error);
  }

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
