"use client";

import { useEffect } from "react";
import { WelcomeCard } from "./WelcomeCard";
import { SubmitFirstStepsCTA } from "./SubmitFirstStepsCTA";
import { ScreenshotGuide } from "./ScreenshotGuide";
import { WorldLeagueExplainer } from "./WorldLeagueExplainer";
import { trackEvent } from "@/lib/analytics";

interface OnboardingSectionProps {
    /** Number of total submissions for the user (0 = show onboarding) */
    submissionCount: number;
    /** User's display name for personalization */
    displayName?: string;
}

/**
 * Container for new-user onboarding cards.
 * Shows only when user has zero submissions (progressive disclosure).
 * PRD 60: Reduces time-to-aha from 5-10 min to 2-3 min.
 */
export function OnboardingSection({ submissionCount, displayName }: OnboardingSectionProps) {
    const isNewUser = submissionCount === 0;

    // Track onboarding view (hooks must be called unconditionally)
    useEffect(() => {
        if (!isNewUser) return;
        trackEvent("onboarding_card_viewed", {
            category: "onboarding",
            action: "view",
            component: "OnboardingSection",
            card_type: "all",
        });
    }, [isNewUser]);

    // Don't show for users who have already submitted
    if (!isNewUser) return null;

    return (
        <div className="mt-6 space-y-4" data-tour="onboarding-section">
            <WelcomeCard displayName={displayName} />

            <div className="grid gap-4 md:grid-cols-2">
                <SubmitFirstStepsCTA />
                <WorldLeagueExplainer />
            </div>

            <ScreenshotGuide />
        </div>
    );
}
