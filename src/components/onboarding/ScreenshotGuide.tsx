"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { trackEvent } from "@/lib/analytics";

const healthApps = [
    {
        name: "Apple Health",
        icon: "🍎",
        steps: [
            "Open the Health app on your iPhone",
            'Tap "Browse" at the bottom',
            'Tap "Activity" then "Steps"',
            "Screenshot the daily total",
        ],
    },
    {
        name: "Google Fit",
        icon: "🟢",
        steps: [
            "Open Google Fit on your Android",
            "You'll see your step count on the home screen",
            "Screenshot the daily step total",
        ],
    },
    {
        name: "Samsung Health",
        icon: "💙",
        steps: [
            "Open Samsung Health",
            "Your steps show on the home screen",
            "Tap to see the daily detail view",
            "Screenshot the daily total",
        ],
    },
];

/**
 * Expandable guide showing how to take screenshots from popular health apps.
 * PRD 60 Section A-3 + B-1 + B-2.
 */
export function ScreenshotGuide() {
    const [expandedApp, setExpandedApp] = useState<string | null>(null);

    function handleToggle(appName: string) {
        const next = expandedApp === appName ? null : appName;
        setExpandedApp(next);
        if (next) {
            trackEvent("screenshot_guide_expanded", {
                category: "onboarding",
                action: "expand",
                component: "ScreenshotGuide",
                app: appName,
            });
        }
    }

    return (
        <Card
            className="border-border bg-card"
            data-tour="onboarding-screenshot-guide"
        >
            <CardContent className="p-4 sm:p-6">
                <h3 className="text-sm font-semibold text-foreground sm:text-base">
                    📱 How to Take a Screenshot
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Open your health app, find your daily step count, and take a
                    screenshot. We support these apps:
                </p>

                <div className="mt-4 space-y-2">
                    {healthApps.map((app) => (
                        <div key={app.name} className="rounded-lg border border-border">
                            <button
                                onClick={() => handleToggle(app.name)}
                                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-foreground transition hover:bg-accent/50"
                                aria-expanded={expandedApp === app.name}
                            >
                                <span className="text-lg" aria-hidden="true">
                                    {app.icon}
                                </span>
                                <span className="flex-1">{app.name}</span>
                                <span
                                    className="text-muted-foreground transition-transform"
                                    style={{
                                        transform:
                                            expandedApp === app.name
                                                ? "rotate(180deg)"
                                                : "rotate(0deg)",
                                    }}
                                >
                                    ▾
                                </span>
                            </button>

                            {expandedApp === app.name && (
                                <div className="border-t border-border px-4 py-3">
                                    <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                                        {app.steps.map((step, i) => (
                                            <li key={i}>{step}</li>
                                        ))}
                                    </ol>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
