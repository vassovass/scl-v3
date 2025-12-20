"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

type Period = "day" | "week" | "month";

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
        const datesParam = dates.join(",");

        const res = await fetch(
          `/api/leaderboard?league_id=${leagueId}&period=${period}&dates=${datesParam}`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

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

    fetchLeaderboard();
  }, [session, leagueId, period]);

  const getPeriodLabel = (p: Period) => {
    switch (p) {
      case "day": return "Today";
      case "week": return "This Week";
      case "month": return "This Month";
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
          <div className="flex gap-1">
            {(["day", "week", "month"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-3 text-sm font-medium transition border-b-2 -mb-px ${period === p
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

      {/* Main */}
      <div className="mx-auto max-w-3xl px-6 py-8">
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
        ) : entries.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-12 text-center">
            <p className="text-slate-400">No submissions {getPeriodLabel(period).toLowerCase()}.</p>
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

