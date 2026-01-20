"use client";

import { useUserStats } from "@/hooks/useUserStats";
import { Spinner } from "@/components/ui/Spinner";

export function PersonalStatsCard() {
    const { stats, loading } = useUserStats();

    if (loading) {
        return (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 flex items-center justify-center min-h-[160px]">
                <Spinner size="md" />
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-center text-slate-400">
                Data unavailable
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {/* Best Day */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/80 p-4">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-400">Best Day</p>
                        <p className="mt-1 text-2xl font-bold text-white">
                            {stats.best_day_steps.toLocaleString()}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                            {stats.best_day_date ? new Date(stats.best_day_date).toLocaleDateString() : "-"}
                        </p>
                    </div>
                    <div className="rounded-lg bg-yellow-500/10 p-2 text-2xl">
                        🏆
                    </div>
                </div>
            </div>

            {/* Current Streak */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/80 p-4">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-400">Current Streak</p>
                        <p className="mt-1 text-2xl font-bold text-white">
                            {stats.current_streak}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">days</p>
                    </div>
                    <div className="rounded-lg bg-orange-500/10 p-2 text-2xl">
                        🔥
                    </div>
                </div>
            </div>

            {/* Longest Streak */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/80 p-4">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-400">Longest Streak</p>
                        <p className="mt-1 text-2xl font-bold text-white">
                            {stats.longest_streak}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">days</p>
                    </div>
                    <div className="rounded-lg bg-red-500/10 p-2 text-2xl">
                        ⚡
                    </div>
                </div>
            </div>

            {/* Lifetime Steps */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/80 p-4">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-400">Total Steps</p>
                        <p className="mt-1 text-2xl font-bold text-white">
                            {(stats.total_steps_lifetime / 1000000).toFixed(2)}M
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                            {stats.total_steps_lifetime.toLocaleString()} total
                        </p>
                    </div>
                    <div className="rounded-lg bg-sky-500/10 p-2 text-2xl">
                        👣
                    </div>
                </div>
            </div>
        </div>
    );
}

