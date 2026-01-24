"use client";

import { KPICard } from "@/components/admin/analytics";
import { BarChart3, Users, Trophy, TrendingUp } from "lucide-react";
import Link from "next/link";

/**
 * Analytics Overview Page
 * 
 * Main hub for admin analytics per PRD 32.
 * Displays high-level KPIs and links to detailed modules.
 * 
 * Future: Will include data from all analytics modules.
 */
export default function AnalyticsOverviewPage() {
    // TODO: Fetch from /api/admin/analytics when PRD 32 is fully implemented
    // For now, show placeholder KPIs with links to available modules

    return (
        <div className="space-y-8">
            {/* KPI Summary - Placeholder for PRD 32 */}
            <section>
                <h2 className="text-lg font-semibold mb-4">Platform Overview</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KPICard
                        label="Total Users"
                        value="—"
                        icon={<Users className="h-4 w-4" />}
                        loading={false}
                    />
                    <KPICard
                        label="Active Rate"
                        value="—"
                        icon={<TrendingUp className="h-4 w-4" />}
                        loading={false}
                    />
                    <KPICard
                        label="Avg Steps"
                        value="—"
                        icon={<BarChart3 className="h-4 w-4" />}
                        loading={false}
                    />
                    <KPICard
                        label="Active Leagues"
                        value="—"
                        icon={<Trophy className="h-4 w-4" />}
                        loading={false}
                    />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    Platform-wide metrics coming in PRD 32
                </p>
            </section>

            {/* Quick Links to Modules */}
            <section>
                <h2 className="text-lg font-semibold mb-4">Analytics Modules</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Link
                        href="/admin/analytics/tours"
                        className="block p-4 bg-card border rounded-lg hover:border-primary transition-colors"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <BarChart3 className="h-5 w-5 text-primary" />
                            </div>
                            <h3 className="font-medium">Tour Analytics</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Onboarding tour completion rates, step drop-off, and user feedback
                        </p>
                    </Link>

                    {/* Future modules - greyed out */}
                    <div className="p-4 bg-muted/30 border border-dashed rounded-lg opacity-60">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-muted rounded-lg">
                                <Users className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <h3 className="font-medium text-muted-foreground">
                                Engagement
                            </h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            User activity and retention metrics (Coming soon)
                        </p>
                    </div>

                    <div className="p-4 bg-muted/30 border border-dashed rounded-lg opacity-60">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-muted rounded-lg">
                                <Trophy className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <h3 className="font-medium text-muted-foreground">
                                Leagues
                            </h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            League performance and participation (Coming soon)
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
