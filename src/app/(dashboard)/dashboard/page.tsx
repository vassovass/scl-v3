"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";

interface League {
  id: string;
  name: string;
  role: string;
}

export default function DashboardPage() {
  const { user, session } = useAuth();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session || !user) return;

    const fetchLeagues = async () => {
      try {
        // Use API route to avoid RLS infinite recursion issues
        const response = await fetch("/api/leagues");
        if (!response.ok) {
          console.error("Error fetching leagues:", response.statusText);
          setLoading(false);
          return;
        }

        const data = await response.json();
        const mapped = (data.leagues || []).map((league: any) => ({
          id: league.id,
          name: league.name,
          role: league.role,
        }));

        setLeagues(mapped);
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
      {/* Main content */}
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-50">Your Leagues</h1>
          <div className="flex gap-3">
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
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
