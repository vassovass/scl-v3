import Link from "next/link";
import { Globe, TrendingUp, Flame, Users, ArrowRight, Upload } from "lucide-react";

export const metadata = {
    title: "Why Upload Daily - StepLeague",
    description: "Upload your daily steps and see how you rank against people worldwide. Track progress, build streaks, and compete globally.",
    openGraph: {
        title: "Why Upload Daily - StepLeague",
        description: "Your steps count on the Global Leaderboard. Upload daily to track progress and compete worldwide.",
    },
};

export default function WhyUploadPage() {
    return (
        <div className="min-h-screen pt-24 pb-16 bg-background">
            {/* HERO SECTION */}
            <section className="px-6 lg:px-8 max-w-6xl mx-auto mb-24">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
                        <Globe className="w-4 h-4" />
                        <span>Global Competition</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6">
                        Every Step Counts — Globally
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Upload your daily steps and see how you rank against people worldwide. No private league required.
                    </p>
                </div>

                {/* Primary CTA */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                    <Link
                        href="/submit-steps"
                        className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-bold text-primary-foreground bg-gradient-brand-primary rounded-full hover:scale-105 transition-transform glow-primary"
                    >
                        <Upload className="w-5 h-5" />
                        Start Uploading
                    </Link>
                    <Link
                        href="/leaderboard"
                        className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-foreground border border-border rounded-full hover:bg-muted/50 transition-colors"
                    >
                        View Leaderboard
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </section>

            {/* SECTION 1: Compete Globally */}
            <section className="bg-muted/30 py-24">
                <div className="px-6 lg:px-8 max-w-5xl mx-auto">
                    <ValueCard
                        icon={Globe}
                        tagText="Global Leaderboard"
                        tagColor="text-sky-400"
                        tagBg="bg-sky-500/10"
                        title="See Your Worldwide Rank"
                        description="Your steps automatically count on the Global Leaderboard. Every upload moves you up or down in real-time against thousands of step enthusiasts worldwide."
                        bullets={[
                            "Automatic ranking — no signup for extra leagues",
                            "Updates instantly when you upload",
                            "Compete with people from around the world",
                        ]}
                    />
                </div>
            </section>

            {/* SECTION 2: Track Your Progress */}
            <section className="py-24">
                <div className="px-6 lg:px-8 max-w-5xl mx-auto">
                    <ValueCard
                        icon={TrendingUp}
                        tagText="Personal Analytics"
                        tagColor="text-purple-400"
                        tagBg="bg-purple-500/10"
                        title="Track Your Progress Over Time"
                        description="StepLeague isn't just about competing — it's about seeing your personal growth. Your dashboard shows patterns, records, and progress."
                        bullets={[
                            "Calendar heatmap shows your consistency",
                            "Personal records tracked (best day, longest streak)",
                            "Analytics dashboard reveals your patterns",
                        ]}
                        reverse
                    />
                </div>
            </section>

            {/* SECTION 3: Build Streaks */}
            <section className="bg-muted/30 py-24">
                <div className="px-6 lg:px-8 max-w-5xl mx-auto">
                    <ValueCard
                        icon={Flame}
                        tagText="Coming Soon"
                        tagColor="text-amber-400"
                        tagBg="bg-amber-500/10"
                        title="Build Streaks & Earn Points"
                        description="Consistency matters. Upload every day to build your streak — and soon, earn points for being reliable. Early uploaders get a head start."
                        bullets={[
                            "Consecutive days build your streak",
                            "Coming soon: Points for consistency",
                            "Early uploaders will have a head start",
                        ]}
                    />
                </div>
            </section>

            {/* SECTION 4: Join Private Leagues */}
            <section className="py-24">
                <div className="px-6 lg:px-8 max-w-5xl mx-auto">
                    <ValueCard
                        icon={Users}
                        tagText="Social Features"
                        tagColor="text-green-400"
                        tagBg="bg-green-500/10"
                        title="Challenge Friends & Family"
                        description="Ready for more? Create or join a private league to compete with people you know. Your steps count everywhere — upload once, compete multiple places."
                        bullets={[
                            "Create custom leagues for friends, family, or coworkers",
                            "Same steps count everywhere — upload once",
                            "Send High Fives to encourage your league mates",
                        ]}
                        reverse
                    />
                </div>
            </section>

            {/* FINAL CTA */}
            <section className="px-6 lg:px-8 max-w-4xl mx-auto text-center py-16">
                <h2 className="text-3xl font-bold mb-6">Ready to Join the Global Competition?</h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                    Every step you take matters. Upload your daily count and see where you stand.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        href="/sign-up"
                        className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-primary-foreground bg-gradient-brand-primary rounded-full hover:scale-105 transition-transform glow-primary"
                    >
                        Get Started Free
                    </Link>
                    <Link
                        href="/league/create"
                        className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-foreground border border-border rounded-full hover:bg-muted/50 transition-colors"
                    >
                        Create a League
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </section>
        </div>
    );
}

interface ValueCardProps {
    icon: React.ComponentType<{ className?: string }>;
    tagText: string;
    tagColor: string;
    tagBg: string;
    title: string;
    description: string;
    bullets: string[];
    reverse?: boolean;
}

function ValueCard({ icon: Icon, tagText, tagColor, tagBg, title, description, bullets, reverse }: ValueCardProps) {
    return (
        <div className={`bg-card border border-border rounded-3xl p-8 lg:p-12 flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12`}>
            <div className="flex-1">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${tagBg} ${tagColor} text-sm font-semibold mb-6`}>
                    <Icon className="w-4 h-4" />
                    <span>{tagText}</span>
                </div>
                <h2 className="text-3xl font-bold mb-4">{title}</h2>
                <p className="text-lg text-muted-foreground mb-6">{description}</p>
                <ul className="space-y-3">
                    {bullets.map((bullet, i) => (
                        <li key={i} className="flex items-start gap-3 text-muted-foreground">
                            <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                            <span>{bullet}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="flex-shrink-0 w-full md:w-64 aspect-square bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center border border-border">
                <Icon className="w-24 h-24 text-primary/50" />
            </div>
        </div>
    );
}
