"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { ModuleFeedback } from "@/components/ui/ModuleFeedback";
import { useFetch } from "@/hooks/useFetch";

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
  const { data, loading } = useFetch<{ leagues: League[] }>("/api/leagues");
  const leagues = data?.leagues || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <ModuleFeedback moduleId="dashboard-header" moduleName="Dashboard Actions">
          <div className="flex items-center justify-between" data-tour="dashboard-header">
            <h1 className="text-2xl font-bold text-foreground">Your Leagues</h1>
            <div className="flex gap-3">
              <Link
                href="/settings/profile"
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-border/80 hover:bg-accent"
              >
                ⚙️ Settings
              </Link>
              <Link
                href="/join"
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-border/80 hover:bg-accent"
                data-tour="join-league"
              >
                Join League
              </Link>
              <Link
                href="/league/create"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                data-tour="create-league"
              >
                Create League
              </Link>
            </div>
          </div>
        </ModuleFeedback>

        {loading ? (
          <div className="mt-12 text-center text-muted-foreground">Loading...</div>
        ) : leagues.length === 0 ? (
          <div className="mt-12 rounded-xl border border-border bg-card/50 p-12 text-center">
            <p className="text-lg text-muted-foreground">You haven&apos;t joined any leagues yet.</p>
            <p className="mt-2 text-sm text-muted-foreground/70">
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
                  className="group rounded-xl border border-border bg-card/50 p-6 transition hover:border-border/80 hover:bg-card"
                >
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-primary">
                    {league.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground capitalize">{league.role}</p>

                  {/* Stats row */}
                  <div className="mt-4 flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <span>👥</span>
                      <span>{league.member_count} member{league.member_count !== 1 ? "s" : ""}</span>
                    </div>
                    {league.user_rank > 0 && (
                      <div className="flex items-center gap-1 text-emerald-500">
                        <span>🏆</span>
                        <span>#{league.user_rank} of {league.member_count}</span>
                      </div>
                    )}
                  </div>

                  {/* Weekly steps */}
                  {league.user_steps_this_week > 0 && (
                    <div className="mt-2 text-sm text-primary">
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

