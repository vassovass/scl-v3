"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { Spinner } from "@/components/ui/Spinner";
import { SystemBadge as Badge } from "@/components/ui/SystemBadge";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
                                        <span className="text-primary">Step</span>
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
                                    <span className="text-slate-50 transition-colors group-hover:text-primary">Step</span>
                                    <span className="text-primary transition-colors group-hover:text-slate-50">League</span>
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-700">
                            <p className="text-xs text-slate-500 mb-4">Usage:</p>
                            <pre className="text-xs text-slate-400 bg-slate-900 p-4 rounded-lg overflow-x-auto">
                                {`<Link className="group flex items-center gap-2">
  <span className="text-xl">👟</span>
  <span className="text-lg font-bold">
    <span className="text-slate-50 transition-colors group-hover:text-primary">Step</span>
    <span className="text-primary transition-colors group-hover:text-slate-50">League</span>
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
                                <code className="text-xs text-primary">--brand-primary</code>
                            </div>
                            <div className="space-y-2">
                                <div className="h-16 rounded-lg bg-sky-400"></div>
                                <p className="text-xs text-slate-400">Primary Light</p>
                                <code className="text-xs text-primary">--brand-primary-light</code>
                            </div>
                            <div className="space-y-2">
                                <div className="h-16 rounded-lg bg-purple-500"></div>
                                <p className="text-xs text-slate-400">Accent (purple-500)</p>
                                <code className="text-xs text-primary">--brand-accent</code>
                            </div>
                            <div className="space-y-2">
                                <div className="h-16 rounded-lg bg-blue-500"></div>
                                <p className="text-xs text-slate-400">Accent Alt (blue-500)</p>
                                <code className="text-xs text-primary">--brand-accent-alt</code>
                            </div>
                        </div>

                        <h3 className="text-sm font-medium text-slate-300 mt-8 mb-4">Background Colors</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <div className="h-16 rounded-lg bg-[rgb(10,10,10)] border border-slate-700"></div>
                                <p className="text-xs text-slate-400">Base</p>
                                <code className="text-xs text-primary">--bg-base</code>
                            </div>
                            <div className="space-y-2">
                                <div className="h-16 rounded-lg bg-slate-900"></div>
                                <p className="text-xs text-slate-400">Elevated</p>
                                <code className="text-xs text-primary">--bg-elevated</code>
                            </div>
                            <div className="space-y-2">
                                <div className="h-16 rounded-lg bg-slate-800"></div>
                                <p className="text-xs text-slate-400">Card</p>
                                <code className="text-xs text-primary">--bg-card</code>
                            </div>
                            <div className="space-y-2">
                                <div className="h-16 rounded-lg bg-slate-700"></div>
                                <p className="text-xs text-slate-400">Card Hover</p>
                                <code className="text-xs text-primary">--bg-card-hover</code>
                            </div>
                        </div>

                        <h3 className="text-sm font-medium text-slate-300 mt-8 mb-4">Status Colors</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <div className="h-12 rounded-lg bg-green-500"></div>
                                <p className="text-xs text-slate-400">Success</p>
                            </div>
                            <div className="space-y-2">
                                <div className="h-12 rounded-lg bg-[hsl(var(--warning))]"></div>
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
                            <code className="text-xs text-primary mt-4 block">.glass-card</code>
                        </div>

                        <div className="glass-card card-glow p-6">
                            <h3 className="text-lg font-semibold text-white mb-2">Glow Card</h3>
                            <p className="text-sm text-slate-400">
                                Glass card with gradient glow on hover. Good for interactive elements.
                            </p>
                            <code className="text-xs text-primary mt-4 block">.glass-card .card-glow</code>
                        </div>

                        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 hover:border-slate-700 transition">
                            <h3 className="text-lg font-semibold text-white mb-2">Simple Card</h3>
                            <p className="text-sm text-slate-400">
                                Basic bordered card without blur. Use for simpler UIs.
                            </p>
                            <code className="text-xs text-primary mt-4 block">border + bg-slate-900/50</code>
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
                                <code className="text-xs text-primary">.animate-float</code>
                            </div>

                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto bg-gradient-primary rounded-lg animate-pulse"></div>
                                <p className="text-xs text-slate-400 mt-2">Pulse</p>
                                <code className="text-xs text-primary">.animate-pulse</code>
                            </div>

                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto bg-gradient-primary rounded-lg animate-pulse-glow"></div>
                                <p className="text-xs text-slate-400 mt-2">Pulse Glow</p>
                                <code className="text-xs text-primary">.animate-pulse-glow</code>
                            </div>

                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto bg-gradient-primary rounded-lg animate-fade-in"></div>
                                <p className="text-xs text-slate-400 mt-2">Fade In</p>
                                <code className="text-xs text-primary">.animate-fade-in</code>
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
                                <code className="text-xs text-primary">.bg-gradient-mesh</code>
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
                        <code className="text-xs text-primary mt-4 block">.feature-icon</code>
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
                            Centralized badge system used across Kanban, Roadmap, and Leaderboard. All badges are defined in <code className="text-primary">src/lib/badges.ts</code>.
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

                        {/* Status Badges (Workflow) */}
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-slate-300 mb-3">Status Badges (Workflow)</h3>
                            <div className="flex flex-wrap gap-2">
                                <Badge category="status" value="backlog" />
                                <Badge category="status" value="todo" />
                                <Badge category="status" value="in_progress" />
                                <Badge category="status" value="review" />
                                <Badge category="status" value="done" />
                                <Badge category="status" value="needs_work" />
                            </div>
                        </div>

                        {/* Status Badges (Submission States) */}
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-slate-300 mb-3">Status Badges (Submission States)</h3>
                            <div className="flex flex-wrap gap-2">
                                <Badge category="status" value="verified" />
                                <Badge category="status" value="pending" />
                                <Badge category="status" value="failed" />
                                <Badge category="status" value="pending_review" />
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                Uses semantic CSS variables: <code className="text-primary">--success</code>, <code className="text-primary">--warning</code>, <code className="text-primary">--destructive</code>
                            </p>
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
                                {`import { SystemBadge } from "@/components/ui/SystemBadge";

<SystemBadge category="type" value="bug" />
<SystemBadge category="status" value="verified" size="sm" />
<SystemBadge category="release" value="now" showLabel={false} />
<SystemBadge category="achievement" value="leader" />`}
                            </pre>
                            <p className="text-xs text-slate-500 mt-4">
                                All badge colors defined in <code className="text-primary">src/lib/badges.ts</code> - Status badges (verified/pending/failed) use semantic CSS variables for theme adaptation.
                            </p>
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
                                    <code className="text-primary">DatePicker</code>
                                    <p className="text-xs text-slate-500 mt-1">Calendar date selection with range support</p>
                                    <p className="text-xs text-slate-600 mt-1">ui/DatePicker.tsx</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-primary">DateRangePicker</code>
                                    <p className="text-xs text-slate-500 mt-1">Calendar date range selection with custom styles</p>
                                    <p className="text-xs text-slate-600 mt-1">ui/DateRangePicker.tsx</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-primary">ShareButton</code>
                                    <p className="text-xs text-slate-500 mt-1">Social sharing with Web Share API fallback</p>
                                    <p className="text-xs text-slate-600 mt-1">ui/ShareButton.tsx</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-primary">ModuleFeedback</code>
                                    <p className="text-xs text-slate-500 mt-1">Floating feedback button for any page section</p>
                                    <p className="text-xs text-slate-600 mt-1">ui/ModuleFeedback.tsx</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-primary">Spinner</code>
                                    <p className="text-xs text-slate-500 mt-1">Loading indicator with sizes</p>
                                    <div className="flex items-center gap-4 mt-2 text-sky-400">
                                        <Spinner size="sm" />
                                        <Spinner size="md" />
                                        <Spinner size="lg" />
                                    </div>
                                    <p className="text-xs text-slate-600 mt-1">ui/Spinner.tsx</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-primary">AchievementShareCard</code>
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
                                    <code className="text-primary">SubmissionForm</code>
                                    <p className="text-xs text-slate-500 mt-1">Single step entry with AI verification</p>
                                    <p className="text-xs text-slate-600 mt-1">forms/SubmissionForm.tsx</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-primary">BatchSubmissionForm</code>
                                    <p className="text-xs text-slate-500 mt-1">Multi-image upload with bulk processing</p>
                                    <p className="text-xs text-slate-600 mt-1">forms/BatchSubmissionForm.tsx</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-primary">BulkUnverifiedForm</code>
                                    <p className="text-xs text-slate-500 mt-1">Quick manual entry for multiple dates</p>
                                    <p className="text-xs text-slate-600 mt-1">forms/BulkUnverifiedForm.tsx</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-primary">JoinLeagueForm</code>
                                    <p className="text-xs text-slate-500 mt-1">Invite code entry form</p>
                                    <p className="text-xs text-slate-600 mt-1">forms/JoinLeagueForm.tsx</p>
                                </div>
                            </div>
                        </div>

                        {/* Analytics Components */}
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                                <span className="text-[hsl(var(--warning))]">📊</span> Analytics Components
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-primary">CalendarHeatmap</code>
                                    <p className="text-xs text-slate-500 mt-1">GitHub-style activity heatmap</p>
                                    <p className="text-xs text-slate-600 mt-1">analytics/CalendarHeatmap.tsx</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-primary">DailyBreakdownTable</code>
                                    <p className="text-xs text-slate-500 mt-1">Tabular view with period grouping</p>
                                    <p className="text-xs text-slate-600 mt-1">analytics/DailyBreakdownTable.tsx</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-primary">PersonalStatsCard</code>
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
                                    <code className="text-primary">LeagueInviteControl</code>
                                    <p className="text-xs text-slate-500 mt-1">Invite code display and sharing</p>
                                    <p className="text-xs text-slate-600 mt-1">league/LeagueInviteControl.tsx</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-primary">ProxyMembersDropdown</code>
                                    <p className="text-xs text-slate-500 mt-1">Select user for proxy submissions</p>
                                    <p className="text-xs text-slate-600 mt-1">league/ProxyMembersDropdown.tsx</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-primary">ProxyMemberManagement</code>
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
                                    <code className="text-primary">PageLayout</code>
                                    <p className="text-xs text-slate-500 mt-1">Orchestrator for header, loading, empty, and content states</p>
                                    <p className="text-xs text-slate-600 mt-1">layout/PageLayout.tsx</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-primary">PageHeader</code>
                                    <p className="text-xs text-slate-500 mt-1">Title, subtitle, actions, breadcrumbs with analytics</p>
                                    <p className="text-xs text-slate-600 mt-1">layout/PageHeader.tsx</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-primary">EmptyState</code>
                                    <p className="text-xs text-slate-500 mt-1">Configurable empty state with icons, descriptions, CTAs</p>
                                    <p className="text-xs text-slate-600 mt-1">layout/EmptyState.tsx</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-primary">LoadingSkeleton</code>
                                    <p className="text-xs text-slate-500 mt-1">Multiple variants: list, cards, table, content</p>
                                    <p className="text-xs text-slate-600 mt-1">layout/LoadingSkeleton.tsx</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-primary">GlobalFooter</code>
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
                                    <code className="text-primary">NavHeader</code>
                                    <p className="text-xs text-slate-500 mt-1">Main navigation with dropdowns and mobile menu</p>
                                    <p className="text-xs text-slate-600 mt-1">navigation/NavHeader.tsx</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-primary">NavDropdown</code>
                                    <p className="text-xs text-slate-500 mt-1">Reusable animated dropdown menu</p>
                                    <p className="text-xs text-slate-600 mt-1">navigation/NavDropdown.tsx</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-primary">MobileMenu</code>
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
                                    <code className="text-primary">AuthProvider</code>
                                    <p className="text-xs text-slate-500 mt-1">Supabase auth context and session management</p>
                                    <p className="text-xs text-slate-600 mt-1">providers/AuthProvider.tsx</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-primary">OnboardingProvider</code>
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
                                <code className="text-primary">Dashboard Layout</code>
                                <p className="text-xs text-slate-500 mt-1">NavHeader + content + GlobalFooter wrapper</p>
                                <p className="text-xs text-slate-600 mt-1">(dashboard)/layout.tsx</p>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                <code className="text-primary">Auth Layout</code>
                                <p className="text-xs text-slate-500 mt-1">Centered card for sign-in/sign-up</p>
                                <p className="text-xs text-slate-600 mt-1">(auth)/sign-in, sign-up</p>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                <code className="text-primary">League Detail</code>
                                <p className="text-xs text-slate-500 mt-1">Submission form + leaderboard + analytics tabs</p>
                                <p className="text-xs text-slate-600 mt-1">league/[id]/*</p>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                <code className="text-primary">Static Page</code>
                                <p className="text-xs text-slate-500 mt-1">section-container with prose content</p>
                                <p className="text-xs text-slate-600 mt-1">privacy, terms, security, beta</p>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                <code className="text-primary">Settings Page</code>
                                <p className="text-xs text-slate-500 mt-1">Form sections with glass-card containers</p>
                                <p className="text-xs text-slate-600 mt-1">settings/profile</p>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                <code className="text-primary">Share Page</code>
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
                                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 focus:border-primary focus:outline-none"
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
                                    <select className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 focus:border-primary focus:outline-none">
                                        <option>Option 1</option>
                                        <option>Option 2</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Alerts/Messages */}
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-slate-300 mb-3">Alert Component</h3>
                            <div className="space-y-3">
                                <Alert variant="success">
                                    <AlertDescription>
                                        ✓ Success: Your changes have been saved successfully.
                                    </AlertDescription>
                                </Alert>
                                <Alert variant="destructive">
                                    <AlertDescription>
                                        ✗ Error: Unable to process your request. Please try again.
                                    </AlertDescription>
                                </Alert>
                                <Alert variant="warning">
                                    <AlertDescription>
                                        ⚠ Warning: This action cannot be undone. Please confirm before proceeding.
                                    </AlertDescription>
                                </Alert>
                                <Alert variant="info">
                                    <AlertDescription>
                                        ℹ Info: This feature uses semantic CSS variables for theme-aware colors.
                                    </AlertDescription>
                                </Alert>
                                <Alert>
                                    <AlertDescription>
                                        Default: Standard informational message.
                                    </AlertDescription>
                                </Alert>
                            </div>
                            <p className="text-xs text-slate-500 mt-4">
                                Usage: <code className="text-primary">{'<Alert variant="success|destructive|warning|info">'}</code>
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                Uses semantic CSS variables for automatic light/dark mode adaptation
                            </p>
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

                {/* shadcn/ui Components Section */}
                <section className="mb-16">
                    <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                        shadcn/ui Components
                    </h2>

                    <div className="glass-card p-6">
                        <p className="text-sm text-slate-400 mb-6">
                            Production-ready, accessible components from shadcn/ui. All components in <code className="text-primary">src/components/ui/</code>.
                        </p>

                        {/* Toast Notifications */}
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-slate-300 mb-3">Toast Notifications</h3>
                            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                                <p className="text-xs text-slate-400 mb-3">Replace all <code className="text-rose-400">alert()</code> calls with <code className="text-primary">toast()</code>:</p>
                                <pre className="text-xs text-slate-400 bg-slate-900 p-3 rounded-lg overflow-x-auto">
                                    {`import { toast } from "@/hooks/use-toast";

// Success
toast({ title: "Saved!", description: "Changes applied." });

// Warning
toast({ title: "Warning", description: "Check input", variant: "destructive" });`}
                                </pre>
                            </div>
                        </div>

                        {/* Confirmation Dialog */}
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-slate-300 mb-3">Confirmation Dialogs</h3>
                            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                                <p className="text-xs text-slate-400 mb-3">Replace <code className="text-rose-400">confirm()</code> with <code className="text-primary">ConfirmDialog</code>:</p>
                                <pre className="text-xs text-slate-400 bg-slate-900 p-3 rounded-lg overflow-x-auto">
                                    {`import { ConfirmDialog } from "@/components/ui/confirm-dialog";

<ConfirmDialog
  open={showDelete}
  onOpenChange={setShowDelete}
  title="Delete Item?"
  description="This cannot be undone."
  variant="destructive"
  onConfirm={handleDelete}
  isLoading={isDeleting}
/>`}
                                </pre>
                            </div>
                        </div>

                        {/* Form Components */}
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-slate-300 mb-3">Form Components</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-primary">input.tsx</code>
                                    <p className="text-xs text-slate-500 mt-1">Text input field</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-primary">select.tsx</code>
                                    <p className="text-xs text-slate-500 mt-1">Dropdown select</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-primary">checkbox.tsx</code>
                                    <p className="text-xs text-slate-500 mt-1">Checkbox input</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-primary">label.tsx</code>
                                    <p className="text-xs text-slate-500 mt-1">Form labels</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-primary">textarea.tsx</code>
                                    <p className="text-xs text-slate-500 mt-1">Multi-line text</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-primary">tooltip.tsx</code>
                                    <p className="text-xs text-slate-500 mt-1">Hover tooltips</p>
                                </div>
                            </div>
                        </div>

                        {/* Other Components */}
                        <div>
                            <h3 className="text-sm font-medium text-slate-300 mb-3">Other Components</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-primary">dialog.tsx</code>
                                    <p className="text-xs text-slate-500 mt-1">Modal dialogs (used by ExpandableCardModal)</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <code className="text-primary">dropdown-menu.tsx</code>
                                    <p className="text-xs text-slate-500 mt-1">Dropdown menus (used by ModeToggle)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Settings Components Section */}
                <section className="mb-16">
                    <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                        Settings Components (PRD 25)
                    </h2>

                    <div className="space-y-6">
                        <div className="glass-card p-6">
                            <h3 className="text-sm font-medium text-slate-300 mb-4">Unified Settings Architecture</h3>
                            <p className="text-sm text-slate-400 mb-6">
                                Reusable settings components for User Preferences, League Settings, and Admin Settings.
                                All components use shadcn/ui primitives with consistent styling.
                            </p>

                            <div className="space-y-4">
                                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                                    <code className="text-primary text-sm">SettingsLayout</code>
                                    <p className="text-xs text-slate-500 mt-2">
                                        Main layout wrapper with header, back link, and optional tabbed navigation.
                                    </p>
                                    <pre className="text-xs text-slate-400 mt-3 bg-slate-950 p-3 rounded overflow-x-auto">
                                        {`<SettingsLayout
  title="Settings"
  navItems={[
    { label: "Profile", href: "/settings/profile" },
    { label: "Preferences", href: "/settings/preferences" }
  ]}
>
  ...
</SettingsLayout>`}
                                    </pre>
                                </div>

                                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                                    <code className="text-primary text-sm">SettingsSection</code>
                                    <p className="text-xs text-slate-500 mt-2">
                                        Groups related settings with title and description. Supports danger mode.
                                    </p>
                                </div>

                                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                                    <code className="text-primary text-sm">SettingsField</code>
                                    <p className="text-xs text-slate-500 mt-2">
                                        Text/textarea input with label, description, and character count.
                                    </p>
                                </div>

                                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                                    <code className="text-primary text-sm">SettingsToggle</code>
                                    <p className="text-xs text-slate-500 mt-2">
                                        Boolean switch field (wraps shadcn Switch).
                                    </p>
                                </div>

                                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                                    <code className="text-primary text-sm">SettingsSelect</code>
                                    <p className="text-xs text-slate-500 mt-2">
                                        Dropdown selector (wraps shadcn Select).
                                    </p>
                                </div>

                                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                                    <code className="text-primary text-sm">SettingsRadioGroup</code>
                                    <p className="text-xs text-slate-500 mt-2">
                                        Radio button group with optional descriptions per option.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-slate-700">
                                <h4 className="text-xs font-medium text-slate-300 mb-3">Registry Pattern</h4>
                                <p className="text-xs text-slate-400 mb-3">
                                    Settings are defined in type-safe registries following industry best practices:
                                </p>
                                <ul className="text-xs text-slate-500 space-y-2 list-disc list-inside">
                                    <li><code className="text-primary">src/lib/settings/userPreferences.ts</code> - User settings registry</li>
                                    <li><code className="text-primary">src/lib/settings/types.ts</code> - Type-safe setting definitions</li>
                                    <li><code className="text-primary">src/hooks/usePreferences.ts</code> - Hook with optimistic updates</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Theme Support Note */}
                <section className="glass-card p-6 border-l-4 border-primary mb-16">
                    <h3 className="text-lg font-semibold text-primary mb-2">🌓 Theme Support</h3>
                    <p className="text-sm text-slate-400 mb-3">
                        All components use CSS variables for light/dark mode. Use the <strong>theme toggle</strong> in the navigation header to switch between Light, Dark, and System modes.
                    </p>
                    <div className="text-xs text-slate-500">
                        <strong>When adding new components:</strong> Always use CSS variables from <code className="text-primary">globals.css</code> instead of hardcoded Tailwind colors.
                    </div>
                </section>

                {/* Documentation Note */}
                <section className="glass-card p-6 border-l-4 border-amber-500">
                    <h3 className="text-lg font-semibold text-[hsl(var(--warning))] mb-2">⚠️ Maintenance Note</h3>
                    <p className="text-sm text-slate-400">
                        This design system page must be updated whenever new design tokens, utility classes,
                        or reusable components are added. See <code className="text-primary">AGENTS.md</code> for documentation rules.
                    </p>
                </section>
            </div >
        </main >
    );
}
