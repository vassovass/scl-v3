"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";

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

                {/* Colors Section */}
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
                    <code className="text-xs text-sky-400 mt-4 block">.stat-badge &gt; .stat-value + .stat-label</code>
                </section>

                {/* Documentation Note */}
                <section className="glass-card p-6 border-l-4 border-amber-500">
                    <h3 className="text-lg font-semibold text-amber-400 mb-2">⚠️ Maintenance Note</h3>
                    <p className="text-sm text-slate-400">
                        This design system page must be updated whenever new design tokens or utility classes
                        are added to <code className="text-sky-400">globals.css</code>. See AGENTS.md for documentation rules.
                    </p>
                </section>
            </div>
        </main>
    );
}
