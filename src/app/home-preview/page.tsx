"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { APP_CONFIG } from "@/lib/config";

/**
 * PREVIEW: New Strava-inspired dark home page
 * Visit /home-preview to see this design
 * Once approved, this will replace src/app/page.tsx
 */
export default function HomePreviewPage() {
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
            <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-mesh">
                <div className="text-slate-400 animate-pulse">Loading...</div>
            </main>
        );
    }

    // If logged in, show nothing (redirect in progress)
    if (session) {
        return null;
    }

    return (
        <main className="min-h-screen bg-gradient-mesh">
            {/* Hero Section */}
            <section className="section-container py-16 sm:py-24 lg:py-32">
                <div className="max-w-3xl mx-auto text-center stagger-children">
                    {/* Brand Title */}
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight glow-text">
                        <span className="text-white">Step</span>
                        <span className="text-gradient">League</span>
                    </h1>

                    {/* Tagline */}
                    <p className="mt-6 text-lg sm:text-xl lg:text-2xl font-medium text-slate-300">
                        Compete. Track. Win.
                    </p>

                    {/* Description */}
                    <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-xl mx-auto">
                        {APP_CONFIG.tagline}. Upload your step screenshots,
                        get AI-verified, and climb the leaderboard with friends.
                    </p>

                    {/* CTAs */}
                    <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/sign-up" className="btn-primary text-base px-8 py-3">
                            Get Started Free
                        </Link>
                        <Link href="/sign-in" className="btn-ghost text-base px-8 py-3">
                            Sign In
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="section-container py-16 sm:py-20">
                <div className="text-center mb-12">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">
                        Why StepLeague?
                    </h2>
                    <p className="mt-2 text-slate-400">
                        Everything you need to compete with friends
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 stagger-children">
                    {/* Feature 1: AI Verification */}
                    <div className="glass-card card-glow p-6 text-center">
                        <div className="feature-icon mx-auto mb-4">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">AI Verification</h3>
                        <p className="text-sm text-slate-400">
                            Upload screenshots from any fitness app. Our AI instantly verifies your step count.
                        </p>
                    </div>

                    {/* Feature 2: Real-time Leaderboards */}
                    <div className="glass-card card-glow p-6 text-center">
                        <div className="feature-icon mx-auto mb-4">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Live Leaderboards</h3>
                        <p className="text-sm text-slate-400">
                            Track daily and weekly rankings. See who&apos;s leading and who&apos;s catching up.
                        </p>
                    </div>

                    {/* Feature 3: Private Leagues */}
                    <div className="glass-card card-glow p-6 text-center">
                        <div className="feature-icon mx-auto mb-4">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Private Leagues</h3>
                        <p className="text-sm text-slate-400">
                            Create leagues and invite friends with a simple code. Compete privately.
                        </p>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="section-container py-16 sm:py-20">
                <div className="text-center mb-12">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">
                        How It Works
                    </h2>
                </div>

                <div className="max-w-2xl mx-auto">
                    <div className="relative">
                        {/* Connecting line */}
                        <div className="absolute left-6 top-8 bottom-8 w-px bg-gradient-to-b from-sky-500/50 via-purple-500/50 to-sky-500/50 hidden sm:block" />

                        <div className="space-y-8 stagger-children">
                            {/* Step 1 */}
                            <div className="flex items-start gap-4 sm:gap-6">
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-lg font-bold text-slate-950">
                                    1
                                </div>
                                <div className="pt-2">
                                    <h3 className="text-lg font-semibold text-white">Upload Screenshot</h3>
                                    <p className="text-sm text-slate-400 mt-1">
                                        Take a screenshot of your steps from any fitness app
                                    </p>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="flex items-start gap-4 sm:gap-6">
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-lg font-bold text-slate-950">
                                    2
                                </div>
                                <div className="pt-2">
                                    <h3 className="text-lg font-semibold text-white">AI Verifies</h3>
                                    <p className="text-sm text-slate-400 mt-1">
                                        Our AI instantly reads and verifies your step count
                                    </p>
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="flex items-start gap-4 sm:gap-6">
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-lg font-bold text-slate-950">
                                    3
                                </div>
                                <div className="pt-2">
                                    <h3 className="text-lg font-semibold text-white">Climb the Leaderboard</h3>
                                    <p className="text-sm text-slate-400 mt-1">
                                        Compete with friends and see who takes the crown
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="section-container py-12">
                <div className="glass-card py-8 px-4">
                    <div className="grid grid-cols-3 divide-x divide-slate-700/50">
                        <div className="stat-badge">
                            <span className="stat-value">10K+</span>
                            <span className="stat-label">Steps Tracked</span>
                        </div>
                        <div className="stat-badge">
                            <span className="stat-value">50+</span>
                            <span className="stat-label">Active Leagues</span>
                        </div>
                        <div className="stat-badge">
                            <span className="stat-value">100+</span>
                            <span className="stat-label">Athletes</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="section-container py-16 sm:py-24 text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                    Ready to compete?
                </h2>
                <p className="text-slate-400 mb-8 max-w-md mx-auto">
                    Join StepLeague for free and start competing with friends today.
                </p>
                <Link
                    href="/sign-up"
                    className="btn-primary text-base px-10 py-4 animate-float inline-block"
                >
                    Get Started Free
                </Link>
            </section>

            {/* Footer spacer */}
            <div className="h-8" />
        </main>
    );
}
