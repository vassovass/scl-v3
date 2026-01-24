"use client";

/**
 * Tour Completion Chart Component
 * 
 * Displays bar chart of tour completion rates.
 * Uses shadcn/ui chart components (Recharts).
 */

interface TourStats {
    tourId: string;
    totalStarts: number;
    totalCompletions: number;
    completionRate: number;
    avgDuration: number | null;
}

interface TourCompletionChartProps {
    data: TourStats[];
    loading?: boolean;
}

// Friendly tour names mapping
const tourNames: Record<string, string> = {
    "dashboard-v1": "Dashboard",
    "league-v1": "League",
    "submit-steps-v1": "Submit Steps",
    "leaderboard-v1": "Leaderboard",
    "analytics-v1": "Analytics",
    "settings-v1": "Settings",
    "admin-v1": "Admin Analytics",
};

export function TourCompletionChart({ data, loading }: TourCompletionChartProps) {
    if (loading) {
        return (
            <div className="bg-card border rounded-lg p-4">
                <div className="h-4 w-40 bg-muted animate-pulse rounded mb-4" />
                <div className="h-[200px] bg-muted animate-pulse rounded" />
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="bg-card border rounded-lg p-4">
                <h3 className="font-medium mb-4">Tour Completion Rates</h3>
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    No tour data available yet
                </div>
            </div>
        );
    }

    // Sort by completion rate descending
    const sortedData = [...data].sort((a, b) => b.completionRate - a.completionRate);

    return (
        <div className="bg-card border rounded-lg p-4">
            <h3 className="font-medium mb-4">Tour Completion Rates</h3>
            <div className="space-y-3">
                {sortedData.map((tour) => {
                    const name = tourNames[tour.tourId] || tour.tourId;
                    const rate = tour.completionRate;

                    return (
                        <div key={tour.tourId} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{name}</span>
                                <span className="font-medium">{rate.toFixed(1)}%</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(rate, 100)}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{tour.totalCompletions} completed</span>
                                <span>{tour.totalStarts} started</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
