"use client";

import { OnboardingCard } from "@/components/ui/OnboardingCard";
import { trackEvent } from "@/lib/analytics";
import { useEffect } from "react";

interface StreakWarningProps {
    /** Current streak length */
    currentStreak: number;
    /** Called when user dismisses the card */
    onDismiss: () => void;
}

/**
 * "Don't break the chain!" warning shown after 6PM local time.
 * PRD 28 Section B-1.
 *
 * Only shown when:
 * - It's after 6PM in the user's local timezone
 * - User hasn't submitted for today
 * - User has an active streak (>0)
 */
export function StreakWarning({ currentStreak, onDismiss }: StreakWarningProps) {
    useEffect(() => {
        trackEvent("streak_warning_shown", {
            category: "engagement",
            action: "view",
            component: "StreakWarning",
            streak_length: currentStreak,
        });
    }, [currentStreak]);

    return (
        <OnboardingCard
            variant="warning"
            icon="🔥"
            title={`${currentStreak}-day streak at risk!`}
            description="Don't break the chain! Submit today's steps before midnight to keep your streak alive."
            cta={{
                label: "Submit Now",
                href: "/submit-steps",
                onClick: () => {
                    trackEvent("streak_warning_submit_clicked", {
                        category: "engagement",
                        action: "click",
                        component: "StreakWarning",
                        streak_length: currentStreak,
                    });
                },
            }}
            onDismiss={() => {
                trackEvent("engagement_prompt_dismissed", {
                    category: "engagement",
                    action: "dismiss",
                    component: "StreakWarning",
                    type: "streak_warning",
                });
                onDismiss();
            }}
            dataTour="engagement-streak-warning"
        />
    );
}
