"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useUserSubmissions } from "@/hooks/useUserSubmissions";
import { useEngagement } from "@/hooks/useEngagement";
import { MissedDayCard } from "./MissedDayCard";
import { StreakWarning } from "./StreakWarning";

/**
 * Container for engagement prompt cards (missed-day, streak warning).
 * Self-contained client component — fetches its own data via useUserSubmissions.
 *
 * Shows for users WITH submissions (complement to OnboardingSection).
 * PRD 28: Smart Engagement.
 */
export function EngagementPrompts() {
    const { session } = useAuth();
    const userId = session?.user?.id;

    const {
        hasSubmittedToday,
        hasSubmittedYesterday,
        currentStreak,
        totalSubmissions,
        isLoading,
    } = useUserSubmissions({ userId, skip: !userId });

    const { missedYesterday, streakAtRisk, missedDate, dismiss, dismissed } =
        useEngagement({
            hasSubmittedToday,
            hasSubmittedYesterday,
            currentStreak,
        });

    // Don't show for brand-new users (they see OnboardingSection instead)
    if (isLoading || totalSubmissions === 0) return null;

    const showMissedDay = missedYesterday && !dismissed.has("missed_day");
    const showStreakWarning = streakAtRisk && !dismissed.has("streak_warning");

    if (!showMissedDay && !showStreakWarning) return null;

    return (
        <div className="mt-4 space-y-3" data-tour="engagement-prompts">
            {showMissedDay && (
                <MissedDayCard
                    missedDate={missedDate}
                    onDismiss={() => dismiss("missed_day")}
                />
            )}
            {showStreakWarning && (
                <StreakWarning
                    currentStreak={currentStreak}
                    onDismiss={() => dismiss("streak_warning")}
                />
            )}
        </div>
    );
}
