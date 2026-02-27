import Link from "next/link";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { ModuleFeedback } from "@/components/ui/ModuleFeedback";
import { GratitudeCard } from "@/components/dashboard/GratitudeCard";
import { ShareProgressWidget } from "@/components/dashboard/ShareProgressWidget";
import { getUserLeagues } from "@/lib/leagues";
import { redirect } from "next/navigation";

import { DashboardWelcomeToast } from "@/components/dashboard/DashboardWelcomeToast";
import { PasswordResetSuccessToast } from "@/components/dashboard/PasswordResetSuccessToast";
import { DashboardClientWrapper } from "@/components/dashboard/DashboardClientWrapper";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { OnboardingSection } from "@/components/onboarding/OnboardingSection";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Server-side fetch (Zero Waterfall) — parallel queries
  const adminClient = createAdminClient();
  const [leagues, submissionCount, userProfile] = await Promise.all([
    getUserLeagues(user.id),
    adminClient
      .from("submissions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .then(({ count }) => count ?? 0),
    adminClient
      .from("users")
      .select("display_name")
      .eq("id", user.id)
      .single()
      .then(({ data }) => data),
  ]);

  return (
    <DashboardClientWrapper>
      <PageViewTracker pageName="dashboard" pageType="dashboard" />
      <div className="bg-background">
        <DashboardWelcomeToast />
        <PasswordResetSuccessToast />
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-12">
        <ModuleFeedback moduleId="dashboard-header" moduleName="Dashboard Actions">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" data-tour="dashboard-header">
            <h1 className="text-2xl font-bold text-foreground">Your Leagues</h1>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Link
                href="/my-stats"
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-border/80 hover:bg-accent"
                data-tour="my-stats"
              >
                📊 My Stats
              </Link>
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

        {/* Onboarding for new users (PRD 60) */}
        <OnboardingSection
          submissionCount={submissionCount}
          displayName={userProfile?.display_name ?? user.user_metadata?.display_name}
        />

        {/* Progress Widget & Gratitude Row */}
        <div className="mt-6 mb-2 grid gap-4 md:grid-cols-2">
          <ShareProgressWidget className="w-full" />
          <GratitudeCard count={0} className="w-full" />
        </div>

        {leagues.length === 0 ? (
          <div className="mt-12 rounded-xl border border-border bg-card/50 p-12 text-center" data-tour="leagues-section">
            <p className="text-lg text-muted-foreground">You haven&apos;t joined any leagues yet.</p>
            <p className="mt-2 text-sm text-muted-foreground/70">
              Create a new league or join one with an invite code.
            </p>
          </div>
        ) : (
          <ModuleFeedback moduleId="dashboard-leagues" moduleName="Your Leagues Grid">
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-tour="leagues-section">
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
    </DashboardClientWrapper>
  );
}
