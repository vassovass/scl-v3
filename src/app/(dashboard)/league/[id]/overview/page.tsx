"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { UserRole } from "@/lib/menuConfig";
import { LeagueNav } from "@/components/league/LeagueNav";
import { LeagueQuickStats } from "@/components/league/LeagueQuickStats";
import { SubmissionStatusCard } from "@/components/league/SubmissionStatusCard";
import { LeagueInviteControl } from "@/components/league/LeagueInviteControl";
import { useSubmissionStatus } from "@/hooks/useSubmissionStatus";
import { analytics, trackEvent } from "@/lib/analytics";
import { PaywallBanner } from "@/components/billing/PaywallBanner";
import { UpgradePrompt } from "@/components/billing/UpgradePrompt";

interface League {
    id: string;
    name: string;
    invite_code: string;
    role?: string;
    member_count?: number;
}

interface UserStats {
    rank: number | null;
    stepsThisWeek: number;
    currentStreak: number;
}

/**
 * League Hub Overview Page
 * Central landing page when viewing a league - shows stats, quick actions, and navigation
 */
/** Track checkout results from URL params */
function CheckoutResultTracker({ leagueId }: { leagueId: string }) {
    const searchParams = useSearchParams();
    const checkoutResult = searchParams.get("checkout");
    const tierSlug = searchParams.get("tier");

    useEffect(() => {
        if (checkoutResult === "success") {
            trackEvent("checkout_completed", {
                league_id: leagueId,
                tier: tierSlug || "unknown",
                category: "conversion",
            });
        } else if (checkoutResult === "cancelled") {
            trackEvent("checkout_abandoned", {
                league_id: leagueId,
                category: "conversion",
            });
        }
    }, [checkoutResult, tierSlug, leagueId]);

    if (checkoutResult === "success") {
        return (
            <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground">
                Payment successful! Your league has been upgraded{tierSlug ? ` to ${tierSlug}` : ""}.
            </div>
        );
    }

    return null;
}

export default function LeagueOverviewPage() {
    const params = useParams();
    const leagueId = params.id as string;
    const { session } = useAuth();

    const [league, setLeague] = useState<League | null>(null);
    const [stats, setStats] = useState<UserStats>({
        rank: null,
        stepsThisWeek: 0,
        currentStreak: 0,
    });
    const [loading, setLoading] = useState(true);
    const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

    // Use the modular hook for checking yesterday's submission status
    const {
        hasSubmitted: hasSubmittedYesterday,
        steps: yesterdaySteps,
        isLoading: submissionLoading,
    } = useSubmissionStatus({
        userId: session?.user?.id,
        leagueId,
        targetDate: "yesterday", // Check for previous day's submission
        skip: !session?.user?.id,
    });

    const fetchLeagueData = useCallback(async () => {
        if (!session) return;

        try {
            // Fetch league details
            const leagueRes = await fetch(`/api/leagues/${leagueId}`);
            if (!leagueRes.ok) {
                console.error("Error fetching league:", leagueRes.statusText);
                setLoading(false);
                return;
            }
            const leagueData = await leagueRes.json();
            setLeague(leagueData.league);

            // Fetch user stats for this league (rank, streak, etc.)
            const statsRes = await fetch(`/api/leagues/${leagueId}/stats?user_id=${session.user.id}`);
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats({
                    rank: statsData.rank,
                    stepsThisWeek: statsData.steps_this_week || 0,
                    currentStreak: statsData.current_streak || 0,
                });
            } else {
                // Stats API may not exist yet, use defaults
                setStats({
                    rank: null,
                    stepsThisWeek: 0,
                    currentStreak: 0,
                });
            }

            // Track hub view
            analytics.leagueNav.hubViewed(leagueId);
        } catch (error) {
            console.error("Error fetching league data:", error);
        } finally {
            setLoading(false);
        }
    }, [session, leagueId]);

    useEffect(() => {
        fetchLeagueData();
    }, [fetchLeagueData]);

    // Derive user role for LeagueNav
    const userRole: UserRole = (league?.role as UserRole) || "member";
    const totalMembers = league?.member_count || 1;

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center text-muted-foreground">
                Loading...
            </div>
        );
    }

    if (!league) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-foreground">League not found</h1>
                    <Link href="/dashboard" className="mt-4 text-primary hover:underline">
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-background">
            {/* League Header */}
            <div className="border-b border-border bg-card/30">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Link
                                href="/dashboard"
                                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                                ← Dashboard
                            </Link>
                            <h1 className="text-xl font-bold text-foreground mt-1">{league.name}</h1>
                        </div>
                        <LeagueInviteControl
                            inviteCode={league.invite_code}
                            leagueName={league.name}
                            leagueId={leagueId}
                        />
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <LeagueNav leagueId={leagueId} userRole={userRole} />

            {/* Main Content */}
            <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-6">
                {/* Checkout result feedback */}
                <Suspense fallback={null}>
                    <CheckoutResultTracker leagueId={leagueId} />
                </Suspense>

                {/* Paywall Banner */}
                <PaywallBanner
                    leagueId={leagueId}
                    onUpgradeClick={() => setShowUpgradePrompt(true)}
                />

                <UpgradePrompt
                    open={showUpgradePrompt}
                    onOpenChange={setShowUpgradePrompt}
                    leagueId={leagueId}
                />

                {/* Quick Stats */}
                <LeagueQuickStats
                    rank={stats.rank}
                    totalMembers={totalMembers}
                    stepsThisWeek={stats.stepsThisWeek}
                    currentStreak={stats.currentStreak}
                    hasSubmittedYesterday={hasSubmittedYesterday}
                />

                {/* Submission Status CTA */}
                <SubmissionStatusCard
                    hasSubmittedYesterday={hasSubmittedYesterday}
                    yesterdaySteps={yesterdaySteps}
                />

                {/* Quick Actions */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Link
                        href={`/league/${leagueId}/leaderboard`}
                        className="rounded-xl border border-border bg-card/50 p-6 transition hover:border-primary/50 hover:bg-card"
                    >
                        <div className="text-2xl mb-2">🏆</div>
                        <h3 className="font-semibold text-foreground">View Rankings</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            See how you stack up against the competition
                        </p>
                    </Link>

                    <Link
                        href={`/league/${leagueId}/analytics`}
                        className="rounded-xl border border-border bg-card/50 p-6 transition hover:border-primary/50 hover:bg-card"
                    >
                        <div className="text-2xl mb-2">📊</div>
                        <h3 className="font-semibold text-foreground">My Progress</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Track your steps with calendar and charts
                        </p>
                    </Link>

                    <Link
                        href="/submit-steps"
                        className="rounded-xl border border-border bg-card/50 p-6 transition hover:border-primary/50 hover:bg-card"
                    >
                        <div className="text-2xl mb-2">📝</div>
                        <h3 className="font-semibold text-foreground">Submit Steps</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Add today's step count to all your leagues
                        </p>
                    </Link>
                </div>
            </main>
        </div>
    );
}
