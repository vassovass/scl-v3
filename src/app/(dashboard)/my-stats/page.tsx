"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { Spinner } from "@/components/ui/Spinner";
import { ShareButton } from "@/components/ui/ShareButton";
import { ModuleFeedback } from "@/components/ui/ModuleFeedback";
import {
    type PeriodPreset,
    getPresetLabel,
    getPreviousPeriod,
} from "@/lib/utils/periods";
import {
    generateShareMessage,
    type CardType,
} from "@/lib/sharing";

interface StatsHubData {
    user: {
        id: string;
        display_name: string;
    };
    base_stats: {
        best_day_steps: number;
        best_day_date: string | null;
        current_streak: number;
        longest_streak: number;
        total_steps_lifetime: number;
    };
    today_steps: number;
    period_stats: {
        period: PeriodPreset;
        total_steps: number;
        days_submitted: number;
        average_per_day: number;
    };
    comparison_stats: {
        period: PeriodPreset;
        total_steps: number;
        days_submitted: number;
        average_per_day: number;
    } | null;
    improvement_pct: number | null;
    league_stats: {
        league_id: string;
        league_name: string;
        rank: number | null;
        total_members: number;
        user_steps: number;
    } | null;
    leagues: Array<{ id: string; name: string }>;
}

const PERIOD_OPTIONS: PeriodPreset[] = [
    "today",
    "this_week",
    "last_week",
    "this_month",
    "last_month",
    "last_7_days",
    "last_30_days",
    "this_year",
    "all_time",
];

export default function MyStatsPage() {
    const { user } = useAuth();
    const [data, setData] = useState<StatsHubData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [period, setPeriod] = useState<PeriodPreset>("this_week");
    const [selectedLeague, setSelectedLeague] = useState<string>("");
    const [compareEnabled, setCompareEnabled] = useState(true);

    const fetchStats = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({ period });

            // Add comparison period if enabled
            if (compareEnabled) {
                const compPeriod = getPreviousPeriod(period);
                if (compPeriod) {
                    params.set("comparison_period", compPeriod);
                }
            }

            // Add league filter if selected
            if (selectedLeague) {
                params.set("league_id", selectedLeague);
            }

            const res = await fetch(`/api/stats/hub?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch stats");

            const json = await res.json();
            setData(json);
        } catch (err) {
            console.error("Error fetching stats:", err);
            setError("Failed to load stats. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [user, period, selectedLeague, compareEnabled]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // Generate share URL for a specific stat card
    const getShareUrl = (cardType: CardType, value: number): string => {
        const params = new URLSearchParams({
            card_type: cardType,
            metric_type: "steps",
            value: value.toString(),
            name: data?.user.display_name || "Player",
        });

        // Add rank for rank card
        if (cardType === "rank" && data?.league_stats?.rank) {
            params.set("rank", data.league_stats.rank.toString());
        }

        // Add streak for streak card
        if (cardType === "streak") {
            params.set("streak", value.toString());
        }

        return `${typeof window !== "undefined" ? window.location.origin : ""}/share/stats?${params.toString()}`;
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="text-muted-foreground">Please sign in to view your stats.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background" data-tour="sharing">
            {/* Header */}
            <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-20">
                <ModuleFeedback moduleId="stats-hub-header" moduleName="Stats Hub Header">
                    <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 sm:py-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            {/* Title */}
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/dashboard"
                                    className="text-sm text-primary hover:text-primary/80"
                                >
                                    ←
                                </Link>
                                <h1 className="text-lg font-bold text-foreground sm:text-xl">
                                    📊 My Stats
                                </h1>
                            </div>

                            {/* Filters */}
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                {/* Period Selector */}
                                <select
                                    value={period}
                                    onChange={(e) => setPeriod(e.target.value as PeriodPreset)}
                                    className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
                                >
                                    {PERIOD_OPTIONS.map((p) => (
                                        <option key={p} value={p}>
                                            {getPresetLabel(p)}
                                        </option>
                                    ))}
                                </select>

                                {/* League Selector */}
                                {data?.leagues && data.leagues.length > 0 && (
                                    <select
                                        value={selectedLeague}
                                        onChange={(e) => setSelectedLeague(e.target.value)}
                                        className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
                                    >
                                        <option value="">All Leagues</option>
                                        {data.leagues.map((league) => (
                                            <option key={league.id} value={league.id}>
                                                {league.name}
                                            </option>
                                        ))}
                                    </select>
                                )}

                                {/* Compare Toggle */}
                                <button
                                    onClick={() => setCompareEnabled(!compareEnabled)}
                                    className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                                        compareEnabled
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-border text-muted-foreground"
                                    }`}
                                >
                                    📈 Compare
                                </button>
                            </div>
                        </div>
                    </div>
                </ModuleFeedback>
            </header>

            {/* Main Content */}
            <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Spinner size="lg" />
                    </div>
                ) : error ? (
                    <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-6 text-center">
                        <p className="text-destructive">{error}</p>
                        <button
                            onClick={fetchStats}
                            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
                        >
                            Retry
                        </button>
                    </div>
                ) : data ? (
                    <>
                        {/* Quick Stats Grid */}
                        <ModuleFeedback moduleId="stats-hub-quick" moduleName="Quick Stats">
                            <section className="mb-8" data-tour="stats-quick">
                                <h2 className="text-sm font-medium text-muted-foreground mb-3">
                                    ⚡ Quick Stats
                                </h2>
                                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                                    {/* Today's Steps */}
                                    <StatCard
                                        title="Today"
                                        value={data.today_steps}
                                        emoji="📅"
                                        accentColor="sky"
                                        shareMessage={generateShareMessage("daily", {
                                            value: data.today_steps,
                                            metricType: "steps",
                                        }).text}
                                        shareUrl={getShareUrl("daily", data.today_steps)}
                                    />

                                    {/* Period Total */}
                                    <StatCard
                                        title={getPresetLabel(period)}
                                        value={data.period_stats.total_steps}
                                        subtitle={`${data.period_stats.days_submitted} days`}
                                        emoji="📊"
                                        accentColor="emerald"
                                        comparison={
                                            data.comparison_stats && data.improvement_pct !== null
                                                ? {
                                                      pct: data.improvement_pct,
                                                      label: `vs ${getPresetLabel(data.comparison_stats.period)}`,
                                                  }
                                                : undefined
                                        }
                                        shareMessage={generateShareMessage("weekly", {
                                            value: data.period_stats.total_steps,
                                            metricType: "steps",
                                            average: data.period_stats.average_per_day,
                                        }).text}
                                        shareUrl={getShareUrl("weekly", data.period_stats.total_steps)}
                                    />

                                    {/* Current Streak */}
                                    <StatCard
                                        title="Streak"
                                        value={data.base_stats.current_streak}
                                        valueFormat="days"
                                        subtitle={`Best: ${data.base_stats.longest_streak} days`}
                                        emoji="🔥"
                                        accentColor="orange"
                                        shareMessage={generateShareMessage("streak", {
                                            value: data.base_stats.current_streak,
                                            metricType: "steps",
                                            streakDays: data.base_stats.current_streak,
                                        }).text}
                                        shareUrl={getShareUrl("streak", data.base_stats.current_streak)}
                                    />

                                    {/* Personal Best */}
                                    <StatCard
                                        title="Personal Best"
                                        value={data.base_stats.best_day_steps}
                                        subtitle={
                                            data.base_stats.best_day_date
                                                ? new Date(data.base_stats.best_day_date).toLocaleDateString(
                                                      "en-US",
                                                      { month: "short", day: "numeric" }
                                                  )
                                                : undefined
                                        }
                                        emoji="🏆"
                                        accentColor="yellow"
                                        shareMessage={generateShareMessage("personal_best", {
                                            value: data.base_stats.best_day_steps,
                                            metricType: "steps",
                                        }).text}
                                        shareUrl={getShareUrl("personal_best", data.base_stats.best_day_steps)}
                                    />
                                </div>
                            </section>
                        </ModuleFeedback>

                        {/* League Stats (if league selected) */}
                        {data.league_stats && (
                            <ModuleFeedback moduleId="stats-hub-league" moduleName="League Stats">
                                <section className="mb-8" data-tour="stats-league">
                                    <h2 className="text-sm font-medium text-muted-foreground mb-3">
                                        🏅 League: {data.league_stats.league_name}
                                    </h2>
                                    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
                                        {/* Rank */}
                                        <StatCard
                                            title="Your Rank"
                                            value={data.league_stats.rank || 0}
                                            valueFormat="rank"
                                            subtitle={`of ${data.league_stats.total_members} members`}
                                            emoji={
                                                data.league_stats.rank === 1
                                                    ? "🥇"
                                                    : data.league_stats.rank === 2
                                                    ? "🥈"
                                                    : data.league_stats.rank === 3
                                                    ? "🥉"
                                                    : "🏅"
                                            }
                                            accentColor="purple"
                                            shareMessage={generateShareMessage("rank", {
                                                value: data.league_stats.user_steps,
                                                metricType: "steps",
                                                rank: data.league_stats.rank ?? undefined,
                                                leagueName: data.league_stats.league_name,
                                            }).text}
                                            shareUrl={getShareUrl("rank", data.league_stats.user_steps)}
                                        />

                                        {/* League Steps */}
                                        <StatCard
                                            title="League Steps"
                                            value={data.league_stats.user_steps}
                                            subtitle={getPresetLabel(period)}
                                            emoji="👣"
                                            accentColor="sky"
                                        />

                                        {/* Avg Per Day */}
                                        <StatCard
                                            title="Daily Avg"
                                            value={data.period_stats.average_per_day}
                                            subtitle="steps/day"
                                            emoji="📈"
                                            accentColor="teal"
                                        />
                                    </div>
                                </section>
                            </ModuleFeedback>
                        )}

                        {/* Lifetime Stats */}
                        <ModuleFeedback moduleId="stats-hub-lifetime" moduleName="Lifetime Stats">
                            <section className="mb-8" data-tour="stats-lifetime">
                                <h2 className="text-sm font-medium text-muted-foreground mb-3">
                                    ♾️ Lifetime
                                </h2>
                                <div className="rounded-xl border border-border bg-card/50 p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Total Steps</p>
                                            <p className="text-3xl font-bold text-foreground">
                                                {(data.base_stats.total_steps_lifetime / 1_000_000).toFixed(2)}M
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {data.base_stats.total_steps_lifetime.toLocaleString()} steps
                                            </p>
                                        </div>
                                        <div className="text-5xl">👣</div>
                                    </div>
                                </div>
                            </section>
                        </ModuleFeedback>

                        {/* Challenge CTA */}
                        <ModuleFeedback moduleId="stats-hub-challenge" moduleName="Challenge CTA">
                            <section data-tour="stats-challenge">
                                <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 text-center">
                                    <p className="text-lg font-semibold text-foreground mb-2">
                                        💪 Challenge Your Friends
                                    </p>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Share your stats and see who can beat you this week!
                                    </p>
                                    <ShareButton
                                        message={generateShareMessage("challenge", {
                                            value: data.period_stats.total_steps,
                                            metricType: "steps",
                                        }).text}
                                        url={getShareUrl("challenge", data.period_stats.total_steps)}
                                        contentType="stats_hub_challenge"
                                        className="px-6 py-2"
                                    >
                                        🎯 Share Challenge
                                    </ShareButton>
                                </div>
                            </section>
                        </ModuleFeedback>
                    </>
                ) : null}
            </main>
        </div>
    );
}

// ============================================================================
// Stat Card Component
// ============================================================================

interface StatCardProps {
    title: string;
    value: number;
    valueFormat?: "number" | "days" | "rank";
    subtitle?: string;
    emoji: string;
    accentColor: "sky" | "emerald" | "orange" | "yellow" | "purple" | "teal";
    comparison?: {
        pct: number;
        label: string;
    };
    shareMessage?: string;
    shareUrl?: string;
}

function StatCard({
    title,
    value,
    valueFormat = "number",
    subtitle,
    emoji,
    accentColor,
    comparison,
    shareMessage,
    shareUrl,
}: StatCardProps) {
    const colorMap = {
        sky: "bg-sky-500/10 text-sky-400",
        emerald: "bg-emerald-500/10 text-emerald-400",
        orange: "bg-orange-500/10 text-orange-400",
        yellow: "bg-yellow-500/10 text-yellow-400",
        purple: "bg-purple-500/10 text-purple-400",
        teal: "bg-teal-500/10 text-teal-400",
    };

    const formatValue = () => {
        switch (valueFormat) {
            case "days":
                return value.toString();
            case "rank":
                return `#${value}`;
            default:
                return value.toLocaleString();
        }
    };

    return (
        <div className="relative rounded-xl border border-border bg-card/50 p-4 transition hover:border-border/80 hover:bg-card group">
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground truncate">
                        {title}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-foreground">
                        {formatValue()}
                    </p>
                    {subtitle && (
                        <p className="mt-0.5 text-xs text-muted-foreground truncate">
                            {subtitle}
                        </p>
                    )}
                    {comparison && (
                        <p
                            className={`mt-1 text-xs font-medium ${
                                comparison.pct >= 0 ? "text-emerald-400" : "text-red-400"
                            }`}
                        >
                            {comparison.pct >= 0 ? "↑" : "↓"} {Math.abs(comparison.pct)}%{" "}
                            <span className="text-muted-foreground font-normal">
                                {comparison.label}
                            </span>
                        </p>
                    )}
                </div>
                <div className={`rounded-lg p-2 text-xl ${colorMap[accentColor]}`}>
                    {emoji}
                </div>
            </div>

            {/* Share Button (appears on hover) */}
            {shareMessage && shareUrl && (
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ShareButton
                        message={shareMessage}
                        url={shareUrl}
                        contentType="stat_card"
                        className="!px-2 !py-1 text-xs"
                    >
                        📤
                    </ShareButton>
                </div>
            )}
        </div>
    );
}
