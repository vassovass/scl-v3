"use client";

/**
 * ChallengeCard Component (PRD-54)
 *
 * Displays a single challenge with status, progress, and actions.
 *
 * Design System:
 * - Uses semantic CSS variables for theming
 * - Status colors follow the design system pattern
 * - Mobile-first responsive layout
 */

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
    STATUS_LABELS,
    STATUS_COLORS,
    formatChallengePeriod,
    formatChallengeValue,
    getChallengeOutcomeEmoji,
    calculateChallengeProgress,
    isChallengeInProgress,
} from "@/lib/challenges";
import type { ChallengeWithUsers, ChallengeStatus } from "@/lib/challenges";
import { METRIC_CONFIGS } from "@/lib/sharing/metricConfig";
import { analytics } from "@/lib/analytics";

interface ChallengeCardProps {
    challenge: ChallengeWithUsers;
    currentUserId: string;
    onAccept?: (challengeId: string) => Promise<void>;
    onDecline?: (challengeId: string) => Promise<void>;
    onCancel?: (challengeId: string) => Promise<void>;
    currentScores?: {
        challenger: number;
        target: number;
    } | null;
    compact?: boolean;
}

export function ChallengeCard({
    challenge,
    currentUserId,
    onAccept,
    onDecline,
    onCancel,
    currentScores,
    compact = false,
}: ChallengeCardProps) {
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const isChallenger = challenge.challenger_id === currentUserId;
    const opponent = isChallenger ? challenge.target : challenge.challenger;
    const metric = METRIC_CONFIGS[challenge.metric_type] || METRIC_CONFIGS.steps;
    const statusColors = STATUS_COLORS[challenge.status as ChallengeStatus];
    const periodLabel = formatChallengePeriod(challenge.period_start, challenge.period_end);

    // Calculate progress if active
    const progress = challenge.status === "accepted"
        ? calculateChallengeProgress(challenge.period_start, challenge.period_end)
        : null;

    // Determine who is leading
    const myScore = isChallenger
        ? (currentScores?.challenger ?? challenge.challenger_value)
        : (currentScores?.target ?? challenge.target_value);
    const opponentScore = isChallenger
        ? (currentScores?.target ?? challenge.target_value)
        : (currentScores?.challenger ?? challenge.challenger_value);

    const isWinning = myScore > opponentScore;
    const isTied = myScore === opponentScore;

    // Action handlers
    const handleAction = async (
        action: "accept" | "decline" | "cancel",
        handler?: (id: string) => Promise<void>
    ) => {
        if (!handler) return;
        setIsLoading(action);
        try {
            await handler(challenge.id);

            // Track analytics
            if (action === "accept") {
                analytics.challenges.accepted(challenge.id, challenge.challenger_id);
            } else if (action === "decline") {
                analytics.challenges.declined(challenge.id, challenge.challenger_id);
            } else if (action === "cancel") {
                analytics.challenges.cancelled(challenge.id, isChallenger ? "challenger" : "target");
            }
        } finally {
            setIsLoading(null);
        }
    };

    // Show pending actions for target
    const showAcceptDecline = challenge.status === "pending" && !isChallenger;
    const showCancel = (challenge.status === "pending" || challenge.status === "accepted") &&
        (isChallenger || challenge.status === "accepted");

    return (
        <Card className={`overflow-hidden ${compact ? "" : "shadow-sm"}`}>
            <CardHeader className="pb-2 space-y-0">
                <div className="flex items-center justify-between">
                    {/* Opponent info */}
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                                {opponent.display_name?.charAt(0).toUpperCase() || "?"}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium text-sm">
                                {isChallenger ? "vs " : "from "}
                                {opponent.display_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {metric.emoji} {metric.displayName} • {periodLabel}
                            </p>
                        </div>
                    </div>

                    {/* Status badge */}
                    <Badge
                        variant="secondary"
                        className={`${statusColors.text} ${statusColors.bg}`}
                    >
                        {challenge.status === "completed" && getChallengeOutcomeEmoji(challenge, currentUserId)}
                        {" "}
                        {STATUS_LABELS[challenge.status as ChallengeStatus]}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="pt-2">
                {/* Progress bar for active challenges */}
                {progress && challenge.status === "accepted" && (
                    <div className="mb-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Day {progress.daysPassed} of {progress.totalDays}</span>
                            <span>{progress.progress}%</span>
                        </div>
                        <Progress value={progress.progress} className="h-1.5" />
                    </div>
                )}

                {/* Score comparison */}
                {(challenge.status === "accepted" || challenge.status === "completed") && (
                    <div className="grid grid-cols-2 gap-4 mb-3">
                        {/* My score */}
                        <div className={`text-center p-2 rounded-lg ${
                            challenge.status === "completed" && challenge.winner_id === currentUserId
                                ? "bg-[hsl(var(--success)/0.1)]"
                                : "bg-muted/50"
                        }`}>
                            <p className="text-xs text-muted-foreground">You</p>
                            <p className={`text-lg font-bold ${
                                isWinning ? "text-[hsl(var(--success))]" : ""
                            }`}>
                                {formatChallengeValue(myScore, challenge.metric_type)}
                            </p>
                        </div>

                        {/* Opponent score */}
                        <div className={`text-center p-2 rounded-lg ${
                            challenge.status === "completed" && challenge.winner_id === opponent.id
                                ? "bg-[hsl(var(--success)/0.1)]"
                                : "bg-muted/50"
                        }`}>
                            <p className="text-xs text-muted-foreground">{opponent.display_name}</p>
                            <p className={`text-lg font-bold ${
                                !isWinning && !isTied ? "text-[hsl(var(--success))]" : ""
                            }`}>
                                {formatChallengeValue(opponentScore, challenge.metric_type)}
                            </p>
                        </div>
                    </div>
                )}

                {/* Challenge message */}
                {challenge.message && (
                    <p className="text-sm text-muted-foreground italic mb-3 bg-muted/30 p-2 rounded">
                        "{challenge.message}"
                    </p>
                )}

                {/* Action buttons */}
                {(showAcceptDecline || showCancel) && (
                    <div className="flex gap-2 pt-2">
                        {showAcceptDecline && (
                            <>
                                <Button
                                    size="sm"
                                    onClick={() => handleAction("accept", onAccept)}
                                    disabled={isLoading !== null}
                                    className="flex-1"
                                >
                                    {isLoading === "accept" ? "Accepting..." : "Accept"}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAction("decline", onDecline)}
                                    disabled={isLoading !== null}
                                    className="flex-1"
                                >
                                    {isLoading === "decline" ? "Declining..." : "Decline"}
                                </Button>
                            </>
                        )}

                        {showCancel && !showAcceptDecline && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleAction("cancel", onCancel)}
                                disabled={isLoading !== null}
                                className="text-muted-foreground hover:text-destructive"
                            >
                                {isLoading === "cancel" ? "Cancelling..." : "Cancel Challenge"}
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
