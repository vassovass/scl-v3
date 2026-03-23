import { Metadata } from "next";
import Link from "next/link";
import {
    Smartphone,
    ShieldCheck,
    Trophy,
    Users,
    ArrowRight,
    AlertTriangle,
    Check,
    X,
    Footprints,
    Zap,
} from "lucide-react";

export const metadata: Metadata = {
    title: "Best Step Challenge App for Groups & Friends (2026) | StepLeague",
    description:
        "Compare the top step challenge apps for friends and groups. See which ones are free, work with any tracker, and actually prevent cheating.",
    keywords: [
        "step challenge app",
        "step challenge app with friends",
        "free group step challenge app",
        "step counting competition",
    ],
};

const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "FAQPage",
            mainEntity: [
                {
                    "@type": "Question",
                    name: "What apps are best for step challenges?",
                    acceptedAnswer: {
                        "@type": "Answer",
                        text: "The best step challenge app depends on your group's devices. StepLeague works with any fitness tracker through AI-verified screenshot uploads. StepUp and Social Steps work for Apple/Google Fit users. Stridekick and BigTeamChallenge serve corporate wellness programs.",
                    },
                },
                {
                    "@type": "Question",
                    name: "What is the best free app to count steps?",
                    acceptedAnswer: {
                        "@type": "Answer",
                        text: "Your phone's built-in health app (Apple Health or Google Fit) is the best free step counter. For step challenges, StepLeague offers a free tier with unlimited uploads, global leaderboard access, and public leagues.",
                    },
                },
                {
                    "@type": "Question",
                    name: "Is there a free version of StepsApp?",
                    acceptedAnswer: {
                        "@type": "Answer",
                        text: "StepsApp offers a free version with basic tracking and ads. For step challenges with friends, StepLeague is free to use and works alongside StepsApp or any other step counter.",
                    },
                },
                {
                    "@type": "Question",
                    name: "How do I track my 10,000 steps?",
                    acceptedAnswer: {
                        "@type": "Answer",
                        text: "Use your phone or wearable to count steps passively, then join a step challenge on StepLeague for social accountability. Check midday progress and push for your target with an evening walk.",
                    },
                },
            ],
        },
        {
            "@type": "SoftwareApplication",
            name: "StepLeague",
            applicationCategory: "HealthApplication",
            operatingSystem: "Web, iOS, Android",
            offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
            },
            description:
                "A step challenge platform where users upload step screenshots from any fitness app, get AI-verified, and compete in private leagues or a global leaderboard.",
            url: "https://stepleague.app",
        },
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
                    name: "Step Challenge App",
                    item: "https://stepleague.app/step-challenge-app",
                },
            ],
        },
    ],
};

export default function StepChallengeAppPage() {
    return (
        <div className="min-h-screen pt-24 pb-16 bg-background">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* ── Hero Section ── */}
            <section className="relative px-6 lg:px-8 max-w-6xl mx-auto mb-20 overflow-hidden">
                {/* Decorative blurs */}
                <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -top-16 -right-24 w-72 h-72 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                <div className="relative text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 animate-fade-slide">
                        <Footprints className="w-4 h-4" />
                        <span>2026 Comparison Guide</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6 animate-fade-slide">
                        Best{" "}
                        <span className="text-gradient-brand">
                            Step Challenge App
                        </span>{" "}
                        for Groups &amp; Friends
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-slide animate-delay-100">
                        A good step challenge app lets you compete on steps with
                        friends, coworkers, or strangers without locking you into
                        one device ecosystem. Here&apos;s how the major options
                        actually compare.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in animate-delay-200">
                        <Link
                            href="/sign-up"
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-bold text-primary-foreground bg-gradient-brand-primary rounded-full hover:scale-105 transition-transform glow-primary"
                        >
                            Try StepLeague Free
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            href="#comparison-table"
                            className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-foreground border border-border rounded-full hover:bg-muted/50 transition-colors"
                        >
                            Jump to Comparison
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── At a Glance: Quick Comparison Cards ── */}
            <section className="px-6 lg:px-8 max-w-6xl mx-auto mb-20">
                <h2 className="text-2xl font-bold text-center mb-8">
                    At a Glance: Top Step Challenge Apps
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in animate-delay-200">
                    <GlanceCard
                        name="StepLeague"
                        highlight
                        icon={Smartphone}
                        traits={[
                            "Any device (screenshot-based)",
                            "AI-verified steps",
                            "Free tier available",
                        ]}
                        bestFor="Mixed-device groups"
                    />
                    <GlanceCard
                        name="StepUp"
                        icon={Zap}
                        traits={[
                            "Apple Health / Google Fit API",
                            "Polished UI",
                            "Limited device support",
                        ]}
                        bestFor="Casual iPhone/Android"
                    />
                    <GlanceCard
                        name="Stridekick"
                        icon={Users}
                        traits={[
                            "Major tracker integrations",
                            "Corporate wellness focus",
                            "Paid plans from ~$3.99/mo",
                        ]}
                        bestFor="Corporate programs"
                    />
                    <GlanceCard
                        name="Social Steps"
                        icon={Trophy}
                        traits={[
                            "Simple friend challenges",
                            "Apple Watch focused",
                            "Limited Android support",
                        ]}
                        bestFor="All-iPhone friend groups"
                    />
                    <GlanceCard
                        name="BigTeamChallenge"
                        icon={Users}
                        traits={[
                            "Large team challenges",
                            "Virtual route maps",
                            "From ~$2/person",
                        ]}
                        bestFor="50+ person companies"
                    />
                </div>
            </section>

            {/* ── What Apps Are Best ── */}
            <section className="bg-muted/30 py-20">
                <div className="px-6 lg:px-8 max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="inline-flex items-center justify-center w-10 h-10 bg-primary/10 text-primary rounded-xl">
                            <Trophy className="w-5 h-5" />
                        </div>
                        <h2 className="text-2xl font-bold">
                            What Apps Are Best for Step Challenges?
                        </h2>
                    </div>

                    <div className="space-y-4 text-muted-foreground leading-relaxed">
                        <p>
                            It depends on your group. The &quot;best&quot; app is
                            the one everyone can actually use without someone
                            getting left out because they have the wrong phone or
                            watch.
                        </p>
                        <p>
                            Here&apos;s the thing most comparison articles skip:{" "}
                            <strong className="text-foreground">
                                device compatibility is the number one reason group
                                step challenges fail.
                            </strong>{" "}
                            You set up a challenge, invite 8 friends, and 3 of
                            them can&apos;t join because they use Samsung Health
                            or an older Fitbit that doesn&apos;t have a supported
                            API.
                        </p>
                        <p>
                            <strong className="text-foreground">StepLeague</strong>{" "}
                            solves this by not requiring API connections at all.
                            You take a screenshot of your steps from whatever app
                            or device you already use. The platform&apos;s AI
                            reads and verifies the screenshot, checking for edits,
                            inconsistencies, and manipulation. No account
                            connections, no permissions, no sync failures.
                        </p>
                        <p>
                            <strong className="text-foreground">StepUp</strong> is
                            solid if your entire group uses iPhones or Android
                            phones with Google Fit. The interface is clean, and
                            challenges are easy to set up. But the moment someone
                            has a tracker that doesn&apos;t play nice with their
                            API, they&apos;re out.
                        </p>
                        <p>
                            <strong className="text-foreground">Stridekick</strong>{" "}
                            handles more devices than StepUp through direct
                            integrations with Fitbit, Garmin, and Apple Health.
                            Good for corporate wellness programs, but it&apos;s a
                            paid product with limited free options.
                        </p>
                        <p>
                            <strong className="text-foreground">BigTeamChallenge</strong>{" "}
                            is purpose-built for companies running large wellness
                            programs. Virtual route maps are a nice touch, but
                            per-person pricing gets expensive at scale.
                        </p>
                        <p>
                            <strong className="text-foreground">Social Steps</strong>{" "}
                            is the simplest option but the most limited. Great for
                            a small friend group on Apple devices. Android support
                            is an afterthought.
                        </p>
                        <p>
                            <strong className="text-foreground">The honest answer:</strong>{" "}
                            for mixed-device groups of friends, StepLeague gives
                            you the fewest headaches. For a corporate program with
                            budget, Stridekick or BigTeamChallenge work. For an
                            all-iPhone friend group, Social Steps is fine.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── Comparison Table ── */}
            <section id="comparison-table" className="px-6 lg:px-8 max-w-6xl mx-auto py-20">
                <div className="flex items-center gap-3 mb-8 justify-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 bg-primary/10 text-primary rounded-xl">
                        <Smartphone className="w-5 h-5" />
                    </div>
                    <h2 className="text-2xl font-bold">
                        Full Comparison Table
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left py-4 px-3 font-bold text-foreground">App</th>
                                <th className="text-left py-4 px-3 font-bold text-foreground">Best For</th>
                                <th className="text-left py-4 px-3 font-bold text-foreground">Device Support</th>
                                <th className="text-left py-4 px-3 font-bold text-foreground">Verification</th>
                                <th className="text-left py-4 px-3 font-bold text-foreground">Cost</th>
                                <th className="text-left py-4 px-3 font-bold text-foreground">Main Tradeoff</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-border bg-primary/5">
                                <td className="py-4 px-3 font-bold text-primary">StepLeague</td>
                                <td className="py-4 px-3 text-muted-foreground">Mixed-device friend groups</td>
                                <td className="py-4 px-3 text-muted-foreground">
                                    <span className="inline-flex items-center gap-1">
                                        <Check className="w-4 h-4 text-green-500" /> Any (screenshot-based)
                                    </span>
                                </td>
                                <td className="py-4 px-3 text-muted-foreground">AI screenshot verification</td>
                                <td className="py-4 px-3 text-muted-foreground">Free tier; Premium coming soon</td>
                                <td className="py-4 px-3 text-muted-foreground">Manual upload vs. auto-sync</td>
                            </tr>
                            <tr className="border-b border-border">
                                <td className="py-4 px-3 font-bold text-foreground">StepUp</td>
                                <td className="py-4 px-3 text-muted-foreground">Casual iPhone/Android</td>
                                <td className="py-4 px-3 text-muted-foreground">Apple Health, Google Fit</td>
                                <td className="py-4 px-3 text-muted-foreground">API-based (trusts source)</td>
                                <td className="py-4 px-3 text-muted-foreground">Free with ads; Pro ~$4.99/mo</td>
                                <td className="py-4 px-3 text-muted-foreground">Limited tracker support</td>
                            </tr>
                            <tr className="border-b border-border">
                                <td className="py-4 px-3 font-bold text-foreground">Stridekick</td>
                                <td className="py-4 px-3 text-muted-foreground">Corporate wellness</td>
                                <td className="py-4 px-3 text-muted-foreground">Fitbit, Garmin, Apple Health, Google Fit</td>
                                <td className="py-4 px-3 text-muted-foreground">API-based (trusts source)</td>
                                <td className="py-4 px-3 text-muted-foreground">~$3.99/mo or enterprise pricing</td>
                                <td className="py-4 px-3 text-muted-foreground">No free tier for full features</td>
                            </tr>
                            <tr className="border-b border-border">
                                <td className="py-4 px-3 font-bold text-foreground">Social Steps</td>
                                <td className="py-4 px-3 text-muted-foreground">Small Apple-ecosystem groups</td>
                                <td className="py-4 px-3 text-muted-foreground">Apple Health primary, limited Android</td>
                                <td className="py-4 px-3 text-muted-foreground">API-based</td>
                                <td className="py-4 px-3 text-muted-foreground">Free with in-app purchases</td>
                                <td className="py-4 px-3 text-muted-foreground">Weak Android experience</td>
                            </tr>
                            <tr className="border-b border-border">
                                <td className="py-4 px-3 font-bold text-foreground">BigTeamChallenge</td>
                                <td className="py-4 px-3 text-muted-foreground">Large company challenges (50+)</td>
                                <td className="py-4 px-3 text-muted-foreground">Most major trackers via API</td>
                                <td className="py-4 px-3 text-muted-foreground">API-based</td>
                                <td className="py-4 px-3 text-muted-foreground">From ~$2/person</td>
                                <td className="py-4 px-3 text-muted-foreground">Overkill for small friend groups</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            {/* ── How Free Apps Work ── */}
            <section className="bg-muted/30 py-20">
                <div className="px-6 lg:px-8 max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="inline-flex items-center justify-center w-10 h-10 bg-primary/10 text-primary rounded-xl">
                            <Zap className="w-5 h-5" />
                        </div>
                        <h2 className="text-2xl font-bold">
                            How Do Free Step Challenge Apps Actually Work?
                        </h2>
                    </div>

                    <div className="space-y-4 text-muted-foreground leading-relaxed">
                        <p>
                            Most free step challenge apps make money one of three
                            ways: ads, premium upsells, or corporate contracts.
                            Understanding this helps you figure out what you&apos;re
                            giving up on a free plan.
                        </p>
                        <p>
                            StepLeague&apos;s free tier gives you unlimited step
                            uploads, access to the global leaderboard, and public
                            leagues. You can compete right away without paying.
                            The upcoming Premium tier will add features, but the
                            core challenge experience stays free. That&apos;s a
                            meaningful distinction because some apps gate the
                            actual competition behind a paywall.
                        </p>
                        <p>
                            StepUp offers a free version with ads. It works, but
                            the ads get old fast. The pro version removes ads and
                            unlocks additional challenge types.
                        </p>
                        <p>
                            Stridekick has a free trial but moves to paid plans
                            for ongoing use. If you want a genuinely free group
                            step challenge app for Android and iPhone, it&apos;s
                            not the best pick long-term.
                        </p>
                    </div>

                    {/* Sync Failure Callout */}
                    <div className="mt-8 bg-card border border-primary/20 rounded-2xl p-6">
                        <div className="flex items-start gap-4">
                            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 text-primary rounded-xl shrink-0">
                                <Smartphone className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-bold text-foreground mb-2">
                                    API sync failure rates run between 5&ndash;15%
                                    depending on the device/OS combination
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    In a 10-person challenge, at least one person
                                    will probably have sync issues at some point.
                                    StepLeague sidesteps this entirely. Screenshots
                                    don&apos;t have sync problems. You see your
                                    steps, you capture them, you upload. Done.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Can You Prevent Cheating ── */}
            <section className="px-6 lg:px-8 max-w-4xl mx-auto py-20">
                <div className="flex items-center gap-3 mb-6">
                    <div className="inline-flex items-center justify-center w-10 h-10 bg-primary/10 text-primary rounded-xl">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h2 className="text-2xl font-bold">
                        Can You Really Prevent Cheating in Step Challenges?
                    </h2>
                </div>

                <div className="space-y-4 text-muted-foreground leading-relaxed">
                    <p>
                        This is the question nobody wants to ask but everyone
                        thinks about. And honestly, most step challenge apps
                        don&apos;t even try.
                    </p>
                    <p>
                        API-based apps trust whatever number the connected tracker
                        reports. If someone shakes their phone in a sock for 20
                        minutes or drives on a bumpy road with their Fitbit on,
                        those &quot;steps&quot; count. The app has no way to
                        distinguish real walking from fake movement because it&apos;s
                        just reading a number from an API.
                    </p>
                    <p>
                        StepLeague takes a different approach. When you upload a
                        screenshot, AI verification checks multiple signals: the
                        formatting matches the claimed source app, the step count
                        is consistent with the time window, the image hasn&apos;t
                        been edited in Photoshop or a screenshot editor, and the
                        metadata lines up. It&apos;s not foolproof (nothing is),
                        but it catches the obvious stuff that ruins challenges in
                        other apps.
                    </p>
                    <p>
                        This matters more than you&apos;d think. Corporate wellness
                        challenges where one person &quot;walked&quot; 45,000 steps
                        daily and nobody could do anything about it because the API
                        said it was real &mdash; that kind of thing kills motivation
                        for everyone else. Having a verification layer, even an
                        imperfect one, keeps things honest enough that people stay
                        engaged.
                    </p>
                </div>

                {/* AI Verification Callout */}
                <div className="mt-8 bg-primary/5 border border-primary/20 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 text-primary rounded-xl shrink-0">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-bold text-foreground mb-1">
                                AI Verification in Under 30 Seconds
                            </p>
                            <p className="text-sm text-muted-foreground">
                                StepLeague&apos;s AI processes screenshots quickly
                                so it doesn&apos;t slow down your flow. Upload,
                                verify, compete. The system checks formatting,
                                consistency, and image integrity automatically.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Best Free Step Counter ── */}
            <section className="bg-muted/30 py-20">
                <div className="px-6 lg:px-8 max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="inline-flex items-center justify-center w-10 h-10 bg-primary/10 text-primary rounded-xl">
                            <Footprints className="w-5 h-5" />
                        </div>
                        <h2 className="text-2xl font-bold">
                            What&apos;s the Best Free App to Count Steps?
                        </h2>
                    </div>

                    <div className="space-y-4 text-muted-foreground leading-relaxed">
                        <p>
                            This is actually a different question than &quot;what&apos;s
                            the best step challenge app,&quot; and the distinction
                            matters.
                        </p>
                        <p>
                            For <em>counting</em> steps, your phone&apos;s built-in
                            health app is probably the best free option. Apple Health
                            on iPhone and Google Fit on Android both count steps
                            using your phone&apos;s accelerometer with zero setup.
                            If you wear a Fitbit or Garmin, those count steps too.
                            You don&apos;t need a separate step-counting app.
                        </p>
                        <p>
                            What you need is a <em>challenge</em> layer on top.
                            That&apos;s where step challenge apps come in. They
                            don&apos;t replace your step counter. They give you a
                            reason to care about the number.
                        </p>
                        <p>
                            StepLeague works with whatever counts your steps. Apple
                            Health says you walked 8,200 steps today? Screenshot it,
                            upload it, and compete. Garmin shows 12,400? Same deal.
                            You keep using the step counter you already trust, and
                            StepLeague handles the competition part.
                        </p>
                        <p>
                            This is a big advantage over apps like StepUp or Social
                            Steps that require specific API connections. Those apps
                            become your step source <em>and</em> your challenge
                            platform. If the API sync breaks, you lose both your
                            tracking and your competition data. With StepLeague,
                            your step counting never depends on a third-party
                            integration staying healthy.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── How to Track 10,000 Steps ── */}
            <section className="px-6 lg:px-8 max-w-4xl mx-auto py-20">
                <div className="flex items-center gap-3 mb-6">
                    <div className="inline-flex items-center justify-center w-10 h-10 bg-primary/10 text-primary rounded-xl">
                        <Trophy className="w-5 h-5" />
                    </div>
                    <h2 className="text-2xl font-bold">
                        How Do I Track My 10,000 Steps?
                    </h2>
                </div>

                <div className="space-y-4 text-muted-foreground leading-relaxed">
                    <p>
                        The 10,000 step goal is kind of arbitrary, by the way.
                        It originated from a 1965 Japanese marketing campaign for
                        a pedometer called &quot;Manpo-kei&quot; (10,000 steps
                        meter). Recent research suggests 7,000&ndash;8,000 steps
                        daily provides most of the mortality-reduction benefit.
                    </p>
                    <p>But if 10,000 is your target, here&apos;s the practical setup:</p>
                    <ol className="list-decimal list-inside space-y-2 ml-2">
                        <li>
                            <strong className="text-foreground">Use your phone or wearable</strong>{" "}
                            to count steps passively throughout the day
                        </li>
                        <li>
                            <strong className="text-foreground">Check midday</strong>{" "}
                            to see where you stand (most people are at
                            3,000&ndash;5,000 by lunch)
                        </li>
                        <li>
                            <strong className="text-foreground">Join a step challenge</strong>{" "}
                            to add accountability &mdash; this is where most
                            people see the biggest jump in consistency
                        </li>
                    </ol>
                    <p>
                        StepLeague users can see how they stack up on the{" "}
                        <Link href="/" className="text-primary hover:underline">
                            global leaderboard
                        </Link>{" "}
                        throughout the day. There&apos;s something motivating about
                        seeing yourself climb from 47th to 23rd place during an
                        evening walk. The community&apos;s High Fives feature adds
                        a social layer where other walkers acknowledge your effort.
                    </p>
                    <p>
                        For tracking accuracy, keep your phone in your pocket
                        rather than a bag. Wrist-worn trackers are more accurate
                        for step counting than phones because they pick up arm
                        swing. If you&apos;re serious about hitting a daily target,
                        a dedicated tracker plus a challenge app is the most
                        effective combo.
                    </p>
                </div>
            </section>

            {/* ── Not For You Section ── */}
            <section className="px-6 lg:px-8 max-w-4xl mx-auto pb-20">
                <div className="bg-amber-500/5 border border-amber-500/30 rounded-2xl p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="inline-flex items-center justify-center w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground">
                            When StepLeague Is NOT the Right Choice
                        </h2>
                    </div>
                    <p className="text-muted-foreground mb-4">
                        Transparency matters. Here&apos;s when you should pick
                        something else:
                    </p>
                    <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                            <X className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">
                                <strong className="text-foreground">You want fully automatic syncing with zero manual input.</strong>{" "}
                                StepLeague requires uploading screenshots. If that
                                feels like friction, an API-based app like StepUp
                                or Stridekick will feel smoother (assuming your
                                device is supported).
                            </span>
                        </li>
                        <li className="flex items-start gap-3">
                            <X className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">
                                <strong className="text-foreground">You&apos;re running a 500+ person corporate program and need admin dashboards, reporting, and SSO.</strong>{" "}
                                BigTeamChallenge or Stridekick are built for that.
                                StepLeague isn&apos;t there yet.
                            </span>
                        </li>
                        <li className="flex items-start gap-3">
                            <X className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">
                                <strong className="text-foreground">Everyone in your group uses iPhones and you want the fastest setup possible.</strong>{" "}
                                Social Steps will get you up and running in under a
                                minute with Apple Health.
                            </span>
                        </li>
                        <li className="flex items-start gap-3">
                            <X className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">
                                <strong className="text-foreground">You need real-time step syncing throughout the day.</strong>{" "}
                                Screenshot uploads capture a point-in-time snapshot.
                                If you want a live-updating leaderboard that changes
                                with every step, API-connected apps do that better.
                            </span>
                        </li>
                    </ul>
                    <p className="text-sm text-muted-foreground mt-6">
                        StepLeague&apos;s sweet spot is groups where device diversity
                        would otherwise make challenges impossible. If everyone&apos;s
                        already in the same ecosystem, the screenshot approach adds
                        friction you don&apos;t need.
                    </p>
                </div>
            </section>

            {/* ── FAQ Section ── */}
            <section className="bg-muted/30 py-20">
                <div className="px-6 lg:px-8 max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold text-center mb-8">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-4">
                        <details className="group bg-card border border-border rounded-xl">
                            <summary className="flex items-center justify-between cursor-pointer px-6 py-4 font-semibold text-foreground">
                                What apps are best for step challenges?
                                <ArrowRight className="w-4 h-4 text-muted-foreground group-open:rotate-90 transition-transform" />
                            </summary>
                            <div className="px-6 pb-4 text-muted-foreground leading-relaxed">
                                The best step challenge app depends on your group&apos;s
                                devices. StepLeague works with any fitness tracker or
                                phone through screenshot uploads and AI verification.
                                StepUp and Social Steps work well for Apple/Google Fit
                                users. Stridekick and BigTeamChallenge serve corporate
                                wellness programs with broader integrations. For
                                mixed-device friend groups, StepLeague avoids the
                                compatibility headaches that break other apps.
                            </div>
                        </details>
                        <details className="group bg-card border border-border rounded-xl">
                            <summary className="flex items-center justify-between cursor-pointer px-6 py-4 font-semibold text-foreground">
                                What is the best free app to count steps?
                                <ArrowRight className="w-4 h-4 text-muted-foreground group-open:rotate-90 transition-transform" />
                            </summary>
                            <div className="px-6 pb-4 text-muted-foreground leading-relaxed">
                                Your phone&apos;s built-in health app (Apple Health or
                                Google Fit) is the best free step counter. You don&apos;t
                                need a separate app for counting. For step challenges,
                                StepLeague offers a free tier with unlimited uploads,
                                global leaderboard access, and public leagues. Most
                                other challenge apps either show ads on free plans or
                                limit features behind paywalls.
                            </div>
                        </details>
                        <details className="group bg-card border border-border rounded-xl">
                            <summary className="flex items-center justify-between cursor-pointer px-6 py-4 font-semibold text-foreground">
                                Is there a free version of StepsApp?
                                <ArrowRight className="w-4 h-4 text-muted-foreground group-open:rotate-90 transition-transform" />
                            </summary>
                            <div className="px-6 pb-4 text-muted-foreground leading-relaxed">
                                StepsApp (the step counter) offers a free version with
                                basic tracking and ads. But StepsApp is a step counter,
                                not a step challenge app. If you want to compete with
                                friends, you need a challenge platform. StepLeague is
                                free to use for challenges and works alongside StepsApp
                                or any other step counter you prefer.
                            </div>
                        </details>
                        <details className="group bg-card border border-border rounded-xl">
                            <summary className="flex items-center justify-between cursor-pointer px-6 py-4 font-semibold text-foreground">
                                How do I track my 10,000 steps?
                                <ArrowRight className="w-4 h-4 text-muted-foreground group-open:rotate-90 transition-transform" />
                            </summary>
                            <div className="px-6 pb-4 text-muted-foreground leading-relaxed">
                                Use your phone or wearable to count steps passively,
                                then join a step challenge for accountability. Research
                                shows that social accountability increases step count
                                consistency by 20&ndash;30% on average. StepLeague
                                lets you track progress against friends and a global
                                community. Check your steps midday, then push for your
                                target with an evening walk.
                            </div>
                        </details>
                    </div>
                </div>
            </section>

            {/* ── CTA Section ── */}
            <section className="px-6 lg:px-8 max-w-4xl mx-auto py-20">
                <div className="relative bg-gradient-to-b from-card to-muted border border-border rounded-2xl p-8 sm:p-12 text-center overflow-hidden">
                    {/* Decorative blur */}
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative">
                        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4">
                            Getting Started Takes 2 Minutes
                        </h2>
                        <p className="text-muted-foreground max-w-lg mx-auto mb-3">
                            Create a free account, screenshot today&apos;s steps
                            from your fitness app, upload it, and you&apos;re on
                            the leaderboard. Any device welcome.
                        </p>
                        <ol className="text-sm text-muted-foreground max-w-md mx-auto mb-8 text-left space-y-1">
                            <li className="flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">1</span>
                                Create a free account at stepleague.app
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">2</span>
                                Screenshot today&apos;s steps from your fitness app
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">3</span>
                                Upload it &mdash; AI verifies in seconds
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">4</span>
                                You&apos;re on the leaderboard. Start competing.
                            </li>
                        </ol>
                        <Link
                            href="/sign-up"
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-bold text-primary-foreground bg-gradient-brand-primary rounded-full hover:scale-105 transition-transform glow-primary"
                        >
                            Try StepLeague Free
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <p className="mt-4 text-sm text-muted-foreground">
                            No credit card required. Works with any device.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── Related Pages ── */}
            <section className="px-6 lg:px-8 max-w-5xl mx-auto pb-16">
                <h2 className="text-2xl font-bold text-center mb-8">
                    Learn More
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <RelatedPageCard
                        href="/compare"
                        title="App Comparisons"
                        description="Detailed head-to-head comparisons with Fitbit, Strava, Stridekick, and more."
                    />
                    <RelatedPageCard
                        href="/how-it-works"
                        title="How It Works"
                        description="See how screenshot uploads and AI verification keep challenges fair."
                    />
                    <RelatedPageCard
                        href="/pricing"
                        title="Pricing"
                        description="Free tier details and what's coming with Premium."
                    />
                    <RelatedPageCard
                        href="/teams"
                        title="Teams & Leagues"
                        description="Create private leagues and invite friends with a link."
                    />
                    <RelatedPageCard
                        href="/why-upload"
                        title="Why Upload Daily"
                        description="How daily uploads power the global leaderboard and streaks."
                    />
                    <RelatedPageCard
                        href="/compare/stepleague-vs-fitbit"
                        title="vs. Fitbit Challenges"
                        description="StepLeague vs. Fitbit: which is better for group step challenges?"
                    />
                </div>
            </section>
        </div>
    );
}

/* ── Helper Components ── */

function GlanceCard({
    name,
    icon: Icon,
    traits,
    bestFor,
    highlight,
}: {
    name: string;
    icon: React.ElementType;
    traits: string[];
    bestFor: string;
    highlight?: boolean;
}) {
    return (
        <div
            className={`rounded-xl p-6 border ${
                highlight
                    ? "bg-primary/5 border-primary/20"
                    : "bg-card border-border"
            }`}
        >
            <div className="flex items-center gap-3 mb-3">
                <div
                    className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${
                        highlight
                            ? "bg-primary/10 text-primary"
                            : "bg-muted/50 text-muted-foreground"
                    }`}
                >
                    <Icon className="w-5 h-5" />
                </div>
                <span className="font-bold text-foreground">{name}</span>
            </div>
            <ul className="space-y-1.5 mb-3">
                {traits.map((trait) => (
                    <li
                        key={trait}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                        <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                        {trait}
                    </li>
                ))}
            </ul>
            <p className="text-xs font-medium text-primary">
                Best for: {bestFor}
            </p>
        </div>
    );
}

function RelatedPageCard({
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
            className="group bg-card border border-border rounded-xl p-6 hover:border-primary/50 hover:shadow-lg transition-all"
        >
            <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                {title}
            </h3>
            <p className="text-sm text-muted-foreground mb-3">{description}</p>
            <span className="flex items-center text-sm font-medium text-primary group-hover:underline">
                Read more
                <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </span>
        </Link>
    );
}
