"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";

/**
 * SUPERADMIN-ONLY: Design System & Brand Guidelines
 * 
 * This page showcases all design tokens and reusable components.
 * It should be updated whenever new design elements are added.
 * 
 * See: globals.css for the design tokens and utility classes
 */
export default function DesignSystemPage() {
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function checkSuperadmin() {
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );

            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.replace("/sign-in");
                return;
            }

            const { data: profile } = await supabase
                .from("users")
                .select("is_superadmin")
                .eq("id", user.id)
                .single();

            if (!profile?.is_superadmin) {
                router.replace("/dashboard");
                return;
            }

            setIsAuthorized(true);
            setLoading(false);
        }

        checkSuperadmin();
    }, [router]);

    if (loading) {
        return (
            <main className="min-h-screen bg-gradient-mesh flex items-center justify-center">
                <div className="text-slate-400 animate-pulse">Checking access...</div>
            </main>
        );
    }

    if (!isAuthorized) {
        return null;
    }

    return (
        <main className="min-h-screen bg-gradient-mesh">
            <div className="section-container py-12">
                {/* Header */}
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Design System</h1>
                        <p className="text-slate-400 mt-1">Brand guidelines & component library</p>
                    </div>
                    <Link href="/dashboard" className="btn-ghost text-sm">
                        ← Back to Dashboard
                    </Link>
                </div>

                {/* Logo & Branding Section */}
                <section className="mb-16">
                    <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                        Logo & Branding
                    </h2>

                    <div className="glass-card p-6">
                        <h3 className="text-sm font-medium text-slate-300 mb-4">Logo Treatment</h3>
                        <div className="flex flex-col sm:flex-row gap-8">
                            {/* Default State */}
                            <div className="space-y-3">
                                <p className="text-xs text-slate-500">Default State</p>
                                <div className="flex items-center gap-2 p-4 rounded-lg bg-slate-900 border border-slate-700">
                                    <span className="text-xl">👟</span>
                                    <span className="text-lg font-bold">
                                        <span className="text-slate-50">Step</span>
                                        <span className="text-sky-500">League</span>
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400">
                                    &quot;Step&quot; in white (slate-50), &quot;League&quot; in brand blue (sky-500)
                                </p>
                            </div>

                            {/* Hover State */}
                            <div className="space-y-3">
                                <p className="text-xs text-slate-500">Hover State (colors swap)</p>
                                <div className="flex items-center gap-2 p-4 rounded-lg bg-slate-900 border border-slate-700">
                                    <span className="text-xl">👟</span>
                                    <span className="text-lg font-bold">
                                        <span className="text-sky-400">Step</span>
                                        <span className="text-slate-50">League</span>
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400">
                                    On hover, colors invert: &quot;Step&quot; → sky-400, &quot;League&quot; → white
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-700">
                            <p className="text-xs text-slate-500 mb-2">Live Demo (hover me):</p>
                            <div className="inline-flex items-center gap-2 p-4 rounded-lg bg-slate-900 border border-slate-700 cursor-pointer group">
                                <span className="text-xl">👟</span>
                                <span className="text-lg font-bold">
                                    <span className="text-slate-50 transition-colors group-hover:text-sky-400">Step</span>
                                    <span className="text-sky-500 transition-colors group-hover:text-slate-50">League</span>
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-700">
                            <p className="text-xs text-slate-500 mb-4">Usage:</p>
                            <pre className="text-xs text-slate-400 bg-slate-900 p-4 rounded-lg overflow-x-auto">
                                {`<Link className="group flex items-center gap-2">
  <span className="text-xl">👟</span>
  <span className="text-lg font-bold">
    <span className="text-slate-50 transition-colors group-hover:text-sky-400">Step</span>
    <span className="text-sky-500 transition-colors group-hover:text-slate-50">League</span>
  </span>
</Link>`}
                            </pre>
                        </div>
                    </div>
                </section>
                <section className="mb-16">
                    <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                        Color Palette
                    </h2>

                    <div className="glass-card p-6">
                        <h3 className="text-sm font-medium text-slate-300 mb-4">Brand Colors</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <div className="h-16 rounded-lg bg-sky-500"></div>
                                <p className="text-xs text-slate-400">Primary (sky-500)</p>
                                <code className="text-xs text-sky-400">--brand-primary</code>
                            </div>
                            <div className="space-y-2">
                                <div className="h-16 rounded-lg bg-sky-400"></div>
                                <p className="text-xs text-slate-400">Primary Light</p>
                                <code className="text-xs text-sky-400">--brand-primary-light</code>
                            </div>
                            <div className="space-y-2">
                                <div className="h-16 rounded-lg bg-purple-500"></div>
                                <p className="text-xs text-slate-400">Accent (purple-500)</p>
                                <code className="text-xs text-sky-400">--brand-accent</code>
                            </div>
                            <div className="space-y-2">
                                <div className="h-16 rounded-lg bg-blue-500"></div>
                                <p className="text-xs text-slate-400">Accent Alt (blue-500)</p>
                                <code className="text-xs text-sky-400">--brand-accent-alt</code>
                            </div>
                        </div>

                        <h3 className="text-sm font-medium text-slate-300 mt-8 mb-4">Background Colors</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <div className="h-16 rounded-lg bg-[rgb(10,10,10)] border border-slate-700"></div>
                                <p className="text-xs text-slate-400">Base</p>
                                <code className="text-xs text-sky-400">--bg-base</code>
                            </div>
                            <div className="space-y-2">
                                <div className="h-16 rounded-lg bg-slate-900"></div>
                                <p className="text-xs text-slate-400">Elevated</p>
                                <code className="text-xs text-sky-400">--bg-elevated</code>
                            </div>
                            <div className="space-y-2">
                                <div className="h-16 rounded-lg bg-slate-800"></div>
                                <p className="text-xs text-slate-400">Card</p>
                                <code className="text-xs text-sky-400">--bg-card</code>
                            </div>
                            <div className="space-y-2">
                                <div className="h-16 rounded-lg bg-slate-700"></div>
                                <p className="text-xs text-slate-400">Card Hover</p>
                                <code className="text-xs text-sky-400">--bg-card-hover</code>
                            </div>
                        </div>

                        <h3 className="text-sm font-medium text-slate-300 mt-8 mb-4">Status Colors</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <div className="h-12 rounded-lg bg-green-500"></div>
                                <p className="text-xs text-slate-400">Success</p>
                            </div>
                            <div className="space-y-2">
                                <div className="h-12 rounded-lg bg-amber-400"></div>
                                <p className="text-xs text-slate-400">Warning</p>
                            </div>
                            <div className="space-y-2">
                                <div className="h-12 rounded-lg bg-red-500"></div>
                                <p className="text-xs text-slate-400">Error</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Typography Section */}
                <section className="mb-16">
                    <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                        Typography
                    </h2>

                    <div className="glass-card p-6 space-y-6">
                        <div>
                            <p className="text-xs text-slate-500 mb-2">Font: Inter</p>
                            <h1 className="text-4xl font-extrabold text-white">Heading 1 - Extra Bold</h1>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-white">Heading 2 - Bold</h2>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-white">Heading 3 - Semibold</h3>
                        </div>
                        <div>
                            <p className="text-base text-slate-300">Body text - Regular weight, slate-300</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Small text - slate-400 for secondary info</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">Extra small - slate-500 for muted content</p>
                        </div>

                        <div className="pt-4 border-t border-slate-700">
                            <p className="text-xs text-slate-500 mb-2">Gradient Text Effect</p>
                            <span className="text-3xl font-bold text-gradient">Gradient Text</span>
                        </div>

                        <div>
                            <p className="text-xs text-slate-500 mb-2">Glow Text Effect</p>
                            <span className="text-3xl font-bold text-white glow-text">Glow Text</span>
                        </div>
                    </div>
                </section>

                {/* Buttons Section */}
                <section className="mb-16">
                    <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Buttons
                    </h2>

                    <div className="glass-card p-6">
                        <div className="flex flex-wrap gap-4 items-center">
                            <button className="btn-primary">Primary Button</button>
                            <button className="btn-ghost">Ghost Button</button>
                            <button className="btn-primary animate-float">Floating Button</button>
                            <button className="btn-primary animate-pulse-glow">Pulse Glow</button>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-700">
                            <p className="text-xs text-slate-500 mb-4">Usage:</p>
                            <pre className="text-xs text-slate-400 bg-slate-900 p-4 rounded-lg overflow-x-auto">
                                {`<button className="btn-primary">Primary</button>
<button className="btn-ghost">Ghost</button>
<button className="btn-primary animate-float">Floating</button>`}
                            </pre>
                        </div>
                    </div>
                </section>

                {/* Cards Section */}
                <section className="mb-16">
                    <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Cards
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="glass-card p-6">
                            <h3 className="text-lg font-semibold text-white mb-2">Glass Card</h3>
                            <p className="text-sm text-slate-400">
                                Uses backdrop-blur for frosted glass effect. Perfect for content sections.
                            </p>
                            <code className="text-xs text-sky-400 mt-4 block">.glass-card</code>
                        </div>

                        <div className="glass-card card-glow p-6">
                            <h3 className="text-lg font-semibold text-white mb-2">Glow Card</h3>
                            <p className="text-sm text-slate-400">
                                Glass card with gradient glow on hover. Good for interactive elements.
                            </p>
                            <code className="text-xs text-sky-400 mt-4 block">.glass-card .card-glow</code>
                        </div>

                        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 hover:border-slate-700 transition">
                            <h3 className="text-lg font-semibold text-white mb-2">Simple Card</h3>
                            <p className="text-sm text-slate-400">
                                Basic bordered card without blur. Use for simpler UIs.
                            </p>
                            <code className="text-xs text-sky-400 mt-4 block">border + bg-slate-900/50</code>
                        </div>
                    </div>
                </section>

                {/* Animations Section */}
                <section className="mb-16">
                    <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        Animations
                    </h2>

                    <div className="glass-card p-6">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto bg-gradient-primary rounded-lg animate-float"></div>
                                <p className="text-xs text-slate-400 mt-2">Float</p>
                                <code className="text-xs text-sky-400">.animate-float</code>
                            </div>

                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto bg-gradient-primary rounded-lg animate-pulse"></div>
                                <p className="text-xs text-slate-400 mt-2">Pulse</p>
                                <code className="text-xs text-sky-400">.animate-pulse</code>
                            </div>

                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto bg-gradient-primary rounded-lg animate-pulse-glow"></div>
                                <p className="text-xs text-slate-400 mt-2">Pulse Glow</p>
                                <code className="text-xs text-sky-400">.animate-pulse-glow</code>
                            </div>

                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto bg-gradient-primary rounded-lg animate-fade-in"></div>
                                <p className="text-xs text-slate-400 mt-2">Fade In</p>
                                <code className="text-xs text-sky-400">.animate-fade-in</code>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Background Effects Section */}
                <section className="mb-16">
                    <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                        Background Effects
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="h-48 rounded-xl bg-gradient-mesh flex items-center justify-center border border-slate-700">
                            <div className="text-center">
                                <p className="text-sm font-medium text-white">Gradient Mesh</p>
                                <code className="text-xs text-sky-400">.bg-gradient-mesh</code>
                            </div>
                        </div>

                        <div className="h-48 rounded-xl bg-gradient-primary flex items-center justify-center">
                            <div className="text-center">
                                <p className="text-sm font-medium text-slate-950">Gradient Primary</p>
                                <code className="text-xs text-slate-800">.bg-gradient-primary</code>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Icons Section */}
                <section className="mb-16">
                    <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                        Feature Icons
                    </h2>

                    <div className="glass-card p-6">
                        <div className="flex flex-wrap gap-4">
                            <div className="feature-icon">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="feature-icon">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2z" />
                                </svg>
                            </div>
                            <div className="feature-icon">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857" />
                                </svg>
                            </div>
                        </div>
                        <code className="text-xs text-sky-400 mt-4 block">.feature-icon</code>
                    </div>
                </section>

                {/* Stats Badge Section */}
                <section className="mb-16">
                    <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        Stats Badge
                    </h2>

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

                {/* Badge Component Section */}
                <section className="mb-16">
                    <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        Badge Component
                    </h2>

                    <div className="glass-card p-6">
                        <p className="text-sm text-slate-400 mb-6">
                            Centralized badge system used across Kanban, Roadmap, and Leaderboard. All badges are defined in <code className="text-sky-400">src/lib/badges.ts</code>.
                        </p>

                        {/* Type Badges */}
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-slate-300 mb-3">Type Badges</h3>
                            <div className="flex flex-wrap gap-2">
                                <Badge category="type" value="bug" />
                                <Badge category="type" value="feature" />
                                <Badge category="type" value="improvement" />
                                <Badge category="type" value="general" />
                                <Badge category="type" value="positive" />
                                <Badge category="type" value="negative" />
                            </div>
                        </div>

                        {/* Status Badges */}
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-slate-300 mb-3">Status Badges</h3>
                            <div className="flex flex-wrap gap-2">
                                <Badge category="status" value="backlog" />
                                <Badge category="status" value="todo" />
                                <Badge category="status" value="in_progress" />
                                <Badge category="status" value="review" />
                                <Badge category="status" value="done" />
                            </div>
                        </div>

                        {/* Release Badges */}
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-slate-300 mb-3">Release Badges</h3>
                            <div className="flex flex-wrap gap-2">
                                <Badge category="release" value="now" />
                                <Badge category="release" value="next" />
                                <Badge category="release" value="later" />
                                <Badge category="release" value="future" />
                            </div>
                        </div>

                        {/* Achievement Badges */}
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-slate-300 mb-3">Achievement Badges</h3>
                            <div className="flex flex-wrap gap-2">
                                <Badge category="achievement" value="leader" />
                                <Badge category="achievement" value="most_improved" />
                                <Badge category="achievement" value="streak_7" />
                                <Badge category="achievement" value="streak_30" />
                                <Badge category="achievement" value="million_club" />
                            </div>
                        </div>

                        {/* Size Variants */}
                        <div className="mb-6 pt-6 border-t border-slate-700">
                            <h3 className="text-sm font-medium text-slate-300 mb-3">Size Variants</h3>
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="text-center">
                                    <Badge category="type" value="bug" size="sm" />
                                    <p className="text-xs text-slate-500 mt-1">sm</p>
                                </div>
                                <div className="text-center">
                                    <Badge category="type" value="bug" size="md" />
                                    <p className="text-xs text-slate-500 mt-1">md (default)</p>
                                </div>
                                <div className="text-center">
                                    <Badge category="type" value="bug" size="lg" />
                                    <p className="text-xs text-slate-500 mt-1">lg</p>
                                </div>
                            </div>
                        </div>

                        {/* Usage */}
                        <div className="pt-6 border-t border-slate-700">
                            <p className="text-xs text-slate-500 mb-4">Usage:</p>
                            <pre className="text-xs text-slate-400 bg-slate-900 p-4 rounded-lg overflow-x-auto">
                                {`import { Badge } from "@/components/ui/Badge";

<Badge category="type" value="bug" />
<Badge category="status" value="in_progress" size="sm" />
<Badge category="release" value="now" showLabel={false} />`}
                            </pre>
                        </div>
                    </div>
                </section>

                {/* Component Library Section */}
                <section className="mb-16">
                    <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Component Library
                    </h2>

                    <div className="glass-card p-6">
                        <p className="text-sm text-slate-400 mb-6">
                            Reusable components organized by category. All components use CSS variables for theme compatibility.
                        </p>

                        {/* UI Components */}
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                                <span className="text-sky-400">📦</span> UI Components
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-sky-400">DatePicker</code>
                                    <p className="text-xs text-slate-500 mt-1">Calendar date selection with range support</p>
                                    <p className="text-xs text-slate-600 mt-1">ui/DatePicker.tsx</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-sky-400">ShareButton</code>
                                    <p className="text-xs text-slate-500 mt-1">Social sharing with Web Share API fallback</p>
                                    <p className="text-xs text-slate-600 mt-1">ui/ShareButton.tsx</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-sky-400">ModuleFeedback</code>
                                    <p className="text-xs text-slate-500 mt-1">Floating feedback button for any page section</p>
                                    <p className="text-xs text-slate-600 mt-1">ui/ModuleFeedback.tsx</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-sky-400">Spinner</code>
                                    <p className="text-xs text-slate-500 mt-1">Loading indicator with sizes</p>
                                    <div className="flex items-center gap-4 mt-2 text-sky-400">
                                        <Spinner size="sm" />
                                        <Spinner size="md" />
                                        <Spinner size="lg" />
                                    </div>
                                    <p className="text-xs text-slate-600 mt-1">ui/Spinner.tsx</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-sky-400">AchievementShareCard</code>
                                    <p className="text-xs text-slate-500 mt-1">Shareable achievement/stats card with download</p>
                                    <p className="text-xs text-slate-600 mt-1">ui/AchievementShareCard.tsx</p>
                                </div>
                            </div>
                        </div>

                        {/* Form Components */}
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                                <span className="text-purple-400">📝</span> Form Components
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-sky-400">SubmissionForm</code>
                                    <p className="text-xs text-slate-500 mt-1">Single step entry with AI verification</p>
                                    <p className="text-xs text-slate-600 mt-1">forms/SubmissionForm.tsx</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-sky-400">BatchSubmissionForm</code>
                                    <p className="text-xs text-slate-500 mt-1">Multi-image upload with bulk processing</p>
                                    <p className="text-xs text-slate-600 mt-1">forms/BatchSubmissionForm.tsx</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-sky-400">BulkUnverifiedForm</code>
                                    <p className="text-xs text-slate-500 mt-1">Quick manual entry for multiple dates</p>
                                    <p className="text-xs text-slate-600 mt-1">forms/BulkUnverifiedForm.tsx</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-sky-400">JoinLeagueForm</code>
                                    <p className="text-xs text-slate-500 mt-1">Invite code entry form</p>
                                    <p className="text-xs text-slate-600 mt-1">forms/JoinLeagueForm.tsx</p>
                                </div>
                            </div>
                        </div>

                        {/* Analytics Components */}
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                                <span className="text-amber-400">📊</span> Analytics Components
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-sky-400">CalendarHeatmap</code>
                                    <p className="text-xs text-slate-500 mt-1">GitHub-style activity heatmap</p>
                                    <p className="text-xs text-slate-600 mt-1">analytics/CalendarHeatmap.tsx</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-sky-400">DailyBreakdownTable</code>
                                    <p className="text-xs text-slate-500 mt-1">Tabular view with period grouping</p>
                                    <p className="text-xs text-slate-600 mt-1">analytics/DailyBreakdownTable.tsx</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-sky-400">PersonalStatsCard</code>
                                    <p className="text-xs text-slate-500 mt-1">User achievements and records</p>
                                    <p className="text-xs text-slate-600 mt-1">analytics/PersonalStatsCard.tsx</p>
                                </div>
                            </div>
                        </div>

                        {/* League Components */}
                        <div>
                            <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                                <span className="text-rose-400">🏆</span> League Components
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-sky-400">LeagueInviteControl</code>
                                    <p className="text-xs text-slate-500 mt-1">Invite code display and sharing</p>
                                    <p className="text-xs text-slate-600 mt-1">league/LeagueInviteControl.tsx</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-sky-400">ProxyMembersDropdown</code>
                                    <p className="text-xs text-slate-500 mt-1">Select user for proxy submissions</p>
                                    <p className="text-xs text-slate-600 mt-1">league/ProxyMembersDropdown.tsx</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-sky-400">ProxyMemberManagement</code>
                                    <p className="text-xs text-slate-500 mt-1">Admin panel for proxy users</p>
                                    <p className="text-xs text-slate-600 mt-1">league/ProxyMemberManagement.tsx</p>
                                </div>
                            </div>
                        </div>

                        {/* Layout Components */}
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                                <span className="text-cyan-400">🖼️</span> Layout Components
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-sky-400">PageLayout</code>
                                    <p className="text-xs text-slate-500 mt-1">Orchestrator for header, loading, empty, and content states</p>
                                    <p className="text-xs text-slate-600 mt-1">layout/PageLayout.tsx</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-sky-400">PageHeader</code>
                                    <p className="text-xs text-slate-500 mt-1">Title, subtitle, actions, breadcrumbs with analytics</p>
                                    <p className="text-xs text-slate-600 mt-1">layout/PageHeader.tsx</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-sky-400">EmptyState</code>
                                    <p className="text-xs text-slate-500 mt-1">Configurable empty state with icons, descriptions, CTAs</p>
                                    <p className="text-xs text-slate-600 mt-1">layout/EmptyState.tsx</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-sky-400">LoadingSkeleton</code>
                                    <p className="text-xs text-slate-500 mt-1">Multiple variants: list, cards, table, content</p>
                                    <p className="text-xs text-slate-600 mt-1">layout/LoadingSkeleton.tsx</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-sky-400">GlobalFooter</code>
                                    <p className="text-xs text-slate-500 mt-1">Site-wide footer with navigation links</p>
                                    <p className="text-xs text-slate-600 mt-1">layout/GlobalFooter.tsx</p>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Components */}
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                                <span className="text-indigo-400">🧭</span> Navigation Components
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-sky-400">NavHeader</code>
                                    <p className="text-xs text-slate-500 mt-1">Main navigation with dropdowns and mobile menu</p>
                                    <p className="text-xs text-slate-600 mt-1">navigation/NavHeader.tsx</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-sky-400">NavDropdown</code>
                                    <p className="text-xs text-slate-500 mt-1">Reusable animated dropdown menu</p>
                                    <p className="text-xs text-slate-600 mt-1">navigation/NavDropdown.tsx</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-sky-400">MobileMenu</code>
                                    <p className="text-xs text-slate-500 mt-1">Responsive drawer for small screens</p>
                                    <p className="text-xs text-slate-600 mt-1">navigation/MobileMenu.tsx</p>
                                </div>
                            </div>
                        </div>

                        {/* Provider Components */}
                        <div>
                            <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                                <span className="text-pink-400">⚙️</span> Provider Components
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-sky-400">AuthProvider</code>
                                    <p className="text-xs text-slate-500 mt-1">Supabase auth context and session management</p>
                                    <p className="text-xs text-slate-600 mt-1">providers/AuthProvider.tsx</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-sky-400">OnboardingProvider</code>
                                    <p className="text-xs text-slate-500 mt-1">Guided tour system with role-based steps</p>
                                    <p className="text-xs text-slate-600 mt-1">providers/OnboardingProvider.tsx</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Page Templates Section */}
                <section className="mb-16">
                    <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                        Page Templates
                    </h2>

                    <div className="glass-card p-6">
                        <p className="text-sm text-slate-400 mb-6">
                            Common page layout patterns used across the application.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                <code className="text-sky-400">Dashboard Layout</code>
                                <p className="text-xs text-slate-500 mt-1">NavHeader + content + GlobalFooter wrapper</p>
                                <p className="text-xs text-slate-600 mt-1">(dashboard)/layout.tsx</p>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                <code className="text-sky-400">Auth Layout</code>
                                <p className="text-xs text-slate-500 mt-1">Centered card for sign-in/sign-up</p>
                                <p className="text-xs text-slate-600 mt-1">(auth)/sign-in, sign-up</p>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                <code className="text-sky-400">League Detail</code>
                                <p className="text-xs text-slate-500 mt-1">Submission form + leaderboard + analytics tabs</p>
                                <p className="text-xs text-slate-600 mt-1">league/[id]/*</p>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                <code className="text-sky-400">Static Page</code>
                                <p className="text-xs text-slate-500 mt-1">section-container with prose content</p>
                                <p className="text-xs text-slate-600 mt-1">privacy, terms, security, beta</p>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                <code className="text-sky-400">Settings Page</code>
                                <p className="text-xs text-slate-500 mt-1">Form sections with glass-card containers</p>
                                <p className="text-xs text-slate-600 mt-1">settings/profile</p>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                <code className="text-sky-400">Share Page</code>
                                <p className="text-xs text-slate-500 mt-1">Public shareable content with OG images</p>
                                <p className="text-xs text-slate-600 mt-1">share/[id], invite/[code]</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Common UI Patterns Section */}
                <section className="mb-16">
                    <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                        Common UI Patterns
                    </h2>

                    <div className="glass-card p-6">
                        <p className="text-sm text-slate-400 mb-6">
                            Consistent styling patterns used across forms and UI elements. Use these exact patterns for consistency.
                        </p>

                        {/* Form Inputs */}
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-slate-300 mb-3">Form Inputs</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Text Input</label>
                                    <input
                                        type="text"
                                        placeholder="Example input..."
                                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 focus:border-sky-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Disabled Input</label>
                                    <input
                                        type="text"
                                        value="Read-only value"
                                        disabled
                                        className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3 text-slate-400 cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Select</label>
                                    <select className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 focus:border-sky-500 focus:outline-none">
                                        <option>Option 1</option>
                                        <option>Option 2</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Alerts/Messages */}
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-slate-300 mb-3">Alert Messages</h3>
                            <div className="space-y-3">
                                <div className="rounded-lg p-4 bg-emerald-900/20 border border-emerald-700 text-emerald-400 text-sm">
                                    ✓ Success message example
                                </div>
                                <div className="rounded-lg p-4 bg-rose-900/20 border border-rose-700 text-rose-400 text-sm">
                                    ✗ Error message example
                                </div>
                                <div className="rounded-lg p-4 bg-amber-900/20 border border-amber-700 text-amber-400 text-sm">
                                    ⚠ Warning message example
                                </div>
                                <div className="rounded-lg p-4 bg-sky-900/20 border border-sky-700 text-sky-400 text-sm">
                                    ℹ Info message example
                                </div>
                            </div>
                        </div>

                        {/* Usage Note */}
                        <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                            <p className="text-xs text-slate-500">
                                <strong className="text-slate-400">Modularization Note:</strong> If you find these patterns repeated 3+ times,
                                extract into a reusable component (e.g., Input, Select, Alert).
                            </p>
                        </div>
                    </div>
                </section>

                {/* Theme Support Note */}
                <section className="glass-card p-6 border-l-4 border-sky-500 mb-16">
                    <h3 className="text-lg font-semibold text-sky-400 mb-2">🌓 Theme Support</h3>
                    <p className="text-sm text-slate-400 mb-3">
                        All components are built with CSS variables for light/dark mode compatibility.
                        Currently dark mode is active. Light mode is ready to enable by adding <code className="text-sky-400">data-theme=&quot;light&quot;</code> to the HTML element.
                    </p>
                    <div className="text-xs text-slate-500">
                        <strong>When adding new components:</strong> Always use CSS variables from <code className="text-sky-400">globals.css</code> instead of hardcoded Tailwind colors.
                    </div>
                </section>

                {/* Documentation Note */}
                <section className="glass-card p-6 border-l-4 border-amber-500">
                    <h3 className="text-lg font-semibold text-amber-400 mb-2">⚠️ Maintenance Note</h3>
                    <p className="text-sm text-slate-400">
                        This design system page must be updated whenever new design tokens, utility classes,
                        or reusable components are added. See <code className="text-sky-400">AGENTS.md</code> for documentation rules.
                    </p>
                </section>
            </div>
        </main>
    );
}
