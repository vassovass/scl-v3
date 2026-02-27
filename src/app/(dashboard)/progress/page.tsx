"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useUserStats } from "@/hooks/useUserStats";
import { ProgressToggle } from "@/components/progress/ProgressToggle";
import { PersonalProgressView } from "@/components/progress/PersonalProgressView";
import { LeagueProgressView } from "@/components/progress/LeagueProgressView";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { trackEvent } from "@/lib/analytics";
import { useEffect } from "react";

type ProgressView = "personal" | "league";

/**
 * Inner component that reads searchParams (must be wrapped in Suspense).
 * Per AGENTS.md: useSearchParams requires Suspense boundary.
 */
function ProgressPageContent() {
    const searchParams = useSearchParams();
    const initialView = (searchParams.get("view") as ProgressView) || "personal";
    const [view, setView] = useState<ProgressView>(initialView);
    const { stats, loading } = useUserStats();

    useEffect(() => {
        trackEvent("progress_page_viewed", {
            category: "progress",
            action: "view",
            view,
        });
    }, [view]);

    return (
        <div className="bg-background">
            <PageViewTracker pageName="progress" pageType="dashboard" />

            {/* Header */}
            <div className="border-b border-border bg-card/30">
                <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold text-foreground">My Progress</h1>
                        <Link
                            href="/dashboard"
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            ← Dashboard
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main */}
            <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
                {/* Toggle */}
                <div className="mb-6">
                    <ProgressToggle value={view} onChange={setView} />
                </div>

                {/* View */}
                {view === "personal" ? (
                    <PersonalProgressView stats={stats} isLoading={loading} />
                ) : (
                    <LeagueProgressView />
                )}
            </main>
        </div>
    );
}

/**
 * Unified Progress Page — combines personal stats with league comparisons.
 * PRD 29: Replaces "Analytics" in the menu.
 */
export default function ProgressPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
            }
        >
            <ProgressPageContent />
        </Suspense>
    );
}
