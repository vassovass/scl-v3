"use client";

import { Suspense } from "react";
import { AnalyticsNav } from "@/components/admin/analytics/AnalyticsNav";

/**
 * Admin Analytics Layout
 * 
 * Provides shared navigation and structure for all analytics modules.
 * Designed for extensibility per PRD 32 (Admin Analytics Dashboard).
 * 
 * Modules:
 * - /admin/analytics (Overview)
 * - /admin/analytics/tours (Tour analytics - PRD 50)
 * - /admin/analytics/engagement (Future: User engagement)
 * - /admin/analytics/leagues (Future: League performance)
 */
export default function AnalyticsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="container mx-auto py-6 px-4 space-y-6">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
                    <p className="text-muted-foreground text-sm">
                        Monitor platform performance, user engagement, and tour effectiveness
                    </p>
                </div>

                <Suspense fallback={null}>
                    <AnalyticsNav />
                </Suspense>
            </div>

            <div className="min-h-[400px]">
                {children}
            </div>
        </div>
    );
}
