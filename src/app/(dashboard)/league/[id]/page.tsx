"use client";

import { useEffect, useState } from "react";
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

export default function LeaguePage() {
  const params = useParams();
  const leagueId = params.id as string;
  const { session } = useAuth();

  const [league, setLeague] = useState<League | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!session) return;

    const fetchLeague = async () => {
      try {
        // Use API route to avoid RLS issues
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
  }, [session, leagueId]);

  const copyInviteCode = () => {
    if (league?.invite_code) {
      navigator.clipboard.writeText(league.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
            <SubmissionForm leagueId={leagueId} />
          </div>
        </section>
      </main>
    </div>
  );
}
