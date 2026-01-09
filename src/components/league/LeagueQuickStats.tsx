"use client";

interface LeagueQuickStatsProps {
    rank: number | null;
    totalMembers: number;
    stepsThisWeek: number;
    currentStreak: number;
    hasSubmittedToday: boolean;
}

/**
 * Quick stats card showing user's league performance at a glance
 */
export function LeagueQuickStats({
    rank,
    totalMembers,
    stepsThisWeek,
    currentStreak,
    hasSubmittedToday,
}: LeagueQuickStatsProps) {
    const getRankBadgeColor = (rank: number | null) => {
        if (!rank) return "text-muted-foreground";
        if (rank === 1) return "text-yellow-500";
        if (rank === 2) return "text-slate-300";
        if (rank === 3) return "text-amber-600";
        return "text-primary";
    };

    return (
        <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Your Stats</h3>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {/* Rank */}
                <div className="text-center">
                    <div className={`text-2xl font-bold ${getRankBadgeColor(rank)}`}>
                        {rank ? `#${rank}` : "—"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                        {rank ? `of ${totalMembers}` : "No rank yet"}
                    </div>
                </div>

                {/* Steps This Week */}
                <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">
                        {stepsThisWeek.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Steps this week</div>
                </div>

                {/* Streak */}
                <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">
                        {currentStreak > 0 ? (
                            <>
                                🔥 {currentStreak}
                            </>
                        ) : (
                            "—"
                        )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                        {currentStreak === 1 ? "Day streak" : "Days streak"}
                    </div>
                </div>

                {/* Today's Status */}
                <div className="text-center">
                    <div className="text-2xl font-bold">
                        {hasSubmittedToday ? (
                            <span className="text-emerald-500">✅</span>
                        ) : (
                            <span className="text-amber-500">⚠️</span>
                        )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                        {hasSubmittedToday ? "Submitted" : "Missing today"}
                    </div>
                </div>
            </div>
        </div>
    );
}
