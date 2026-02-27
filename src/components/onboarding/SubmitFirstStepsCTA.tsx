"use client";

import { OnboardingCard } from "@/components/ui/OnboardingCard";

/**
 * Prominent CTA card directing new users to submit their first steps.
 * PRD 60 Section A-2.
 */
export function SubmitFirstStepsCTA() {
    return (
        <OnboardingCard
            variant="action"
            icon="📸"
            title="Submit Your First Steps"
            description="Take a screenshot of your step count from any health app and upload it. Our AI will verify your steps automatically."
            cta={{
                label: "Submit Steps Now",
                href: "/submit-steps",
            }}
            dataTour="onboarding-submit-cta"
        />
    );
}
