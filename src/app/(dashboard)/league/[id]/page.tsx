"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { SubmissionForm } from "@/components/forms/SubmissionForm";

interface League {
  id: string;
  name: string;
  invite_code: string;
  stepweek_start: string;
  role?: string;
}

interface Submission {
  id: string;
  for_date: string;
  steps: number;
  verified: boolean | null;
  partial: boolean;
  created_at: string;
}

export default function LeaguePage() {
  const params = useParams();
  const leagueId = params.id as string;
  const { session } = useAuth();

  const [league, setLeague] = useState<League | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Get dates for current week (last 7 days)
  const getWeekDates = () => {
    const dates: string[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dates.push(date.toISOString().split("T")[0]);
    }
    return dates;
  };

  const fetchSubmissions = useCallback(async () => {
    if (!session) return;

    try {
      const weekDates = getWeekDates();
      const from = weekDates[weekDates.length - 1];
      const to = weekDates[0];

      const res = await fetch(
        `/api/submissions?league_id=${leagueId}&user_id=${session.user.id}&from=${from}&to=${to}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || []);
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
    }
  }, [session, leagueId]);

  useEffect(() => {
    if (!session) return;

    const fetchLeague = async () => {
      try {
        const response = await fetch(`/api/leagues/${leagueId}`);
        if (!response.ok) {
          console.error("Error fetching league:", response.statusText);
          setLoading(false);
          return;
        }

        const data = await response.json();
        setLeague(data.league);
      } catch (error) {
        console.error("Error fetching league:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeague();
    fetchSubmissions();
  }, [session, leagueId, fetchSubmissions]);

  const handleSubmissionComplete = () => {
    fetchSubmissions();
  };

  const copyInviteCode = () => {
    if (league?.invite_code) {
      navigator.clipboard.writeText(league.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getVerificationBadge = (verified: boolean | null) => {
    if (verified === true) {
      return <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">✓ Verified</span>;
    }
    if (verified === false) {
      return <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-xs text-rose-400">✗ Failed</span>;
    }
    return <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">⏳ Pending</span>;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateOnly = new Date(dateStr + "T00:00:00");
    if (dateOnly.getTime() === today.getTime()) return "Today";
    if (dateOnly.getTime() === yesterday.getTime()) return "Yesterday";

    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        Loading...
      </div>
    );
  }

  if (!league) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-50">League not found</h1>
          <Link href="/dashboard" className="mt-4 text-sky-400 hover:text-sky-300">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Page Title */}
      <div className="border-b border-slate-800 bg-slate-900/30">
        <div className="mx-auto max-w-5xl px-6 py-4">
          <h1 className="text-xl font-bold text-slate-50">{league.name}</h1>
        </div>
      </div>

      {/* Main */}
      <main className="mx-auto max-w-5xl px-6 py-12">
        {/* Actions */}
        <div className="flex flex-wrap gap-4">
          <Link
            href={`/league/${leagueId}/leaderboard`}
            className="rounded-lg bg-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
          >
            View Leaderboard
          </Link>
          <button
            onClick={copyInviteCode}
            className="rounded-lg border border-slate-700 px-6 py-3 text-sm font-medium text-slate-300 transition hover:border-slate-500"
          >
            {copied ? "Copied!" : `Invite Code: ${league.invite_code}`}
          </button>
        </div>

        {/* Submit Steps Section */}
        <section className="mt-12">
          <h2 className="text-xl font-semibold text-slate-100">Submit Today&apos;s Steps</h2>
          <p className="mt-2 text-sm text-slate-400">
            Upload a screenshot from your fitness app to verify your step count.
          </p>

          <div className="mt-6">
            <SubmissionForm leagueId={leagueId} onSubmitted={handleSubmissionComplete} />
          </div>
        </section>

        {/* Your Recent Submissions */}
        <section className="mt-12">
          <h2 className="text-xl font-semibold text-slate-100">Your Recent Submissions</h2>
          <p className="mt-2 text-sm text-slate-400">
            Your step submissions from the past 7 days.
          </p>

          <div className="mt-6">
            {submissions.length === 0 ? (
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6 text-center">
                <p className="text-slate-400">No submissions this week yet.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-slate-800">
                <table className="w-full">
                  <thead className="bg-slate-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Date</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-slate-400">Steps</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-slate-400">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {submissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-900/50">
                        <td className="px-4 py-3 text-slate-100">
                          {formatDate(sub.for_date)}
                          {sub.partial && (
                            <span className="ml-2 text-xs text-slate-500">(partial)</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-100">
                          {sub.steps.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {getVerificationBadge(sub.verified)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

