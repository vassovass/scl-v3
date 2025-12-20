"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { DatePicker } from "@/components/ui/DatePicker";

type Period = "day" | "week" | "month" | "year" | "all" | "custom";
type VerifiedFilter = "all" | "verified" | "unverified";

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string | null;
  total_steps: number;
  verified_days?: number;
  unverified_days?: number;
}

interface LeaderboardMeta {
  total_members: number;
  team_total_steps: number;
}

export default function LeaderboardPage() {
  const params = useParams();
  const leagueId = params.id as string;
  const { session } = useAuth();

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [meta, setMeta] = useState<LeaderboardMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("day");
  const [verifiedFilter, setVerifiedFilter] = useState<VerifiedFilter>("all");

  // Custom date range
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  // Calculate date range based on period
  const getDateRange = (p: Period): string[] => {
    const today = new Date();
    const dates: string[] = [];

    if (p === "day") {
      dates.push(today.toISOString().split("T")[0]);
    } else if (p === "week") {
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        dates.push(date.toISOString().split("T")[0]);
      }
    } else if (p === "month") {
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        dates.push(date.toISOString().split("T")[0]);
      }
    } else if (p === "year") {
      for (let i = 0; i < 365; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        dates.push(date.toISOString().split("T")[0]);
      }
    } else if (p === "all") {
      return ["all"];
    } else if (p === "custom") {
      return ["custom"];
    }

    return dates;
  };

  useEffect(() => {
    if (!session) return;

    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);

      try {
        const dates = getDateRange(period);
        let url = `/api/leaderboard?league_id=${leagueId}&period=${period}&verified=${verifiedFilter}`;

        if (period === "custom" && customStartDate && customEndDate) {
          url += `&start_date=${customStartDate}&end_date=${customEndDate}`;
        } else if (period !== "custom") {
          url += `&dates=${dates.join(",")}`;
        }

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const errorMsg = data.error || data.message || `Failed to load leaderboard (${res.status})`;
          setError(errorMsg);
          setEntries([]);
          return;
        }

        const data = await res.json();
        setEntries(data.leaderboard || []);
        setMeta(data.meta || null);
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
        setError(err instanceof Error ? err.message : "Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    };

    // Don't fetch if custom period but dates not set
    if (period === "custom" && (!customStartDate || !customEndDate)) {
      setLoading(false);
      return;
    }

    fetchLeaderboard();
  }, [session, leagueId, period, verifiedFilter, customStartDate, customEndDate]);

  const getPeriodLabel = (p: Period) => {
    switch (p) {
      case "day": return "Today";
      case "week": return "Week";
      case "month": return "Month";
      case "year": return "Year";
      case "all": return "All Time";
      case "custom": return "Custom";
    }
  };

  const handlePeriodChange = (p: Period) => {
    setPeriod(p);
    if (p === "custom" && !customStartDate) {
      // Set default custom range to last 7 days
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      setCustomEndDate(today.toISOString().slice(0, 10));
      setCustomStartDate(weekAgo.toISOString().slice(0, 10));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Page Title */}
      <div className="border-b border-slate-800 bg-slate-900/30">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-50">Leaderboard</h1>
          <Link
            href={`/league/${leagueId}`}
            className="text-sm text-slate-400 hover:text-slate-300"
          >
            ← Back to League
          </Link>
        </div>
      </div>

      {/* Period Tabs */}
      <div className="border-b border-slate-800">
        <div className="mx-auto max-w-3xl px-6">
          <div className="flex gap-1 overflow-x-auto">
            {(["day", "week", "month", "year", "all", "custom"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                className={`px-4 py-3 text-sm font-medium transition border-b-2 -mb-px whitespace-nowrap ${period === p
                  ? "border-sky-500 text-sky-400"
                  : "border-transparent text-slate-400 hover:text-slate-300"
                  }`}
              >
                {getPeriodLabel(p)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Date Range */}
      {period === "custom" && (
        <div className="mx-auto max-w-3xl px-6 py-4 border-b border-slate-800">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[150px]">
              <DatePicker
                value={customStartDate}
                onChange={setCustomStartDate}
                label="From"
                max={customEndDate || new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <DatePicker
                value={customEndDate}
                onChange={setCustomEndDate}
                label="To"
                min={customStartDate}
                max={new Date().toISOString().slice(0, 10)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mx-auto max-w-3xl px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Show:</span>
          {(["all", "verified", "unverified"] as VerifiedFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setVerifiedFilter(f)}
              className={`px-3 py-1 text-xs rounded-full transition ${verifiedFilter === f
                ? "bg-sky-600/20 text-sky-400 border border-sky-600"
                : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600"
                }`}
            >
              {f === "all" ? "All" : f === "verified" ? "Verified Only" : "Unverified Only"}
            </button>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="mx-auto max-w-3xl px-6 py-4">
        {/* Stats Summary */}
        {meta && entries.length > 0 && (
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 text-center">
              <p className="text-2xl font-bold text-slate-100">
                {meta.team_total_steps.toLocaleString()}
              </p>
              <p className="text-xs text-slate-400 mt-1">Total Team Steps</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 text-center">
              <p className="text-2xl font-bold text-slate-100">
                {meta.total_members}
              </p>
              <p className="text-xs text-slate-400 mt-1">Active Members</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center text-slate-400 py-12">Loading...</div>
        ) : error ? (
          <div className="rounded-xl border border-rose-800 bg-rose-900/20 p-6 text-center">
            <p className="text-rose-400">{error}</p>
            <button
              onClick={() => setPeriod(period)}
              className="mt-4 text-sm text-slate-400 hover:text-slate-300"
            >
              Try again
            </button>
          </div>
        ) : period === "custom" && (!customStartDate || !customEndDate) ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-12 text-center">
            <p className="text-slate-400">Select a date range above to view the leaderboard.</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-12 text-center">
            <p className="text-slate-400">No submissions for this period.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-800">
            <table className="w-full">
              <thead className="bg-slate-900">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">
                    Rank
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">
                    Name
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-slate-400">
                    Steps
                  </th>
                  {period !== "day" && (
                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-400">
                      Verified
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {entries.map((entry) => (
                  <tr
                    key={entry.user_id}
                    className={`hover:bg-slate-900/50 ${entry.user_id === session?.user?.id ? "bg-sky-950/20" : ""
                      }`}
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${entry.rank === 1
                          ? "bg-yellow-500/20 text-yellow-400"
                          : entry.rank === 2
                            ? "bg-slate-400/20 text-slate-300"
                            : entry.rank === 3
                              ? "bg-amber-600/20 text-amber-500"
                              : "bg-slate-800 text-slate-400"
                          }`}
                      >
                        {entry.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-100">
                        {entry.display_name || "Anonymous"}
                      </span>
                      {entry.user_id === session?.user?.id && (
                        <span className="ml-2 text-xs text-sky-400">(You)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-100">
                      {entry.total_steps.toLocaleString()}
                    </td>
                    {period !== "day" && (
                      <td className="px-4 py-3 text-right">
                        <span className="text-emerald-400">
                          {entry.verified_days ?? 0}
                        </span>
                        <span className="text-slate-500">/</span>
                        <span className="text-slate-400">
                          {(entry.verified_days ?? 0) + (entry.unverified_days ?? 0)}
                        </span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
