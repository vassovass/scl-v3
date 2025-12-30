import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget";
import { Analytics } from "@vercel/analytics/next";
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
    <html lang="en">
      <head>
        {/* GTM: Consent defaults + script (must be in head) */}
        <GoogleTagManager />
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-50 antialiased">
        {/* GTM noscript fallback (immediately after body open) */}
        <GoogleTagManagerNoscript />

        <AuthProvider>
          {children}
          <FeedbackWidget />
        </AuthProvider>

        {/* Cookie consent banner (renders at bottom of page) */}
        <CookieConsentBanner />

        {/* Vercel Analytics (separate from GA4) */}
        <Analytics />
      </body>
    </html>
  );
}
