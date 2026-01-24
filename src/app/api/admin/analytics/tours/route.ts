import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Tour Analytics API
 * 
 * Returns aggregated data from:
 * - tour_completions
 * - tour_step_interactions
 * - tour_feedback
 * 
 * Part of PRD 50 Phase 5 (Admin Analytics)
 */

export const dynamic = "force-dynamic";

interface TourCompletion {
    tour_id: string;
    completed: boolean;
    completion_time_ms: number | null;
    created_at: string;
}

interface StepInteraction {
    tour_id: string;
    step_index: number;
    step_id: string;
    action: string;
    duration_ms: number | null;
}

interface TourFeedback {
    tour_id: string;
    rating: string | null;
    comment: string | null;
}

interface TourStats {
    tourId: string;
    totalStarts: number;
    totalCompletions: number;
    completionRate: number;
    avgDuration: number | null;
}

interface StepDropoff {
    tourId: string;
    stepIndex: number;
    stepId: string;
    views: number;
    dropoffRate: number;
}

interface FeedbackSummary {
    totalFeedback: number;
    ratings: Record<string, number>;
    averageRating: number;
}

export async function GET() {
    const supabase = await createServerSupabaseClient();

    // Verify superadmin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
        .from("users")
        .select("is_superadmin")
        .eq("id", user.id)
        .single();

    if (!profile?.is_superadmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        // Get tour completions aggregated by tour
        const { data: completions, error: completionsError } = await supabase
            .from("tour_completions")
            .select("tour_id, completed, completion_time_ms, created_at");

        if (completionsError) throw completionsError;

        // Get step interactions
        const { data: steps, error: stepsError } = await supabase
            .from("tour_step_interactions")
            .select("tour_id, step_index, step_id, action, duration_ms");

        if (stepsError) throw stepsError;

        // Get feedback
        const { data: feedback, error: feedbackError } = await supabase
            .from("tour_feedback")
            .select("tour_id, rating, comment");

        if (feedbackError) throw feedbackError;

        // Aggregate tour stats
        const tourStatsMap = new Map<string, { starts: number; completions: number; durations: number[] }>();

        ((completions || []) as TourCompletion[]).forEach((c) => {
            const existing = tourStatsMap.get(c.tour_id) || { starts: 0, completions: 0, durations: [] };
            existing.starts++;
            if (c.completed) {
                existing.completions++;
                if (c.completion_time_ms) {
                    existing.durations.push(c.completion_time_ms);
                }
            }
            tourStatsMap.set(c.tour_id, existing);
        });

        const tourStats: TourStats[] = Array.from(tourStatsMap.entries()).map(([tourId, stats]) => ({
            tourId,
            totalStarts: stats.starts,
            totalCompletions: stats.completions,
            completionRate: stats.starts > 0 ? (stats.completions / stats.starts) * 100 : 0,
            avgDuration: stats.durations.length > 0
                ? stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length
                : null,
        }));

        // Aggregate step drop-off
        const stepViewsMap = new Map<string, Map<number, { stepId: string; views: number }>>();

        ((steps || []) as StepInteraction[]).forEach((s) => {
            if (s.action === "view") {
                const tourSteps = stepViewsMap.get(s.tour_id) || new Map();
                const existing = tourSteps.get(s.step_index) || { stepId: s.step_id, views: 0 };
                existing.views++;
                tourSteps.set(s.step_index, existing);
                stepViewsMap.set(s.tour_id, tourSteps);
            }
        });

        const stepDropoff: StepDropoff[] = [];
        stepViewsMap.forEach((stepsMap, tourId) => {
            let prevViews = 0;
            Array.from(stepsMap.entries())
                .sort(([a], [b]) => a - b)
                .forEach(([stepIndex, data], idx) => {
                    const dropoffRate = idx === 0
                        ? 0
                        : prevViews > 0
                            ? ((prevViews - data.views) / prevViews) * 100
                            : 0;

                    stepDropoff.push({
                        tourId,
                        stepIndex,
                        stepId: data.stepId,
                        views: data.views,
                        dropoffRate: Math.max(0, dropoffRate),
                    });

                    prevViews = data.views;
                });
        });

        // Aggregate feedback
        const ratingCounts: Record<string, number> = {};
        let totalRatingValue = 0;

        ((feedback || []) as TourFeedback[]).forEach((f) => {
            const r = f.rating || "unknown";
            ratingCounts[r] = (ratingCounts[r] || 0) + 1;
            // Convert emoji to numeric for average
            const numericRatings: Record<string, number> = {
                "😍": 5, "😊": 4, "😐": 3, "😕": 2, "😢": 1,
                "great": 5, "good": 4, "ok": 3, "bad": 2, "terrible": 1,
            };
            totalRatingValue += numericRatings[r] || 3;
        });

        const feedbackSummary: FeedbackSummary = {
            totalFeedback: feedback?.length || 0,
            ratings: ratingCounts,
            averageRating: feedback && feedback.length > 0
                ? totalRatingValue / feedback.length
                : 0,
        };

        const typedCompletions = (completions || []) as TourCompletion[];

        return NextResponse.json({
            tourStats,
            stepDropoff,
            feedbackSummary,
            totalCompletions: typedCompletions.filter(c => c.completed).length,
            totalStarts: typedCompletions.length,
            overallCompletionRate: typedCompletions.length > 0
                ? (typedCompletions.filter(c => c.completed).length / typedCompletions.length) * 100
                : 0,
        });

    } catch (error) {
        console.error("[Analytics/Tours] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch tour analytics" },
            { status: 500 }
        );
    }
}
