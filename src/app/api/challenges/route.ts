/**
 * Challenges API Route (PRD-54)
 *
 * GET: List user's challenges with filters
 * POST: Create a new challenge
 */

import { z } from "zod";
import { withApiHandler } from "@/lib/api/handler";
import { badRequest, notFound } from "@/lib/api";
import {
    validateCreateChallenge,
    canCreateChallengeWith,
    formatValidationErrors,
} from "@/lib/challenges";
import type { ChallengeStatus, CreateChallengeRequest } from "@/lib/challenges";

// ============================================================================
// GET - List Challenges
// ============================================================================

export const GET = withApiHandler(
    { auth: "required" },
    async ({ user, request, adminClient }) => {
        const { searchParams } = new URL(request.url);

        // Parse filters
        const status = searchParams.get("status") as ChallengeStatus | null;
        const role = searchParams.get("role") as "challenger" | "target" | "any" | null;
        const limit = parseInt(searchParams.get("limit") || "50");
        const offset = parseInt(searchParams.get("offset") || "0");

        // Build query
        let query = adminClient
            .from("challenges")
            .select(`
                *,
                challenger:users!challenges_challenger_id_fkey(id, display_name),
                target:users!challenges_target_id_fkey(id, display_name),
                winner:users!challenges_winner_id_fkey(id, display_name)
            `)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        // Filter by role
        if (role === "challenger") {
            query = query.eq("challenger_id", user!.id);
        } else if (role === "target") {
            query = query.eq("target_id", user!.id);
        } else {
            // Any role - user is either challenger or target
            query = query.or(`challenger_id.eq.${user!.id},target_id.eq.${user!.id}`);
        }

        // Filter by status
        if (status) {
            const statuses = status.split(",") as ChallengeStatus[];
            if (statuses.length === 1) {
                query = query.eq("status", status);
            } else {
                query = query.in("status", statuses);
            }
        }

        const { data: challenges, error } = await query;

        if (error) {
            console.error("[Challenges GET] Query error:", error);
            return badRequest("Failed to fetch challenges");
        }

        // Organize challenges by category for dashboard
        const userId = user!.id;
        const pending_received = challenges?.filter(
            (c: { status: string; target_id: string }) => c.status === "pending" && c.target_id === userId
        ) || [];
        const pending_sent = challenges?.filter(
            (c: { status: string; challenger_id: string }) => c.status === "pending" && c.challenger_id === userId
        ) || [];
        const active = challenges?.filter(
            (c: { status: string }) => c.status === "accepted"
        ) || [];
        const history = challenges?.filter(
            (c: { status: string }) => ["completed", "declined", "cancelled", "expired"].includes(c.status)
        ) || [];

        // Calculate stats
        const completedChallenges = challenges?.filter((c: { status: string }) => c.status === "completed") || [];
        let wins = 0;
        let losses = 0;
        let ties = 0;

        for (const c of completedChallenges) {
            const challenge = c as { winner_id: string | null; challenger_id: string; target_id: string };
            if (challenge.winner_id === null) {
                ties++;
            } else if (challenge.winner_id === userId) {
                wins++;
            } else {
                losses++;
            }
        }

        const total_challenges = completedChallenges.length;
        const win_rate = total_challenges > 0 ? Math.round((wins / total_challenges) * 100) : 0;

        const stats = {
            total_challenges,
            wins,
            losses,
            ties,
            pending_received: pending_received.length,
            pending_sent: pending_sent.length,
            active: active.length,
            win_rate,
            current_win_streak: 0, // TODO: Calculate from challenge history
            best_win_streak: 0,
        };

        return {
            challenges,
            pending_received,
            pending_sent,
            active,
            history,
            stats,
            pagination: {
                limit,
                offset,
                total: challenges?.length || 0,
            },
        };
    }
);

// ============================================================================
// POST - Create Challenge
// ============================================================================

const createChallengeSchema = z.object({
    target_id: z.string().uuid(),
    metric_type: z.enum(["steps", "calories", "slp", "distance", "swimming", "cycling", "running"]).optional().default("steps"),
    period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
    period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
    message: z.string().max(500).optional(),
    template_id: z.string().optional(),
});

export const POST = withApiHandler(
    {
        auth: "required",
        schema: createChallengeSchema,
    },
    async ({ user, body, adminClient }) => {
        const challengeData: CreateChallengeRequest = body;

        // Validate the request
        const validation = validateCreateChallenge(challengeData, user!.id);
        if (!validation.valid) {
            return badRequest(formatValidationErrors(validation.errors));
        }

        // Check target user exists
        const { data: targetUser } = await adminClient
            .from("users")
            .select("id, display_name")
            .eq("id", challengeData.target_id)
            .single();

        if (!targetUser) {
            return notFound("Target user not found");
        }

        // Check for existing active challenge between these users
        const { data: existingChallenge } = await adminClient
            .from("challenges")
            .select("id, status")
            .or(`and(challenger_id.eq.${user!.id},target_id.eq.${challengeData.target_id}),and(challenger_id.eq.${challengeData.target_id},target_id.eq.${user!.id})`)
            .in("status", ["pending", "accepted"])
            .limit(1)
            .single();

        if (existingChallenge) {
            const duplicateCheck = canCreateChallengeWith(existingChallenge.status as ChallengeStatus);
            if (!duplicateCheck.valid) {
                return badRequest(formatValidationErrors(duplicateCheck.errors));
            }
        }

        // Create the challenge
        const { data: challenge, error } = await adminClient
            .from("challenges")
            .insert({
                challenger_id: user!.id,
                target_id: challengeData.target_id,
                metric_type: challengeData.metric_type || "steps",
                period_start: challengeData.period_start,
                period_end: challengeData.period_end,
                message: challengeData.message || null,
                template_id: challengeData.template_id || null,
                status: "pending",
            })
            .select()
            .single();

        if (error) {
            console.error("[Challenges POST] Insert error:", error);
            return badRequest("Failed to create challenge");
        }

        // Get challenger info for notification
        const { data: challengerUser } = await adminClient
            .from("users")
            .select("display_name")
            .eq("id", user!.id)
            .single();

        // Create notification for target user
        await adminClient.from("notifications").insert({
            user_id: challengeData.target_id,
            notification_type_id: "challenge_received",
            title: `${challengerUser?.display_name || "Someone"} challenged you!`,
            message: challengeData.message || `Can you beat them in ${challengeData.metric_type || "steps"}?`,
            action_url: "/challenges",
            metadata: {
                challenge_id: challenge.id,
                challenger_id: user!.id,
                metric_type: challengeData.metric_type,
                period_start: challengeData.period_start,
                period_end: challengeData.period_end,
            },
        });

        return {
            success: true,
            challenge,
        };
    }
);
