"use client";

import { OnboardingCard } from "@/components/ui/OnboardingCard";

interface WelcomeCardProps {
    displayName?: string;
}

/**
 * Personalized welcome card shown to new users (zero submissions).
 * PRD 60 Section A-1.
 */
export function WelcomeCard({ displayName }: WelcomeCardProps) {
    const name = displayName || "there";

    return (
        <OnboardingCard
            variant="welcome"
            icon="👋"
            title={`Welcome, ${name}!`}
            description="You're all set up and ready to start tracking your steps. Here's how to get started with StepLeague."
            dataTour="onboarding-welcome"
        />
    );
}
