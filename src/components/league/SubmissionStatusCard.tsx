"use client";

import Link from "next/link";

interface SubmissionStatusCardProps {
    hasSubmittedYesterday: boolean;
    yesterdaySteps?: number;
}

/**
 * CTA card prompting users to submit steps if they haven't for yesterday
 * Links to the league-agnostic /submit-steps page
 */
export function SubmissionStatusCard({
    hasSubmittedYesterday,
    yesterdaySteps,
}: SubmissionStatusCardProps) {
    if (hasSubmittedYesterday && yesterdaySteps) {
        // Success state - already submitted
        return (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
                        <span className="text-2xl">✅</span>
                    </div>
                    <div>
                        <h3 className="font-semibold text-emerald-100">Yesterday's steps submitted!</h3>
                        <p className="text-sm text-emerald-200/80">
                            {yesterdaySteps.toLocaleString()} steps recorded for yesterday
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
                        <h3 className="font-semibold text-foreground">You haven't submitted yesterday</h3>
                        <p className="text-sm text-[hsl(var(--warning)/0.8)]">
                            Don't break your streak – submit yesterday's steps now!
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
