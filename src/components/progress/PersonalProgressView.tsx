"use client";

import { StepBankCard } from "./StepBankCard";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

interface PersonalProgressViewProps {
    stats: {
        total_steps_lifetime: number;
        best_day_steps: number;
        best_day_date: string | null;
        current_streak: number;
        longest_streak: number;
    } | null;
    isLoading: boolean;
}

/**
 * Personal progress view showing lifetime stats, streak, and milestones.
 * PRD 29: Default tab on the progress page.
 */
export function PersonalProgressView({ stats, isLoading }: PersonalProgressViewProps) {
    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                        <CardContent className="h-24 p-4" />
                    </Card>
                ))}
            </div>
        );
    }

    if (!stats || stats.total_steps_lifetime === 0) {
        return (
            <Card className="border-border">
                <CardContent className="p-8 text-center">
                    <p className="text-lg text-muted-foreground">
                        No progress data yet
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground/70">
                        Submit your first steps to see your progress here.
                    </p>
                    <Link
                        href="/submit-steps"
                        className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                    >
                        Submit Steps
                    </Link>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Step Bank */}
            <StepBankCard
                lifetimeSteps={stats.total_steps_lifetime}
                bestDaySteps={stats.best_day_steps}
                bestDayDate={stats.best_day_date}
            />

            {/* Streak Cards */}
            <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                    <CardContent className="p-4 sm:p-6">
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Current Streak
                        </p>
                        <p className="mt-2 text-2xl font-bold text-foreground">
                            {stats.current_streak} {stats.current_streak === 1 ? "day" : "days"}
                        </p>
                        {stats.current_streak > 0 && (
                            <p className="mt-1 text-sm text-[hsl(var(--success))]">
                                Keep it going!
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 sm:p-6">
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Longest Streak
                        </p>
                        <p className="mt-2 text-2xl font-bold text-foreground">
                            {stats.longest_streak} {stats.longest_streak === 1 ? "day" : "days"}
                        </p>
                        {stats.current_streak >= stats.longest_streak && stats.current_streak > 0 && (
                            <p className="mt-1 text-sm text-[hsl(var(--warning))]">
                                Personal best!
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* More stats link */}
            <div className="text-center">
                <Link
                    href="/my-stats"
                    className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                    View detailed stats and sharing options →
                </Link>
            </div>
        </div>
    );
}
