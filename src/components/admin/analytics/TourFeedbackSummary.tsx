"use client";

/**
 * Tour Feedback Summary Component
 * 
 * Displays aggregated feedback ratings with emoji breakdown.
 */

interface FeedbackSummary {
    totalFeedback: number;
    ratings: Record<string, number>;
    averageRating: number;
}

interface TourFeedbackSummaryProps {
    data: FeedbackSummary | null;
    loading?: boolean;
}

const ratingLabels: Record<string, string> = {
    "5": "Excellent",
    "4": "Good",
    "3": "Okay",
    "2": "Needs work",
    "1": "Poor",
};

export function TourFeedbackSummary({ data, loading }: TourFeedbackSummaryProps) {
    if (loading) {
        return (
            <div className="bg-card border rounded-lg p-4">
                <div className="h-4 w-32 bg-muted animate-pulse rounded mb-4" />
                <div className="h-[150px] bg-muted animate-pulse rounded" />
            </div>
        );
    }

    if (!data || data.totalFeedback === 0) {
        return (
            <div className="bg-card border rounded-lg p-4">
                <h3 className="font-medium mb-4">Feedback Summary</h3>
                <div className="h-[150px] flex items-center justify-center text-muted-foreground">
                    No feedback received yet
                </div>
            </div>
        );
    }

    const total = data.totalFeedback;
    const sortedRatings = Object.entries(data.ratings)
        .sort(([, a], [, b]) => b - a);

    // Get rating indicator color
    const getRatingColor = (rating: number): string => {
        if (rating >= 4) return "text-[hsl(var(--success))]";
        if (rating >= 3) return "text-[hsl(var(--warning))]";
        return "text-destructive";
    };

    return (
        <div className="bg-card border rounded-lg p-4">
            <h3 className="font-medium mb-4">Feedback Summary</h3>

            {/* Average Rating */}
            <div className="text-center mb-4 pb-4 border-b">
                <div className={`text-3xl font-bold ${getRatingColor(data.averageRating)}`}>
                    {data.averageRating.toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground">
                    Average rating from {total} response{total !== 1 ? "s" : ""}
                </div>
            </div>

            {/* Rating Breakdown */}
            <div className="space-y-2">
                {sortedRatings.map(([rating, count]) => {
                    const percentage = (count / total) * 100;
                    const label = ratingLabels[rating] || rating;

                    return (
                        <div key={rating} className="flex items-center gap-2 text-sm">
                            <span className="w-8 text-center text-lg">{rating}★</span>
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary/70 rounded-full"
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                            <span className="w-8 text-right text-muted-foreground">{count}</span>
                            <span className="hidden md:inline text-xs text-muted-foreground">
                                {label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
