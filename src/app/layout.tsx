import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget";
import { Analytics } from "@vercel/analytics/next";

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
      <body className="min-h-screen bg-slate-950 text-slate-50 antialiased">
        <AuthProvider>
          {children}
          <FeedbackWidget />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}

