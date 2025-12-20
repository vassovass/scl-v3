import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "StepCountLeague",
  description: "Compete with friends in step counting challenges",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-50 antialiased">
        <AuthProvider>{children}</AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}

