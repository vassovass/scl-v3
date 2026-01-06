"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { ModuleFeedback } from "@/components/ui/ModuleFeedback";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { BADGE_INFO } from "@/lib/badges";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";

// Period options with custom support
type Period = "all_time" | "this_year" | "this_month" | "last_30_days" | "last_7_days" | "custom";
type CompareMode = "none" | "period" | "user";

interface GlobalLeaderboardEntry {
    rank: number;
    user_id: string;
    display_name: string | null;
    nickname: string | null;
    total_steps: number;
    current_streak: number;
    longest_streak: number;
    best_day_steps: number;
    best_day_date: string | null;
    badges: string[];
    compare_steps?: number | null;
    improvement_pct?: number | null;
}

interface LeaderboardMeta {
    total_users: number;
    period: string;
    date_range: { start: string; end: string } | null;
    compare_date_range: { start: string; end: string } | null;
    compare_mode: string;
    enabled: boolean;
    message?: string;
    limit: number;
    offset: number;
}

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
    { value: "all_time", label: "All Time" },
    { value: "this_year", label: "This Year" },
    { value: "this_month", label: "This Month" },
    { value: "last_30_days", label: "Last 30 Days" },
    { value: "last_7_days", label: "Last 7 Days" },
    { value: "custom", label: "Custom" },
];

const COMPARE_PERIOD_OPTIONS = [
    { value: "previous", label: "Previous Period" },
    { value: "last_year", label: "Same Period Last Year" },
    { value: "custom", label: "Custom Range" },
];

function formatNumber(num: number): string {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    }
    return num.toLocaleString();
}

function LeaderboardSkeleton() {
    return (
        <div className="min-h-screen bg-background">
            <div className="border-b border-border bg-card/30">
                <div className="mx-auto max-w-4xl px-6 py-6">
                    <div className="h-8 w-48 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-64 bg-muted rounded animate-pulse mt-2" />
                </div>
            </div>
            <div className="mx-auto max-w-4xl px-6 py-8">
                <div className="space-y-3">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
                    ))}
                </div>
            </div>
        </div>
    );
}

function WorldLeaderboardContent() {
    const { session, user } = useAuth();
    const [entries, setEntries] = useState<GlobalLeaderboardEntry[]>([]);
    const [meta, setMeta] = useState<LeaderboardMeta | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter state
    const [period, setPeriod] = useState<Period>("all_time");
    const [customRange, setCustomRange] = useState<DateRange | undefined>();
    const [compareMode, setCompareMode] = useState<CompareMode>("none");
    const [comparePeriod, setComparePeriod] = useState<string>("previous");
    const [compareCustomRange, setCompareCustomRange] = useState<DateRange | undefined>();

    const fetchLeaderboard = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            let url = `/api/leaderboard/global?period=${period}&limit=50`;

            // Add custom date range
            if (period === "custom" && customRange?.from && customRange?.to) {
                url += `&start_date=${format(customRange.from, "yyyy-MM-dd")}`;
                url += `&end_date=${format(customRange.to, "yyyy-MM-dd")}`;
            }

            // Add comparison params
            if (compareMode === "period" && comparePeriod) {
                url += `&compare=period&compare_period=${comparePeriod}`;
                if (comparePeriod === "custom" && compareCustomRange?.from && compareCustomRange?.to) {
                    url += `&compare_start_date=${format(compareCustomRange.from, "yyyy-MM-dd")}`;
                    url += `&compare_end_date=${format(compareCustomRange.to, "yyyy-MM-dd")}`;
                }
            }

            const res = await fetch(url);

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.error || data.message || `Failed (${res.status})`);
                return;
            }

            const data = await res.json();
            setEntries(data.leaderboard || []);
            setMeta(data.meta || null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load leaderboard");
        } finally {
            setLoading(false);
        }
    }, [period, customRange, compareMode, comparePeriod, compareCustomRange]);

    useEffect(() => {
        // Don't fetch if custom period without dates
        if (period === "custom" && (!customRange?.from || !customRange?.to)) {
            setLoading(false);
            return;
        }
        fetchLeaderboard();
    }, [fetchLeaderboard, period, customRange]);

    // Find current user's entry
    const currentUserEntry = user ? entries.find(e => e.user_id === user.id) : null;

    // Check if leaderboard is disabled
    if (meta && !meta.enabled) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">🌍</div>
                    <h1 className="text-2xl font-bold text-foreground mb-2">World Leaderboard</h1>
                    <p className="text-muted-foreground">{meta.message || "Coming soon!"}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-border bg-card/30">
                <div className="mx-auto max-w-4xl px-6 py-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                                🌍 World Leaderboard
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Platform-wide rankings across all leagues
                            </p>
                        </div>
                        <Link
                            href="/dashboard"
                            className="text-sm text-muted-foreground hover:text-foreground transition"
                        >
                            ← Back to Dashboard
                        </Link>
                    </div>
                </div>
            </div>

            {/* Period Selection */}
            <ModuleFeedback moduleId="world-leaderboard-filters" moduleName="Period Filter">
                <div className="border-b border-border bg-card/20">
                    <div className="mx-auto max-w-4xl px-6 py-4">
                        {/* Period Tabs */}
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm text-muted-foreground mr-2">Period:</span>
                            {PERIOD_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setPeriod(opt.value)}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${period === opt.value
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {/* Custom Date Range */}
                        {period === "custom" && (
                            <div className="mt-4">
                                <DateRangePicker
                                    date={customRange}
                                    onSelect={setCustomRange}
                                />
                            </div>
                        )}

                        {/* Comparison Toggle */}
                        <div className="mt-4 pt-4 border-t border-border">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="text-sm text-muted-foreground">Compare:</span>
                                <button
                                    onClick={() => setCompareMode(compareMode === "none" ? "period" : "none")}
                                    className={`px-3 py-1.5 text-sm rounded-lg transition ${compareMode !== "none"
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                                        }`}
                                >
                                    {compareMode !== "none" ? "✓ Comparing" : "Compare Periods"}
                                </button>

                                {compareMode === "period" && (
                                    <select
                                        value={comparePeriod}
                                        onChange={(e) => setComparePeriod(e.target.value)}
                                        className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
                                    >
                                        {COMPARE_PERIOD_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Comparison Custom Range */}
                            {compareMode === "period" && comparePeriod === "custom" && (
                                <div className="mt-4">
                                    <p className="text-xs text-muted-foreground mb-2">Compare to:</p>
                                    <DateRangePicker
                                        date={compareCustomRange}
                                        onSelect={setCompareCustomRange}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </ModuleFeedback>

            {/* Current User's Rank (if logged in and ranked) */}
            {currentUserEntry && !loading && (
                <div className="mx-auto max-w-4xl px-6 pt-6">
                    <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                                    #{currentUserEntry.rank}
                                </div>
                                <div>
                                    <p className="font-semibold text-foreground">Your World Rank</p>
                                    <p className="text-sm text-muted-foreground">
                                        {formatNumber(currentUserEntry.total_steps)} total steps
                                        {currentUserEntry.improvement_pct !== null && currentUserEntry.improvement_pct !== undefined && (
                                            <span className={`ml-2 ${currentUserEntry.improvement_pct >= 0 ? "text-green-500" : "text-red-500"}`}>
                                                {currentUserEntry.improvement_pct >= 0 ? "+" : ""}{currentUserEntry.improvement_pct}%
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {currentUserEntry.badges.map((badge) => (
                                    <span
                                        key={badge}
                                        className={BADGE_INFO[badge]?.color || ""}
                                        title={BADGE_INFO[badge]?.label}
                                    >
                                        {BADGE_INFO[badge]?.icon || "🏅"}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Summary */}
            {meta && !loading && (
                <div className="mx-auto max-w-4xl px-6 py-4">
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span>{meta.total_users.toLocaleString()} users ranked</span>
                        {meta.date_range && (
                            <span className="text-xs">
                                {meta.date_range.start} → {meta.date_range.end}
                            </span>
                        )}
                        {meta.compare_date_range && (
                            <span className="text-xs text-primary">
                                vs {meta.compare_date_range.start} → {meta.compare_date_range.end}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Main Table */}
            <div className="mx-auto max-w-4xl px-6 py-4">
                {loading ? (
                    <div className="text-center text-muted-foreground py-12">Loading...</div>
                ) : error ? (
                    <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-6 text-center">
                        <p className="text-destructive">{error}</p>
                        <button
                            onClick={fetchLeaderboard}
                            className="mt-4 text-sm text-muted-foreground hover:text-foreground"
                        >
                            Try again
                        </button>
                    </div>
                ) : entries.length === 0 ? (
                    <div className="rounded-xl border border-border bg-card/50 p-12 text-center">
                        <div className="text-4xl mb-4">🌍</div>
                        <p className="text-muted-foreground">No users found for this period.</p>
                        {period === "custom" && !customRange?.from && (
                            <p className="text-sm text-muted-foreground mt-2">Select a date range to see rankings.</p>
                        )}
                    </div>
                ) : (
                    <ModuleFeedback moduleId="world-leaderboard-table" moduleName="Leaderboard Table">
                        <div className="overflow-x-auto rounded-xl border border-border">
                            <table className="w-full text-sm">
                                <thead className="bg-card">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-muted-foreground font-medium">#</th>
                                        <th className="px-4 py-3 text-left text-muted-foreground font-medium">Name</th>
                                        <th className="px-4 py-3 text-right text-muted-foreground font-medium">Steps</th>
                                        {compareMode === "period" && (
                                            <>
                                                <th className="px-4 py-3 text-right text-muted-foreground font-medium">Previous</th>
                                                <th className="px-4 py-3 text-right text-muted-foreground font-medium">Δ%</th>
                                            </>
                                        )}
                                        <th className="px-4 py-3 text-center text-muted-foreground font-medium">🔥 Streak</th>
                                        <th className="px-4 py-3 text-center text-muted-foreground font-medium">Badges</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {entries.map((entry) => {
                                        const isCurrentUser = user && entry.user_id === user.id;
                                        return (
                                            <tr
                                                key={entry.user_id}
                                                className={`hover:bg-muted/30 transition ${isCurrentUser ? "bg-primary/5" : ""
                                                    }`}
                                            >
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${entry.rank === 1
                                                            ? "bg-yellow-500/20 text-yellow-400"
                                                            : entry.rank === 2
                                                                ? "bg-slate-400/20 text-slate-300"
                                                                : entry.rank === 3
                                                                    ? "bg-amber-600/20 text-amber-500"
                                                                    : "bg-muted text-muted-foreground"
                                                            }`}
                                                    >
                                                        {entry.rank}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-foreground font-medium">
                                                        {entry.display_name || "Anonymous"}
                                                    </span>
                                                    {isCurrentUser && (
                                                        <span className="ml-2 text-xs text-primary">(You)</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono text-foreground">
                                                    {entry.total_steps.toLocaleString()}
                                                </td>
                                                {compareMode === "period" && (
                                                    <>
                                                        <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                                                            {entry.compare_steps?.toLocaleString() ?? "—"}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            {entry.improvement_pct !== null && entry.improvement_pct !== undefined ? (
                                                                <span className={entry.improvement_pct >= 0 ? "text-green-500" : "text-red-500"}>
                                                                    {entry.improvement_pct >= 0 ? "+" : ""}{entry.improvement_pct}%
                                                                </span>
                                                            ) : "—"}
                                                        </td>
                                                    </>
                                                )}
                                                <td className="px-4 py-3 text-center">
                                                    {entry.current_streak > 0 && (
                                                        <span className="text-orange-400">
                                                            {entry.current_streak}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        {entry.badges.slice(0, 3).map((badge) => (
                                                            <span
                                                                key={badge}
                                                                className={BADGE_INFO[badge]?.color || ""}
                                                                title={BADGE_INFO[badge]?.label}
                                                            >
                                                                {BADGE_INFO[badge]?.icon || "🏅"}
                                                            </span>
                                                        ))}
                                                        {entry.badges.length > 3 && (
                                                            <span
                                                                className="text-xs text-muted-foreground"
                                                                title={entry.badges.slice(3).map(b => BADGE_INFO[b]?.label).join(", ")}
                                                            >
                                                                +{entry.badges.length - 3}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </ModuleFeedback>
                )}
            </div>
        </div>
    );
}

export default function WorldLeaderboardPage() {
    return (
        <Suspense fallback={<LeaderboardSkeleton />}>
            <WorldLeaderboardContent />
        </Suspense>
    );
}
