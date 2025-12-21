"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { ModuleFeedback } from "@/components/ui/ModuleFeedback";

interface League {
  id: string;
  name: string;
  role: string;
  member_count: number;
  user_rank: number;
  user_steps_this_week: number;
}

export default function DashboardPage() {
  const { user, session } = useAuth();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session || !user) return;

    const fetchLeagues = async () => {
      try {
        const response = await fetch("/api/leagues");
        if (!response.ok) {
          console.error("Error fetching leagues:", response.statusText);
          setLoading(false);
          return;
        }

        const data = await response.json();
        setLeagues(data.leagues || []);
      } catch (error) {
        console.error("Error fetching leagues:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeagues();
  }, [session, user]);

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <ModuleFeedback moduleId="dashboard-header" moduleName="Dashboard Actions">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-50">Your Leagues</h1>
            <div className="flex gap-3">
              <Link
                href="/settings/profile"
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-500"
              >
                ⚙️ Settings
              </Link>
              <Link
                href="/join"
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-500"
              >
                Join League
              </Link>
              <Link
                href="/league/create"
                className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-sky-400"
              >
                Create League
              </Link>
            </div>
          </div>
        </ModuleFeedback>

        {loading ? (
          <div className="mt-12 text-center text-slate-400">Loading...</div>
        ) : leagues.length === 0 ? (
          <div className="mt-12 rounded-xl border border-slate-800 bg-slate-900/50 p-12 text-center">
            <p className="text-lg text-slate-400">You haven&apos;t joined any leagues yet.</p>
            <p className="mt-2 text-sm text-slate-500">
              Create a new league or join one with an invite code.
            </p>
          </div>
        ) : (
          <ModuleFeedback moduleId="dashboard-leagues" moduleName="Your Leagues Grid">
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {leagues.map((league) => (
                <Link
                  key={league.id}
                  href={`/league/${league.id}`}
                  className="group rounded-xl border border-slate-800 bg-slate-900/50 p-6 transition hover:border-slate-700 hover:bg-slate-900"
                >
                  <h3 className="text-lg font-semibold text-slate-100 group-hover:text-sky-400">
                    {league.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 capitalize">{league.role}</p>

                  {/* Stats row */}
                  <div className="mt-4 flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1 text-slate-400">
                      <span>👥</span>
                      <span>{league.member_count} member{league.member_count !== 1 ? "s" : ""}</span>
                    </div>
                    {league.user_rank > 0 && (
                      <div className="flex items-center gap-1 text-emerald-400">
                        <span>🏆</span>
                        <span>#{league.user_rank} of {league.member_count}</span>
                      </div>
                    )}
                  </div>

                  {/* Weekly steps */}
                  {league.user_steps_this_week > 0 && (
                    <div className="mt-2 text-sm text-sky-400">
                      {league.user_steps_this_week.toLocaleString()} steps this week
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </ModuleFeedback>
        )}
      </div>
    </div>
  );
}

