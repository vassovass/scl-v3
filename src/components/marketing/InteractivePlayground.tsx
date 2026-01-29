"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Share2, Sparkles } from "lucide-react";
import { CARD_TYPE_CONFIGS, type CardType, METRIC_CONFIGS } from "@/lib/sharing/metricConfig";
import { analytics } from "@/lib/analytics";

/**
 * Interactive Playground Component
 *
 * Allows visitors to customize and preview share cards inline
 * without needing to sign up. Reduces friction and demonstrates value.
 *
 * PRD-53 P-5: Interactive card customization
 */
const DEBOUNCE_MS = 500;

export function InteractivePlayground() {
    const [stepValue, setStepValue] = useState(12345);
    const [cardType, setCardType] = useState<CardType>("daily");
    const [name, setName] = useState("You");

    // Local state for immediate UI feedback (debounced before updating actual name)
    const [localName, setLocalName] = useState("You");
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup debounce timer on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    // Debounced name change handler - immediate UI feedback, delayed image update
    const handleNameChange = (value: string) => {
        const trimmed = value.slice(0, 20);
        setLocalName(trimmed); // Immediate UI update

        // Clear existing debounce timer
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        // Debounce the actual name state update (which triggers image regeneration)
        debounceRef.current = setTimeout(() => {
            setName(trimmed);
        }, DEBOUNCE_MS);
    };

    // Build the OG image URL with current settings
    const ogImageUrl = useMemo(() => {
        const params = new URLSearchParams({
            card_type: cardType,
            value: stepValue.toString(),
            metric_type: "steps",
            name: name || "You",
        });

        // Add rank for rank card type
        if (cardType === "rank") {
            params.set("rank", "5");
        }

        return `/api/og?${params.toString()}`;
    }, [stepValue, cardType, name]);

    const handleShare = () => {
        // Track the playground share attempt
        analytics.shareFunnel.modalOpened("playground", cardType);

        // Copy share URL to clipboard
        const shareUrl = `${window.location.origin}/share/demo?steps=${stepValue}&type=${cardType}`;
        navigator.clipboard.writeText(shareUrl);

        // Show feedback (could be enhanced with toast)
        alert("Share link copied to clipboard! Sign up to share beautiful cards.");
    };

    const cardTypeOptions = Object.values(CARD_TYPE_CONFIGS).filter(
        (config) => config.type !== "rank_change" // Exclude rank_change for simplicity
    );

    return (
        <section className="py-24 bg-gradient-to-b from-background to-muted/30">
            <div className="px-6 lg:px-8 max-w-5xl mx-auto">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-sm font-semibold mb-6">
                        <Sparkles className="w-4 h-4" />
                        <span>Try It Now</span>
                    </div>
                    <h2 className="text-3xl font-bold mb-4">Create Your Own Card</h2>
                    <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                        Enter your step count and see the card update in real-time.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 items-start">
                    {/* Controls */}
                    <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
                        {/* Step Count Input */}
                        <div>
                            <label
                                htmlFor="steps"
                                className="block text-sm font-medium text-foreground mb-2"
                            >
                                Your Step Count
                            </label>
                            <input
                                id="steps"
                                type="number"
                                value={stepValue}
                                onChange={(e) => setStepValue(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-2xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary"
                                min={0}
                                max={999999}
                            />
                            <p className="mt-2 text-sm text-muted-foreground text-center">
                                {METRIC_CONFIGS.steps.formatValue(stepValue)} steps
                            </p>
                        </div>

                        {/* Card Type Selector */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Card Type
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {cardTypeOptions.map((config) => (
                                    <button
                                        key={config.type}
                                        onClick={() => setCardType(config.type)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            cardType === config.type
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted hover:bg-muted/80 text-foreground"
                                        }`}
                                    >
                                        {config.emoji} {config.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Name Input */}
                        <div>
                            <label
                                htmlFor="name"
                                className="block text-sm font-medium text-foreground mb-2"
                            >
                                Display Name
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={localName}
                                onChange={(e) => handleNameChange(e.target.value)}
                                placeholder="Your name"
                                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                                maxLength={20}
                            />
                        </div>

                        {/* Share Button */}
                        <button
                            onClick={handleShare}
                            className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 text-lg font-bold text-primary-foreground bg-gradient-brand-primary rounded-xl hover:scale-[1.02] transition-transform"
                        >
                            <Share2 className="w-5 h-5" />
                            Copy Share Link
                        </button>

                        <p className="text-xs text-muted-foreground text-center">
                            Sign up to save your cards and track your progress!
                        </p>
                    </div>

                    {/* Live Preview */}
                    <div className="sticky top-24">
                        <div className="bg-card border border-border rounded-2xl p-4 overflow-hidden">
                            <p className="text-sm font-medium text-muted-foreground mb-3 text-center">
                                Live Preview
                            </p>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={ogImageUrl}
                                alt="Your share card preview"
                                className="w-full aspect-[1200/630] object-cover rounded-xl border border-border"
                            />
                            <p className="text-xs text-muted-foreground mt-3 text-center">
                                This is how your card will look on WhatsApp, X, and other platforms.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
