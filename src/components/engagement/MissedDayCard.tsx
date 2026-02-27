"use client";

import { OnboardingCard } from "@/components/ui/OnboardingCard";
import { trackEvent } from "@/lib/analytics";
import { useEffect } from "react";

interface MissedDayCardProps {
    /** The missed date in YYYY-MM-DD format */
    missedDate: string;
    /** Called when user dismisses the card */
    onDismiss: () => void;
}

/**
 * "Keep your history complete!" card for missed days.
 * PRD 28 Section A-1, A-2, A-3.
 *
 * Uses OnboardingCard (variant="warning") — shared component from Phase 0.
 * Links to submit page with pre-filled date via ?date= param.
 */
export function MissedDayCard({ missedDate, onDismiss }: MissedDayCardProps) {
    // Format date for display: "Wednesday, Feb 26"
    const displayDate = new Date(missedDate + "T12:00:00").toLocaleDateString(
        undefined,
        { weekday: "long", month: "short", day: "numeric" }
    );

    useEffect(() => {
        trackEvent("missed_day_prompt_shown", {
            category: "engagement",
            action: "view",
            component: "MissedDayCard",
            missed_date: missedDate,
        });
    }, [missedDate]);

    return (
        <OnboardingCard
            variant="warning"
            icon="📅"
            title="Keep your history complete!"
            description={`You haven't submitted steps for ${displayDate}. Log them now to keep your record up to date.`}
            cta={{
                label: `Submit for ${displayDate}`,
                href: `/submit-steps?date=${missedDate}`,
                onClick: () => {
                    trackEvent("missed_day_submit_clicked", {
                        category: "engagement",
                        action: "click",
                        component: "MissedDayCard",
                        missed_date: missedDate,
                    });
                },
            }}
            onDismiss={() => {
                trackEvent("engagement_prompt_dismissed", {
                    category: "engagement",
                    action: "dismiss",
                    component: "MissedDayCard",
                    type: "missed_day",
                });
                onDismiss();
            }}
            dataTour="engagement-missed-day"
        />
    );
}
