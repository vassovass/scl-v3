import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, X, ExternalLink } from "lucide-react";
import {
    competitors,
    getCompetitorBySlug,
    getAllCompetitorSlugs,
    buildFeatureComparison,
    getFeaturesByCategory,
    getCategoryDisplayName,
    getStepLeaguePros,
    type Competitor,
    type FeatureComparison,
    type FeatureCategory,
} from "@/lib/compare/comparisons";

// Generate static paths for all competitors
export function generateStaticParams() {
    return getAllCompetitorSlugs().map((slug) => ({
        competitor: slug,
    }));
}

// Dynamic metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ competitor: string }> }) {
    const { competitor: slug } = await params;
    const competitor = getCompetitorBySlug(slug);

    if (!competitor) {
        return { title: "Comparison Not Found" };
    }

    return {
        title: `StepLeague vs ${competitor.shortName}: Which Step Challenge App is Best? (2026)`,
        description: `Compare StepLeague and ${competitor.name}. See features, pricing, and which is better for your team or workplace step challenge.`,
        keywords: [
            `stepleague vs ${competitor.slug}`,
            `${competitor.slug} alternative`,
            `${competitor.shortName.toLowerCase()} step challenge`,
            "step challenge app comparison",
        ],
    };
}

export default async function ComparisonPage({ params }: { params: Promise<{ competitor: string }> }) {
    const { competitor: slug } = await params;
    const competitor = getCompetitorBySlug(slug);

    if (!competitor) {
        notFound();
    }

    // Build feature comparison using modular system
    const features = buildFeatureComparison(competitor);
    const featuresByCategory = getFeaturesByCategory(features);
    const pros = getStepLeaguePros();

    return (
        <div className="min-h-screen pt-24 pb-16 bg-background">
            {/* JSON-LD Schema for FAQs */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        "mainEntity": competitor.faqs.map((faq) => ({
                            "@type": "Question",
                            "name": faq.question,
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": faq.answer,
                            },
                        })),
                    }),
                }}
            />

            <div className="max-w-4xl mx-auto px-6 lg:px-8">
                {/* Breadcrumb */}
                <Link
                    href="/compare"
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    All Comparisons
                </Link>

                {/* Hero */}
                <header className="mb-12">
                    <div className="flex items-center gap-4 mb-4">
                        <span className="text-4xl">🏆</span>
                        <span className="text-2xl text-muted-foreground">vs</span>
                        <span className="text-4xl">{competitor.logoEmoji}</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
                        StepLeague vs {competitor.name}
                    </h1>
                    <p className="text-xl text-muted-foreground">
                        An honest comparison to help you choose the right step challenge app.
                    </p>
                </header>

                {/* Quick Verdict */}
                <section className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-12">
                    <h2 className="text-lg font-bold mb-4">Quick Verdict</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm font-medium text-primary mb-2">Choose StepLeague if...</p>
                            <p className="text-muted-foreground">{competitor.verdict.chooseStepleague}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium mb-2">Choose {competitor.shortName} if...</p>
                            <p className="text-muted-foreground">{competitor.verdict.chooseCompetitor}</p>
                        </div>
                    </div>
                </section>

                {/* Feature Comparison by Category */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">Feature Comparison</h2>

                    {(Object.keys(featuresByCategory) as FeatureCategory[]).map((category) => {
                        const categoryFeatures = featuresByCategory[category];
                        if (categoryFeatures.length === 0) return null;

                        return (
                            <div key={category} className="mb-8">
                                <h3 className="text-lg font-semibold mb-4 text-muted-foreground">
                                    {getCategoryDisplayName(category)}
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="border-b border-border">
                                                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Feature</th>
                                                <th className="py-3 px-4 text-center font-bold text-primary">StepLeague</th>
                                                <th className="py-3 px-4 text-center font-medium">{competitor.shortName}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {categoryFeatures.map((feature) => (
                                                <tr key={feature.id} className="border-b border-border/50">
                                                    <td className="py-3 px-4 text-sm">{feature.name}</td>
                                                    <td className="py-3 px-4 text-center">
                                                        <FeatureValue value={feature.stepleague} />
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <FeatureValue value={feature.competitor} />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })}
                </section>

                {/* Pricing */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">Pricing Comparison</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
                            <h3 className="font-bold text-primary mb-2">StepLeague</h3>
                            <p className="text-2xl font-bold mb-2">{competitor.pricing.stepleague}</p>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-6">
                            <h3 className="font-bold mb-2">{competitor.shortName}</h3>
                            <p className="text-2xl font-bold mb-2">{competitor.pricing.competitor}</p>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">{competitor.pricing.notes}</p>
                </section>

                {/* Pros & Cons */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">StepLeague: Pros & Cons</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-card border border-border rounded-xl p-6">
                            <h3 className="font-bold text-[hsl(var(--success))] mb-4">✓ Advantages</h3>
                            <ul className="space-y-2">
                                {pros.map((pro, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm">
                                        <Check className="h-4 w-4 text-[hsl(var(--success))] mt-0.5 flex-shrink-0" />
                                        <span>{pro}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-6">
                            <h3 className="font-bold text-muted-foreground mb-4">Considerations</h3>
                            <ul className="space-y-2">
                                {competitor.cons.map((con, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                        <span className="mt-0.5 flex-shrink-0">•</span>
                                        <span>{con}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        {competitor.faqs.map((faq, i) => (
                            <details key={i} className="group bg-card border border-border rounded-xl">
                                <summary className="cursor-pointer p-4 font-medium hover:text-primary transition-colors list-none flex items-center justify-between">
                                    {faq.question}
                                    <span className="text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <div className="px-4 pb-4 text-muted-foreground">
                                    {faq.answer}
                                </div>
                            </details>
                        ))}
                    </div>
                </section>

                {/* CTA */}
                <section className="text-center bg-gradient-to-b from-card to-muted border border-border rounded-2xl p-8">
                    <h2 className="text-2xl font-bold mb-4">Ready to Try StepLeague?</h2>
                    <p className="text-muted-foreground mb-6">
                        Join thousands of teams staying active together. Free forever for individuals.
                    </p>
                    <Link
                        href="/sign-up"
                        className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-primary-foreground bg-gradient-brand-primary rounded-full hover:scale-105 transition-transform glow-primary"
                    >
                        Get Started Free
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                    <p className="mt-4 text-sm text-muted-foreground">
                        No credit card required
                    </p>
                </section>

                {/* External Link */}
                <div className="mt-8 text-center text-sm text-muted-foreground">
                    <a
                        href={competitor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center hover:text-foreground transition-colors"
                    >
                        Visit {competitor.shortName}
                        <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                </div>
            </div>
        </div>
    );
}

function FeatureValue({ value }: { value: boolean | string }) {
    if (typeof value === "string") {
        return <span className="text-sm text-muted-foreground">{value}</span>;
    }
    return value ? (
        <Check className="h-5 w-5 text-[hsl(var(--success))] inline-block" />
    ) : (
        <X className="h-5 w-5 text-muted-foreground/50 inline-block" />
    );
}
