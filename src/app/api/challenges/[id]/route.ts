/**
 * Challenge Detail API Route (PRD-54)
 *
 * GET: Get challenge details with progress
 * PATCH: Update challenge status (accept/decline/cancel)
 */

import { z } from "zod";
import { withApiHandler } from "@/lib/api/handler";
import { badRequest, notFound, forbidden } from "@/lib/api";
import {
    transition,
    canTransition,
    validateChallengeAction,
    formatValidationErrors,
    calculateChallengeProgress,
    isChallengeInProgress,
} from "@/lib/challenges";
import type { ChallengeStatus, ChallengeEvent } from "@/lib/challenges";

// ============================================================================
// GET - Challenge Details
// ============================================================================

export const GET = withApiHandler(
    { auth: "required" },
    async ({ user, params, adminClient }) => {
        const challengeId = params.id;

        // Get challenge with user details
        const { data: challenge, error } = await adminClient
            .from("challenges")
            .select(`
                *,
                challenger:users!challenges_challenger_id_fkey(id, display_name),
                target:users!challenges_target_id_fkey(id, display_name),
                winner:users!challenges_winner_id_fkey(id, display_name)
            `)
            .eq("id", challengeId)
            .single();

        if (error || !challenge) {
            return notFound("Challenge not found");
        }

        // Check user is participant
        if (challenge.challenger_id !== user!.id && challenge.target_id !== user!.id) {
            return forbidden("You are not part of this challenge");
        }

        // Calculate progress if challenge is active
        let progress = null;
        let currentScores = null;

        if (challenge.status === "accepted") {
            progress = calculateChallengeProgress(
                challenge.period_start,
                challenge.period_end
            );

            // Get current submission totals
            const [challengerSubs, targetSubs] = await Promise.all([
                adminClient
                    .from("submissions")
                    .select("steps, for_date")
                    .eq("user_id", challenge.challenger_id)
                    .gte("for_date", challenge.period_start)
                    .lte("for_date", challenge.period_end),
                adminClient
                    .from("submissions")
                    .select("steps, for_date")
                    .eq("user_id", challenge.target_id)
                    .gte("for_date", challenge.period_start)
                    .lte("for_date", challenge.period_end),
            ]);

            // Dedupe and sum
            const dedupeAndSum = (subs: { steps: number; for_date: string }[] | null) => {
                if (!subs) return 0;
                const byDate = new Map<string, number>();
                for (const sub of subs) {
                    const current = byDate.get(sub.for_date) || 0;
                    byDate.set(sub.for_date, Math.max(current, sub.steps || 0));
                }
                return Array.from(byDate.values()).reduce((a, b) => a + b, 0);
            };

            currentScores = {
                challenger: dedupeAndSum(challengerSubs.data),
                target: dedupeAndSum(targetSubs.data),
            };
        }

        // Determine who is leading
        let leader = null;
        if (currentScores) {
            if (currentScores.challenger > currentScores.target) {
                leader = "challenger";
            } else if (currentScores.target > currentScores.challenger) {
                leader = "target";
            } else {
                leader = "tie";
            }
        }

        return {
            challenge,
            progress,
            currentScores,
            leader,
            isInProgress: isChallengeInProgress(challenge.period_start, challenge.period_end),
            isUserChallenger: challenge.challenger_id === user!.id,
        };
    }
);

// ============================================================================
// PATCH - Update Challenge Status
// ============================================================================

const updateChallengeSchema = z.object({
    action: z.enum(["accept", "decline", "cancel"]),
});

export const PATCH = withApiHandler(
    {
        auth: "required",
        schema: updateChallengeSchema,
    },
    async ({ user, params, body, adminClient }) => {
        const challengeId = params.id;
        const { action } = body;

        // Get current challenge
        const { data: challenge, error } = await adminClient
            .from("challenges")
            .select(`
                *,
                challenger:users!challenges_challenger_id_fkey(id, display_name),
                target:users!challenges_target_id_fkey(id, display_name)
            `)
            .eq("id", challengeId)
            .single();

        if (error || !challenge) {
            return notFound("Challenge not found");
        }

        // Validate the action
        const validation = validateChallengeAction(
            action,
            challenge.status as ChallengeStatus,
            user!.id,
            challenge.challenger_id,
            challenge.target_id
        );

        if (!validation.valid) {
            return badRequest(formatValidationErrors(validation.errors));
        }

        // Check if transition is valid
        const event = action as ChallengeEvent;
        if (!canTransition(challenge.status as ChallengeStatus, event)) {
            return badRequest(`Cannot ${action} a challenge that is ${challenge.status}`);
        }

        // Calculate new status
        const newStatus = transition(challenge.status as ChallengeStatus, event);

        // Build update data
        const updateData: Record<string, any> = {
            status: newStatus,
        };

        // Set timestamp based on action
        const now = new Date().toISOString();
        if (action === "accept") {
            updateData.accepted_at = now;
        } else if (action === "decline") {
            updateData.declined_at = now;
        } else if (action === "cancel") {
            updateData.cancelled_at = now;
        }

        // Update challenge
        const { data: updatedChallenge, error: updateError } = await adminClient
            .from("challenges")
            .update(updateData)
            .eq("id", challengeId)
            .select()
            .single();

        if (updateError) {
            console.error("[Challenge PATCH] Update error:", updateError);
            return badRequest("Failed to update challenge");
        }

        // Send notification to the other party
        const isChallenger = user!.id === challenge.challenger_id;
        const otherUserId = isChallenger ? challenge.target_id : challenge.challenger_id;
        const currentUserName = isChallenger
            ? (challenge.challenger as any)?.display_name
            : (challenge.target as any)?.display_name;

        let notificationTypeId: string;
        let notificationTitle: string;
        let notificationMessage: string;

        switch (action) {
            case "accept":
                notificationTypeId = "challenge_accepted";
                notificationTitle = "Challenge accepted!";
                notificationMessage = `${currentUserName || "Your opponent"} accepted your challenge`;
                break;
            case "decline":
                notificationTypeId = "challenge_declined";
                notificationTitle = "Challenge declined";
                notificationMessage = `${currentUserName || "Your opponent"} declined your challenge`;
                break;
            case "cancel":
                notificationTypeId = "challenge_declined"; // Use same type for cancellation
                notificationTitle = "Challenge cancelled";
                notificationMessage = `${currentUserName || "Your opponent"} cancelled the challenge`;
                break;
            default:
                notificationTypeId = "challenge_declined";
                notificationTitle = "Challenge updated";
                notificationMessage = "A challenge has been updated";
        }

        await adminClient.from("notifications").insert({
            user_id: otherUserId,
            notification_type_id: notificationTypeId,
            title: notificationTitle,
            message: notificationMessage,
            action_url: `/challenges/${challengeId}`,
            metadata: {
                challenge_id: challengeId,
                action,
            },
        });

        return {
            success: true,
            challenge: updatedChallenge,
            previousStatus: challenge.status,
            newStatus,
        };
    }
);
