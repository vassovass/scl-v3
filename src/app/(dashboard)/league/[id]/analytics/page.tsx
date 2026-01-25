"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { CalendarHeatmap } from "@/components/analytics/CalendarHeatmap";
import { DailyBreakdownTable } from "@/components/analytics/DailyBreakdownTable";
import { ShareButton, generateShareMessage } from "@/components/ui/ShareButton";

import { ModuleFeedback } from "@/components/ui/ModuleFeedback";
import { PersonalStatsCard } from "@/components/analytics/PersonalStatsCard";

type ViewMode = "both" | "calendar" | "table";

export default function LeagueAnalyticsPage() {
    const params = useParams();
    const leagueId = params.id as string;
    const { user } = useAuth();
    const [viewMode, setViewMode] = useState<ViewMode>("both");
    const [selectedDay, setSelectedDay] = useState<{
        date: string;
        submitted_count: number;
        total_members: number;
        total_steps: number;
    } | null>(null);

    // Tour view mode switch handler - allows tour to control view mode
    useEffect(() => {
        const handleTourViewModeSwitch = (e: CustomEvent) => {
            const { mode, restoreMode } = e.detail;
            console.log(`[Analytics] Tour requested view mode switch to: ${mode}`,
                restoreMode ? `(will restore: ${restoreMode})` : '');
            setViewMode(mode as ViewMode);
        };

        window.addEventListener('tour:switch-view-mode', handleTourViewModeSwitch as EventListener);

        return () => {
            window.removeEventListener('tour:switch-view-mode', handleTourViewModeSwitch as EventListener);
        };
    }, []);

    return (
        <div className="min-h-screen bg-background" data-view-mode={viewMode}>
            {/* Header */}
            <header
                className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-20"
                data-tour="analytics-header"
            >
                <ModuleFeedback moduleId="analytics-header" moduleName="Page Filters">
                    <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 sm:py-4">
                        {/* Mobile: Stack vertically, Desktop: Single row */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            {/* Title row */}
                            <div className="flex items-center gap-3">
                                <Link
                                    href={`/league/${leagueId}`}
                                    className="text-sm text-primary hover:text-primary/80"
                                >
                                    ←
                                </Link>
                                <h1 className="text-lg font-bold text-foreground sm:text-xl">Analytics</h1>
                            </div>

                            {/* Controls row - always visible */}
                            <div className="flex items-center justify-between gap-2 sm:gap-3">
                                {/* View Mode Toggle */}
                                <div className="flex rounded-lg border border-border p-0.5">
                                    {(["both", "calendar", "table"] as const).map((mode) => (
                                        <button
                                            key={mode}
                                            onClick={() => setViewMode(mode)}
                                            className={`px-2 py-1 text-xs rounded transition sm:px-3 ${viewMode === mode
                                                ? "bg-primary text-primary-foreground"
                                                : "text-muted-foreground hover:text-foreground"
                                                }`}
                                        >
                                            {mode === "both" ? "📅📋" : mode === "calendar" ? "📅" : "📋"}
                                        </button>
                                    ))}
                                </div>

                                {/* Share Button - Prominent on mobile */}
                                <ShareButton
                                    message={generateShareMessage("total_steps", { steps: 100000, period: "month" })}
                                    className="px-3 py-1.5 text-xs sm:px-4 sm:py-2"
                                    contentType="analytics_page"
                                    itemId={leagueId}
                                >
                                    📤 Share
                                </ShareButton>
                            </div>
                        </div>
                    </div>
                </ModuleFeedback>
            </header>

            {/* Main Content */}
            <main className="mx-auto max-w-6xl px-6 py-6">

                {/* Personal Stats */}
                <ModuleFeedback moduleId="personal-stats" moduleName="Personal Records">
                    <section className="mb-8" data-tour="analytics-personal-stats">
                        <h2 className="text-sm font-medium text-muted-foreground mb-3">🏆 Your Records</h2>
                        <PersonalStatsCard />
                    </section>
                </ModuleFeedback>
                {/* Calendar View */}
                {(viewMode === "both" || viewMode === "calendar") && (
                    <ModuleFeedback moduleId="analytics-calendar" moduleName="Calendar Heatmap">
                        <section className="mb-6" data-tour="analytics-heatmap">
                            <h2 className="text-sm font-medium text-muted-foreground mb-3">📅 Submission Calendar</h2>
                            <CalendarHeatmap
                                leagueId={leagueId}
                                onDayClick={(day) => setSelectedDay(day)}
                            />
                        </section>
                    </ModuleFeedback>
                )}

                {/* Day Detail Modal */}
                {selectedDay && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-foreground">
                                    {new Date(selectedDay.date + "T00:00:00").toLocaleDateString("en-US", {
                                        weekday: "long",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </h3>
                                <button
                                    onClick={() => setSelectedDay(null)}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="rounded-lg bg-secondary p-3">
                                    <div className="text-2xl font-bold text-primary">
                                        {selectedDay.submitted_count}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Submitted</div>
                                </div>
                                <div className="rounded-lg bg-secondary p-3">
                                    <div className="text-2xl font-bold text-foreground">
                                        {selectedDay.total_members}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Members</div>
                                </div>
                                <div className="rounded-lg bg-secondary p-3">
                                    <div className="text-2xl font-bold text-[hsl(var(--success))]">
                                        {selectedDay.total_steps.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Total Steps</div>
                                </div>
                            </div>

                            <div className="mt-4 text-center">
                                <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2">
                                    <span className="text-sm text-muted-foreground">Coverage:</span>
                                    <span className={`text-sm font-semibold ${selectedDay.submitted_count === selectedDay.total_members
                                        ? "text-[hsl(var(--success))]"
                                        : selectedDay.submitted_count >= selectedDay.total_members * 0.5
                                            ? "text-[hsl(var(--info))]"
                                            : "text-[hsl(var(--warning))]"
                                        }`}>
                                        {Math.round((selectedDay.submitted_count / selectedDay.total_members) * 100)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Daily Breakdown Table */}
                {(viewMode === "both" || viewMode === "table") && (
                    <ModuleFeedback moduleId="analytics-breakdown" moduleName="Daily Breakdown Table">
                        <section data-tour="analytics-breakdown">
                            <h2 className="text-sm font-medium text-muted-foreground mb-3">📋 Daily Breakdown</h2>
                            <DailyBreakdownTable leagueId={leagueId} />
                        </section>
                    </ModuleFeedback>
                )}
            </main>
        </div>
    );
}
