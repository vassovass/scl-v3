"use client";

import Link from "next/link";
import { useAppSettings } from "@/hooks/useAppSettings";

export default function StageInfoPage() {
    const { getSetting, isLoading } = useAppSettings();

    const currentStageData = getSetting('development_stage', { stage: 'pre-alpha', badge_visible: true });
    const stageDescriptions = getSetting<Record<string, any>>('stage_descriptions', {});

    const stageInfo = stageDescriptions[currentStageData.stage as string] || {
        title: "Development Stage",
        emoji: "🚧",
        tagline: "Application in development",
        what_it_means: ["The application is under active development"],
        known_limitations: [],
    };

    // Color mapping for each stage
    const stageColors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
        'pre-alpha': { bg: 'bg-[hsl(var(--brand-accent)/0.1)]', border: 'border-[hsl(var(--brand-accent)/0.3)]', text: 'text-[hsl(var(--brand-accent))]', glow: 'bg-[hsl(var(--brand-accent))]' },
        'alpha': { bg: 'bg-[hsl(var(--info)/0.1)]', border: 'border-[hsl(var(--info)/0.3)]', text: 'text-[hsl(var(--info))]', glow: 'bg-[hsl(var(--info))]' },
        'beta': { bg: 'bg-[hsl(var(--warning)/0.1)]', border: 'border-[hsl(var(--warning)/0.3)]', text: 'text-[hsl(var(--warning))]', glow: 'bg-[hsl(var(--warning))]' },
        'product-hunt': { bg: 'bg-[hsl(var(--warning)/0.1)]', border: 'border-[hsl(var(--warning)/0.3)]', text: 'text-[hsl(var(--warning))]', glow: 'bg-[hsl(var(--warning))]' },
        'production': { bg: 'bg-[hsl(var(--success)/0.1)]', border: 'border-[hsl(var(--success)/0.3)]', text: 'text-[hsl(var(--success))]', glow: 'bg-[hsl(var(--success))]' },
    };

    const colors = stageColors[currentStageData.stage] || stageColors['beta'];

    if (isLoading) {
        return (
            <main className="min-h-screen bg-background text-foreground">
                <div className="mx-auto max-w-3xl px-6 py-12">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 w-32 bg-muted rounded"></div>
                        <div className="h-32 bg-card rounded-xl border border-border"></div>
                        <div className="h-64 bg-card rounded-xl border border-border"></div>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-background text-foreground">
            <div className="mx-auto max-w-3xl px-6 py-12">
                <Link href="/" className="text-sm text-primary hover:text-primary/80 transition">
                    ← Back to Home
                </Link>

                {/* Stage Banner */}
                <div className={`mt-8 rounded-xl border ${colors.border} ${colors.bg} p-6`}>
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">{stageInfo.emoji}</span>
                        <div>
                            <h1 className={`text-2xl font-bold ${colors.text}`}>
                                {stageInfo.title}
                            </h1>
                            <p className={`${colors.text}/80`}>{stageInfo.tagline}</p>
                        </div>
                    </div>
                </div>

                <section className="mt-8 space-y-6">
                    {/* What This Means */}
                    <div className="bg-card rounded-lg border border-border p-6">
                        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                            What This Means
                        </h2>
                        <ul className="mt-3 space-y-2">
                            {stageInfo.what_it_means.map((item: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                                    <span className="text-primary mt-0.5">•</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Your Feedback Matters */}
                    <div className="bg-card rounded-lg border border-border p-6">
                        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                            Your Feedback Matters
                        </h2>
                        <p className="mt-3 text-muted-foreground">
                            We actively rely on user feedback to improve the application. Please use the{" "}
                            <Link href="/feedback" className="text-primary hover:text-primary/80 underline">
                                Feedback Form
                            </Link>{" "}
                            to report bugs, suggest features, or share your experience.
                        </p>
                    </div>

                    {/* Known Limitations */}
                    {stageInfo.known_limitations && stageInfo.known_limitations.length > 0 && (
                        <div className="bg-card rounded-lg border border-border p-6">
                            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                                Known Limitations
                            </h2>
                            <ul className="mt-3 space-y-2">
                                {stageInfo.known_limitations.map((item: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                                        <span className="text-amber-500 mt-0.5">⚠</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Roadmap Link */}
                    <div className="bg-card rounded-lg border border-border p-6">
                        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                            Roadmap
                        </h2>
                        <p className="mt-3 text-muted-foreground">
                            See what we're building next and vote on features you'd like to see on our{" "}
                            <Link href="/roadmap" className="text-primary hover:text-primary/80 underline">
                                Public Roadmap
                            </Link>
                            .
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}
