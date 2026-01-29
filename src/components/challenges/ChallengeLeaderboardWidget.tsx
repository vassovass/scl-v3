"use client";

/**
 * ChallengeLeaderboardWidget Component (PRD-54 P-4)
 *
 * Dashboard widget showing challenge stats and recent activity.
 *
 * Design System:
 * - Card-based layout
 * - Semantic colors for win/loss/tie
 */

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Trophy, Target, Swords, ChevronRight } from "lucide-react";
import type { ChallengeStats } from "@/lib/challenges";

interface ChallengeLeaderboardWidgetProps {
    stats: ChallengeStats;
    showViewAll?: boolean;
}

export function ChallengeLeaderboardWidget({
    stats,
    showViewAll = true,
}: ChallengeLeaderboardWidgetProps) {
    const hasNoChallenges = stats.total_challenges === 0 && stats.active === 0;

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Swords className="h-4 w-4" />
                        Challenges
                    </CardTitle>
                    {showViewAll && (
                        <Link href="/challenges">
                            <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
                                View all
                                <ChevronRight className="ml-1 h-3 w-3" />
                            </Button>
                        </Link>
                    )}
                </div>
            </CardHeader>

            <CardContent>
                {hasNoChallenges ? (
                    <div className="text-center py-4">
                        <Target className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                        <p className="text-sm text-muted-foreground">
                            No challenges yet
                        </p>
                        <Link href="/challenges">
                            <Button variant="outline" size="sm" className="mt-2">
                                Start a Challenge
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="p-2 rounded-lg bg-[hsl(var(--success)/0.1)]">
                                <p className="text-lg font-bold text-[hsl(var(--success))]">
                                    {stats.wins}
                                </p>
                                <p className="text-xs text-muted-foreground">Wins</p>
                            </div>
                            <div className="p-2 rounded-lg bg-muted/50">
                                <p className="text-lg font-bold text-muted-foreground">
                                    {stats.losses}
                                </p>
                                <p className="text-xs text-muted-foreground">Losses</p>
                            </div>
                            <div className="p-2 rounded-lg bg-muted/50">
                                <p className="text-lg font-bold text-muted-foreground">
                                    {stats.ties}
                                </p>
                                <p className="text-xs text-muted-foreground">Ties</p>
                            </div>
                        </div>

                        {/* Win rate */}
                        {stats.total_challenges > 0 && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Win rate</span>
                                <span className="font-medium">{stats.win_rate}%</span>
                            </div>
                        )}

                        {/* Current streak */}
                        {stats.current_win_streak > 0 && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Win streak</span>
                                <Badge variant="secondary" className="bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]">
                                    <Trophy className="h-3 w-3 mr-1" />
                                    {stats.current_win_streak}
                                </Badge>
                            </div>
                        )}

                        {/* Active/Pending badges */}
                        <div className="flex flex-wrap gap-2 pt-1">
                            {stats.active > 0 && (
                                <Badge variant="outline" className="text-xs">
                                    {stats.active} active
                                </Badge>
                            )}
                            {stats.pending_received > 0 && (
                                <Badge className="text-xs bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))]">
                                    {stats.pending_received} pending
                                </Badge>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
