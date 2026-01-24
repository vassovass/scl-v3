"use client";

/**
 * Step Drop-off Funnel Component
 * 
 * Displays drop-off rates between tour steps for a single tour.
 */

interface StepDropoff {
    tourId: string;
    stepIndex: number;
    stepId: string;
    views: number;
    dropoffRate: number;
}

interface StepDropoffFunnelProps {
    data: StepDropoff[];
    tourId: string;
    loading?: boolean;
}

export function StepDropoffFunnel({ data, tourId, loading }: StepDropoffFunnelProps) {
    const tourSteps = data.filter(s => s.tourId === tourId)
        .sort((a, b) => a.stepIndex - b.stepIndex);

    if (loading) {
        return (
            <div className="bg-card border rounded-lg p-4">
                <div className="h-4 w-32 bg-muted animate-pulse rounded mb-4" />
                <div className="h-[150px] bg-muted animate-pulse rounded" />
            </div>
        );
    }

    if (tourSteps.length === 0) {
        return (
            <div className="bg-card border rounded-lg p-4">
                <h3 className="font-medium mb-4">Step Drop-off: {tourId}</h3>
                <div className="h-[100px] flex items-center justify-center text-muted-foreground">
                    No step data available
                </div>
            </div>
        );
    }

    const maxViews = Math.max(...tourSteps.map(s => s.views), 1);

    return (
        <div className="bg-card border rounded-lg p-4">
            <h3 className="font-medium mb-4">Step Drop-off: {tourId}</h3>

            <div className="flex items-end gap-1 h-[120px]">
                {tourSteps.map((step, idx) => {
                    const height = (step.views / maxViews) * 100;
                    const isHighDropoff = step.dropoffRate > 30;

                    return (
                        <div
                            key={step.stepIndex}
                            className="flex-1 flex flex-col items-center group"
                        >
                            {/* Drop-off indicator */}
                            {idx > 0 && step.dropoffRate > 0 && (
                                <div className={`text-xs mb-1 ${isHighDropoff ? "text-destructive" : "text-muted-foreground"}`}>
                                    -{step.dropoffRate.toFixed(0)}%
                                </div>
                            )}

                            {/* Bar */}
                            <div
                                className={`w-full rounded-t transition-all ${isHighDropoff ? "bg-destructive/60" : "bg-primary/60"
                                    } group-hover:opacity-80`}
                                style={{ height: `${height}%`, minHeight: "4px" }}
                            />

                            {/* Step label */}
                            <div className="text-xs text-muted-foreground mt-1">
                                {step.stepIndex + 1}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>Step 1</span>
                <span>Step {tourSteps.length}</span>
            </div>
        </div>
    );
}
