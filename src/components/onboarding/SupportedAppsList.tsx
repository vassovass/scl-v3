"use client";

import { Card, CardContent } from "@/components/ui/card";

const supportedApps = [
    { name: "Apple Health", icon: "🍎" },
    { name: "Google Fit", icon: "🟢" },
    { name: "Samsung Health", icon: "💙" },
    { name: "Fitbit", icon: "💚" },
    { name: "Garmin", icon: "🔵" },
    { name: "Strava", icon: "🟠" },
];

/**
 * Grid of supported health app icons/names shown on the submit page.
 * PRD 60 Section B-1.
 */
export function SupportedAppsList() {
    return (
        <Card className="border-border bg-card" data-tour="supported-apps">
            <CardContent className="p-4 sm:p-6">
                <h3 className="text-sm font-semibold text-foreground">
                    Supported Health Apps
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                    Take a screenshot from any of these apps showing your daily
                    step count
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {supportedApps.map((app) => (
                        <div
                            key={app.name}
                            className="flex flex-col items-center gap-1 rounded-lg border border-border p-2 text-center"
                        >
                            <span className="text-xl" aria-hidden="true">
                                {app.icon}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {app.name}
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
