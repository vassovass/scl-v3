"use client";

import { Card, CardContent } from "@/components/ui/card";

interface StepBankCardProps {
    lifetimeSteps: number;
    bestDaySteps: number;
    bestDayDate: string | null;
}

/**
 * Gamified "Step Bank" card showing lifetime total steps.
 * PRD 29: Makes lifetime totals feel like earned currency.
 */
export function StepBankCard({ lifetimeSteps, bestDaySteps, bestDayDate }: StepBankCardProps) {
    const formattedBestDate = bestDayDate
        ? new Date(bestDayDate + "T12:00:00").toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
          })
        : null;

    return (
        <Card className="border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--primary)/0.05)]">
            <CardContent className="p-4 sm:p-6">
                <div className="text-center">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Lifetime Step Bank
                    </p>
                    <p className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">
                        {lifetimeSteps.toLocaleString()}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">total steps</p>
                </div>

                {bestDaySteps > 0 && (
                    <div className="mt-4 flex justify-center">
                        <div className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
                            Best day: {bestDaySteps.toLocaleString()} steps
                            {formattedBestDate && ` on ${formattedBestDate}`}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
