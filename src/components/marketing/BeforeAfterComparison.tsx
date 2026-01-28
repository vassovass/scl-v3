/**
 * BeforeAfterComparison Component
 *
 * Shows the transformation from raw screenshot to StepLeague card.
 * Visual demonstration of the value proposition.
 *
 * PRD-53 P-8: Competitor screenshot comparison (Before/After)
 */

import { ArrowRight, X, Check } from "lucide-react";

export function BeforeAfterComparison() {
    return (
        <section className="py-24 bg-muted/30">
            <div className="px-6 lg:px-8 max-w-5xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-4">From Boring to Beautiful</h2>
                    <p className="text-lg text-muted-foreground">
                        Turn cluttered screenshots into shareable achievement cards.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 items-center">
                    {/* BEFORE */}
                    <div className="relative">
                        <div className="absolute -top-3 -left-3 px-3 py-1 bg-red-500/10 text-red-500 text-sm font-semibold rounded-full border border-red-500/20">
                            Before
                        </div>
                        <div className="bg-card border border-border rounded-2xl p-6 opacity-80">
                            {/* Simulated raw screenshot look */}
                            <div className="bg-gray-900 rounded-xl p-4 space-y-4">
                                <div className="flex items-center justify-between text-white/50 text-xs">
                                    <span>9:41 AM</span>
                                    <div className="flex gap-1">
                                        <div className="w-4 h-2 bg-white/30 rounded" />
                                        <div className="w-4 h-2 bg-white/30 rounded" />
                                    </div>
                                </div>
                                <div className="text-center py-8">
                                    <div className="text-6xl font-bold text-white mb-2">12,345</div>
                                    <div className="text-white/50 text-sm">Steps</div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                    <div className="p-2 bg-white/5 rounded">
                                        <div className="text-white/70">Distance</div>
                                        <div className="text-white font-medium">8.2 km</div>
                                    </div>
                                    <div className="p-2 bg-white/5 rounded">
                                        <div className="text-white/70">Floors</div>
                                        <div className="text-white font-medium">12</div>
                                    </div>
                                    <div className="p-2 bg-white/5 rounded">
                                        <div className="text-white/70">Calories</div>
                                        <div className="text-white font-medium">450</div>
                                    </div>
                                </div>
                                <div className="flex justify-around pt-4 border-t border-white/10">
                                    <div className="w-6 h-6 bg-white/10 rounded-full" />
                                    <div className="w-6 h-6 bg-white/10 rounded-full" />
                                    <div className="w-6 h-6 bg-white/10 rounded-full" />
                                    <div className="w-6 h-6 bg-white/10 rounded-full" />
                                </div>
                            </div>
                            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-center gap-2">
                                    <X className="w-4 h-4 text-red-500" />
                                    Cluttered UI elements
                                </li>
                                <li className="flex items-center gap-2">
                                    <X className="w-4 h-4 text-red-500" />
                                    No context or period
                                </li>
                                <li className="flex items-center gap-2">
                                    <X className="w-4 h-4 text-red-500" />
                                    Boring, generic look
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Arrow */}
                    <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-primary rounded-full items-center justify-center z-10">
                        <ArrowRight className="w-8 h-8 text-primary-foreground" />
                    </div>

                    {/* AFTER */}
                    <div className="relative">
                        <div className="absolute -top-3 -left-3 px-3 py-1 bg-emerald-500/10 text-emerald-500 text-sm font-semibold rounded-full border border-emerald-500/20">
                            After
                        </div>
                        <div className="bg-card border border-border rounded-2xl p-6">
                            {/* StepLeague card preview */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/api/og?card_type=daily&value=12345&metric_type=steps&name=You&period=Today"
                                alt="StepLeague share card"
                                className="w-full aspect-[1200/630] object-cover rounded-xl border border-border"
                                loading="lazy"
                            />
                            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-500" />
                                    Clean, professional design
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-500" />
                                    Shows period and context
                                </li>
                                <li className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-500" />
                                    Beautiful link previews
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
