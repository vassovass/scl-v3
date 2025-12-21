"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { CalendarHeatmap } from "@/components/analytics/CalendarHeatmap";
import { DailyBreakdownTable } from "@/components/analytics/DailyBreakdownTable";
import { ShareButton, generateShareMessage } from "@/components/ui/ShareButton";
import { ModuleFeedback } from "@/components/ui/ModuleFeedback";

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

    return (
        <div className="min-h-screen bg-slate-950">
            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-20">
                <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 sm:py-4">
                    {/* Mobile: Stack vertically, Desktop: Single row */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        {/* Title row */}
                        <div className="flex items-center gap-3">
                            <Link
                                href={`/league/${leagueId}`}
                                className="text-sm text-sky-400 hover:text-sky-300"
                            >
                                ←
                            </Link>
                            <h1 className="text-lg font-bold text-slate-100 sm:text-xl">Analytics</h1>
                        </div>

                        {/* Controls row - always visible */}
                        <div className="flex items-center justify-between gap-2 sm:gap-3">
                            {/* View Mode Toggle */}
                            <div className="flex rounded-lg border border-slate-700 p-0.5">
                                {(["both", "calendar", "table"] as const).map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => setViewMode(mode)}
                                        className={`px-2 py-1 text-xs rounded transition sm:px-3 ${viewMode === mode
                                            ? "bg-sky-600 text-white"
                                            : "text-slate-400 hover:text-slate-200"
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
                            >
                                📤 Share
                            </ShareButton>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="mx-auto max-w-6xl px-6 py-6">
                {/* Calendar View */}
                {(viewMode === "both" || viewMode === "calendar") && (
                    <ModuleFeedback moduleId="analytics-calendar" moduleName="Calendar Heatmap">
                        <section className="mb-6">
                            <h2 className="text-sm font-medium text-slate-400 mb-3">📅 Submission Calendar</h2>
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
                        <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-slate-100">
                                    {new Date(selectedDay.date + "T00:00:00").toLocaleDateString("en-US", {
                                        weekday: "long",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </h3>
                                <button
                                    onClick={() => setSelectedDay(null)}
                                    className="text-slate-400 hover:text-slate-200"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="rounded-lg bg-slate-800 p-3">
                                    <div className="text-2xl font-bold text-sky-400">
                                        {selectedDay.submitted_count}
                                    </div>
                                    <div className="text-xs text-slate-500">Submitted</div>
                                </div>
                                <div className="rounded-lg bg-slate-800 p-3">
                                    <div className="text-2xl font-bold text-slate-300">
                                        {selectedDay.total_members}
                                    </div>
                                    <div className="text-xs text-slate-500">Members</div>
                                </div>
                                <div className="rounded-lg bg-slate-800 p-3">
                                    <div className="text-2xl font-bold text-emerald-400">
                                        {selectedDay.total_steps.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-slate-500">Total Steps</div>
                                </div>
                            </div>

                            <div className="mt-4 text-center">
                                <div className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2">
                                    <span className="text-sm text-slate-400">Coverage:</span>
                                    <span className={`text-sm font-semibold ${selectedDay.submitted_count === selectedDay.total_members
                                        ? "text-emerald-400"
                                        : selectedDay.submitted_count >= selectedDay.total_members * 0.5
                                            ? "text-sky-400"
                                            : "text-amber-400"
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
                        <section>
                            <h2 className="text-sm font-medium text-slate-400 mb-3">📋 Daily Breakdown</h2>
                            <DailyBreakdownTable leagueId={leagueId} />
                        </section>
                    </ModuleFeedback>
                )}
            </main>
        </div>
    );
}
