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

export const metadata: Metadata = {
  title: "StepLeague",
  description: "Step competition with friends",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://stepleague.app"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Favicon and App Icons - Theme-aware using media queries */}
        {/* Dark mode: use sky-blue icons (light version) for visibility */}
        <link rel="icon" href="/favicon-16x16-light.png" sizes="16x16" type="image/png" media="(prefers-color-scheme: dark)" />
        <link rel="icon" href="/favicon-32x32-light.png" sizes="32x32" type="image/png" media="(prefers-color-scheme: dark)" />
        {/* Light mode: use deep-blue icons (dark version) for visibility */}
        <link rel="icon" href="/favicon-16x16.png" sizes="16x16" type="image/png" media="(prefers-color-scheme: light)" />
        <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png" media="(prefers-color-scheme: light)" />
        {/* PWA icons - dark version as default (works on both backgrounds) */}
        <link rel="icon" href="/icon-192.png" sizes="192x192" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        {/* Theme color matches browser chrome */}
        <meta name="theme-color" content="#f8fafc" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#020617" media="(prefers-color-scheme: dark)" />
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
