import { withApiHandler } from "@/lib/api/handler";

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

interface TourCompletionRow {
    tour_id: string;
    completion_type: "completed" | "skipped";
    duration_ms: number | null;
}

interface StepInteractionRow {
    tour_id: string;
    step_index: number;
    step_id: string;
    action: "viewed" | "completed" | "skipped";
}

interface TourFeedbackRow {
    tour_id: string;
    rating: number | null;
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

export const GET = withApiHandler(
    {
        auth: "superadmin",
    },
    async ({ adminClient }) => {
        const { data: completions, error: completionsError } = await adminClient
            .from("tour_completions")
            .select("tour_id, completion_type, duration_ms");

        if (completionsError) {
            throw completionsError;
        }

        const { data: steps, error: stepsError } = await adminClient
            .from("tour_step_interactions")
            .select("tour_id, step_index, step_id, action");

        if (stepsError) {
            throw stepsError;
        }

        const { data: feedback, error: feedbackError } = await adminClient
            .from("tour_feedback")
            .select("tour_id, rating");

        if (feedbackError) {
            throw feedbackError;
        }

        const completionRows = (completions || []) as TourCompletionRow[];
        const stepRows = (steps || []) as StepInteractionRow[];
        const feedbackRows = (feedback || []) as TourFeedbackRow[];

        const startsByTour = new Map<string, number>();
        stepRows
            .filter((row) => row.action === "viewed" && row.step_index === 0)
            .forEach((row) => {
                startsByTour.set(row.tour_id, (startsByTour.get(row.tour_id) || 0) + 1);
            });

        const completionStats = new Map<string, { completions: number; durations: number[] }>();
        completionRows.forEach((row) => {
            const existing = completionStats.get(row.tour_id) || { completions: 0, durations: [] };
            if (row.completion_type === "completed") {
                existing.completions += 1;
                if (row.duration_ms) {
                    existing.durations.push(row.duration_ms);
                }
            }
            completionStats.set(row.tour_id, existing);
        });

        const tourIds = new Set<string>([
            ...startsByTour.keys(),
            ...completionStats.keys(),
        ]);

        const tourStats: TourStats[] = Array.from(tourIds).map((tourId) => {
            const totalStarts = startsByTour.get(tourId) || 0;
            const stats = completionStats.get(tourId) || { completions: 0, durations: [] };
            const avgDuration =
                stats.durations.length > 0
                    ? stats.durations.reduce((sum, duration) => sum + duration, 0) / stats.durations.length
                    : null;

            return {
                tourId,
                totalStarts,
                totalCompletions: stats.completions,
                completionRate: totalStarts > 0 ? (stats.completions / totalStarts) * 100 : 0,
                avgDuration,
            };
        });

        const stepViewsMap = new Map<string, Map<number, { stepId: string; views: number }>>();
        stepRows
            .filter((row) => row.action === "viewed")
            .forEach((row) => {
                const tourSteps = stepViewsMap.get(row.tour_id) || new Map();
                const existing = tourSteps.get(row.step_index) || { stepId: row.step_id, views: 0 };
                existing.views += 1;
                tourSteps.set(row.step_index, existing);
                stepViewsMap.set(row.tour_id, tourSteps);
            });

        const stepDropoff: StepDropoff[] = [];
        stepViewsMap.forEach((stepsMap, tourId) => {
            let prevViews = 0;
            Array.from(stepsMap.entries())
                .sort(([a], [b]) => a - b)
                .forEach(([stepIndex, data], idx) => {
                    const dropoffRate =
                        idx === 0
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

        const ratingCounts: Record<string, number> = {};
        let totalRatingValue = 0;

        feedbackRows.forEach((row) => {
            const rating = row.rating ?? 0;
            if (rating > 0) {
                ratingCounts[String(rating)] = (ratingCounts[String(rating)] || 0) + 1;
                totalRatingValue += rating;
            }
        });

        const totalFeedback = feedbackRows.filter((row) => row.rating != null).length;
        const feedbackSummary: FeedbackSummary = {
            totalFeedback,
            ratings: ratingCounts,
            averageRating: totalFeedback > 0 ? totalRatingValue / totalFeedback : 0,
        };

        const totalStarts = tourStats.reduce((sum, stat) => sum + stat.totalStarts, 0);
        const totalCompletions = tourStats.reduce((sum, stat) => sum + stat.totalCompletions, 0);

        return {
            tourStats,
            stepDropoff,
            feedbackSummary,
            totalCompletions,
            totalStarts,
            overallCompletionRate: totalStarts > 0 ? (totalCompletions / totalStarts) * 100 : 0,
        };
    }
);
