"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { DatePicker } from "@/components/ui/DatePicker";
import { ModuleFeedback } from "@/components/ui/ModuleFeedback";
import { ShareAchievementButton, AchievementData } from "@/components/ui/AchievementShareCard";
import { useUserStats } from "@/hooks/useUserStats";
import { APP_CONFIG } from "@/lib/config";
import { BADGE_INFO } from "@/lib/badges";

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
  nickname: string | null;
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

export default function LeaderboardPage() {
  const params = useParams();
  const leagueId = params.id as string;
  const { session } = useAuth();

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [meta, setMeta] = useState<LeaderboardMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [period, setPeriod] = useState<PeriodPreset>("this_week");
  const [periodB, setPeriodB] = useState<PeriodPreset | null>(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [verifiedFilter, setVerifiedFilter] = useState<VerifiedFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("steps");

  // Custom dates
  const [customStartA, setCustomStartA] = useState("");
  const [customEndA, setCustomEndA] = useState("");
  const [customStartB, setCustomStartB] = useState("");
  const [customEndB, setCustomEndB] = useState("");
  const { stats: userStats } = useUserStats();

  const fetchLeaderboard = useCallback(async () => {
    if (!session) return;

    setLoading(true);
    setError(null);

    try {
      let url = `/api/leaderboard?league_id=${leagueId}&period=${period}&verified=${verifiedFilter}&sort_by=${sortBy}`;

      if (period === "custom" && customStartA && customEndA) {
        url += `&start_date=${customStartA}&end_date=${customEndA}`;
      }

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
  }, [session, leagueId, period, periodB, verifiedFilter, sortBy, comparisonMode, customStartA, customEndA, customStartB, customEndB]);

  useEffect(() => {
    if (period === "custom" && (!customStartA || !customEndA)) {
      setLoading(false);
      return;
    }
    fetchLeaderboard();
  }, [fetchLeaderboard, period, customStartA, customEndA]);

  const toggleComparison = () => {
    setComparisonMode(!comparisonMode);
    if (!comparisonMode && !periodB) {
      // Auto-select comparison period
      if (period === "this_week") setPeriodB("last_week");
      else if (period === "this_month") setPeriodB("last_month");
      else setPeriodB("last_week");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/30">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-50">Leaderboard</h1>
          <Link href={`/league/${leagueId}`} className="text-sm text-slate-400 hover:text-slate-300">
            ← Back to League
          </Link>
        </div>
      </div>

      {/* Period Selection */}
      <ModuleFeedback moduleId="leaderboard-period" moduleName="Period Selector" className="w-full">
        <div className="border-b border-slate-800 bg-slate-900/20">
          <div className="mx-auto max-w-3xl px-6 py-4">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm text-slate-400">Period:</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as PeriodPreset)}
                className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-100"
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
                  : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
                  }`}
              >
                {comparisonMode ? "✓ Compare" : "Compare Periods"}
              </button>
            </div>

            {/* Custom Date Range A */}
            {period === "custom" && (
              <div className="mt-4 flex flex-wrap gap-4">
                <DatePicker value={customStartA} onChange={setCustomStartA} label="From" max={customEndA || undefined} />
                <DatePicker value={customEndA} onChange={setCustomEndA} label="To" min={customStartA} />
              </div>
            )}

            {/* Comparison Period B */}
            {comparisonMode && (
              <div className="mt-4 pt-4 border-t border-slate-800">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="text-sm text-slate-400">Compare to:</label>
                  <select
                    value={periodB || ""}
                    onChange={(e) => setPeriodB(e.target.value as PeriodPreset)}
                    className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-100"
                    style={{ colorScheme: "dark" }}
                  >
                    {PERIOD_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                {periodB === "custom" && (
                  <div className="mt-4 flex flex-wrap gap-4">
                    <DatePicker value={customStartB} onChange={setCustomStartB} label="From" max={customEndB || undefined} />
                    <DatePicker value={customEndB} onChange={setCustomEndB} label="To" min={customStartB} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </ModuleFeedback>

      {/* Filters Row */}
      <ModuleFeedback moduleId="leaderboard-filters" moduleName="Leaderboard Filters">
        <div className="mx-auto max-w-3xl px-6 py-4 flex flex-wrap items-center gap-4" data-tour="leaderboard-filters">
          {/* Sort By */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Sort:</span>
            {(["steps", "improvement", "average", "streak"] as SortBy[]).map(s => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`px-2 py-1 text-xs rounded-md transition ${sortBy === s
                  ? "bg-sky-600/20 text-sky-400 border border-sky-600"
                  : "bg-slate-800 text-slate-400 border border-slate-700"
                  }`}
              >
                {s === "steps" ? "Steps" : s === "improvement" ? "Improvement %" : s === "average" ? "Daily Avg" : "Streak"}
              </button>
            ))}
          </div>

          {/* Verified Filter */}
          <div className="flex items-center gap-2 ml-auto" data-tour="verified-filter">
            <span className="text-xs text-slate-500">Show:</span>
            {(["all", "verified", "unverified"] as VerifiedFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setVerifiedFilter(f)}
                className={`px-2 py-1 text-xs rounded-md transition ${verifiedFilter === f
                  ? "bg-emerald-600/20 text-emerald-400 border border-emerald-600"
                  : "bg-slate-800 text-slate-400 border border-slate-700"
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
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 text-center">
                <p className="text-xl font-bold text-slate-100">{meta.team_total_steps.toLocaleString()}</p>
                <p className="text-xs text-slate-500">Team Total</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 text-center">
                <p className="text-xl font-bold text-slate-100">{meta.total_members}</p>
                <p className="text-xs text-slate-500">Members</p>
              </div>
              {meta.period_a && (
                <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 text-center col-span-2">
                  <p className="text-sm text-slate-300">{meta.period_a.start} → {meta.period_a.end}</p>
                  <p className="text-xs text-slate-500">Period</p>
                </div>
              )}
            </div>
          </div>
        </ModuleFeedback>
      )}

      {/* Main Table */}
      <div className="mx-auto max-w-3xl px-6 py-4">
        {loading ? (
          <div className="text-center text-slate-400 py-12">Loading...</div>
        ) : error ? (
          <div className="rounded-xl border border-rose-800 bg-rose-900/20 p-6 text-center">
            <p className="text-rose-400">{error}</p>
            <button onClick={fetchLeaderboard} className="mt-4 text-sm text-slate-400 hover:text-slate-300">Try again</button>
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-12 text-center">
            <p className="text-slate-400">No submissions for this period.</p>
          </div>
        ) : (
          <ModuleFeedback moduleId="leaderboard-table" moduleName="Leaderboard Table">
            <div className="overflow-x-auto rounded-xl border border-slate-800" data-tour="leaderboard-table">
              <table className="w-full text-sm">
                <thead className="bg-slate-900">
                  <tr>
                    <th className="px-3 py-3 text-left text-slate-400 font-medium">#</th>
                    <th className="px-3 py-3 text-left text-slate-400 font-medium">Name</th>
                    <th className="px-3 py-3 text-right text-slate-400 font-medium">Steps</th>
                    <th className="px-3 py-3 text-center text-slate-400 font-medium">Days</th>
                    {comparisonMode && (
                      <>
                        <th className="px-3 py-3 text-right text-slate-400 font-medium">Prev</th>
                        <th className="px-3 py-3 text-right text-slate-400 font-medium">Δ%</th>
                      </>
                    )}
                    <th className="px-3 py-3 text-right text-slate-400 font-medium">Avg/Day</th>
                    <th className="px-3 py-3 text-center text-slate-400 font-medium">🔥</th>
                    <th className="px-3 py-3 text-center text-slate-400 font-medium">Badges</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {entries.map((entry) => (
                    <tr
                      key={entry.user_id}
                      className={`hover:bg-slate-900/50 ${entry.user_id === session?.user?.id ? "bg-sky-950/20" : ""}`}
                    >
                      <td className="px-3 py-3">
                        <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${entry.rank === 1 ? "bg-yellow-500/20 text-yellow-400" :
                          entry.rank === 2 ? "bg-slate-400/20 text-slate-300" :
                            entry.rank === 3 ? "bg-amber-600/20 text-amber-500" :
                              "bg-slate-800 text-slate-400"
                          }`}>
                          {entry.rank}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-slate-100">{entry.display_name || "Anonymous"}</span>
                        {entry.user_id === session?.user?.id && <span className="ml-1 text-xs text-sky-400">(You)</span>}
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
                      <td className="px-3 py-3 text-right font-mono text-slate-100">
                        {entry.total_steps.toLocaleString()}
                      </td>
                      <td className="px-3 py-3 text-center text-sm">
                        <span className="text-sky-400">{entry.days_submitted}</span>
                        {entry.total_days_in_period && (
                          <>
                            <span className="text-slate-600">/</span>
                            <span className="text-slate-400">{entry.total_days_in_period}</span>
                          </>
                        )}
                      </td>
                      {comparisonMode && (
                        <>
                          <td className="px-3 py-3 text-right font-mono text-slate-400">
                            {entry.period_b_steps?.toLocaleString() ?? "—"}
                          </td>
                          <td className="px-3 py-3 text-right">
                            {entry.improvement_pct !== null ? (
                              <span className={entry.improvement_pct >= 0 ? "text-emerald-400" : "text-slate-500"}>
                                {entry.improvement_pct >= 0 ? "+" : ""}{entry.improvement_pct}%
                              </span>
                            ) : "—"}
                          </td>
                        </>
                      )}
                      <td className="px-3 py-3 text-right text-slate-400">
                        {entry.average_per_day.toLocaleString()}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {entry.streak > 0 && <span className="text-orange-400">{entry.streak}</span>}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {entry.badges.map(badge => (
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
