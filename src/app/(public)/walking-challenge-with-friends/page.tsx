import { Metadata } from "next";
import Link from "next/link";
import {
    Users,
    Heart,
    Footprints,
    Trophy,
    Smartphone,
    ArrowRight,
    AlertTriangle,
    Check,
    X,
    Flame,
    Target,
    Zap,
} from "lucide-react";

// ============================================================================
// Metadata
// ============================================================================

export const metadata: Metadata = {
    title: "Walking Challenge With Friends: Setup Guide (2026) | StepLeague",
    description:
        "Start a walking challenge with friends using any fitness tracker. Free setup guide with app comparisons, challenge ideas, and tips for mixed-device groups.",
    keywords: [
        "walking challenge with friends",
        "group step challenge app free",
        "walking challenge with friends app",
    ],
};

// ============================================================================
// JSON-LD Schema
// ============================================================================

const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "BreadcrumbList",
            itemListElement: [
                {
                    "@type": "ListItem",
                    position: 1,
                    name: "Home",
                    item: "https://stepleague.app",
                },
                {
                    "@type": "ListItem",
                    position: 2,
                    name: "Walking Challenge With Friends",
                    item: "https://stepleague.app/walking-challenge-with-friends",
                },
            ],
        },
        {
            "@type": "FAQPage",
            mainEntity: [
                {
                    "@type": "Question",
                    name: "What is the free walking challenge app with friends?",
                    acceptedAnswer: {
                        "@type": "Answer",
                        text: "Several apps offer free walking challenges with friends. StepLeague provides a free tier with unlimited step uploads, private leagues, and a global leaderboard. It works across all devices since you upload screenshots rather than syncing APIs. Stridekick and StepUp also have free options, though with varying limitations on features and device compatibility.",
                    },
                },
                {
                    "@type": "Question",
                    name: "What is the 6 6 6 rule for walking?",
                    acceptedAnswer: {
                        "@type": "Answer",
                        text: "The 6 6 6 rule is a walking guideline that suggests walking for 6 minutes after each meal, 6 days per week, at a pace of 6 km/h (about 3.7 mph). It is designed to help regulate blood sugar levels, particularly after eating. Research shows that even short post-meal walks of 2-5 minutes can significantly reduce blood sugar spikes.",
                    },
                },
                {
                    "@type": "Question",
                    name: "How do you create a virtual walking challenge?",
                    acceptedAnswer: {
                        "@type": "Answer",
                        text: "Choose a platform that supports your group's devices, create a private league, and share the invite link. Each participant uploads daily step screenshots from their fitness app. Set your challenge duration (four weeks is a great starting point), pick a format (weekly totals, streaks, or head-to-head), and agree on any house rules.",
                    },
                },
                {
                    "@type": "Question",
                    name: "What are some walking challenges?",
                    acceptedAnswer: {
                        "@type": "Answer",
                        text: "Popular walking challenges include the 10,000-step daily challenge, 30-day streak challenges, distance-based virtual routes, team relay formats, and escalating weekly targets. For friend groups, head-to-head weekly matchups add a competitive edge while keeping things manageable.",
                    },
                },
            ],
        },
        {
            "@type": "HowTo",
            name: "How to Set Up a Walking Challenge With Friends",
            description:
                "A step-by-step guide to launching a walking challenge with your friend group using any fitness tracker or phone.",
            step: [
                {
                    "@type": "HowToStep",
                    name: "Choose a platform",
                    text: "Pick a step challenge app that supports all your friends' devices. Screenshot-based platforms like StepLeague work with any tracker.",
                },
                {
                    "@type": "HowToStep",
                    name: "Create a private league",
                    text: "Set up a private group or league in your chosen app and send invite links to your friends.",
                },
                {
                    "@type": "HowToStep",
                    name: "Pick a challenge format",
                    text: "Choose between weekly totals, daily streaks, head-to-head matchups, or team-based challenges based on your group's personality.",
                },
                {
                    "@type": "HowToStep",
                    name: "Set a realistic starting goal",
                    text: "Start with 7,000-8,000 steps per day for most groups. You can always increase later.",
                },
                {
                    "@type": "HowToStep",
                    name: "Agree on rules",
                    text: "Decide on rest days, vacation policies, and what counts as steps before you begin to avoid arguments later.",
                },
            ],
        },
    ],
};

// ============================================================================
// Page Component
// ============================================================================

export default function WalkingChallengeWithFriendsPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <div className="min-h-screen pt-24 pb-16 bg-background">
                {/* Decorative gradient blurs */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                    <div className="absolute top-32 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
                    <div className="absolute top-96 -right-32 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-64 left-1/3 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
                </div>

                <HeroSection />
                <QuickStartSection />
                <BestAppsSection />
                <ComparisonTableSection />
                <ChallengeIdeasSection />
                <MotivationTipsSection />
                <MixedDevicesSection />
                <NotForYouSection />
                <FAQSection />
                <RelatedPagesSection />
                <CTASection />
            </div>
        </>
    );
}

// ============================================================================
// 1. Hero Section
// ============================================================================

function HeroSection() {
    return (
        <section className="px-6 lg:px-8 max-w-6xl mx-auto mb-24">
            <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 text-pink-400 text-sm font-semibold mb-6 animate-fade-slide">
                    <Heart className="w-4 h-4" />
                    <span>Friends Who Walk Together, Stick Together</span>
                </div>
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6 animate-fade-slide">
                    Walking Challenge With Friends:{" "}
                    <span className="text-gradient-brand">How to Set One Up</span>{" "}
                    (And Actually Stick With It)
                </h1>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-4 animate-fade-slide">
                    Pick a step challenge app that works across everyone&apos;s devices, create a
                    private group, set a weekly step goal, and start walking. The whole setup takes
                    about five minutes.
                </p>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-slide">
                    The app you pick determines whether this thing lasts two weeks or two months.
                    And the format you choose changes whether it feels fun or like homework.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                    href="/sign-up"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-bold text-primary-foreground bg-gradient-brand-primary rounded-full hover:scale-105 transition-transform glow-primary"
                >
                    <Users className="w-5 h-5" />
                    Start a Challenge Free
                </Link>
                <Link
                    href="#quick-start"
                    className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-foreground border border-border rounded-full hover:bg-muted/50 transition-colors"
                >
                    Read the Guide
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </section>
    );
}

// ============================================================================
// 2. Quick-Start Steps
// ============================================================================

function QuickStartSection() {
    const steps = [
        {
            number: "1",
            icon: Smartphone,
            title: "Choose a Platform",
            description:
                "Pick a step challenge app that supports all your friends' devices. See the comparison table below.",
            color: "text-primary",
            bg: "bg-primary/10",
        },
        {
            number: "2",
            icon: Users,
            title: "Create a Private League",
            description:
                "Set up a private group and send invite links to your friends via your group chat.",
            color: "text-purple-400",
            bg: "bg-purple-500/10",
        },
        {
            number: "3",
            icon: Target,
            title: "Pick a Format",
            description:
                "Weekly totals, daily streaks, or head-to-head. Choose what fits your group's personality.",
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
        },
        {
            number: "4",
            icon: Footprints,
            title: "Set a Realistic Goal",
            description:
                "7,000\u20138,000 steps/day works for most people. You can always increase later.",
            color: "text-amber-400",
            bg: "bg-amber-500/10",
        },
        {
            number: "5",
            icon: Check,
            title: "Agree on Rules",
            description:
                "Rest days, vacations, what counts as 'steps.' Set expectations before you begin.",
            color: "text-pink-400",
            bg: "bg-pink-500/10",
        },
    ];

    return (
        <section id="quick-start" className="bg-muted/30 py-24">
            <div className="px-6 lg:px-8 max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
                        <Zap className="w-4 h-4" />
                        <span>5-Minute Setup</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                        Launch a Walking Challenge in 5 Steps
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        From zero to competing with friends in five minutes flat.
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {steps.map((step) => (
                        <div
                            key={step.number}
                            className="relative flex flex-col items-center text-center p-6 bg-card border border-border rounded-2xl hover:border-primary/50 hover:scale-105 transition-transform"
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
            </div>
        </section>
    );
}

// ============================================================================
// 3. Best Apps Section
// ============================================================================

function BestAppsSection() {
    const apps = [
        {
            name: "StepLeague",
            icon: Trophy,
            tagColor: "text-primary",
            tagBg: "bg-primary/10",
            tagText: "Best for Mixed Devices",
            description:
                "You don't need to connect an API or sync anything. Just screenshot your step count from whatever app you use, upload it, and AI verifies the number. Works on both Android and iPhone.",
            highlights: [
                "Unlimited step uploads on free tier",
                "Private leagues and global leaderboard",
                "High Five feature for quick encouragement",
                "Works with any fitness tracker or phone",
            ],
            tradeoff: "Steps aren't auto-synced \u2014 manual upload takes about 15 seconds.",
            href: "https://stepleague.app",
            featured: true,
        },
        {
            name: "Stridekick",
            icon: Footprints,
            tagColor: "text-sky-400",
            tagBg: "bg-sky-500/10",
            tagText: "Auto-Sync",
            description:
                "Solid app with direct fitness tracker syncing. Connects to Fitbit, Apple Health, Google Fit, and Garmin. Good interface for group challenges.",
            highlights: [
                "Direct sync with 4 major platforms",
                "Good group challenge interface",
            ],
            tradeoff:
                "Some users report sync issues. Samsung Health users may need Google Fit as a bridge.",
            href: "/compare/stepleague-vs-stridekick",
            featured: false,
        },
        {
            name: "StepUp",
            icon: Zap,
            tagColor: "text-amber-400",
            tagBg: "bg-amber-500/10",
            tagText: "Simple 1v1",
            description:
                "Popular for simple friend-vs-friend competitions. Clean design focused on 1v1 and small group challenges.",
            highlights: [
                "Clean, focused design",
                "Great for 1v1 matchups",
            ],
            tradeoff:
                "Limited device compatibility compared to screenshot-based alternatives.",
            href: null,
            featured: false,
        },
        {
            name: "Social Steps",
            icon: Heart,
            tagColor: "text-pink-400",
            tagBg: "bg-pink-500/10",
            tagText: "Social Features",
            description:
                "Designed specifically for walking with friends. Nice social features for group motivation.",
            highlights: [
                "Built for social walking",
                "Nice community features",
            ],
            tradeoff: "Smaller user base means less community outside your friend group.",
            href: null,
            featured: false,
        },
        {
            name: "Fitbit Challenges",
            icon: Target,
            tagColor: "text-emerald-400",
            tagBg: "bg-emerald-500/10",
            tagText: "Fitbit Only",
            description:
                "If everyone in your group has a Fitbit, this is built right in. No extra app needed. Weekly and weekend warrior challenges work great.",
            highlights: [
                "Built into Fitbit \u2014 no extra app",
                "Weekly and weekend challenges",
            ],
            tradeoff:
                "Only works with Fitbit. One friend buys a Garmin? They're out.",
            href: "/compare/stepleague-vs-fitbit",
            featured: false,
        },
    ];

    return (
        <section className="py-24">
            <div className="px-6 lg:px-8 max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 text-sm font-semibold mb-6">
                        <Smartphone className="w-4 h-4" />
                        <span>App Comparison</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                        What&apos;s the Best Group Step Challenge App (Free)?
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Not all step challenge apps handle friend groups well. Here&apos;s an honest
                        breakdown of what works.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {apps.map((app) => (
                        <div
                            key={app.name}
                            className={`bg-card border rounded-2xl p-6 flex flex-col hover:scale-105 transition-transform ${
                                app.featured
                                    ? "border-primary/50 ring-1 ring-primary/20"
                                    : "border-border"
                            }`}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div
                                    className={`w-10 h-10 rounded-xl ${app.tagBg} ${app.tagColor} flex items-center justify-center`}
                                >
                                    <app.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold">{app.name}</h3>
                                    <span className={`text-xs font-semibold ${app.tagColor}`}>
                                        {app.tagText}
                                    </span>
                                </div>
                                {app.featured && (
                                    <span className="ml-auto text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">
                                        Top Pick
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-4 flex-grow">
                                {app.description}
                            </p>
                            <ul className="space-y-2 mb-4">
                                {app.highlights.map((h, i) => (
                                    <li
                                        key={i}
                                        className="flex items-start gap-2 text-sm text-muted-foreground"
                                    >
                                        <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                        <span>{h}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 mb-4">
                                <strong>Tradeoff:</strong> {app.tradeoff}
                            </div>
                            {app.href && (
                                <Link
                                    href={app.href}
                                    className="inline-flex items-center text-sm font-medium text-primary hover:underline mt-auto"
                                >
                                    Learn more
                                    <ArrowRight className="ml-1 w-3 h-3" />
                                </Link>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ============================================================================
// 4. Comparison Table
// ============================================================================

function ComparisonTableSection() {
    const rows = [
        {
            app: "StepLeague",
            bestFor: "Mixed-device friend groups",
            mixedDevices: "Yes (any tracker via screenshot)",
            free: true,
            groupSize: "Unlimited",
            tradeoff: "Manual upload (15 sec)",
            highlight: true,
        },
        {
            app: "Stridekick",
            bestFor: "Auto-sync convenience",
            mixedDevices: "Partial (4 platforms)",
            free: false,
            groupSize: "Up to 20",
            tradeoff: "Sync issues, limited free tier",
            highlight: false,
        },
        {
            app: "StepUp",
            bestFor: "Simple 1v1 challenges",
            mixedDevices: "Partial",
            free: true,
            groupSize: "Small groups",
            tradeoff: "Limited device support",
            highlight: false,
        },
        {
            app: "Social Steps",
            bestFor: "Social walking features",
            mixedDevices: "Partial",
            free: true,
            groupSize: "Varies",
            tradeoff: "Smaller community",
            highlight: false,
        },
        {
            app: "Fitbit Challenges",
            bestFor: "All-Fitbit groups",
            mixedDevices: "No (Fitbit only)",
            free: true,
            groupSize: "Up to 10",
            tradeoff: "Single ecosystem lock-in",
            highlight: false,
        },
    ];

    return (
        <section id="app-comparison-table" className="bg-muted/30 py-24">
            <div className="px-6 lg:px-8 max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                        Side-by-Side Comparison
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        Quick reference for choosing the right app for your group.
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full bg-card border border-border rounded-2xl overflow-hidden">
                        <thead>
                            <tr className="border-b border-border bg-muted/50">
                                <th className="text-left p-4 font-bold text-sm">App</th>
                                <th className="text-left p-4 font-bold text-sm">Best For</th>
                                <th className="text-left p-4 font-bold text-sm">Mixed Devices?</th>
                                <th className="text-center p-4 font-bold text-sm">Free?</th>
                                <th className="text-left p-4 font-bold text-sm">Group Size</th>
                                <th className="text-left p-4 font-bold text-sm">Main Tradeoff</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, i) => (
                                <tr
                                    key={row.app}
                                    className={`border-b border-border last:border-b-0 ${
                                        row.highlight ? "bg-primary/5" : i % 2 === 1 ? "bg-muted/20" : ""
                                    }`}
                                >
                                    <td className="p-4 font-bold text-sm whitespace-nowrap">
                                        {row.highlight && (
                                            <span className="inline-block w-2 h-2 rounded-full bg-primary mr-2" />
                                        )}
                                        {row.app}
                                    </td>
                                    <td className="p-4 text-sm text-muted-foreground">{row.bestFor}</td>
                                    <td className="p-4 text-sm text-muted-foreground">{row.mixedDevices}</td>
                                    <td className="p-4 text-center">
                                        {row.free ? (
                                            <Check className="w-5 h-5 text-emerald-500 mx-auto" />
                                        ) : (
                                            <span className="text-xs text-muted-foreground">Freemium</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-sm text-muted-foreground">{row.groupSize}</td>
                                    <td className="p-4 text-sm text-muted-foreground">{row.tradeoff}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}

// ============================================================================
// 5. Challenge Ideas
// ============================================================================

function ChallengeIdeasSection() {
    const ideas = [
        {
            icon: Target,
            color: "text-primary",
            bg: "bg-primary/10",
            title: "The Weekly Total Challenge",
            tagline: "Collaborative, not competitive",
            description:
                "Everyone tries to hit a shared weekly step target \u2014 say, 50,000 steps per week. Everyone who hits it \"wins.\" Works great for groups with mixed fitness levels.",
            why: "Nobody feels bad about a low-step Tuesday if they crush it on Saturday. The weekly window gives flexibility.",
        },
        {
            icon: Flame,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
            title: "The Daily Streak Challenge",
            tagline: "Simple and addictive",
            description:
                "Who can maintain the longest streak of hitting 8,000+ steps per day? Miss a day, your streak resets.",
            why: "It taps into loss aversion. Once you have a 12-day streak going, you really don't want to break it. Build in \"grace days\" from the start.",
        },
        {
            icon: Trophy,
            color: "text-purple-400",
            bg: "bg-purple-500/10",
            title: "Head-to-Head Matchups",
            tagline: "Fantasy football for walking",
            description:
                "Pair friends up randomly each week. Whoever gets more steps wins that round. Track wins over a season.",
            why: "You only need to beat one person each week, which feels achievable even when the group's top walker pulls 15,000 steps daily.",
        },
        {
            icon: Users,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
            title: "Team Relay Challenge",
            tagline: "Team accountability is powerful",
            description:
                "Split into teams of 3\u20134. Each team's total steps count toward a shared goal \u2014 like \"walking\" from London to Paris (roughly 4.5 million steps for a group of four).",
            why: "You don't want to be the one dragging your team down. Plus it sparks conversation: \"I'm doing an extra lap because Team B is ahead.\"",
        },
        {
            icon: Zap,
            color: "text-sky-400",
            bg: "bg-sky-500/10",
            title: "The Escalator Challenge",
            tagline: "Progressive overload for walking",
            description:
                "Start at 5,000 steps/day in week one. Add 1,000 each week for six weeks. By the end, everyone hits 10,000+. Great for sedentary groups.",
            why: "Gradual increases feel manageable. By week four, 8,000 steps feels normal even though it would have felt daunting at the start.",
        },
    ];

    return (
        <section className="py-24">
            <div className="px-6 lg:px-8 max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-sm font-semibold mb-6">
                        <Trophy className="w-4 h-4" />
                        <span>Challenge Formats</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                        Walking Challenge Ideas for Friend Groups
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Not every friend group wants the same thing. Here are formats that work for
                        different dynamics.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ideas.map((idea) => (
                        <div
                            key={idea.title}
                            className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 hover:scale-105 transition-all group"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div
                                    className={`w-10 h-10 rounded-xl ${idea.bg} ${idea.color} flex items-center justify-center`}
                                >
                                    <idea.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold">{idea.title}</h3>
                                    <span className="text-xs text-muted-foreground">
                                        {idea.tagline}
                                    </span>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">
                                {idea.description}
                            </p>
                            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                                <p className="text-sm text-muted-foreground">
                                    <strong className="text-foreground">Why it works:</strong>{" "}
                                    {idea.why}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ============================================================================
// 6. Motivation Tips
// ============================================================================

function MotivationTipsSection() {
    const tips = [
        {
            icon: Heart,
            color: "text-pink-400",
            bg: "bg-pink-500/10",
            title: "Keep the Group Chat Active",
            description:
                "Share screenshots of your walks. Post a funny photo from your route. The challenge itself is the excuse, but the social connection sustains it. Platforms like StepLeague have built-in High Fives \u2014 one tap, no typing needed.",
        },
        {
            icon: Trophy,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
            title: "Celebrate Consistency, Not Just High Numbers",
            description:
                "The person who walks 7,500 steps every single day is doing something harder than the person who logs one 20,000-step hiking day and coasts. Call that out.",
        },
        {
            icon: Flame,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
            title: "Add Mini-Challenges",
            description:
                "\"Whoever gets the most steps on Saturday wins bragging rights.\" These little spikes of competition break up the monotony and keep things fresh.",
        },
        {
            icon: Users,
            color: "text-sky-400",
            bg: "bg-sky-500/10",
            title: "Let People Have Off Days",
            description:
                "If your challenge makes people feel guilty for resting, it will die fast. Build in explicit rest days or use a weekly total format that naturally accommodates them.",
        },
    ];

    return (
        <section className="bg-muted/30 py-24">
            <div className="px-6 lg:px-8 max-w-5xl mx-auto">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 text-pink-400 text-sm font-semibold mb-6">
                        <Heart className="w-4 h-4" />
                        <span>Staying Power</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                        How to Keep Going When Motivation Drops
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Every walking challenge hits a wall around week two or three. The novelty
                        wears off. This is normal \u2014 and it&apos;s fixable.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {tips.map((tip) => (
                        <div
                            key={tip.title}
                            className="bg-card border border-border rounded-2xl p-6"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div
                                    className={`w-10 h-10 rounded-xl ${tip.bg} ${tip.color} flex items-center justify-center`}
                                >
                                    <tip.icon className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold">{tip.title}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">{tip.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ============================================================================
// 7. Mixed Devices Section
// ============================================================================

function MixedDevicesSection() {
    return (
        <section className="py-24">
            <div className="px-6 lg:px-8 max-w-5xl mx-auto">
                <div className="bg-card border border-border rounded-3xl p-8 lg:p-12 flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-sm font-semibold mb-6">
                            <Smartphone className="w-4 h-4" />
                            <span>The #1 Problem</span>
                        </div>
                        <h2 className="text-3xl font-bold mb-4">
                            What If Your Friends All Use Different Devices?
                        </h2>
                        <p className="text-lg text-muted-foreground mb-4">
                            This is the number one reason friend walking challenges fail. Your group
                            has Apple Watch, Fitbit, Samsung, Garmin, and someone just using their
                            phone&apos;s pedometer. Most apps only sync with one or two ecosystems.
                        </p>
                        <p className="text-lg text-muted-foreground mb-6">
                            The screenshot-based approach solves this completely. Everyone opens
                            whatever health app they already use, takes a screenshot, and uploads it.{" "}
                            <Link href="/why-upload" className="text-primary hover:underline">
                                StepLeague&apos;s AI verification
                            </Link>{" "}
                            reads the numbers and confirms they&apos;re legitimate. No syncing issues.
                            No one left out.
                        </p>
                        <Link
                            href="/how-it-works"
                            className="inline-flex items-center text-primary font-medium hover:underline"
                        >
                            See how it works
                            <ArrowRight className="ml-1 w-4 h-4" />
                        </Link>
                    </div>
                    <div className="flex-shrink-0 w-full md:w-72 aspect-square bg-gradient-to-br from-amber-500/10 to-primary/5 rounded-2xl flex flex-col items-center justify-center border border-border gap-4 p-6">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center text-xs font-bold text-muted-foreground">
                                iOS
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center text-xs font-bold text-muted-foreground">
                                Fitbit
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center text-xs font-bold text-muted-foreground">
                                Garmin
                            </div>
                        </div>
                        <ArrowRight className="w-6 h-6 text-muted-foreground rotate-90" />
                        <div className="bg-primary/10 border border-primary/30 rounded-xl px-4 py-3 text-center">
                            <Smartphone className="w-8 h-8 text-primary mx-auto mb-1" />
                            <span className="text-xs font-bold text-primary">StepLeague</span>
                        </div>
                        <ArrowRight className="w-6 h-6 text-muted-foreground rotate-90" />
                        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-500">
                            <Check className="w-4 h-4" />
                            Everyone competes
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ============================================================================
// 8. Not For You Section
// ============================================================================

function NotForYouSection() {
    const warnings = [
        "If you need clinical accountability for a medical condition, a walking challenge with friends is fun but not a substitute for working with a physical therapist or doctor.",
        "If your friend group has wildly different mobility levels, a step-count competition might feel exclusionary. Consider a percentage-improvement format or time-based goals (minutes of movement) instead.",
        "If you tend toward exercise compulsion, the competitive element could feed unhealthy patterns. A collaborative \"everyone hits their own goal\" format is safer.",
        "If you just want solo tracking, you don't need a social app. Your phone's built-in pedometer works fine.",
    ];

    return (
        <section className="bg-muted/30 py-24">
            <div className="px-6 lg:px-8 max-w-4xl mx-auto">
                <div className="bg-card border border-amber-500/30 rounded-2xl p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-amber-500">
                            When This Isn&apos;t the Right Move
                        </h2>
                    </div>
                    <p className="text-muted-foreground mb-6">
                        Real talk: this approach isn&apos;t for everyone, and it doesn&apos;t solve
                        every problem.
                    </p>
                    <ul className="space-y-4">
                        {warnings.map((warning, i) => (
                            <li
                                key={i}
                                className="flex items-start gap-3 text-muted-foreground"
                            >
                                <X className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                                <span>{warning}</span>
                            </li>
                        ))}
                    </ul>
                    <p className="text-sm text-muted-foreground mt-6 italic">
                        Know your group. Know yourself. Pick the format that fits.
                    </p>
                </div>
            </div>
        </section>
    );
}

// ============================================================================
// 9. FAQ Section
// ============================================================================

function FAQSection() {
    const faqs = [
        {
            question: "What is the free walking challenge app with friends?",
            answer: "Several apps offer free walking challenges with friends. StepLeague provides a free tier with unlimited step uploads, private leagues, and a global leaderboard. It works across all devices since you upload screenshots rather than syncing APIs. Stridekick and StepUp also have free options, though with varying limitations on features and device compatibility. The best choice depends on whether your friend group all uses the same fitness tracker or a mix.",
        },
        {
            question: "What is the 6 6 6 rule for walking?",
            answer: "The 6 6 6 rule is a walking guideline that suggests walking for 6 minutes after each meal, 6 days per week, at a pace of 6 km/h (about 3.7 mph). It\u2019s designed to help regulate blood sugar levels, particularly after eating. Research published in Sports Medicine found that even short post-meal walks of 2\u20135 minutes can significantly reduce blood sugar spikes. For a walking challenge with friends, it makes a great micro-challenge: \u201CDid everyone get their post-meal walk in today?\u201D",
        },
        {
            question: "How do you create a virtual walking challenge?",
            answer: "Creating a virtual walking challenge takes just a few steps. First, choose a platform that supports your group\u2019s devices. On StepLeague, you create a private league and share the invite link. Each participant uploads daily step screenshots from their fitness app. The AI verifies the counts, and everyone can see the leaderboard. Set your challenge duration (four weeks is a great starting point), pick a format (weekly totals, streaks, or head-to-head), and agree on any house rules. The virtual format means friends in different cities or countries can compete together.",
        },
        {
            question: "What are some walking challenges?",
            answer: "Popular walking challenges include: the 10,000-step daily challenge, 30-day streak challenges, distance-based virtual routes (like \u201Cwalk the length of your country\u201D), team relay formats, and escalating weekly targets. For friend groups, head-to-head weekly matchups add a competitive edge while keeping things manageable.",
        },
    ];

    return (
        <section className="py-24">
            <div className="px-6 lg:px-8 max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                        Frequently Asked Questions
                    </h2>
                </div>
                <div className="space-y-4">
                    {faqs.map((faq, i) => (
                        <details
                            key={i}
                            className="group bg-card border border-border rounded-xl"
                        >
                            <summary className="cursor-pointer p-4 font-medium hover:text-primary transition-colors list-none flex items-center justify-between">
                                {faq.question}
                                <span className="text-muted-foreground group-open:rotate-180 transition-transform">
                                    &#9660;
                                </span>
                            </summary>
                            <div className="px-4 pb-4 text-muted-foreground">
                                {faq.answer}
                            </div>
                        </details>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ============================================================================
// 10. Related Pages
// ============================================================================

function RelatedPagesSection() {
    const pages = [
        {
            title: "How StepLeague Works",
            description: "See the screenshot upload and AI verification process",
            href: "/how-it-works",
        },
        {
            title: "Why Upload Screenshots?",
            description: "The fairness and device-agnostic philosophy",
            href: "/why-upload",
        },
        {
            title: "StepLeague vs Stridekick",
            description: "Detailed comparison for friend group challenges",
            href: "/compare/stepleague-vs-stridekick",
        },
        {
            title: "StepLeague vs Fitbit",
            description: "When built-in challenges aren\u2019t enough",
            href: "/compare/stepleague-vs-fitbit",
        },
        {
            title: "Compare All Step Challenge Apps",
            description: "Full competitive landscape",
            href: "/compare",
        },
        {
            title: "Pricing",
            description: "Free tier details and premium features",
            href: "/pricing",
        },
    ];

    return (
        <section className="bg-muted/30 py-24">
            <div className="px-6 lg:px-8 max-w-5xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-2xl font-bold mb-4">Related Pages</h2>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pages.map((page) => (
                        <Link
                            key={page.href}
                            href={page.href}
                            className="group bg-card border border-border rounded-xl p-5 hover:border-primary/50 hover:shadow-lg transition-all"
                        >
                            <h3 className="font-bold mb-1 group-hover:text-primary transition-colors">
                                {page.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-3">
                                {page.description}
                            </p>
                            <span className="inline-flex items-center text-sm font-medium text-primary">
                                Read more
                                <ArrowRight className="ml-1 w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ============================================================================
// 11. CTA Section
// ============================================================================

function CTASection() {
    return (
        <section className="px-6 lg:px-8 max-w-4xl mx-auto py-16">
            <div className="bg-gradient-to-b from-card to-muted border border-border rounded-2xl p-8 text-center">
                <h2 className="text-3xl font-bold mb-4">
                    Ready to Walk With Your Friends?
                </h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                    Create a free league, invite your group, and start your first walking
                    challenge in under five minutes. Any device. Any fitness app.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        href="/sign-up"
                        className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-bold text-primary-foreground bg-gradient-brand-primary rounded-full hover:scale-105 transition-transform glow-primary"
                    >
                        Start a Challenge Free
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                    <Link
                        href="/league/create"
                        className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-foreground border border-border rounded-full hover:bg-muted/50 transition-colors"
                    >
                        Create a League
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                    No credit card required. Works with any device.
                </p>
            </div>
        </section>
    );
}
