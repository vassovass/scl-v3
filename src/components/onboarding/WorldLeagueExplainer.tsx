"use client";

import { OnboardingCard } from "@/components/ui/OnboardingCard";

/**
 * Explains the World League to new users.
 * PRD 60 Section A-4.
 */
export function WorldLeagueExplainer() {
    return (
        <OnboardingCard
            variant="info"
            icon="🌍"
            title="You're in the World League!"
            description="Every StepLeague member competes in the global World League. Submit your daily steps to climb the leaderboard and compete with athletes worldwide."
            cta={{
                label: "View World League",
                href: "/league/world",
            }}
            dataTour="onboarding-world-league"
        />
    );
}
