"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { APP_CONFIG } from "@/lib/config";

export default function HomePage() {
  const { session, loading } = useAuth();
  const router = useRouter();

  // Auto-redirect logged-in users to dashboard
  useEffect(() => {
    if (!loading && session) {
      router.replace("/dashboard");
    }
  }, [session, loading, router]);

  // Show loading or nothing while checking auth
  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="text-slate-400">Loading...</div>
      </main>
    );
  }

  // If logged in, show nothing (redirect in progress)
  if (session) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12">
      {/* Hero Section */}
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-50 sm:text-5xl">
          <span>Step</span>
          <span className="text-sky-500">League</span>
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-400 sm:mt-6 sm:text-lg">
          {APP_CONFIG.tagline}.
          Submit your daily steps, get AI-verified, and climb the leaderboard.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-4">
          <Link
            href="/sign-up"
            className="w-full rounded-lg bg-sky-500 px-6 py-3 text-center text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-sky-400 sm:w-auto"
          >
            Get Started
          </Link>
          <Link
            href="/sign-in"
            className="w-full rounded-lg border border-slate-700 px-6 py-3 text-center text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-slate-50 sm:w-auto"
          >
            Sign In
          </Link>
        </div>
      </div>

      {/* Features - Compact cards with inline icons */}
      <div className="mx-auto mt-16 max-w-3xl sm:mt-20">
        <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-4">
          {/* Feature 1 */}
          <div className="flex items-start gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4 transition hover:border-slate-700 sm:flex-col sm:items-center sm:text-center sm:p-5">
            <span className="text-2xl sm:text-3xl sm:mb-2">📱</span>
            <div className="flex-1 sm:flex-none">
              <h3 className="text-sm font-semibold text-slate-100 sm:text-base">Screenshot Proof</h3>
              <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                Upload from your fitness app. AI verifies your steps.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex items-start gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4 transition hover:border-slate-700 sm:flex-col sm:items-center sm:text-center sm:p-5">
            <span className="text-2xl sm:text-3xl sm:mb-2">🏆</span>
            <div className="flex-1 sm:flex-none">
              <h3 className="text-sm font-semibold text-slate-100 sm:text-base">Leaderboards</h3>
              <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                See how you rank. Daily and weekly standings.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex items-start gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4 transition hover:border-slate-700 sm:flex-col sm:items-center sm:text-center sm:p-5">
            <span className="text-2xl sm:text-3xl sm:mb-2">👥</span>
            <div className="flex-1 sm:flex-none">
              <h3 className="text-sm font-semibold text-slate-100 sm:text-base">Private Leagues</h3>
              <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                Create a league and invite friends with a code.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
