import { PricingTierGrid } from "@/components/billing/PricingTierGrid";

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

            <div className="animate-fade-in animate-delay-200">
                <PricingTierGrid />
            </div>

            {/* FAQ or Trust Section could go here */}
            <div className="text-center mt-16 text-muted-foreground text-sm">
                Questions? Contact us at <a href="mailto:support@stepleague.app" className="underline hover:text-foreground">support@stepleague.app</a>
            </div>
        </div>
    );
}
