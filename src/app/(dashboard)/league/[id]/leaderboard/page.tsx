"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { DateRange } from "react-day-picker";
import { ModuleFeedback } from "@/components/ui/ModuleFeedback";
import { useUserStats } from "@/hooks/useUserStats";
import { useFilterPersistence } from "@/hooks/useFilterPersistence";
import { APP_CONFIG } from "@/lib/config";
import { BADGE_INFO } from "@/lib/badges";
import { format } from "date-fns";
import { ShareAchievementButton, AchievementData } from "@/components/ui/AchievementShareCard";
import { IDENTITY_LABEL, IDENTITY_FALLBACK } from "@/lib/identity";
import { HighFiveButton } from "@/components/encouragement/HighFiveButton";
import { CheerPrompt } from "@/components/encouragement/CheerPrompt";

// ... (Types remain same) ...

// ... (Inside component) ...



type PeriodPreset =
  | "today" | "yesterday"
  | "this_week" | "last_week"
  | "this_month" | "last_month"
  | "last_7_days" | "last_30_days"
  | "all_time" | "custom";

type SortBy = "steps" | "improvement" | "average" | "streak";
type VerifiedFilter = "all" | "verified" | "unverified";

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string | null;
  total_steps: number;
  days_submitted: number;
  total_days_in_period: number | null;
  average_per_day: number;
  verified_days: number;
  unverified_days: number;
  streak: number;
  period_b_steps: number | null;
  period_b_days: number | null;
  improvement_pct: number | null;
  common_days_steps_a: number | null;
  common_days_steps_b: number | null;
  badges: string[];
  high_five_count?: number; // Optional until API is fully updated
  user_has_high_fived?: boolean;
}

interface LeaderboardMeta {
  total_members: number;
  team_total_steps: number;
  total_days_in_period: number | null;
  period_a: { start: string; end: string } | null;
  period_b: { start: string; end: string } | null;
}

const PERIOD_OPTIONS: { value: PeriodPreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "this_week", label: "This Week" },
  { value: "last_week", label: "Last Week" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "last_7_days", label: "Last 7 Days" },
  { value: "last_30_days", label: "Last 30 Days" },
  { value: "all_time", label: "All Time" },
  { value: "custom", label: "Custom" },
];

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Loading skeleton component
function LeaderboardSkeleton() {
  return (
    <div className="bg-background">
      <div className="border-b border-border bg-card/30">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <div className="h-7 w-32 bg-muted rounded animate-pulse" />
          <div className="h-5 w-24 bg-muted rounded animate-pulse" />
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Filter defaults
const FILTER_DEFAULTS = {
  period: "this_week" as PeriodPreset,
  sort_by: "steps" as SortBy,
  verified: "all" as VerifiedFilter,
  period_b: "",
  compare: "",
  start_date: "",
  end_date: "",
  start_date_b: "",
  end_date_b: "",
};

// Main leaderboard content - uses useSearchParams so needs Suspense
function LeaderboardContent() {
  const params = useParams();
  const leagueId = params.id as string;
  const { session } = useAuth();

  // Debug: Track render count
  const renderCountRef = React.useRef(0);
  renderCountRef.current++;
  console.log(`[LEADERBOARD] Render #${renderCountRef.current}`, { leagueId, hasSession: !!session });

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [meta, setMeta] = useState<LeaderboardMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use persistent filters
  const { filters, setFilter, setFilters, isHydrated } = useFilterPersistence({
    storageKey: 'leaderboard',
    contextId: leagueId,
    defaults: FILTER_DEFAULTS,
    urlParamKeys: ['period', 'sort_by', 'verified', 'period_b', 'compare'],
  });

  console.log(`[LEADERBOARD] Filters state:`, { isHydrated, filters });

  const period = filters.period as PeriodPreset;
  const sortBy = filters.sort_by as SortBy;
  const verifiedFilter = filters.verified as VerifiedFilter;
  const periodB = filters.period_b as PeriodPreset | "";
  const comparisonMode = filters.compare === "true";
  const customStartA = filters.start_date;
  const customEndA = filters.end_date;
  const customStartB = filters.start_date_b;
  const customEndB = filters.end_date_b;

  const { stats: userStats } = useUserStats();

  const fetchLeaderboard = useCallback(async () => {
    if (!session || !isHydrated) return;

    // Log for debugging
    console.log("Fetching leaderboard with params:", {
      leagueId, period, periodB, verifiedFilter, sortBy, comparisonMode,
      customStartA, customEndA, customStartB, customEndB
    });

    setLoading(true);
    setError(null);
    try {
      let url = `/api/leaderboard?league_id=${leagueId}&period=${period}&verified=${verifiedFilter}&sort_by=${sortBy}`;

      if (period === "custom" && customStartA && customEndA) {
        url += `&start_date=${customStartA}&end_date=${customEndA}`;
      }
      // ...


      if (comparisonMode && periodB) {
        url += `&period_b=${periodB}`;
        if (periodB === "custom" && customStartB && customEndB) {
          url += `&start_date_b=${customStartB}&end_date_b=${customEndB}`;
        }
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || data.message || `Failed (${res.status})`);
        return;
      }

      const data = await res.json();
      setEntries(data.leaderboard || []);
      setMeta(data.meta || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [session, isHydrated, leagueId, period, periodB, verifiedFilter, sortBy, comparisonMode, customStartA, customEndA, customStartB, customEndB]);

  useEffect(() => {
    if (!isHydrated) return;
    if (period === "custom" && (!customStartA || !customEndA)) {
      setLoading(false);
      return;
    }
    fetchLeaderboard();
  }, [fetchLeaderboard, isHydrated, period, customStartA, customEndA]);

  const toggleComparison = () => {
    const newCompare = !comparisonMode;
    const updates: Partial<typeof FILTER_DEFAULTS> = { compare: newCompare ? "true" : "" };

    if (newCompare && !periodB) {
      // Auto-select comparison period
      if (period === "this_week") updates.period_b = "last_week";
      else if (period === "this_month") updates.period_b = "last_month";
      else updates.period_b = "last_week";
    }

    setFilters(updates);
  };

  const handlePeriodChange = (newPeriod: PeriodPreset) => {
    const updates: Partial<typeof FILTER_DEFAULTS> & { period: PeriodPreset } = { period: newPeriod };

    // If switching to custom and no dates set, default to today
    if (newPeriod === "custom" && !customStartA && !customEndA) {
      const today = new Date().toISOString().slice(0, 10);
      updates.start_date = today;
      updates.end_date = today;
    }

    setFilters(updates);
  };

  const handleSortChange = (newSort: SortBy) => {
    setFilter('sort_by', newSort);
  };

  const handleVerifiedChange = (newVerified: VerifiedFilter) => {
    setFilter('verified', newVerified);
  };

  const handlePeriodBChange = (newPeriodB: PeriodPreset) => {
    setFilter('period_b', newPeriodB);
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    const start = range?.from ? format(range.from, "yyyy-MM-dd") : "";
    const end = range?.to ? format(range.to, "yyyy-MM-dd") : "";
    // cast to any or undefined to fix lint if needed, but defaulting to "" is cleaner if acceptable
    // Use undefined instead of null to match implicit optional type if that's the issue
    setFilters({ start_date: start || undefined, end_date: end || undefined });
  };

  const handleDateRangeBChange = (range: DateRange | undefined) => {
    const start = range?.from ? format(range.from, "yyyy-MM-dd") : "";
    const end = range?.to ? format(range.to, "yyyy-MM-dd") : "";
    setFilters({ start_date_b: start || undefined, end_date_b: end || undefined });
  };



  // Show skeleton until hydrated
  if (!isHydrated) {
    return <LeaderboardSkeleton />;
  }

  return (
    <div className="bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/30" data-tour="leaderboard-header">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Leaderboard</h1>
          <Link href={`/league/${leagueId}`} className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to League
          </Link>
        </div>
      </div>

      {/* Period Selection */}
      <ModuleFeedback moduleId="leaderboard-period" moduleName="Period Selector" className="w-full">
        <div className="border-b border-border bg-card/20" data-tour="leaderboard-period">
          <div className="mx-auto max-w-3xl px-6 py-4">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm text-muted-foreground">Period:</label>
              <select
                value={period}
                onChange={(e) => handlePeriodChange(e.target.value as PeriodPreset)}
                className="rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground"
                style={{ colorScheme: "dark" }}
              >
                {PERIOD_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              <button
                onClick={toggleComparison}
                className={`ml-auto px-3 py-1.5 text-sm rounded-md transition ${comparisonMode
                  ? "bg-sky-600 text-white"
                  : "bg-secondary text-foreground border border-input hover:bg-secondary/80"
                  }`}
              >
                {comparisonMode ? "✓ Compare" : "Compare Periods"}
              </button>
            </div>

            {/* Custom Date Range A */}
            {period === "custom" && (
              <div className="mt-4 animate-fade-in">
                <DateRangePicker
                  date={{
                    from: customStartA ? new Date(customStartA + "T12:00:00") : undefined,
                    to: customEndA ? new Date(customEndA + "T12:00:00") : undefined
                  }}
                  onSelect={handleDateRangeChange}
                />
              </div>
            )}

            {/* Comparison Period B */}
            {comparisonMode && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="text-sm text-muted-foreground">Compare to:</label>
                  <select
                    value={periodB}
                    onChange={(e) => handlePeriodBChange(e.target.value as PeriodPreset)}
                    className="rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground"
                    style={{ colorScheme: "dark" }}
                  >
                    {PERIOD_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                {periodB === "custom" && (
                  <div className="mt-4 animate-fade-in">
                    <DateRangePicker
                      date={{
                        from: customStartB ? new Date(customStartB + "T12:00:00") : undefined,
                        to: customEndB ? new Date(customEndB + "T12:00:00") : undefined
                      }}
                      onSelect={handleDateRangeBChange}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </ModuleFeedback>

      {/* Cheer Prompt (Proactive) */}
      <div className="mx-auto max-w-3xl px-6 pt-4">
        {userStats && userStats.current_streak >= 3 && (
          <CheerPrompt
            recipientName="Your Team"
            recipientId="team" // Placeholder
            reason="is crushing it this week!"
            className="mb-2"
          />
        )}
      </div>

      {/* Filters Row */}
      <ModuleFeedback moduleId="leaderboard-filters" moduleName="Leaderboard Filters">
        <div className="mx-auto max-w-3xl px-6 py-4 flex flex-wrap items-center gap-4" data-tour="leaderboard-filters">
          {/* Sort By */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-foreground0">Sort:</span>
            {(["steps", "improvement", "average", "streak"] as SortBy[]).map(s => (
              <button
                key={s}
                onClick={() => handleSortChange(s)}
                className={`px-2 py-1 text-xs rounded-md transition ${sortBy === s
                  ? "bg-sky-600/20 text-primary border border-sky-600"
                  : "bg-secondary text-muted-foreground border border-input"
                  }`}
              >
                {s === "steps" ? "Steps" : s === "improvement" ? "Improvement %" : s === "average" ? "Daily Avg" : "Streak"}
              </button>
            ))}
          </div>

          {/* Verified Filter */}
          <div className="flex items-center gap-2 ml-auto" data-tour="verified-filter">
            <span className="text-xs text-foreground0">Show:</span>
            {(["all", "verified", "unverified"] as VerifiedFilter[]).map(f => (
              <button
                key={f}
                onClick={() => handleVerifiedChange(f)}
                className={`px-2 py-1 text-xs rounded-md transition ${verifiedFilter === f
                  ? "bg-[hsl(var(--success)/0.2)] text-[hsl(var(--success))] border border-[hsl(var(--success))]"
                  : "bg-secondary text-muted-foreground border border-input"
                  }`}
              >
                {f === "all" ? "All" : f === "verified" ? "Verified" : "Unverified"}
              </button>
            ))}
          </div>
        </div>
      </ModuleFeedback>

      {/* Stats Summary */}
      {meta && entries.length > 0 && (
        <ModuleFeedback moduleId="leaderboard-stats" moduleName="Stats Summary">
          <div className="mx-auto max-w-3xl px-6 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg border border-border bg-card/50 p-3 text-center">
                <p className="text-xl font-bold text-foreground">{meta.team_total_steps.toLocaleString()}</p>
                <p className="text-xs text-foreground0">Team Total</p>
              </div>
              <div className="rounded-lg border border-border bg-card/50 p-3 text-center">
                <p className="text-xl font-bold text-foreground">{meta.total_members}</p>
                <p className="text-xs text-foreground0">Members</p>
              </div>
              {meta.period_a && (
                <div className="rounded-lg border border-border bg-card/50 p-3 text-center col-span-2">
                  <p className="text-sm text-foreground">{meta.period_a.start} → {meta.period_a.end}</p>
                  <p className="text-xs text-foreground0">Period</p>
                </div>
              )}
            </div>
          </div>
        </ModuleFeedback>
      )}

      {/* Main Table */}
      <div className="mx-auto max-w-3xl px-6 py-4">
        {loading ? (
          <div className="text-center text-muted-foreground py-12">Loading...</div>
        ) : error ? (
          <div className="rounded-xl border border-rose-800 bg-rose-900/20 p-6 text-center">
            <p className="text-rose-400">{error}</p>
            <button onClick={fetchLeaderboard} className="mt-4 text-sm text-muted-foreground hover:text-foreground">Try again</button>
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-xl border border-border bg-card/50 p-12 text-center">
            <p className="text-muted-foreground">No submissions for this period.</p>
          </div>
        ) : (
          <ModuleFeedback moduleId="leaderboard-table" moduleName="Leaderboard Table">
            <div className="overflow-x-auto rounded-xl border border-border" data-tour="leaderboard-table">
              <table className="w-full text-sm">
                <thead className="bg-card">
                  <tr>
                    <th className="px-3 py-3 text-left text-muted-foreground font-medium">#</th>
                    <th className="px-3 py-3 text-left text-muted-foreground font-medium">{IDENTITY_LABEL}</th>
                    <th className="px-3 py-3 text-right text-muted-foreground font-medium">Steps</th>
                    <th className="px-3 py-3 text-center text-muted-foreground font-medium">Days</th>
                    {comparisonMode && (
                      <>
                        <th className="px-3 py-3 text-right text-muted-foreground font-medium">Prev</th>
                        <th className="px-3 py-3 text-right text-muted-foreground font-medium">Δ%</th>
                      </>
                    )}
                    <th className="px-3 py-3 text-right text-muted-foreground font-medium">Avg/Day</th>
                    <th className="px-3 py-3 text-center text-muted-foreground font-medium">🔥</th>
                    <th className="px-3 py-3 text-center text-muted-foreground font-medium">Support</th>
                    <th className="px-3 py-3 text-center text-muted-foreground font-medium">Badges</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {entries.map((entry) => (
                    <tr
                      key={entry.user_id}
                      className={`hover:bg-card/50 ${entry.user_id === session?.user?.id ? "bg-primary/10" : ""}`}
                      data-tour={entry.user_id === session?.user?.id ? "leaderboard-current-user" : undefined}
                    >
                      <td className="px-3 py-3">
                        <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${entry.rank === 1 ? "bg-[hsl(var(--warning)/0.2)] text-[hsl(var(--warning))]" :
                          entry.rank === 2 ? "bg-muted/50 text-foreground" :
                            entry.rank === 3 ? "bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))]" :
                              "bg-secondary text-muted-foreground"
                          }`}>
                          {entry.rank}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-foreground">{entry.display_name || IDENTITY_FALLBACK}</span>
                        {entry.user_id === session?.user?.id && <span className="ml-1 text-xs text-primary">(You)</span>}
                        {entry.user_id === session?.user?.id && (
                          <ShareAchievementButton
                            achievement={{
                              type: (period === "today" && userStats && entry.total_steps >= userStats.best_day_steps && entry.total_steps > 0)
                                ? "personal_best"
                                : (entry.rank === 1 ? "leader" : "rank"),
                              value: entry.total_steps,
                              label: "steps",
                              rank: entry.rank,
                              totalMembers: meta?.total_members,
                              userName: entry.display_name || "I",
                              leagueName: APP_CONFIG.name,
                              period: period,
                              periodLabel: PERIOD_OPTIONS.find(p => p.value === period)?.label,
                              improvementPct: entry.improvement_pct ?? undefined,
                              comparisonPeriod: periodB ? PERIOD_OPTIONS.find(p => p.value === periodB)?.label?.toLowerCase() : undefined,
                              dateRange: period === "custom" ? `${formatDate(customStartA)} - ${formatDate(customEndA)}` : undefined,
                              comparisonDateRange: periodB === "custom" ? `${formatDate(customStartB)} - ${formatDate(customEndB)}` : undefined,
                            } as AchievementData}
                            className="ml-2 text-xs"
                            data-tour="share-button"
                          >
                            🎉 Share
                          </ShareAchievementButton>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-foreground">
                        {entry.total_steps.toLocaleString()}
                      </td>
                      <td className="px-3 py-3 text-center text-sm">
                        <span className="text-primary">{entry.days_submitted}</span>
                        {entry.total_days_in_period && (
                          <>
                            <span className="text-muted-foreground">/</span>
                            <span className="text-muted-foreground">{entry.total_days_in_period}</span>
                          </>
                        )}
                      </td>
                      {comparisonMode && (
                        <>
                          <td className="px-3 py-3 text-right font-mono text-muted-foreground">
                            {entry.period_b_steps?.toLocaleString() ?? "—"}
                          </td>
                          <td className="px-3 py-3 text-right">
                            {entry.improvement_pct !== null ? (
                              <span className={entry.improvement_pct >= 0 ? "text-[hsl(var(--success))]" : "text-foreground0"}>
                                {entry.improvement_pct >= 0 ? "+" : ""}{entry.improvement_pct}%
                              </span>
                            ) : "—"}
                          </td>
                        </>
                      )}
                      <td className="px-3 py-3 text-right text-muted-foreground">
                        {entry.average_per_day.toLocaleString()}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {entry.streak > 0 && <span className="text-orange-400">{entry.streak}</span>}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {entry.user_id !== session?.user?.id && (
                          <div className="flex justify-center" data-tour="high-five-button">
                            <HighFiveButton
                              recipientId={entry.user_id}
                              initialCount={entry.high_five_count || 0}
                              initialHasHighFived={entry.user_has_high_fived || false}
                              size="sm"
                            />
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {(entry.badges || []).map(badge => (
                          <span key={badge} className={`mr-1 ${BADGE_INFO[badge]?.color || ""}`} title={BADGE_INFO[badge]?.label}>
                            {BADGE_INFO[badge]?.icon || "🏅"}
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ModuleFeedback>
        )}
      </div>
    </div>
  );
}

// Wrapper component with Suspense boundary (required for useSearchParams)
export default function LeaderboardPage() {
  return (
    <Suspense fallback={<LeaderboardSkeleton />}>
      <LeaderboardContent />
    </Suspense>
  );
}
