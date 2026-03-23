import { Metadata } from "next";
import Link from "next/link";
import {
    Building2,
    Users,
    Trophy,
    BarChart3,
    ArrowRight,
    AlertTriangle,
    Check,
    X,
    Smartphone,
    ShieldCheck,
    Target,
    Clock,
    TrendingUp,
    Zap,
    Briefcase,
    Calendar,
    MessageSquare,
    Award,
    Star,
} from "lucide-react";

export const metadata: Metadata = {
    title: "Workplace Step Challenge: Free Setup Guide (2026) | StepLeague",
    description:
        "Run a workplace step challenge that actually works. Free setup guide, platform comparison, and the device compatibility fix most guides skip.",
    keywords: [
        "workplace step challenge",
        "step challenge ideas",
        "workplace step challenge template",
        "free step challenges for workplace",
        "workplace step challenge app",
    ],
    openGraph: {
        title: "Workplace Step Challenge: Free Setup Guide (2026) | StepLeague",
        description:
            "Run a workplace step challenge that actually works. Free setup guide, platform comparison, and the device compatibility fix most guides skip.",
        type: "website",
        url: "/workplace-step-challenge",
    },
};

/* -------------------------------------------------------------------------- */
/*  JSON-LD Structured Data                                                    */
/* -------------------------------------------------------------------------- */

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
                    item: "https://stepleague.app/",
                },
                {
                    "@type": "ListItem",
                    position: 2,
                    name: "Workplace Step Challenge",
                    item: "https://stepleague.app/workplace-step-challenge",
                },
            ],
        },
        {
            "@type": "FAQPage",
            mainEntity: [
                {
                    "@type": "Question",
                    name: "How do I organize a step challenge at work?",
                    acceptedAnswer: {
                        "@type": "Answer",
                        text: "Pick a device-agnostic platform, set a 4-week timeframe, create team-based and individual challenges, and run weekly engagement touchpoints. The biggest operational decision is choosing a tool that works with every fitness tracker your employees already own.",
                    },
                },
                {
                    "@type": "Question",
                    name: "How long should a workplace step challenge last?",
                    acceptedAnswer: {
                        "@type": "Answer",
                        text: "Four weeks for your first challenge. That gives enough time for people to establish habits without hitting tracking fatigue. Experienced teams can go up to eight weeks if you break the challenge into phases with distinct milestones.",
                    },
                },
                {
                    "@type": "Question",
                    name: "What is a good step goal for a workplace challenge?",
                    acceptedAnswer: {
                        "@type": "Answer",
                        text: "It depends on role type. Desk workers should target 6,000-8,000 daily steps. Mixed roles can aim for 8,000-10,000. A better approach than flat targets: challenge participants to improve their personal baseline by 20-30%.",
                    },
                },
                {
                    "@type": "Question",
                    name: "How do you keep employees engaged in a step challenge?",
                    acceptedAnswer: {
                        "@type": "Answer",
                        text: "Weekly leaderboard updates, team-based competition, social features like peer encouragement, and mid-challenge bonus events. Recognition outperforms small prizes for sustained motivation.",
                    },
                },
                {
                    "@type": "Question",
                    name: "Can employees use any fitness tracker for a workplace step challenge?",
                    acceptedAnswer: {
                        "@type": "Answer",
                        text: "On most enterprise platforms, no. They typically support Apple Health, Google Fit, and Fitbit via API. StepLeague takes a different approach: participants upload a screenshot from any fitness app or device, and AI verifies the data. This means Samsung Health, Garmin, Xiaomi, Whoop, or even a basic phone pedometer all work equally well.",
                    },
                },
            ],
        },
        {
            "@type": "HowTo",
            name: "How to Set Up a Workplace Step Challenge",
            description:
                "A 7-step guide to launching a successful workplace step challenge for any team size.",
            step: [
                {
                    "@type": "HowToStep",
                    position: 1,
                    name: "Pick your dates and duration",
                    text: "Choose a 4-week window that avoids major holidays and company events. Monday starts work best. Announce the challenge at least 7 days before launch.",
                },
                {
                    "@type": "HowToStep",
                    position: 2,
                    name: "Choose your platform",
                    text: "For mixed-device teams, use a device-agnostic platform like StepLeague. For enterprise environments, check if step challenges are included in your existing wellness vendor contract.",
                },
                {
                    "@type": "HowToStep",
                    position: 3,
                    name: "Define the challenge structure",
                    text: "Decide between individual, team-based, or both. Team challenges drive higher participation. Individual leaderboards drive higher step counts.",
                },
                {
                    "@type": "HowToStep",
                    position: 4,
                    name: "Set goals that match your workforce",
                    text: "Use role-based targets: 6,000-8,000 for desk workers, 8,000-10,000 for mixed roles. Consider running a one-week baseline period before the official start.",
                },
                {
                    "@type": "HowToStep",
                    position: 5,
                    name: "Launch with clear instructions",
                    text: "Send one email with the start date, how to join in under 3 steps, what counts as a step, and where to find the leaderboard.",
                },
                {
                    "@type": "HowToStep",
                    position: 6,
                    name: "Run weekly engagement touchpoints",
                    text: "Monday: leaderboard update. Wednesday: mid-week challenge. Friday: shout-outs for consistency. This takes about 20 minutes per week.",
                },
                {
                    "@type": "HowToStep",
                    position: 7,
                    name: "Close strong and gather feedback",
                    text: "Announce final leaderboard, recognize winners and most improved, and send a 3-question survey to plan your next challenge.",
                },
            ],
        },
    ],
};

/* -------------------------------------------------------------------------- */
/*  Page Component                                                             */
/* -------------------------------------------------------------------------- */

export default function WorkplaceStepChallengePage() {
    return (
        <div className="min-h-screen pt-24 pb-16 bg-background">
            {/* JSON-LD */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* ── Hero ─────────────────────────────────────────────────── */}
            <section className="relative px-6 lg:px-8 max-w-5xl mx-auto mb-24 text-center overflow-hidden">
                {/* Decorative blurs */}
                <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -top-16 -right-24 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-8">
                        <Building2 className="w-4 h-4" />
                        <span>Corporate Wellness Guide</span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6">
                        Workplace Step Challenge:{" "}
                        <span className="text-gradient-brand">
                            The Complete Setup Guide
                        </span>
                    </h1>

                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
                        A workplace step challenge is simple to explain and surprisingly hard
                        to run well. Half your office uses Apple Watch, a third uses Fitbit,
                        someone has a Garmin, and the new hire just counts steps on their
                        phone.
                    </p>

                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
                        You need three things: a platform that accepts{" "}
                        <strong className="text-foreground">any device</strong>, a way to{" "}
                        <strong className="text-foreground">verify steps</strong>, and a
                        structure that keeps people walking past week two. This guide covers
                        all of it.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/teams"
                            className="inline-flex items-center gap-2 px-8 py-4 text-lg font-bold text-primary-foreground bg-gradient-brand-primary rounded-full hover:scale-105 transition-transform glow-primary"
                        >
                            Set Up a Free Challenge
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            href="#setup-guide"
                            className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-foreground border border-border rounded-full hover:bg-muted/50 transition-colors"
                        >
                            Skip to 7-Step Guide
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── Quick-Scan Decision Matrix ───────────────────────────── */}
            <section className="bg-muted/30 py-20">
                <div className="px-6 lg:px-8 max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl font-bold mb-3">
                            Quick-Scan: Is a Step Challenge Right for Your Team?
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Before you spend time planning, here&apos;s the honest breakdown.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <QuickStatCard
                            icon={Users}
                            label="Best Team Size"
                            value="10 - 500"
                            detail="Smaller teams work but need higher per-person buy-in"
                        />
                        <QuickStatCard
                            icon={Clock}
                            label="Typical Duration"
                            value="4 - 8 weeks"
                            detail="Shorter loses momentum, longer causes burnout"
                        />
                        <QuickStatCard
                            icon={BarChart3}
                            label="Avg. Participation"
                            value="40 - 60%"
                            detail="Of eligible employees across corporate programs"
                        />
                        <QuickStatCard
                            icon={Briefcase}
                            label="Budget Range"
                            value="$0 - $5+"
                            detail="Per employee per month, depending on platform"
                        />
                        <QuickStatCard
                            icon={AlertTriangle}
                            label="Biggest Failure Point"
                            value="Devices & Fairness"
                            detail="Device fragmentation and perceived unfairness kill challenges"
                        />
                        <QuickStatCard
                            icon={Zap}
                            label="Setup Time"
                            value="1 - 3 days"
                            detail="With the right tool. 2+ weeks without one."
                        />
                    </div>

                    <p className="text-center text-muted-foreground mt-8 max-w-2xl mx-auto">
                        If your team is remote or hybrid, step challenges actually work
                        better than most wellness programs because walking doesn&apos;t need a
                        gym, a class, or a specific time slot.
                    </p>
                </div>
            </section>

            {/* ── How to Organize ──────────────────────────────────────── */}
            <section className="px-6 lg:px-8 max-w-5xl mx-auto py-20">
                <h2 className="text-2xl font-bold mb-3 text-center">
                    How Do You Organize a Step Challenge at Work?
                </h2>
                <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
                    Most guides list vague steps like &ldquo;set goals&rdquo; and
                    &ldquo;communicate with your team.&rdquo; Here&apos;s what actually
                    matters.
                </p>

                <div className="grid md:grid-cols-3 gap-8">
                    <ProblemCard
                        icon={Smartphone}
                        title="The Device Problem"
                        description="In any office of 20+ people, you'll find 3-4 different fitness tracking ecosystems. The platform you choose either handles this or you'll spend the challenge answering 'how do I connect?' emails."
                        solution="StepLeague solves this with screenshot-based verification. If your device shows step counts on a screen, it works. Zero device restrictions, zero setup friction."
                    />
                    <ProblemCard
                        icon={ShieldCheck}
                        title="The Fairness Problem"
                        description="Self-reported step counts in a shared spreadsheet invite exaggeration. In a corporate setting with prizes or bragging rights on the line, you need verification."
                        solution="AI-powered screenshot verification isn't about catching cheaters. It's about making sure honest participants don't feel the system is stacked against them."
                    />
                    <ProblemCard
                        icon={MessageSquare}
                        title="Communication Cadence"
                        description="A beautiful launch email followed by silence for three weeks kills participation. You need weekly updates at minimum."
                        solution="Leaderboard snapshots, shout-outs for consistency (not just highest counts), and mid-challenge reminders all help flatten the engagement curve."
                    />
                </div>
            </section>

            {/* ── Duration Section ─────────────────────────────────────── */}
            <section className="bg-muted/30 py-20">
                <div className="px-6 lg:px-8 max-w-5xl mx-auto">
                    <h2 className="text-2xl font-bold mb-3 text-center">
                        How Long Should a Workplace Step Challenge Last?
                    </h2>
                    <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
                        Four weeks is the sweet spot for a first challenge. Here&apos;s why
                        each duration option plays out.
                    </p>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <DurationCard
                            weeks="2 Weeks"
                            verdict="Too Short"
                            color="text-red-400"
                            bg="bg-red-500/10"
                            borderColor="border-red-500/20"
                            description="People spend 3-4 days figuring out the platform. By the time everyone's competing, you're halfway done. No time for habit formation."
                        />
                        <DurationCard
                            weeks="4 Weeks"
                            verdict="Sweet Spot"
                            color="text-green-400"
                            bg="bg-green-500/10"
                            borderColor="border-green-500/30"
                            description="Enough time to establish habits, build competitive momentum, and see real leaderboard movement. Perfect for first-time challenges."
                            recommended
                        />
                        <DurationCard
                            weeks="8 Weeks"
                            verdict="Experienced Teams"
                            color="text-amber-400"
                            bg="bg-amber-500/10"
                            borderColor="border-amber-500/20"
                            description="Works if participation stays above 50% through week four. Build in milestones - a flat 8-week grind loses people around week five."
                        />
                        <DurationCard
                            weeks="12 Weeks"
                            verdict="Almost Always Too Long"
                            color="text-red-400"
                            bg="bg-red-500/10"
                            borderColor="border-red-500/20"
                            description="Daily tracking for three months leads to fatigue. Engagement data consistently shows drop-off rates accelerating after week six."
                        />
                    </div>

                    <div className="mt-10 bg-card border border-border rounded-2xl p-6">
                        <p className="text-sm font-semibold text-foreground mb-2">
                            Pro Tip: Phase Your Longer Challenges
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Weeks 1-2: baseline building. Weeks 3-4: team competitions. Weeks
                            5-6: bonus challenges (most improved, streak awards). Each phase
                            gives people a fresh reason to stay engaged.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── Step Goals Section ───────────────────────────────────── */}
            <section className="px-6 lg:px-8 max-w-5xl mx-auto py-20">
                <h2 className="text-2xl font-bold mb-3 text-center">
                    What Is a Good Step Goal for a Workplace Challenge?
                </h2>
                <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
                    The 10,000-step default came from a 1960s Japanese marketing campaign
                    for a pedometer, not exercise science. Here are realistic targets by
                    role type.
                </p>

                <div className="grid md:grid-cols-3 gap-6 mb-10">
                    <GoalCard
                        icon={Briefcase}
                        role="Desk-Based Workers"
                        range="6,000 - 8,000"
                        detail="Genuinely challenging for people who sit most of the day"
                        color="text-sky-400"
                        bg="bg-sky-500/10"
                    />
                    <GoalCard
                        icon={Users}
                        role="Mixed Roles"
                        range="8,000 - 10,000"
                        detail="Some standing and walking built into the workday"
                        color="text-purple-400"
                        bg="bg-purple-500/10"
                    />
                    <GoalCard
                        icon={TrendingUp}
                        role="Active Roles"
                        range="10,000 - 15,000"
                        detail="Warehouse, retail floor, and other physical roles"
                        color="text-amber-400"
                        bg="bg-amber-500/10"
                    />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                        <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                            <Target className="w-5 h-5 text-primary" />
                            Better Approach: Percentage Improvement
                        </h3>
                        <p className="text-muted-foreground text-sm">
                            Challenge employees to increase their baseline by 20-30%. Someone
                            averaging 4,000 steps who hits 5,200 is making a bigger behavioral
                            change than someone who already walks 12,000 and coasts to the same
                            number.
                        </p>
                    </div>
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                        <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary" />
                            Team Goals Prevent Sandbagging
                        </h3>
                        <p className="text-muted-foreground text-sm">
                            When individual rankings dominate, casual walkers disengage. Team
                            averages level the field. A team of five where everyone hits 7,000
                            beats a team where one person hits 20,000 and four hit 3,000.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── Engagement Section ───────────────────────────────────── */}
            <section className="bg-muted/30 py-20">
                <div className="px-6 lg:px-8 max-w-5xl mx-auto">
                    <h2 className="text-2xl font-bold mb-3 text-center">
                        How Do You Keep Employees Engaged?
                    </h2>
                    <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
                        Participation follows a predictable curve: high week one, steady week
                        two, drop week three, small rally at the finish. Your job is to
                        flatten it.
                    </p>

                    <div className="grid sm:grid-cols-2 gap-6 mb-10">
                        <EngagementCard
                            icon={Users}
                            title="Social Features Beat Prizes"
                            description="Prizes drive sign-ups. Social accountability drives daily participation. Features like peer encouragement tap into the same psychology that makes group fitness sticky."
                        />
                        <EngagementCard
                            icon={BarChart3}
                            title="Leaderboard Visibility"
                            description="If people have to dig through an app to find standings, they won't. Make it prominent, updated frequently, and ideally visible without logging in."
                        />
                        <EngagementCard
                            icon={Award}
                            title="Recognition Over Rewards"
                            description='A $25 gift card motivates for 48 hours. Being named "Most Consistent Walker" in a company-wide email motivates for weeks. Public recognition costs nothing.'
                        />
                        <EngagementCard
                            icon={Zap}
                            title="Mid-Challenge Events"
                            description="Double step days, department showdowns, Walking Meeting Wednesdays, and weekend warrior bonuses prevent the week-three slump."
                        />
                    </div>

                    <div className="bg-card border border-border rounded-2xl p-6">
                        <h3 className="font-semibold mb-3">Mini-Challenge Ideas to Break the Routine:</h3>
                        <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                                <Star className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                                &ldquo;Double step day&rdquo; where one day&apos;s steps count 2x
                            </li>
                            <li className="flex items-start gap-2">
                                <Star className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                                Department vs. department showdowns
                            </li>
                            <li className="flex items-start gap-2">
                                <Star className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                                &ldquo;Walking Meeting Wednesday&rdquo; step logging
                            </li>
                            <li className="flex items-start gap-2">
                                <Star className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                                Weekend warrior bonus for Saturday/Sunday activity
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* ── Platform Comparison Table ─────────────────────────────── */}
            <section className="px-6 lg:px-8 max-w-6xl mx-auto py-20">
                <h2 className="text-2xl font-bold mb-3 text-center">
                    Workplace Step Challenge App Comparison
                </h2>
                <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
                    The platform market splits into three tiers: enterprise suites
                    ($3-8/employee/month), mid-market ($1-3), and free/freemium tools.
                    Here&apos;s the honest comparison.
                </p>

                <div className="overflow-x-auto">
                    <div className="min-w-[800px]">
                        {/* Table Header */}
                        <div className="grid grid-cols-6 gap-px bg-muted/50 rounded-t-xl overflow-hidden text-sm font-semibold">
                            <div className="bg-card p-4">Platform</div>
                            <div className="bg-card p-4">Best For</div>
                            <div className="bg-card p-4">Device Support</div>
                            <div className="bg-card p-4">Pricing</div>
                            <div className="bg-card p-4">Min Team</div>
                            <div className="bg-card p-4">Main Tradeoff</div>
                        </div>

                        {/* StepLeague - highlighted */}
                        <div className="grid grid-cols-6 gap-px bg-primary/10 border-x-2 border-primary/30 text-sm">
                            <div className="bg-primary/5 p-4 font-bold text-primary">StepLeague</div>
                            <div className="bg-primary/5 p-4 text-muted-foreground">Any team size, mixed devices</div>
                            <div className="bg-primary/5 p-4 text-muted-foreground">Any tracker (screenshot-based)</div>
                            <div className="bg-primary/5 p-4 text-muted-foreground">Free tier available</div>
                            <div className="bg-primary/5 p-4 text-muted-foreground">None</div>
                            <div className="bg-primary/5 p-4 text-muted-foreground">No direct API sync (by design)</div>
                        </div>

                        {[
                            {
                                name: "Wellable",
                                best: "Enterprise programs",
                                devices: "Major wearables via API",
                                price: "Per-employee/month",
                                min: "~50",
                                tradeoff: "Cost adds up; setup time",
                            },
                            {
                                name: "Wellhub (Gympass)",
                                best: "Full wellness suite",
                                devices: "Major wearables",
                                price: "Per-employee/month",
                                min: "Varies",
                                tradeoff: "Step challenges are one small feature",
                            },
                            {
                                name: "BigTeamChallenge",
                                best: "Virtual race format",
                                devices: "Manual + some integrations",
                                price: "Per-person, one-time",
                                min: "~10",
                                tradeoff: "Race-focused, less flexible",
                            },
                            {
                                name: "IncentFit",
                                best: "Incentive-driven programs",
                                devices: "Major wearables via API",
                                price: "Per-employee/month",
                                min: "~25",
                                tradeoff: "Requires incentive budget on top",
                            },
                            {
                                name: "Spreadsheet (DIY)",
                                best: "Tiny teams, zero budget",
                                devices: "Manual entry only",
                                price: "Free",
                                min: "None",
                                tradeoff: "No verification, admin burden",
                            },
                        ].map((row, i) => (
                            <div
                                key={row.name}
                                className={`grid grid-cols-6 gap-px text-sm ${i % 2 === 0 ? "bg-muted/30" : ""}`}
                            >
                                <div className="bg-card p-4 font-semibold text-foreground">{row.name}</div>
                                <div className="bg-card p-4 text-muted-foreground">{row.best}</div>
                                <div className="bg-card p-4 text-muted-foreground">{row.devices}</div>
                                <div className="bg-card p-4 text-muted-foreground">{row.price}</div>
                                <div className="bg-card p-4 text-muted-foreground">{row.min}</div>
                                <div className="bg-card p-4 text-muted-foreground">{row.tradeoff}</div>
                            </div>
                        ))}

                        <div className="bg-muted/20 rounded-b-xl h-1" />
                    </div>
                </div>

                <p className="text-sm text-muted-foreground mt-6 text-center max-w-2xl mx-auto">
                    <strong className="text-foreground">The real differentiator is device support.</strong>{" "}
                    Most enterprise platforms cover 70-80% of your office via API. The
                    remaining 20-30% either can&apos;t participate or have to manually enter
                    data. StepLeague&apos;s screenshot approach means if your device shows
                    steps on a screen, it works.
                </p>

                <p className="text-sm text-muted-foreground mt-3 text-center">
                    For a deeper comparison, see our{" "}
                    <Link href="/compare" className="text-primary hover:underline">
                        full comparison page
                    </Link>
                    .
                </p>
            </section>

            {/* ── Free Options Section ──────────────────────────────────── */}
            <section className="bg-muted/30 py-20">
                <div className="px-6 lg:px-8 max-w-5xl mx-auto">
                    <h2 className="text-2xl font-bold mb-3 text-center">
                        Free Step Challenges for Workplace Teams
                    </h2>
                    <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
                        &ldquo;Free&rdquo; in workplace wellness usually means &ldquo;free
                        trial&rdquo; or &ldquo;free for up to 5 people.&rdquo; Let&apos;s be
                        specific.
                    </p>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Genuinely Free */}
                        <div className="bg-card border border-border rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                                    <Check className="w-5 h-5 text-green-400" />
                                </div>
                                <h3 className="font-bold text-foreground">Genuinely Free</h3>
                            </div>
                            <ul className="space-y-3 text-sm text-muted-foreground">
                                <li className="flex items-start gap-2">
                                    <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                    <span>
                                        <strong className="text-foreground">StepLeague free tier:</strong>{" "}
                                        Unlimited step tracking, AI verification, private leagues,
                                        global leaderboard. No per-employee cost.
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                    <span>
                                        <strong className="text-foreground">Google Sheets template:</strong>{" "}
                                        Free but requires manual data entry and maintenance. Works
                                        for teams under 10.
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                    <span>
                                        <strong className="text-foreground">Apple Fitness competitions:</strong>{" "}
                                        Free but only works if literally everyone has an Apple Watch.
                                    </span>
                                </li>
                            </ul>
                        </div>

                        {/* "Free" with catches */}
                        <div className="bg-card border border-border rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                                </div>
                                <h3 className="font-bold text-foreground">&ldquo;Free&rdquo; with Catches</h3>
                            </div>
                            <ul className="space-y-3 text-sm text-muted-foreground">
                                <li className="flex items-start gap-2">
                                    <X className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                                    <span>
                                        14-30 day trials. Enough for a short challenge, not sustained
                                        programs.
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <X className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                                    <span>
                                        Free for participants but the company pays an admin fee.
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <X className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                                    <span>
                                        Free up to a team size limit, then per-employee pricing
                                        kicks in.
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-2xl p-6 mt-8">
                        <p className="text-sm text-muted-foreground">
                            <strong className="text-foreground">The cost question HR actually asks:</strong>{" "}
                            &ldquo;If I can get a free tool that works, why pay $3-5 per
                            employee per month?&rdquo; Honest answer: enterprise platforms
                            bundle step challenges with broader wellness features. If you only
                            need a step challenge, you don&apos;t need the bundle. Check{" "}
                            <Link href="/pricing" className="text-primary hover:underline">
                                StepLeague pricing
                            </Link>{" "}
                            for current tier details.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── 7-Step Setup Guide ───────────────────────────────────── */}
            <section id="setup-guide" className="px-6 lg:px-8 max-w-5xl mx-auto py-20">
                <div className="text-center mb-16">
                    <h2 className="text-2xl font-bold mb-3">
                        How to Set Up a Workplace Step Challenge in 7 Steps
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        The operational playbook. Follow it in order.
                    </p>
                </div>

                <div className="grid gap-6 relative">
                    {/* Connecting line */}
                    <div className="hidden md:block absolute left-[39px] top-12 bottom-12 w-0.5 bg-gradient-to-b from-primary/30 via-purple-500/30 to-primary/30" />

                    <SetupStepCard
                        number={1}
                        title="Pick Your Dates and Duration"
                        description="Choose a 4-week window that avoids major holidays and company events. Monday starts work best because people plan their weeks on Sunday night. Announce the challenge at least 7 days before launch."
                        icon={Calendar}
                    />
                    <SetupStepCard
                        number={2}
                        title="Choose Your Platform"
                        description="For mixed-device teams (which is almost every team), use a device-agnostic platform like StepLeague. For enterprise environments that already have a wellness vendor, check if step challenges are included in your existing contract."
                        icon={Smartphone}
                    />
                    <SetupStepCard
                        number={3}
                        title="Define the Challenge Structure"
                        description="Individual, team-based, or both? Team challenges drive higher participation. Individual leaderboards drive higher step counts. Running both in parallel works if your platform supports it."
                        icon={Users}
                    />
                    <SetupStepCard
                        number={4}
                        title="Set Goals That Match Your Workforce"
                        description="Use role-based targets: 6,000-8,000 for desk workers, 8,000-10,000 for mixed roles. If possible, run a one-week baseline period before the official challenge starts."
                        icon={Target}
                    />
                    <SetupStepCard
                        number={5}
                        title="Launch with Clear Instructions"
                        description="Send one email with: the start date, how to join (under 3 steps), what counts as a 'step,' and where to find the leaderboard. Include a 60-second video walkthrough if your platform offers one."
                        icon={Zap}
                    />
                    <SetupStepCard
                        number={6}
                        title="Run Weekly Engagement Touchpoints"
                        description="Monday: leaderboard update. Wednesday: fun fact or mid-week challenge. Friday: shout-outs for most consistent participants. This cadence takes about 20 minutes per week."
                        icon={MessageSquare}
                    />
                    <SetupStepCard
                        number={7}
                        title="Close Strong and Gather Feedback"
                        description='Final leaderboard announcement, recognition for winners and most improved, and a 3-question survey: "Would you do this again? What would you change? Did this affect your daily activity?"'
                        icon={Trophy}
                    />
                </div>
            </section>

            {/* ── Not For You Section ──────────────────────────────────── */}
            <section className="bg-muted/30 py-20">
                <div className="px-6 lg:px-8 max-w-4xl mx-auto">
                    <div className="bg-card border border-amber-500/30 rounded-2xl p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-amber-400" />
                            </div>
                            <h2 className="text-2xl font-bold">
                                When a Step Challenge Isn&apos;t the Right Move
                            </h2>
                        </div>

                        <div className="space-y-4">
                            <WarningItem
                                title="Significant mobility differences"
                                description="If your team includes members who physically can't participate and you haven't built in alternative methods (wheelchair pushes, swimming laps), running a steps-only challenge is worse than no challenge at all."
                            />
                            <WarningItem
                                title="Challenge fatigue"
                                description="You've run three challenges in the past year and participation dropped each time. Switch formats - hydration challenge, mindfulness minutes, volunteering hours - before coming back to steps."
                            />
                            <WarningItem
                                title="Leadership won't participate"
                                description="When managers and executives visibly opt out, it signals the challenge isn't valued. Even casual participation from leadership doubles sign-up rates in most organizations."
                            />
                            <WarningItem
                                title="Replacing real wellness benefits"
                                description="A step challenge is a nice-to-have, not a substitute for health insurance, mental health support, or reasonable working hours. If employees see it as performative wellness, it will backfire."
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* ── ROI Metrics Section ──────────────────────────────────── */}
            <section className="px-6 lg:px-8 max-w-5xl mx-auto py-20">
                <h2 className="text-2xl font-bold mb-3 text-center">
                    Measuring ROI: Did Your Challenge Actually Work?
                </h2>
                <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
                    HR directors and wellness coordinators need numbers. Here&apos;s what to
                    track.
                </p>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <MetricCard
                        category="Participation"
                        metrics={[
                            "Sign-up rate (target: 50%+ of eligible)",
                            "Active participation rate by week",
                            "Completion rate through final week",
                        ]}
                        icon={Users}
                        color="text-sky-400"
                        bg="bg-sky-500/10"
                    />
                    <MetricCard
                        category="Engagement"
                        metrics={[
                            "Average daily steps vs. baseline",
                            "Social interactions (encouragement, comments)",
                            "Cross-department connections formed",
                        ]}
                        icon={TrendingUp}
                        color="text-green-400"
                        bg="bg-green-500/10"
                    />
                    <MetricCard
                        category="Business Impact"
                        metrics={[
                            "Sick days during vs. prior year",
                            "Employee satisfaction scores pre/post",
                            "Anecdotal feedback on energy & bonding",
                        ]}
                        icon={BarChart3}
                        color="text-purple-400"
                        bg="bg-purple-500/10"
                    />
                </div>

                <div className="mt-8 bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                        Research published in the{" "}
                        <em>British Journal of Sports Medicine</em> found that workplace step
                        challenges increased daily steps by an average of{" "}
                        <strong className="text-foreground">1,500 steps per day</strong> during
                        the intervention period. That&apos;s roughly 10-15 additional minutes of
                        walking per day -- compounded across a workforce and repeated
                        quarterly, it adds up.
                    </p>
                </div>
            </section>

            {/* ── FAQ Section ──────────────────────────────────────────── */}
            <section className="bg-muted/30 py-20">
                <div className="px-6 lg:px-8 max-w-3xl mx-auto">
                    <h2 className="text-2xl font-bold mb-10 text-center">
                        Frequently Asked Questions
                    </h2>

                    <div className="space-y-4">
                        <FaqItem
                            question="How do I organize a step challenge at work?"
                            answer="Pick a device-agnostic platform, set a 4-week timeframe, create team-based and individual challenges, and run weekly engagement touchpoints. The biggest operational decision is choosing a tool that works with every fitness tracker your employees already own. See the full 7-step setup guide above."
                        />
                        <FaqItem
                            question="How long should a workplace step challenge last?"
                            answer="Four weeks for your first challenge. That gives enough time for people to establish habits without hitting tracking fatigue. Experienced teams can go up to eight weeks if you break the challenge into phases with distinct milestones. Avoid going beyond eight weeks for a single continuous challenge."
                        />
                        <FaqItem
                            question="What is a good step goal for a workplace challenge?"
                            answer="It depends on role type. Desk workers should target 6,000-8,000 daily steps. Mixed roles can aim for 8,000-10,000. A better approach than flat targets: challenge participants to improve their personal baseline by 20-30%. This keeps the challenge meaningful for both low and high step counters."
                        />
                        <FaqItem
                            question="How do you keep employees engaged in a step challenge?"
                            answer="Weekly leaderboard updates, team-based competition, social features like peer encouragement, and mid-challenge bonus events. Recognition outperforms small prizes for sustained motivation. The single most effective tactic: make the leaderboard visible without requiring people to open an app."
                        />
                        <FaqItem
                            question="Can employees use any fitness tracker for a workplace step challenge?"
                            answer="On most enterprise platforms, no - they typically support Apple Health, Google Fit, and Fitbit via API. StepLeague takes a different approach: participants upload a screenshot from any fitness app or device, and AI verifies the data. Samsung Health, Garmin, Xiaomi, Whoop, or even a basic phone pedometer all work equally well."
                        />
                    </div>
                </div>
            </section>

            {/* ── CTA ──────────────────────────────────────────────────── */}
            <section className="px-6 lg:px-8 max-w-3xl mx-auto py-20">
                <div className="bg-gradient-to-b from-card to-muted border border-border rounded-2xl p-8 text-center">
                    <Building2 className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-3">
                        Ready to Run Your First Workplace Step Challenge?
                    </h2>
                    <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                        Set up a free private league for your team on StepLeague. Works with
                        every fitness tracker, no per-employee fees, AI-verified results.
                    </p>
                    <Link
                        href="/teams"
                        className="inline-flex items-center gap-2 px-8 py-4 text-lg font-bold text-primary-foreground bg-gradient-brand-primary rounded-full hover:scale-105 transition-transform glow-primary"
                    >
                        Get Started Free
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>

            {/* ── Related Pages ─────────────────────────────────────────── */}
            <section className="px-6 lg:px-8 max-w-5xl mx-auto pb-8">
                <h2 className="text-lg font-bold mb-6 text-center text-muted-foreground">
                    Explore More
                </h2>
                <div className="grid sm:grid-cols-3 gap-4">
                    <RelatedCard
                        href="/how-it-works"
                        title="How StepLeague Works"
                        description="See the walk, snap, rank process in detail."
                    />
                    <RelatedCard
                        href="/compare"
                        title="Platform Comparisons"
                        description="Side-by-side breakdowns of top step challenge apps."
                    />
                    <RelatedCard
                        href="/pricing"
                        title="Pricing"
                        description="Free tier details and upcoming Teams features."
                    />
                </div>
            </section>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                             */
/* -------------------------------------------------------------------------- */

function QuickStatCard({
    icon: Icon,
    label,
    value,
    detail,
}: {
    icon: any;
    label: string;
    value: string;
    detail: string;
}) {
    return (
        <div className="bg-card border border-border rounded-2xl p-6 animate-fade-slide">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">{label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">{value}</p>
            <p className="text-sm text-muted-foreground">{detail}</p>
        </div>
    );
}

function ProblemCard({
    icon: Icon,
    title,
    description,
    solution,
}: {
    icon: any;
    title: string;
    description: string;
    solution: string;
}) {
    return (
        <div className="bg-card border border-border rounded-2xl p-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Icon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{description}</p>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                <p className="text-sm text-muted-foreground">{solution}</p>
            </div>
        </div>
    );
}

function DurationCard({
    weeks,
    verdict,
    color,
    bg,
    borderColor,
    description,
    recommended,
}: {
    weeks: string;
    verdict: string;
    color: string;
    bg: string;
    borderColor: string;
    description: string;
    recommended?: boolean;
}) {
    return (
        <div
            className={`relative bg-card border ${recommended ? "border-green-500/40 ring-1 ring-green-500/20" : "border-border"} rounded-2xl p-6`}
        >
            {recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/30">
                    RECOMMENDED
                </div>
            )}
            <div className={`inline-flex px-3 py-1 rounded-lg ${bg} ${color} text-sm font-semibold mb-3`}>
                {weeks}
            </div>
            <p className={`font-bold ${color} mb-2`}>{verdict}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
    );
}

function GoalCard({
    icon: Icon,
    role,
    range,
    detail,
    color,
    bg,
}: {
    icon: any;
    role: string;
    range: string;
    detail: string;
    color: string;
    bg: string;
}) {
    return (
        <div className="bg-card border border-border rounded-2xl p-6 text-center">
            <div className={`w-12 h-12 rounded-xl ${bg} ${color} flex items-center justify-center mx-auto mb-4`}>
                <Icon className="w-6 h-6" />
            </div>
            <h3 className="font-bold mb-1">{role}</h3>
            <p className="text-2xl font-bold text-foreground mb-1">{range}</p>
            <p className="text-xs text-muted-foreground">steps/day</p>
            <p className="text-sm text-muted-foreground mt-2">{detail}</p>
        </div>
    );
}

function EngagementCard({
    icon: Icon,
    title,
    description,
}: {
    icon: any;
    title: string;
    description: string;
}) {
    return (
        <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold">{title}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
    );
}

function SetupStepCard({
    number,
    title,
    description,
    icon: Icon,
}: {
    number: number;
    title: string;
    description: string;
    icon: any;
}) {
    return (
        <div className="relative flex gap-6 items-start">
            {/* Number circle */}
            <div className="relative z-10 flex-shrink-0 w-20 h-20 rounded-2xl bg-card border border-border flex flex-col items-center justify-center shadow-sm">
                <Icon className="w-5 h-5 text-primary mb-1" />
                <span className="text-xs font-bold text-muted-foreground">
                    Step {number}
                </span>
            </div>
            {/* Content */}
            <div className="flex-1 bg-card border border-border rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
        </div>
    );
}

function WarningItem({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <div className="flex items-start gap-3">
            <X className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
                <p className="font-semibold text-foreground">{title}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
        </div>
    );
}

function MetricCard({
    category,
    metrics,
    icon: Icon,
    color,
    bg,
}: {
    category: string;
    metrics: string[];
    icon: any;
    color: string;
    bg: string;
}) {
    return (
        <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold">{category}</h3>
            </div>
            <ul className="space-y-2">
                {metrics.map((metric) => (
                    <li key={metric} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        {metric}
                    </li>
                ))}
            </ul>
        </div>
    );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
    return (
        <details className="group bg-card border border-border rounded-xl">
            <summary className="flex items-center justify-between cursor-pointer p-5 font-semibold text-foreground">
                {question}
                <ArrowRight className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-90" />
            </summary>
            <div className="px-5 pb-5">
                <p className="text-sm text-muted-foreground leading-relaxed">{answer}</p>
            </div>
        </details>
    );
}

function RelatedCard({
    href,
    title,
    description,
}: {
    href: string;
    title: string;
    description: string;
}) {
    return (
        <Link
            href={href}
            className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 hover:scale-105 transition-transform block"
        >
            <h3 className="font-bold mb-1 text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
            <span className="text-primary text-sm font-medium mt-2 inline-flex items-center gap-1">
                Read more <ArrowRight className="w-3 h-3" />
            </span>
        </Link>
    );
}
