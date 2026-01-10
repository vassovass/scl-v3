"use client";

import Link from "next/link";

interface SubmissionStatusCardProps {
    hasSubmittedToday: boolean;
    todaySteps?: number;
}

/**
 * CTA card prompting users to submit steps if they haven't today
 * Links to the league-agnostic /submit-steps page
 */
export function SubmissionStatusCard({
    hasSubmittedToday,
    todaySteps,
}: SubmissionStatusCardProps) {
    if (hasSubmittedToday && todaySteps) {
        // Success state - already submitted
        return (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
                        <span className="text-2xl">✅</span>
                    </div>
                    <div>
                        <h3 className="font-semibold text-emerald-100">Today's steps submitted!</h3>
                        <p className="text-sm text-emerald-200/80">
                            {todaySteps.toLocaleString()} steps recorded for today
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Warning state - missing submission
    return (
        <div className="rounded-xl border border-[hsl(var(--warning)/0.3)] bg-[hsl(var(--warning)/0.1)] p-6">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--warning)/0.2)]">
                        <span className="text-2xl">⚠️</span>
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground">You haven't submitted today</h3>
                        <p className="text-sm text-[hsl(var(--warning)/0.8)]">
                            Don't break your streak – submit your steps now!
                        </p>
                    </div>
                </div>
                <Link
                    href="/submit-steps"
                    className="flex-shrink-0 rounded-lg bg-[hsl(var(--warning))] px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-[hsl(var(--warning)/0.9)]"
                >
                    Submit Steps →
                </Link>
            </div>
        </div>
    );
}
