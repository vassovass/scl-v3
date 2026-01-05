"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { APP_CONFIG } from "@/lib/config";

/**
 * Main Homepage - Strava-inspired dark design with hero imagery
 */
export default function HomePage() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && session) {
      router.replace("/dashboard");
    }
  }, [session, loading, router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="text-slate-400 animate-pulse">Loading...</div>
      </main>
    );
  }

  if (session) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* === HERO SECTION === */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20" />

        {/* Hero content - asymmetric layout: contained text, edge-to-edge image */}
        <div className="relative z-10 w-full grid lg:grid-cols-2 items-center">
          {/* Left: Text content - contained with padding */}
          <div className="text-center lg:text-left order-2 lg:order-1 px-6 lg:pl-12 xl:pl-24 py-20 lg:py-0">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] pb-2 animate-fade-slide">
              <span className="block text-foreground">Step</span>
              <span className="block bg-gradient-to-r from-sky-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent pb-1">
                League
              </span>
            </h1>

            <p className="mt-6 text-xl sm:text-2xl font-light text-muted-foreground animate-fade-slide animate-delay-100">
              Compete. Track. Win.
            </p>

            <p className="mt-4 text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0 animate-fade-slide animate-delay-200">
              {APP_CONFIG.tagline}. Upload step screenshots, get AI-verified,
              and climb the leaderboard against friends.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-slide animate-delay-300">
              <Link
                href="/sign-up"
                className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-black bg-gradient-to-r from-sky-400 to-cyan-400 rounded-full overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(56,189,248,0.4)]"
              >
                Get Started Free
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-foreground border-2 border-input rounded-full transition-all duration-300 hover:border-primary hover:text-primary"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Right: Hero image - extends to right edge */}
          <div className="relative order-1 lg:order-2 h-[50vh] lg:h-screen animate-fade-in animate-delay-200">
            {/* Glow effect behind image */}
            <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-purple-500/20 blur-3xl" />

            <Image
              src="/images/hero-fitness.png"
              alt="Step tracking on smartwatch"
              fill
              className="object-cover object-center relative z-10"
              priority
            />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* === HOW IT WORKS === */}
      <section className="py-24 bg-gradient-to-b from-background to-muted/50">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Three simple steps to start competing
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {/* Step 1 */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-sky-500/20 to-cyan-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition duration-500" />
              <div className="relative bg-card border border-border rounded-2xl p-8 h-full">
                <div className="w-14 h-14 bg-gradient-to-br from-sky-400 to-cyan-500 rounded-xl flex items-center justify-center text-2xl font-bold text-black mb-6">
                  1
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">Upload Screenshot</h3>
                <p className="text-muted-foreground">
                  Take a screenshot of your daily steps from any fitness app - Apple Health, Google Fit, Samsung Health, and more.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition duration-500" />
              <div className="relative bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 h-full">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center text-2xl font-bold text-black mb-6">
                  2
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">AI Verifies</h3>
                <p className="text-slate-400">
                  Our AI instantly reads your screenshot and verifies the step count - no cheating, no manual entry errors.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition duration-500" />
              <div className="relative bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 h-full">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center text-2xl font-bold text-black mb-6">
                  3
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Climb the Leaderboard</h3>
                <p className="text-slate-400">
                  See where you rank against friends in daily and weekly standings. Stay motivated and keep moving!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === FEATURES SECTION === */}
      <section className="py-24 bg-muted/20">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Features list */}
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-8">
                Everything you need to <br />
                <span className="bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">
                  compete with friends
                </span>
              </h2>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-sky-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">AI-Powered Verification</h3>
                    <p className="text-muted-foreground mt-1">Screenshots are verified by AI to prevent cheating and ensure fair competition.</p>>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Real-time Leaderboards</h3>
                    <p className="text-slate-400 mt-1">Daily and weekly rankings update instantly. See who&apos;s leading and catch up!</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Private Leagues</h3>
                    <p className="text-slate-400 mt-1">Create invite-only leagues and share a simple code with friends and family.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Analytics & Insights</h3>
                    <p className="text-slate-400 mt-1">Track your progress with calendar heatmaps, streaks, and personal bests.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Stats showcase */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 to-purple-500/10 blur-3xl" />
              <div className="relative bg-slate-800/50 border border-slate-700/50 rounded-3xl p-8 lg:p-12">
                <div className="grid grid-cols-2 gap-8">
                  <div className="text-center">
                    <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">
                      10K+
                    </div>
                    <div className="mt-2 text-sm text-slate-400 uppercase tracking-wider">Steps Tracked</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                      50+
                    </div>
                    <div className="mt-2 text-sm text-slate-400 uppercase tracking-wider">Active Leagues</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      100+
                    </div>
                    <div className="mt-2 text-sm text-slate-400 uppercase tracking-wider">Athletes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      99%
                    </div>
                    <div className="mt-2 text-sm text-slate-400 uppercase tracking-wider">AI Accuracy</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === FINAL CTA === */}
      <section className="py-24 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-t from-card to-background" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-5xl font-bold text-foreground">
            Ready to start competing?
          </h2>
          <p className="mt-6 text-xl text-muted-foreground">
            Join StepLeague for free and challenge your friends to move more.
          </p>
          <Link
            href="/sign-up"
            className="mt-10 inline-flex items-center justify-center px-10 py-5 text-xl font-semibold text-black bg-gradient-to-r from-sky-400 to-cyan-400 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-[0_0_50px_rgba(56,189,248,0.5)]"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer spacer */}
      <div className="h-12 bg-background" />
    </main>
  );
}
