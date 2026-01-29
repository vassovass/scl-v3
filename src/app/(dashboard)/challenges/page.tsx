"use client";

/**
 * Challenges Dashboard Page (PRD-54)
 *
 * Displays user's challenges organized by status:
 * - Pending (received) - Accept/Decline actions
 * - Active - Progress tracking
 * - Sent - Pending challenges user created
 * - History - Completed/cancelled/declined
 *
 * Design System:
 * - Mobile-first responsive layout
 * - Semantic CSS variables for theming
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Spinner } from "@/components/ui/Spinner";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ChallengeCard,
    ChallengeModal,
    ChallengeLeaderboardWidget,
} from "@/components/challenges";
import { Swords, Plus, Trophy, Clock, Send, History, AlertTriangle, RefreshCw } from "lucide-react";
import type { ChallengeWithUsers, ChallengeStats } from "@/lib/challenges";
import { analytics } from "@/lib/analytics";

interface Member {
    id: string;
    display_name: string;
    avatar_url?: string | null;
    league_id?: string;
    league_name?: string;
}

interface ChallengesData {
    pending_received: ChallengeWithUsers[];
    active: ChallengeWithUsers[];
    pending_sent: ChallengeWithUsers[];
    history: ChallengeWithUsers[];
    stats: ChallengeStats;
    members: Member[];
    excludeUserIds: string[];
}

export default function ChallengesPage() {
    const { user } = useAuth();
    const [data, setData] = useState<ChallengesData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Fetch challenges data
    const fetchChallenges = useCallback(async () => {
        if (!user) return;

        try {
            // Fetch challenges and league members in parallel
            const [challengesRes, membersRes] = await Promise.all([
                fetch("/api/challenges"),
                fetch("/api/leagues/members"), // Get all league members for friend selector
            ]);

            if (!challengesRes.ok) {
                const errData = await challengesRes.json();
                throw new Error(errData.error || "Failed to load challenges");
            }

            const challengesData = await challengesRes.json();
            let members: Member[] = [];
            let excludeUserIds: string[] = [];

            if (membersRes.ok) {
                const membersData = await membersRes.json();
                members = membersData.members || [];
                // Get IDs of users with active/pending challenges
                excludeUserIds = [
                    ...challengesData.pending_received.map((c: ChallengeWithUsers) =>
                        c.challenger_id === user.id ? c.target_id : c.challenger_id
                    ),
                    ...challengesData.active.map((c: ChallengeWithUsers) =>
                        c.challenger_id === user.id ? c.target_id : c.challenger_id
                    ),
                    ...challengesData.pending_sent.map((c: ChallengeWithUsers) =>
                        c.challenger_id === user.id ? c.target_id : c.challenger_id
                    ),
                ];
            }

            setData({
                ...challengesData,
                members,
                excludeUserIds,
            });
            setError(null);
        } catch (err) {
            console.error("Error fetching challenges:", err);
            setError(err instanceof Error ? err.message : "Failed to load challenges");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchChallenges();
    }, [fetchChallenges]);

    // Track dashboard view once data is loaded
    useEffect(() => {
        if (data) {
            analytics.challenges.dashboardViewed(data.active.length, data.pending_received.length);
        }
    }, [data]);

    // Handle challenge actions
    const handleAccept = async (challengeId: string) => {
        setActionLoading(challengeId);
        try {
            const res = await fetch(`/api/challenges/${challengeId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "accept" }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to accept challenge");
            }

            await fetchChallenges(); // Refresh data
        } catch (err) {
            console.error("Error accepting challenge:", err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDecline = async (challengeId: string) => {
        setActionLoading(challengeId);
        try {
            const res = await fetch(`/api/challenges/${challengeId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "decline" }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to decline challenge");
            }

            await fetchChallenges();
        } catch (err) {
            console.error("Error declining challenge:", err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancel = async (challengeId: string) => {
        setActionLoading(challengeId);
        try {
            const res = await fetch(`/api/challenges/${challengeId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "cancel" }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to cancel challenge");
            }

            await fetchChallenges();
        } catch (err) {
            console.error("Error cancelling challenge:", err);
        } finally {
            setActionLoading(null);
        }
    };

    // Handle new challenge creation
    const handleCreateChallenge = async (data: {
        target_id: string;
        metric_type: string;
        period_start: string;
        period_end: string;
        message?: string;
        template_id?: string;
    }) => {
        const res = await fetch("/api/challenges", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || "Failed to create challenge");
        }

        await fetchChallenges();
    };

    // Calculate tab counts
    const pendingCount = data?.pending_received.length || 0;
    const activeCount = data?.active.length || 0;
    const sentCount = data?.pending_sent.length || 0;
    const historyCount = data?.history.length || 0;

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Swords className="h-6 w-6" />
                        Challenges
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Compete with friends in 1v1 step battles
                    </p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Challenge
                </Button>
            </div>

            {/* Stats Widget */}
            {data?.stats && (
                <ChallengeLeaderboardWidget stats={data.stats} showViewAll={false} />
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <Spinner size="lg" />
                </div>
            )}

            {/* Error State */}
            {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error Loading Challenges</AlertTitle>
                    <AlertDescription className="flex items-center justify-between">
                        <span>{error}</span>
                        <Button variant="outline" size="sm" onClick={fetchChallenges}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Try Again
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            {/* Challenges Tabs */}
            {!loading && !error && data && (
                <Tabs defaultValue={pendingCount > 0 ? "pending" : "active"} className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="pending" className="relative">
                            <Clock className="h-4 w-4 mr-1 md:mr-2" />
                            <span className="hidden md:inline">Pending</span>
                            {pendingCount > 0 && (
                                <Badge
                                    variant="secondary"
                                    className="ml-1 h-5 w-5 p-0 flex items-center justify-center bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))]"
                                >
                                    {pendingCount}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="active">
                            <Trophy className="h-4 w-4 mr-1 md:mr-2" />
                            <span className="hidden md:inline">Active</span>
                            {activeCount > 0 && (
                                <Badge variant="secondary" className="ml-1">
                                    {activeCount}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="sent">
                            <Send className="h-4 w-4 mr-1 md:mr-2" />
                            <span className="hidden md:inline">Sent</span>
                            {sentCount > 0 && (
                                <Badge variant="secondary" className="ml-1">
                                    {sentCount}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="history">
                            <History className="h-4 w-4 mr-1 md:mr-2" />
                            <span className="hidden md:inline">History</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Pending Received */}
                    <TabsContent value="pending" className="mt-4 space-y-4">
                        {pendingCount === 0 ? (
                            <EmptyState
                                icon={<Clock className="h-12 w-12 text-muted-foreground/50" />}
                                title="No pending challenges"
                                description="When someone challenges you, it will appear here"
                            />
                        ) : (
                            data.pending_received.map((challenge) => (
                                <ChallengeCard
                                    key={challenge.id}
                                    challenge={challenge}
                                    currentUserId={user.id}
                                    onAccept={handleAccept}
                                    onDecline={handleDecline}
                                />
                            ))
                        )}
                    </TabsContent>

                    {/* Active */}
                    <TabsContent value="active" className="mt-4 space-y-4">
                        {activeCount === 0 ? (
                            <EmptyState
                                icon={<Trophy className="h-12 w-12 text-muted-foreground/50" />}
                                title="No active challenges"
                                description="Start a challenge with a friend to compete!"
                                action={
                                    <Button variant="outline" onClick={() => setIsModalOpen(true)}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Start a Challenge
                                    </Button>
                                }
                            />
                        ) : (
                            data.active.map((challenge) => (
                                <ChallengeCard
                                    key={challenge.id}
                                    challenge={challenge}
                                    currentUserId={user.id}
                                    onCancel={handleCancel}
                                />
                            ))
                        )}
                    </TabsContent>

                    {/* Sent (Pending) */}
                    <TabsContent value="sent" className="mt-4 space-y-4">
                        {sentCount === 0 ? (
                            <EmptyState
                                icon={<Send className="h-12 w-12 text-muted-foreground/50" />}
                                title="No pending sent challenges"
                                description="Challenges you send will appear here until accepted"
                            />
                        ) : (
                            data.pending_sent.map((challenge) => (
                                <ChallengeCard
                                    key={challenge.id}
                                    challenge={challenge}
                                    currentUserId={user.id}
                                    onCancel={handleCancel}
                                />
                            ))
                        )}
                    </TabsContent>

                    {/* History */}
                    <TabsContent value="history" className="mt-4 space-y-4">
                        {historyCount === 0 ? (
                            <EmptyState
                                icon={<History className="h-12 w-12 text-muted-foreground/50" />}
                                title="No challenge history"
                                description="Completed and past challenges will appear here"
                            />
                        ) : (
                            data.history.map((challenge) => (
                                <ChallengeCard
                                    key={challenge.id}
                                    challenge={challenge}
                                    currentUserId={user.id}
                                />
                            ))
                        )}
                    </TabsContent>
                </Tabs>
            )}

            {/* Create Challenge Modal */}
            {data && (
                <ChallengeModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleCreateChallenge}
                    members={data.members}
                    currentUserId={user.id}
                    excludeUserIds={data.excludeUserIds}
                />
            )}
        </div>
    );
}

// Empty state component
function EmptyState({
    icon,
    title,
    description,
    action,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            {icon}
            <h3 className="mt-4 text-lg font-medium">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
