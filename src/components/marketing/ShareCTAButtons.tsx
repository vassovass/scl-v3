"use client";

import { useState } from "react";
import Link from "next/link";
import { Share2, ArrowRight } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { analytics } from "@/lib/analytics";
import { ShareModal } from "@/components/sharing";
import { useShareCTATest } from "@/hooks/useABTest";

/**
 * Auth-aware CTA buttons for the How To Share marketing page
 * Shows different text/destination based on login state
 *
 * PRD-53 P-3: Uses PostHog A/B testing for CTA text variants
 */
export function ShareCTAButtons({ location }: { location: string }) {
    const { user, loading: authLoading } = useAuth();
    const { variant: ctaVariant, isLoading: abLoading } = useShareCTATest();
    const [showDemo, setShowDemo] = useState(false);

    const handlePrimaryClick = () => {
        const destination = user ? "/submit-steps" : "/sign-up";
        // Track with A/B variant info
        analytics.ctaClicked(`share_primary_${ctaVariant.variant}`, location, destination);
    };

    const handleDemoClick = () => {
        analytics.shareFunnel.modalOpened("how_to_share_demo", "daily");
        setShowDemo(true);
    };

    // Loading state with skeleton
    const loading = authLoading || abLoading;
    if (loading) {
        return (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="h-14 w-48 bg-muted/50 rounded-full animate-pulse" />
                <div className="h-14 w-40 bg-muted/30 rounded-full animate-pulse" />
            </div>
        );
    }

    const primaryHref = user ? "/submit-steps" : "/sign-up";
    // Use A/B test variant text
    const primaryText = user ? ctaVariant.buttonTextLoggedIn : ctaVariant.buttonText;
    const demoText = ctaVariant.demoText;

    return (
        <>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {/* Primary CTA */}
                <Link
                    href={primaryHref}
                    onClick={handlePrimaryClick}
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-bold text-primary-foreground bg-gradient-brand-primary rounded-full hover:scale-105 transition-transform glow-primary"
                    data-track-click="cta_share_primary"
                    data-track-location={location}
                >
                    <Share2 className="w-5 h-5" />
                    {primaryText}
                </Link>

                {/* Secondary CTA - Demo */}
                <button
                    onClick={handleDemoClick}
                    className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-foreground border border-border rounded-full hover:bg-muted/50 transition-colors"
                    data-track-click="cta_view_demo"
                    data-track-location={location}
                >
                    {demoText}
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>

            {/* Demo Modal */}
            {showDemo && (
                <ShareModal
                    isOpen={showDemo}
                    onClose={() => setShowDemo(false)}
                    defaultCardType="daily"
                    defaultValue={12345}
                    metricType="steps"
                    rank={5}
                    leagueName="Demo League"
                    periodLabel="today"
                />
            )}
        </>
    );
}
