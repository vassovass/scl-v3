import { Metadata } from "next";
import {
    Share2,
    Upload,
    Palette,
    Zap,
    TrendingUp,
    Users,
    MessageCircle,
    CheckCircle,
    XCircle,
    Heart,
    Calendar,
    BarChart3,
    Settings2,
    Sparkles,
} from "lucide-react";
import { APP_CONFIG } from "@/lib/config";
import { CARD_TYPE_CONFIGS, type CardType } from "@/lib/sharing/metricConfig";
import {
    ShareCTAButtons,
    ValueCard,
    DynamicSocialProof,
    InteractivePlayground,
    PlatformBadges,
    BeforeAfterComparison,
} from "@/components/marketing";

// ============================================================================
// Metadata (SEO Optimized)
// ============================================================================

export const metadata: Metadata = {
    title: "Share Step Count Progress on WhatsApp - StepLeague",
    description:
        "Track and share your step progress over time. Compare periods, challenge friends, celebrate personal bests. Create shareable fitness cards in seconds.",
    keywords: [
        "share step count WhatsApp",
        "fitness progress tracker",
        "compare weekly steps",
        "step challenge friends",
        "shareable fitness achievements",
        "fitness group accountability",
    ],
    openGraph: {
        title: "Share Step Count Progress on WhatsApp - StepLeague",
        description:
            "Track and share your step progress over time. Compare periods, challenge friends, celebrate personal bests.",
        url: `${APP_CONFIG.url}/how-to-share`,
        siteName: APP_CONFIG.name,
        images: [
            {
                url: `${APP_CONFIG.url}/api/og?card_type=challenge&value=12345&metric_type=steps&name=You`,
                width: 1200,
                height: 630,
                alt: "StepLeague Share Card Example",
            },
        ],
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Share Step Count Progress on WhatsApp - StepLeague",
        description:
            "Track and share your step progress over time. Compare periods, challenge friends, celebrate personal bests.",
        images: [`${APP_CONFIG.url}/api/og?card_type=challenge&value=12345&metric_type=steps&name=You`],
    },
    alternates: {
        canonical: `${APP_CONFIG.url}/how-to-share`,
    },
};

// ============================================================================
// JSON-LD Schema
// ============================================================================

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Share Your Step Progress",
    description:
        "Create and share beautiful achievement cards showing your step progress on WhatsApp and other platforms.",
    totalTime: "PT2M",
    step: [
        {
            "@type": "HowToStep",
            position: 1,
            name: "Upload Your Steps",
            text: "Take a screenshot of your daily step count from any fitness app (Apple Health, Google Fit, Garmin) and upload it to StepLeague.",
        },
        {
            "@type": "HowToStep",
            position: 2,
            name: "Choose Your Card Type",
            text: "Select from daily, weekly, personal best, streak, rank, or challenge card styles. Customize with your message.",
        },
        {
            "@type": "HowToStep",
            position: 3,
            name: "Share Anywhere",
            text: "Share directly to WhatsApp, X, or copy the link. Beautiful OG image previews work on all platforms.",
        },
    ],
};

// ============================================================================
// Page Component
// ============================================================================

export default function HowToSharePage() {
    return (
        <>
            {/* JSON-LD Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <div className="min-h-screen pt-24 pb-16 bg-background">
                {/* HERO SECTION */}
                <HeroSection />

                {/* WHAT MAKES THIS DIFFERENT */}
                <UniqueValueSection />

                {/* HOW IT WORKS (3 Steps) */}
                <HowItWorksSection />

                {/* CUSTOMIZABLE CONTENT */}
                <CustomizeSection />

                {/* BEFORE/AFTER COMPARISON */}
                <BeforeAfterComparison />

                {/* CARD GALLERY */}
                <CardGallerySection />

                {/* PLATFORM BADGES */}
                <PlatformBadges />

                {/* INTERACTIVE PLAYGROUND */}
                <InteractivePlayground />

                {/* TRACK PROGRESS (Intrinsic) */}
                <TrackProgressSection />

                {/* COMPARE & CHALLENGE (Extrinsic) */}
                <CompareSection />

                {/* WHATSAPP OPTIMIZED */}
                <WhatsAppSection />

                {/* THIS IS FOR YOU / NOT FOR YOU */}
                <ForYouSection />

                {/* INTRINSIC VS EXTRINSIC */}
                <MotivationSection />

                {/* SOCIAL PROOF (Dynamic) */}
                <DynamicSocialProof />

                {/* FINAL CTA */}
                <FinalCTASection />
            </div>
        </>
    );
}

// ============================================================================
// Hero Section
// ============================================================================

function HeroSection() {
    return (
        <section className="px-6 lg:px-8 max-w-6xl mx-auto mb-24">
            <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
                    <Share2 className="w-4 h-4" />
                    <span>Track & Share</span>
                </div>
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6">
                    Track and Share Your Progress Over Time
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
                    Not just daily counts. Compare week vs week, track improvement trends, and challenge friends to beat your score.
                </p>
                <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                    Things you can&apos;t do with Apple Health screenshots.
                </p>
            </div>

            {/* CTAs */}
            <ShareCTAButtons location="hero" />
        </section>
    );
}

// ============================================================================
// Unique Value Section
// ============================================================================

function UniqueValueSection() {
    const features = [
        {
            icon: Calendar,
            title: "Multiple Periods",
            description: "Share today, this week, last week, this month, or all-time totals.",
        },
        {
            icon: BarChart3,
            title: "Week-over-Week",
            description: "Compare last week vs this week. Show your +15% improvement.",
        },
        {
            icon: Users,
            title: "Challenge Cards",
            description: "Share challenge cards that invite friends to beat your score.",
        },
        {
            icon: TrendingUp,
            title: "Track Milestones",
            description: "Celebrate personal bests, streak milestones, and rank changes.",
        },
    ];

    return (
        <section className="bg-muted/30 py-24">
            <div className="px-6 lg:px-8 max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-sm font-semibold mb-6">
                        <Zap className="w-4 h-4" />
                        <span>What You Can&apos;t Do Elsewhere</span>
                    </div>
                    <h2 className="text-3xl font-bold mb-4">Beyond Simple Step Counts</h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Default fitness apps show numbers. StepLeague shows progress.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature) => (
                        <div
                            key={feature.title}
                            className="bg-card border border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors"
                        >
                            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                <feature.icon className="w-6 h-6" />
                            </div>
                            <h3 className="font-semibold mb-2">{feature.title}</h3>
                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ============================================================================
// How It Works Section
// ============================================================================

function HowItWorksSection() {
    const steps = [
        {
            number: "1",
            icon: Upload,
            title: "Upload Your Steps",
            description:
                "Screenshot your step count from any app — Apple Health, Google Fit, Garmin, Fitbit. We support them all.",
            color: "text-primary",
            bg: "bg-primary/10",
        },
        {
            number: "2",
            icon: Palette,
            title: "Choose Your Card",
            description:
                "Pick your card type: daily win, weekly total, personal best, streak, rank, or challenge. Add a message.",
            color: "text-purple-400",
            bg: "bg-purple-500/10",
        },
        {
            number: "3",
            icon: Share2,
            title: "Share Anywhere",
            description:
                "One tap to WhatsApp, X, or copy link. Beautiful previews that actually show up in group chats.",
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
        },
    ];

    return (
        <section className="px-6 lg:px-8 max-w-6xl mx-auto py-24">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4">How It Works</h2>
                <p className="text-lg text-muted-foreground">Three simple steps to share your progress.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-12 relative">
                {/* Connecting Line (Desktop) */}
                <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-primary/20 via-purple-500/20 to-emerald-500/20" />

                {steps.map((step) => (
                    <div
                        key={step.number}
                        className="relative flex flex-col items-center text-center p-6 bg-card border border-border rounded-2xl z-10"
                    >
                        <div
                            className={`w-16 h-16 rounded-2xl ${step.bg} ${step.color} flex items-center justify-center mb-6`}
                        >
                            <step.icon className="w-8 h-8" />
                        </div>
                        <div className="absolute -top-4 -right-4 w-12 h-12 bg-background border border-border rounded-full flex items-center justify-center font-bold text-xl text-muted-foreground shadow-sm">
                            {step.number}
                        </div>
                        <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                        <p className="text-muted-foreground">{step.description}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ============================================================================
// Customize Section (PRD-57)
// ============================================================================

function CustomizeSection() {
    const customizeOptions = [
        {
            emoji: "👟",
            label: "Total Steps",
            description: "Your total for the period",
        },
        {
            emoji: "📅",
            label: "Days Logged",
            description: "Number of days submitted",
        },
        {
            emoji: "📆",
            label: "Date Range",
            description: "e.g., \"10 Jan - 30 Jan 2026\"",
        },
        {
            emoji: "📊",
            label: "Daily Average",
            description: "Average steps per day",
        },
        {
            emoji: "📋",
            label: "Daily Breakdown",
            description: "List each day's steps",
        },
        {
            emoji: "🔥",
            label: "Current Streak",
            description: "Consecutive active days",
        },
        {
            emoji: "🏆",
            label: "League Rank",
            description: "Your position (#3 of 12)",
        },
        {
            emoji: "📈",
            label: "Improvement %",
            description: "Change vs previous period",
        },
    ];

    return (
        <section className="py-24 bg-muted/30">
            <div className="px-6 lg:px-8 max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-sm font-semibold mb-6">
                        <Settings2 className="w-4 h-4" />
                        <span>Customize Your Share</span>
                    </div>
                    <h2 className="text-3xl font-bold mb-4">Choose What to Share</h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Toggle on/off the stats you want to include. Share just the total, or add day-by-day breakdown, streaks, and league comparisons.
                    </p>
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                    {customizeOptions.map((option) => (
                        <div
                            key={option.label}
                            className="bg-card border border-border rounded-xl p-4 text-center hover:border-primary/50 transition-colors"
                        >
                            <span className="text-2xl mb-2 block">{option.emoji}</span>
                            <h3 className="font-semibold text-sm mb-1">{option.label}</h3>
                            <p className="text-xs text-muted-foreground">{option.description}</p>
                        </div>
                    ))}
                </div>

                {/* Example Messages */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Basic Share */}
                    <div className="bg-card border border-border rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold">Quick Share</h3>
                        </div>
                        <div className="bg-muted rounded-lg p-4 text-sm whitespace-pre-wrap font-mono">
                            {`I just logged 184,642 steps! 👟

📅 10 days (10 Jan - 30 Jan 2026)
📊 Avg: 18,464 steps/day

#StepLeague
https://stepleague.app`}
                        </div>
                    </div>

                    {/* Detailed Share */}
                    <div className="bg-card border border-border rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart3 className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold">Detailed Breakdown</h3>
                        </div>
                        <div className="bg-muted rounded-lg p-4 text-sm whitespace-pre-wrap font-mono">
                            {`My week in steps! 👟

Mon 20 Jan: 12,456
Tue 21 Jan: 8,234
Wed 22 Jan: 15,678 ⭐
Thu 23 Jan: 11,234
Fri 24 Jan: 9,876

Total: 57,478 | Avg: 11,496/day

#StepLeague`}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ============================================================================
// Card Gallery Section
// ============================================================================

function CardGallerySection() {
    const cardExamples: { type: CardType; value: number; label: string; rank?: number }[] = [
        { type: "daily", value: 12345, label: "Daily Achievement" },
        { type: "weekly", value: 87654, label: "Weekly Total" },
        { type: "personal_best", value: 18500, label: "Personal Best" },
        { type: "streak", value: 14, label: "Streak" },
        { type: "rank", value: 15000, rank: 3, label: "League Rank" },
        { type: "challenge", value: 10000, label: "Challenge" },
    ];

    return (
        <section className="py-24 bg-muted/30">
            <div className="px-6 lg:px-8 max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-4">6 Card Types to Share</h2>
                    <p className="text-lg text-muted-foreground">
                        Every card generates a beautiful OG image that works on all platforms.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                    {cardExamples.map((card) => {
                        const config = CARD_TYPE_CONFIGS[card.type];
                        const ogUrl = `/api/og?card_type=${card.type}&value=${card.value}&metric_type=steps&name=You${card.rank ? `&rank=${card.rank}` : ""}`;

                        return (
                            <div
                                key={card.type}
                                className="group relative rounded-xl overflow-hidden border border-border bg-card"
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={ogUrl}
                                    alt={card.label}
                                    className="w-full aspect-[1200/630] object-cover transition-transform group-hover:scale-105"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-white font-semibold text-sm md:text-lg">
                                        {config.emoji} {card.label}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

// ============================================================================
// Track Progress Section (Intrinsic Motivation)
// ============================================================================

function TrackProgressSection() {
    return (
        <section className="py-24">
            <div className="px-6 lg:px-8 max-w-5xl mx-auto">
                <ValueCard
                    icon={TrendingUp}
                    tagText="Track Over Time"
                    tagColor="text-emerald-400"
                    tagBg="bg-emerald-500/10"
                    title="Compare Yourself to Yesterday"
                    description="Not just today's number. See week-over-week trends, spot improvement patterns, and celebrate personal bests with context."
                    bullets={[
                        "Week vs week comparison with improvement percentage",
                        "Personal best tracking with historical context",
                        "Streak milestones (7, 14, 30, 100 days)",
                        "See the trend, not just the snapshot",
                    ]}
                />
            </div>
        </section>
    );
}

// ============================================================================
// Compare & Challenge Section (Extrinsic Motivation)
// ============================================================================

function CompareSection() {
    return (
        <section className="bg-muted/30 py-24">
            <div className="px-6 lg:px-8 max-w-5xl mx-auto">
                <ValueCard
                    icon={Users}
                    tagText="Social Competition"
                    tagColor="text-blue-400"
                    tagBg="bg-blue-500/10"
                    title="Challenge Friends to Beat Your Score"
                    description="Share challenge cards that invite your friends to beat your steps. League leaderboards add friendly competition that keeps everyone motivated."
                    bullets={[
                        "Challenge cards with your score to beat",
                        "League rankings show where you stand",
                        "Rank change cards when you climb",
                        "Friendly competition that actually works",
                    ]}
                    reverse
                />
            </div>
        </section>
    );
}

// ============================================================================
// WhatsApp Section
// ============================================================================

function WhatsAppSection() {
    return (
        <section className="py-24">
            <div className="px-6 lg:px-8 max-w-5xl mx-auto">
                <ValueCard
                    icon={MessageCircle}
                    tagText="WhatsApp First"
                    tagColor="text-green-400"
                    tagBg="bg-green-500/10"
                    title="Made for Fitness Groups"
                    description="Your fitness WhatsApp group deserves better than blurry screenshots. Cards preview beautifully, load fast, and spark conversation."
                    bullets={[
                        "Beautiful link previews in group chats",
                        "Optimized image size for fast loading",
                        "Concise messages that get responses",
                        "Stand out from raw screenshots",
                    ]}
                />
            </div>
        </section>
    );
}

// ============================================================================
// "This Is For You" Section
// ============================================================================

function ForYouSection() {
    const forYou = [
        "You want to track and share progress over time, not just daily counts",
        "You're in fitness WhatsApp groups and want to stand out",
        "You love seeing improvement trends (week vs week, month vs month)",
        "You want to challenge friends with specific comparisons",
    ];

    const notForYou = [
        "You just want to log steps privately (use Apple Health)",
        "You're not interested in sharing or comparing",
        "You prefer raw data over visual cards",
    ];

    return (
        <section className="bg-muted/30 py-24">
            <div className="px-6 lg:px-8 max-w-5xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-4">Is This For You?</h2>
                    <p className="text-lg text-muted-foreground">
                        We&apos;re not for everyone — and that&apos;s okay.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* FOR YOU */}
                    <div className="bg-card border border-emerald-500/30 rounded-2xl p-6 md:p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-emerald-500" />
                            </div>
                            <h3 className="text-xl font-bold text-emerald-500">This is for you if...</h3>
                        </div>
                        <ul className="space-y-3">
                            {forYou.map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-muted-foreground">
                                    <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* NOT FOR YOU */}
                    <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                <XCircle className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-bold text-muted-foreground">This is NOT for you if...</h3>
                        </div>
                        <ul className="space-y-3">
                            {notForYou.map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-muted-foreground">
                                    <XCircle className="w-5 h-5 text-muted-foreground/50 mt-0.5 flex-shrink-0" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ============================================================================
// Motivation Section (Intrinsic vs Extrinsic)
// ============================================================================

function MotivationSection() {
    return (
        <section className="py-24">
            <div className="px-6 lg:px-8 max-w-5xl mx-auto">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 text-pink-400 text-sm font-semibold mb-6">
                        <Heart className="w-4 h-4" />
                        <span>Your Motivation Style</span>
                    </div>
                    <h2 className="text-3xl font-bold mb-4">We Support Both</h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Some people are motivated by personal progress. Others by friendly competition. You choose.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Intrinsic */}
                    <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
                        <h3 className="text-xl font-bold mb-4">Intrinsic Motivation</h3>
                        <p className="text-muted-foreground mb-4">
                            Track your own progress. Compare yourself to yesterday, not others. Celebrate personal bests.
                        </p>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>• Personal best cards</li>
                            <li>• Week-over-week improvement</li>
                            <li>• Private streak tracking</li>
                        </ul>
                    </div>

                    {/* Extrinsic */}
                    <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
                        <h3 className="text-xl font-bold mb-4">Extrinsic Motivation</h3>
                        <p className="text-muted-foreground mb-4">
                            Share wins with friends. Friendly competition. Social accountability that actually works.
                        </p>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>• Challenge cards</li>
                            <li>• League rank sharing</li>
                            <li>• Group accountability</li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ============================================================================
// Final CTA Section
// ============================================================================

function FinalCTASection() {
    return (
        <section className="px-6 lg:px-8 max-w-4xl mx-auto text-center py-16">
            <h2 className="text-3xl font-bold mb-6">Ready to Share Your Progress?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                Track trends, compare periods, challenge friends. Things you can&apos;t do with raw screenshots.
            </p>
            <ShareCTAButtons location="footer" />
        </section>
    );
}
