import Link from "next/link";
import { Check, X, Minus } from "lucide-react";

export const metadata = {
    title: "Pricing - StepLeague",
    description: "Simple, fair pricing. Compete for free, upgrade for privacy and power.",
};

export default function PricingPage() {
    return (
        <div className="min-h-screen pt-24 pb-16 px-6 lg:px-8 bg-background">
            <div className="max-w-4xl mx-auto text-center mb-16">
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 animate-fade-slide">
                    Compete for{" "}
                    <span className="text-gradient-brand">
                        Free
                    </span>
                    .
                    <br />
                    Upgrade for Privacy & Power.
                </h1>
                <p className="text-xl text-muted-foreground animate-fade-slide animate-delay-100">
                    Join the community today. No credit card required.
                </p>
            </div>

            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 animate-fade-in animate-delay-200">
                {/* FREE TIER */}
                <div className="relative bg-card border border-border rounded-3xl p-8 flex flex-col">
                    <div className="mb-6">
                        <h3 className="text-2xl font-bold text-foreground">Free Walker</h3>
                        <div className="mt-4 flex items-baseline text-foreground">
                            <span className="text-4xl font-extrabold tracking-tight">$0</span>
                            <span className="ml-1 text-xl font-semibold text-muted-foreground">/ forever</span>
                        </div>
                        <p className="mt-4 text-muted-foreground">
                            Everything you need to stay active and compete in public leagues.
                        </p>
                    </div>

                    <ul className="space-y-4 mb-8 flex-1">
                        <FeatureItem included>Global Leaderboard Access</FeatureItem>
                        <FeatureItem included>Unlimited Steps</FeatureItem>
                        <FeatureItem included>Public Profile</FeatureItem>
                        <FeatureItem included>Join Public Leagues</FeatureItem>
                        <FeatureItem included={false}>Privacy Mode (Ghost)</FeatureItem>
                        <FeatureItem included={false}>Private Leagues</FeatureItem>
                        <FeatureItem included={false}>Advanced Analytics</FeatureItem>
                    </ul>

                    <Link
                        href="/sign-up"
                        className="w-full inline-flex items-center justify-center px-6 py-3 border border-border text-base font-medium rounded-full text-foreground hover:bg-muted transition-colors"
                    >
                        Get Started Free
                    </Link>
                </div>

                {/* PREMIUM TIER */}
                <div className="relative bg-gradient-to-b from-card to-muted border-2 border-primary/20 rounded-3xl p-8 flex flex-col shadow-2xl glow-primary">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-brand-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold tracking-wide uppercase shadow-lg">
                        Coming Soon
                    </div>
                    <div className="mb-6">
                        <h3 className="text-2xl font-bold text-foreground">Premium</h3>
                        <div className="mt-4 flex items-baseline text-foreground">
                            <span className="text-4xl font-extrabold tracking-tight">$?</span>
                            <span className="ml-1 text-xl font-semibold text-muted-foreground">/ month</span>
                        </div>
                        <p className="mt-4 text-muted-foreground">
                            For privacy-conscious athletes and office teams who want full control.
                        </p>
                    </div>

                    <ul className="space-y-4 mb-8 flex-1">
                        <FeatureItem included dark>Global Leaderboard Access</FeatureItem>
                        <FeatureItem included dark>Unlimited Steps</FeatureItem>
                        <FeatureItem included dark>Public Profile</FeatureItem>
                        <FeatureItem included dark>Join Any League</FeatureItem>
                        <FeatureItem included dark>
                            <strong>Privacy Mode</strong> (Ghost)
                        </FeatureItem>
                        <FeatureItem included dark>Create Private Leagues</FeatureItem>
                        <FeatureItem included dark>Unlimited History & Stats</FeatureItem>
                    </ul>

                    <ButtonLink href="/waitlist" primary>
                        Notify Me
                    </ButtonLink>
                </div>
            </div>

            {/* FAQ or Trust Section could go here */}
            <div className="text-center mt-16 text-muted-foreground text-sm">
                Questions? Contact us at <a href="mailto:support@stepleague.app" className="underline hover:text-foreground">support@stepleague.app</a>
            </div>
        </div>
    );
}

function FeatureItem({ children, included, dark }: { children: React.ReactNode; included: boolean; dark?: boolean }) {
    return (
        <li className="flex items-start">
            <div className="flex-shrink-0">
                {included ? (
                    <Check className="h-6 w-6 text-primary" />
                ) : (
                    <X className="h-6 w-6 text-muted-foreground/50" />
                )}
            </div>
            <p className="ml-3 text-base text-muted-foreground">{children}</p>
        </li>
    );
}

function ButtonLink({ href, children, primary }: { href: string; children: React.ReactNode; primary?: boolean }) {
    // Determine classes based on variant
    const baseClasses = "w-full inline-flex items-center justify-center px-6 py-3 border text-base font-medium rounded-full transition-all duration-300";
    const primaryClasses = "border-transparent text-primary-foreground bg-gradient-brand-primary hover:scale-[1.02] glow-primary";
    const secondaryClasses = "border-border text-foreground hover:bg-muted";

    return (
        <a href={href} className={`${baseClasses} ${primary ? primaryClasses : secondaryClasses}`}>
            {children}
        </a>
    )
}
