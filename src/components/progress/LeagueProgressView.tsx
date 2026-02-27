"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";

interface LeagueStat {
    league_id: string;
    league_name: string;
    rank: number;
    total_members: number;
    user_steps_this_week: number;
    league_average_this_week: number;
}

interface LeagueProgressViewProps {
    userId?: string;
}

/**
 * League progress view showing rank and comparison across leagues.
 * PRD 29: Second tab on the progress page.
 */
export function LeagueProgressView({ userId }: LeagueProgressViewProps) {
    const { session } = useAuth();
    const [leagues, setLeagues] = useState<LeagueStat[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const uid = userId || session?.user?.id;
        if (!uid) return;

        async function fetchLeagueProgress() {
            try {
                const res = await fetch(`/api/stats/hub?period=this_week`);
                if (!res.ok) throw new Error("Failed to fetch");
                const data = await res.json();

                if (data.league_stats) {
                    setLeagues(
                        Array.isArray(data.league_stats)
                            ? data.league_stats
                            : [data.league_stats]
                    );
                }
            } catch {
                // Silently fail — empty state will show
            } finally {
                setIsLoading(false);
            }
        }

        fetchLeagueProgress();
    }, [userId, session?.user?.id]);

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2].map((i) => (
                    <Card key={i} className="animate-pulse">
                        <CardContent className="h-24 p-4" />
                    </Card>
                ))}
            </div>
        );
    }

    if (leagues.length === 0) {
        return (
            <Card className="border-border">
                <CardContent className="p-8 text-center">
                    <p className="text-lg text-muted-foreground">
                        No league data yet
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground/70">
                        Join a league to see how you compare with others.
                    </p>
                    <Link
                        href="/join"
                        className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                    >
                        Join a League
                    </Link>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {leagues.map((league) => {
                const diff = league.user_steps_this_week - league.league_average_this_week;
                const diffLabel = diff > 0
                    ? `${diff.toLocaleString()} above average`
                    : diff < 0
                    ? `${Math.abs(diff).toLocaleString()} below average`
                    : "At average";

                return (
                    <Card key={league.league_id}>
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        {league.league_name}
                                    </p>
                                    <p className="mt-2 text-2xl font-bold text-foreground">
                                        #{league.rank}
                                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                                            of {league.total_members}
                                        </span>
                                    </p>
                                </div>
                                <Link
                                    href={`/league/${league.league_id}/leaderboard`}
                                    className="text-xs text-primary hover:text-primary/80 transition-colors"
                                >
                                    Full leaderboard →
                                </Link>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Your steps (week)</p>
                                    <p className="font-medium text-foreground">
                                        {league.user_steps_this_week.toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">League avg (week)</p>
                                    <p className="font-medium text-foreground">
                                        {league.league_average_this_week.toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-3">
                                <p className={`text-xs font-medium ${
                                    diff > 0
                                        ? "text-[hsl(var(--success))]"
                                        : diff < 0
                                        ? "text-[hsl(var(--warning))]"
                                        : "text-muted-foreground"
                                }`}>
                                    {diff > 0 ? "↑" : diff < 0 ? "↓" : "→"} {diffLabel}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
