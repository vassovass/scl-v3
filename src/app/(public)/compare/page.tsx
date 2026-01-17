import Link from "next/link";
import { ArrowRight, Check, Users, ShieldCheck, Smartphone } from "lucide-react";
import { competitors } from "@/lib/compare/comparisons";

export const metadata = {
    title: "Step Challenge Apps Compared | StepLeague",
    description: "Compare StepLeague with Fitbit, Strava, Garmin, Apple Fitness+ and more. Find the best step challenge app for your team, family, or workplace.",
    keywords: ["step challenge app", "step count motivation", "workout group app", "fitbit alternative", "workplace step competition"],
};

export default function ComparePage() {
    return (
        <div className="min-h-screen pt-24 pb-16 px-6 lg:px-8 bg-background">
            {/* Hero Section */}
            <div className="max-w-5xl mx-auto text-center mb-16">
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6 animate-fade-slide">
                    Find the Right{" "}
                    <span className="text-gradient-brand">Step Challenge App</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-slide animate-delay-100">
                    Honest, balanced comparisons to help you choose the best app for your
                    team, family, or workplace wellness goals.
                </p>
            </div>

            {/* Why StepLeague - Key Differentiators */}
            <div className="max-w-5xl mx-auto mb-16 animate-fade-in animate-delay-200">
                <div className="grid md:grid-cols-3 gap-6">
                    <DifferentiatorCard
                        icon={Smartphone}
                        title="Works With Any Device"
                        description="Apple Watch, Fitbit, Garmin, Samsung, or just your phone. Everyone can join."
                    />
                    <DifferentiatorCard
                        icon={ShieldCheck}
                        title="Fair & Verified"
                        description="AI verifies screenshots to ensure accurate tracking for everyone."
                    />
                    <DifferentiatorCard
                        icon={Users}
                        title="Built for Groups"
                        description="Perfect for workplace challenges, friend groups, and family competitions."
                    />
                </div>
            </div>

            {/* Competitor Grid */}
            <div className="max-w-5xl mx-auto mb-16">
                <h2 className="text-2xl font-bold text-center mb-8">
                    StepLeague vs. The Alternatives
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {competitors.map((competitor) => (
                        <CompetitorCard
                            key={competitor.slug}
                            slug={competitor.slug}
                            name={competitor.name}
                            shortName={competitor.shortName}
                            tagline={competitor.tagline}
                            emoji={competitor.logoEmoji}
                        />
                    ))}
                </div>
            </div>

            {/* SEO Content Block */}
            <div className="max-w-3xl mx-auto mb-16">
                <div className="bg-card border border-border rounded-2xl p-8">
                    <h2 className="text-xl font-bold mb-4">Why Compare Step Challenge Apps?</h2>
                    <p className="text-muted-foreground mb-4">
                        Choosing the right step counting app can make or break your motivation.
                        Whether you&apos;re organizing an office walking challenge, keeping your
                        friend group active, or just looking for step count motivation, the
                        right app matters.
                    </p>
                    <p className="text-muted-foreground mb-4">
                        Many fitness apps lock you into their ecosystem. Fitbit challenges only
                        work with Fitbit. Apple Fitness+ requires an Apple Watch. That&apos;s
                        frustrating when your group uses different devices.
                    </p>
                    <p className="text-muted-foreground">
                        <strong>StepLeague is different.</strong> Upload a screenshot from any
                        fitness app, and our AI verifies your steps instantly. Fair play for
                        everyone, regardless of what device they use.
                    </p>
                </div>
            </div>

            {/* CTA */}
            <div className="text-center">
                <Link
                    href="/sign-up"
                    className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-primary-foreground bg-gradient-brand-primary rounded-full hover:scale-105 transition-transform glow-primary"
                >
                    Try StepLeague Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <p className="mt-4 text-sm text-muted-foreground">
                    No credit card required. Works with any device.
                </p>
            </div>
        </div>
    );
}

function DifferentiatorCard({
    icon: Icon,
    title,
    description
}: {
    icon: React.ElementType;
    title: string;
    description: string;
}) {
    return (
        <div className="bg-card border border-border rounded-xl p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 text-primary rounded-xl mb-4">
                <Icon className="w-6 h-6" />
            </div>
            <h3 className="font-bold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
    );
}

function CompetitorCard({
    slug,
    name,
    shortName,
    tagline,
    emoji
}: {
    slug: string;
    name: string;
    shortName: string;
    tagline: string;
    emoji: string;
}) {
    return (
        <Link
            href={`/compare/${slug}`}
            className="group bg-card border border-border rounded-xl p-6 hover:border-primary/50 hover:shadow-lg transition-all"
        >
            <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{emoji}</span>
                <span className="font-bold">vs {shortName}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{tagline}</p>
            <div className="flex items-center text-sm font-medium text-primary group-hover:underline">
                Read comparison
                <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
        </Link>
    );
}
