/**
 * Challenge Utilities (PRD-54)
 *
 * Helper functions for challenge operations.
 *
 * Systems Thinking:
 * - Pure functions for calculations and formatting
 * - Reusable across API routes and UI components
 * - Consistent formatting for share messages
 */

import type { Challenge, ChallengeResult, ChallengeWithUsers, ChallengeStats } from "./types";
import type { MetricType } from "@/lib/sharing/metricConfig";
import { METRIC_CONFIGS, formatWithUnit } from "@/lib/sharing/metricConfig";
import { formatCustomPeriodLabel, calculateDaysBetween } from "@/lib/utils/periods";

// ============================================================================
// Result Calculations
// ============================================================================

/**
 * Calculate challenge result from submission totals.
 */
export function calculateChallengeResult(
    challengerTotal: number,
    targetTotal: number,
    challengerId: string,
    targetId: string
): ChallengeResult {
    const margin = Math.abs(challengerTotal - targetTotal);
    const loserTotal = Math.min(challengerTotal, targetTotal);
    const margin_pct = loserTotal > 0 ? Math.round((margin / loserTotal) * 100) : 0;

    let winner_id: string | null = null;
    let is_tie = false;

    if (challengerTotal > targetTotal) {
        winner_id = challengerId;
    } else if (targetTotal > challengerTotal) {
        winner_id = targetId;
    } else {
        is_tie = true;
    }

    return {
        challenger_total: challengerTotal,
        target_total: targetTotal,
        winner_id,
        is_tie,
        margin,
        margin_pct,
    };
}

/**
 * Calculate statistics from a list of challenges.
 */
export function calculateChallengeStats(
    challenges: Challenge[],
    userId: string
): ChallengeStats {
    let wins = 0;
    let losses = 0;
    let ties = 0;
    let pending_received = 0;
    let pending_sent = 0;
    let active = 0;
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    // Sort by resolved_at for streak calculation
    const completedChallenges = challenges
        .filter((c) => c.status === "completed")
        .sort((a, b) => {
            const dateA = new Date(a.resolved_at || a.created_at);
            const dateB = new Date(b.resolved_at || b.created_at);
            return dateA.getTime() - dateB.getTime();
        });

    for (const challenge of challenges) {
        if (challenge.status === "pending") {
            if (challenge.challenger_id === userId) {
                pending_sent++;
            } else {
                pending_received++;
            }
        } else if (challenge.status === "accepted") {
            active++;
        } else if (challenge.status === "completed") {
            if (challenge.winner_id === userId) {
                wins++;
            } else if (challenge.winner_id === null) {
                ties++;
            } else {
                losses++;
            }
        }
    }

    // Calculate win streaks
    for (const challenge of completedChallenges) {
        if (challenge.winner_id === userId) {
            tempStreak++;
            bestStreak = Math.max(bestStreak, tempStreak);
        } else {
            tempStreak = 0;
        }
    }

    // Current streak is from most recent backwards
    currentStreak = 0;
    for (let i = completedChallenges.length - 1; i >= 0; i--) {
        if (completedChallenges[i].winner_id === userId) {
            currentStreak++;
        } else {
            break;
        }
    }

    const total_challenges = wins + losses + ties;
    const win_rate = total_challenges > 0 ? Math.round((wins / total_challenges) * 100) : 0;

    return {
        total_challenges,
        wins,
        losses,
        ties,
        pending_received,
        pending_sent,
        active,
        win_rate,
        current_win_streak: currentStreak,
        best_win_streak: bestStreak,
    };
}

// ============================================================================
// Challenge Progress
// ============================================================================

/**
 * Calculate progress percentage through a challenge period.
 */
export function calculateChallengeProgress(
    periodStart: string,
    periodEnd: string
): { daysPassed: number; totalDays: number; progress: number } {
    const now = new Date();
    const nowStr = formatDateForCalc(now);

    // calculateDaysBetween already includes +1 for inclusive count
    const totalDays = calculateDaysBetween(periodStart, periodEnd);

    // Calculate days passed - clamp to period boundaries
    let daysPassed: number;
    if (nowStr < periodStart) {
        daysPassed = 0;
    } else if (nowStr > periodEnd) {
        daysPassed = totalDays;
    } else {
        daysPassed = calculateDaysBetween(periodStart, nowStr);
    }

    const progress = Math.min(100, Math.round((daysPassed / totalDays) * 100));

    return { daysPassed, totalDays, progress };
}

function formatDateForCalc(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

/**
 * Check if a challenge is currently in its active period.
 */
export function isChallengeInProgress(periodStart: string, periodEnd: string): boolean {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const start = new Date(periodStart + "T00:00:00");
    const end = new Date(periodEnd + "T23:59:59");
    return now >= start && now <= end;
}

/**
 * Check if a challenge period has ended.
 */
export function hasChallengePeriodEnded(periodEnd: string): boolean {
    const now = new Date();
    const end = new Date(periodEnd + "T23:59:59");
    return now > end;
}

// ============================================================================
// Formatting
// ============================================================================

/**
 * Format challenge period for display.
 */
export function formatChallengePeriod(periodStart: string, periodEnd: string): string {
    const start = new Date(periodStart + "T00:00:00");
    const end = new Date(periodEnd + "T00:00:00");
    return formatCustomPeriodLabel(start, end);
}

/**
 * Format challenge value with metric unit.
 */
export function formatChallengeValue(value: number, metricType: MetricType): string {
    return formatWithUnit(value, metricType);
}

/**
 * Get emoji for challenge outcome.
 */
export function getChallengeOutcomeEmoji(
    challenge: Challenge,
    userId: string
): string {
    if (challenge.status !== "completed") return "";
    if (challenge.winner_id === null) return "🤝"; // Tie
    if (challenge.winner_id === userId) return "🏆"; // Won
    return "👏"; // Lost (good sportsmanship)
}

/**
 * Format challenge result message.
 */
export function formatChallengeResultMessage(
    challenge: ChallengeWithUsers,
    userId: string
): string {
    const isChallenger = challenge.challenger_id === userId;
    const opponent = isChallenger ? challenge.target : challenge.challenger;
    const userValue = isChallenger ? challenge.challenger_value : challenge.target_value;
    const opponentValue = isChallenger ? challenge.target_value : challenge.challenger_value;
    const metric = METRIC_CONFIGS[challenge.metric_type];

    if (challenge.status !== "completed") {
        return "Challenge in progress";
    }

    if (challenge.winner_id === null) {
        return `It's a tie! You both got ${userValue.toLocaleString()} ${metric.unitPlural}`;
    }

    const won = challenge.winner_id === userId;
    const margin = Math.abs(userValue - opponentValue);
    const marginPct = opponentValue > 0 ? Math.round((margin / opponentValue) * 100) : 0;

    if (won) {
        return `You won by ${margin.toLocaleString()} ${metric.unitPlural} (${marginPct}%)!`;
    } else {
        return `${opponent.display_name} won by ${margin.toLocaleString()} ${metric.unitPlural}`;
    }
}

// ============================================================================
// Share Message Generation
// ============================================================================

/**
 * Generate share message for a challenge.
 */
export function generateChallengeShareMessage(
    challenge: ChallengeWithUsers,
    userId: string
): { text: string; hashtags: string[] } {
    const isChallenger = challenge.challenger_id === userId;
    const opponent = isChallenger ? challenge.target : challenge.challenger;
    const metric = METRIC_CONFIGS[challenge.metric_type];
    const period = formatChallengePeriod(challenge.period_start, challenge.period_end);

    let text: string;
    const hashtags = ["StepLeague", "StepChallenge"];

    switch (challenge.status) {
        case "pending":
            text = `I just challenged ${opponent.display_name} to a ${metric.displayName.toLowerCase()} competition! ${metric.emoji}`;
            break;

        case "accepted":
            text = `${isChallenger ? "My" : "A"} challenge vs ${opponent.display_name} is ON! Who will get more ${metric.unitPlural}? ${metric.emoji}`;
            break;

        case "completed":
            const won = challenge.winner_id === userId;
            const userValue = isChallenger ? challenge.challenger_value : challenge.target_value;

            if (challenge.winner_id === null) {
                text = `It's a tie! ${opponent.display_name} and I both hit ${userValue.toLocaleString()} ${metric.unitPlural} ${period}! ${metric.emoji}`;
            } else if (won) {
                text = `I won my challenge against ${opponent.display_name}! ${userValue.toLocaleString()} ${metric.unitPlural} ${period} 🏆`;
                hashtags.push("Victory");
            } else {
                text = `Good game ${opponent.display_name}! They beat me in our ${metric.displayName.toLowerCase()} challenge ${period} 💪`;
                hashtags.push("GoodSportsmanship");
            }
            break;

        default:
            text = `Check out my step challenge on StepLeague! ${metric.emoji}`;
    }

    return { text, hashtags };
}

// ============================================================================
// Notification Messages
// ============================================================================

/**
 * Generate notification content for challenge events.
 */
export function generateChallengeNotification(
    event: "created" | "accepted" | "declined" | "completed",
    challenge: ChallengeWithUsers,
    recipientId: string
): { title: string; message: string; action_url: string } {
    const isRecipientChallenger = challenge.challenger_id === recipientId;
    const opponent = isRecipientChallenger ? challenge.target : challenge.challenger;
    const period = formatChallengePeriod(challenge.period_start, challenge.period_end);
    const metric = METRIC_CONFIGS[challenge.metric_type];

    switch (event) {
        case "created":
            return {
                title: `${opponent.display_name} challenged you!`,
                message: `${metric.emoji} Can you beat them in ${metric.unitPlural} ${period}?`,
                action_url: `/challenges`,
            };

        case "accepted":
            return {
                title: "Challenge accepted!",
                message: `${opponent.display_name} accepted your ${metric.displayName.toLowerCase()} challenge`,
                action_url: `/challenges/${challenge.id}`,
            };

        case "declined":
            return {
                title: "Challenge declined",
                message: `${opponent.display_name} declined your challenge`,
                action_url: `/challenges`,
            };

        case "completed":
            const won = challenge.winner_id === recipientId;
            const tied = challenge.winner_id === null;

            if (tied) {
                return {
                    title: "Challenge ended - It's a tie!",
                    message: `You and ${opponent.display_name} tied in your ${metric.displayName.toLowerCase()} challenge`,
                    action_url: `/challenges/${challenge.id}`,
                };
            } else if (won) {
                return {
                    title: "You won! 🏆",
                    message: `You beat ${opponent.display_name} in your ${metric.displayName.toLowerCase()} challenge!`,
                    action_url: `/challenges/${challenge.id}`,
                };
            } else {
                return {
                    title: "Challenge complete",
                    message: `${opponent.display_name} won your ${metric.displayName.toLowerCase()} challenge. Good effort!`,
                    action_url: `/challenges/${challenge.id}`,
                };
            }
    }
}
