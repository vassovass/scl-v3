"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { Spinner } from "@/components/ui/Spinner";
import { ModuleFeedback } from "@/components/ui/ModuleFeedback";
import { ShareModal, ShareDateRangePicker } from "@/components/sharing";
import { useShareModal } from "@/hooks/useShareModal";
import { CARD_TYPE_CONFIGS, type CardType } from "@/lib/sharing";
import {
    type PeriodPreset,
    getPresetLabel,
    getPreviousPeriod,
    formatCustomPeriodLabel,
} from "@/lib/utils/periods";

interface ShareHistoryItem {
    id: string;
    shortCode: string;
    cardType: string;
    metricType: string;
    value: number;
    createdAt: string;
    stats: {
        views: number;
        clicks: number;
    };
}

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
        days_in_range?: number;
        days_without_submissions?: number;
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
    "custom",
];

export default function MyStatsPage() {
    const { user } = useAuth();
    const [data, setData] = useState<StatsHubData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [period, setPeriod] = useState<PeriodPreset>("this_week");
    const [customDateRange, setCustomDateRange] = useState<{ start: string; end: string } | null>(null);
    const [selectedLeague, setSelectedLeague] = useState<string>("");
    const [compareEnabled, setCompareEnabled] = useState(true);

    // Share Modal
    const { isOpen: shareModalOpen, config: shareConfig, openShareModal, closeShareModal } = useShareModal();

    // Share History
    const [shareHistory, setShareHistory] = useState<ShareHistoryItem[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const fetchShareHistory = useCallback(async () => {
        if (!user) return;
        setHistoryLoading(true);
        try {
            const res = await fetch("/api/share/history?limit=5");
            if (res.ok) {
                const json = await res.json();
                setShareHistory(json.history || []);
            }
        } catch (err) {
            console.error("Error fetching share history:", err);
        } finally {
            setHistoryLoading(false);
        }
    }, [user]);

    const fetchStats = useCallback(async () => {
        if (!user) return;

        // For custom period, require date range to be set
        if (period === "custom" && !customDateRange) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({ period });

            // Add custom date range params if period is custom
            if (period === "custom" && customDateRange) {
                params.set("start_date", customDateRange.start);
                params.set("end_date", customDateRange.end);
            }

            // Add comparison period if enabled (not for custom periods)
            if (compareEnabled && period !== "custom") {
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
    }, [user, period, customDateRange, selectedLeague, compareEnabled]);

    useEffect(() => {
        fetchStats();
        fetchShareHistory();
    }, [fetchStats, fetchShareHistory]);

    if (!user) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="text-muted-foreground">Please sign in to view your stats.</p>
            </div>
        );
    }

    return (
        <div className="bg-background" data-tour="sharing">
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
                                    data-tour="period-selector"
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

                                {/* Compare Toggle (hidden for custom periods) */}
                                {period !== "custom" && (
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
                                )}
                            </div>
                        </div>

                        {/* Custom Date Range Picker */}
                        {period === "custom" && (
                            <div className="mt-3 pt-3 border-t border-border">
                                <ShareDateRangePicker
                                    value={customDateRange}
                                    onChange={(range) => setCustomDateRange(range)}
                                    showShortcuts={true}
                                    compact={false}
                                />
                            </div>
                        )}
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
                                        onShareClick={() => openShareModal({
                                            cardType: "daily",
                                            value: data.today_steps,
                                            metricType: "steps",
                                        })}
                                    />

                                    {/* Period Total */}
                                    <StatCard
                                        title={period === "custom" && customDateRange
                                            ? formatCustomPeriodLabel(customDateRange.start, customDateRange.end)
                                            : getPresetLabel(period)
                                        }
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
                                        gapWarning={
                                            data.period_stats.days_without_submissions &&
                                            data.period_stats.days_without_submissions > 0
                                                ? data.period_stats.days_without_submissions
                                                : undefined
                                        }
                                        onShareClick={() => openShareModal({
                                            cardType: period === "custom" ? "custom_period" : "weekly",
                                            value: data.period_stats.total_steps,
                                            metricType: "steps",
                                            periodLabel: period === "custom" && customDateRange
                                                ? formatCustomPeriodLabel(customDateRange.start, customDateRange.end)
                                                : getPresetLabel(period),
                                            periodStart: customDateRange?.start,
                                            periodEnd: customDateRange?.end,
                                        })}
                                    />

                                    {/* Current Streak */}
                                    <StatCard
                                        title="Streak"
                                        value={data.base_stats.current_streak}
                                        valueFormat="days"
                                        subtitle={`Best: ${data.base_stats.longest_streak} days`}
                                        emoji="🔥"
                                        accentColor="orange"
                                        onShareClick={() => openShareModal({
                                            cardType: "streak",
                                            value: data.base_stats.current_streak,
                                            metricType: "steps",
                                            streakDays: data.base_stats.current_streak,
                                        })}
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
                                        onShareClick={() => openShareModal({
                                            cardType: "personal_best",
                                            value: data.base_stats.best_day_steps,
                                            metricType: "steps",
                                        })}
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
                                            onShareClick={() => openShareModal({
                                                cardType: "rank",
                                                value: data.league_stats!.user_steps,
                                                metricType: "steps",
                                                rank: data.league_stats!.rank ?? undefined,
                                                leagueName: data.league_stats!.league_name,
                                            })}
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
                                    <button
                                        onClick={() => openShareModal({
                                            cardType: "challenge",
                                            value: data.period_stats.total_steps,
                                            metricType: "steps",
                                            periodLabel: getPresetLabel(period),
                                        })}
                                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
                                        data-tour="challenge-share-button"
                                    >
                                        🎯 Share Challenge
                                    </button>
                                </div>
                            </section>
                        </ModuleFeedback>

                        {/* Share History */}
                        {shareHistory.length > 0 && (
                            <ModuleFeedback moduleId="stats-hub-history" moduleName="Share History">
                                <section className="mt-8" data-tour="stats-history">
                                    <h2 className="text-sm font-medium text-muted-foreground mb-3">
                                        📤 Recently Shared
                                    </h2>
                                    <div className="space-y-2">
                                        {shareHistory.map((item) => {
                                            const cardConfig = CARD_TYPE_CONFIGS[item.cardType as CardType];
                                            return (
                                                <div
                                                    key={item.id}
                                                    className="flex items-center justify-between rounded-lg border border-border bg-card/50 p-3"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-lg">
                                                            {cardConfig?.emoji || "📊"}
                                                        </span>
                                                        <div>
                                                            <p className="text-sm font-medium text-foreground">
                                                                {cardConfig?.label || item.cardType}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {item.value.toLocaleString()} steps •{" "}
                                                                {new Date(item.createdAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                        <span title="Views">👁 {item.stats.views}</span>
                                                        <span title="Clicks">🔗 {item.stats.clicks}</span>
                                                        <button
                                                            onClick={() => openShareModal({
                                                                cardType: item.cardType as CardType,
                                                                value: item.value,
                                                                metricType: "steps",
                                                            })}
                                                            className="rounded px-2 py-1 text-primary hover:bg-primary/10 transition"
                                                        >
                                                            Share Again
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            </ModuleFeedback>
                        )}
                    </>
                ) : null}
            </main>

            {/* Share Modal */}
            <ShareModal
                isOpen={shareModalOpen}
                onClose={closeShareModal}
                defaultCardType={shareConfig?.cardType}
                defaultValue={shareConfig?.value ?? 0}
                metricType={shareConfig?.metricType}
                rank={shareConfig?.rank}
                leagueName={shareConfig?.leagueName}
                streakDays={shareConfig?.streakDays}
                periodLabel={shareConfig?.periodLabel}
                periodStart={shareConfig?.periodStart}
                periodEnd={shareConfig?.periodEnd}
            />
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
    /** Number of days in range that have no submissions */
    gapWarning?: number;
    shareMessage?: string;
    shareUrl?: string;
    onShareClick?: () => void;
}

function StatCard({
    title,
    value,
    valueFormat = "number",
    subtitle,
    emoji,
    accentColor,
    comparison,
    gapWarning,
    shareMessage,
    shareUrl,
    onShareClick,
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
                    {gapWarning && gapWarning > 0 && (
                        <p className="mt-1 text-xs text-warning">
                            ⚠️ {gapWarning} day{gapWarning > 1 ? "s" : ""} without submissions
                        </p>
                    )}
                </div>
                <div className={`rounded-lg p-2 text-xl ${colorMap[accentColor]}`}>
                    {emoji}
                </div>
            </div>

            {/* Share Button (appears on hover) */}
            {onShareClick && (
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={onShareClick}
                        className="rounded-lg bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90 transition"
                    >
                        📤
                    </button>
                </div>
            )}
        </div>
    );
}
