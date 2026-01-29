/**
 * Challenge Resolution Cron (PRD-54)
 *
 * POST: Resolve completed challenges
 *
 * This endpoint should be called by a cron job (e.g., Vercel Cron)
 * to resolve challenges whose period has ended.
 *
 * Security: Protected by CRON_SECRET environment variable
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { calculateChallengeResult } from "@/lib/challenges";

export async function POST(request: NextRequest) {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const today = new Date().toISOString().slice(0, 10);

    // Find all accepted challenges whose period has ended
    const { data: challenges, error: fetchError } = await adminClient
        .from("challenges")
        .select(`
            *,
            challenger:users!challenges_challenger_id_fkey(id, display_name),
            target:users!challenges_target_id_fkey(id, display_name)
        `)
        .eq("status", "accepted")
        .lt("period_end", today);

    if (fetchError) {
        console.error("[Cron] Error fetching challenges:", fetchError);
        return NextResponse.json(
            { error: "Failed to fetch challenges" },
            { status: 500 }
        );
    }

    if (!challenges || challenges.length === 0) {
        return NextResponse.json({
            message: "No challenges to resolve",
            resolved: 0,
        });
    }

    const results = {
        resolved: 0,
        failed: 0,
        errors: [] as string[],
    };

    for (const challenge of challenges) {
        try {
            // Get submissions for both users
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

            // Dedupe and sum (take highest per date)
            const dedupeAndSum = (subs: { steps: number; for_date: string }[] | null) => {
                if (!subs) return 0;
                const byDate = new Map<string, number>();
                for (const sub of subs) {
                    const current = byDate.get(sub.for_date) || 0;
                    byDate.set(sub.for_date, Math.max(current, sub.steps || 0));
                }
                return Array.from(byDate.values()).reduce((a, b) => a + b, 0);
            };

            const challengerTotal = dedupeAndSum(challengerSubs.data);
            const targetTotal = dedupeAndSum(targetSubs.data);

            // Calculate result
            const result = calculateChallengeResult(
                challengerTotal,
                targetTotal,
                challenge.challenger_id,
                challenge.target_id
            );

            // Update challenge with results
            const { error: updateError } = await adminClient
                .from("challenges")
                .update({
                    challenger_value: result.challenger_total,
                    target_value: result.target_total,
                    winner_id: result.winner_id,
                    status: "completed",
                    resolved_at: new Date().toISOString(),
                })
                .eq("id", challenge.id);

            if (updateError) {
                throw updateError;
            }

            // Create notifications for both users
            const challengerNotification = {
                user_id: challenge.challenger_id,
                notification_type_id: "challenge_result",
                title: result.winner_id === challenge.challenger_id
                    ? "You won! 🏆"
                    : result.is_tie
                        ? "It's a tie! 🤝"
                        : "Challenge complete",
                message: result.winner_id === challenge.challenger_id
                    ? `You beat ${(challenge.target as any).display_name} with ${challengerTotal.toLocaleString()} steps!`
                    : result.is_tie
                        ? `You and ${(challenge.target as any).display_name} tied with ${challengerTotal.toLocaleString()} steps!`
                        : `${(challenge.target as any).display_name} won with ${targetTotal.toLocaleString()} steps`,
                action_url: `/challenges/${challenge.id}`,
                metadata: {
                    challenge_id: challenge.id,
                    result: result.winner_id === challenge.challenger_id ? "won" : result.is_tie ? "tie" : "lost",
                    your_total: challengerTotal,
                    opponent_total: targetTotal,
                },
            };

            const targetNotification = {
                user_id: challenge.target_id,
                notification_type_id: "challenge_result",
                title: result.winner_id === challenge.target_id
                    ? "You won! 🏆"
                    : result.is_tie
                        ? "It's a tie! 🤝"
                        : "Challenge complete",
                message: result.winner_id === challenge.target_id
                    ? `You beat ${(challenge.challenger as any).display_name} with ${targetTotal.toLocaleString()} steps!`
                    : result.is_tie
                        ? `You and ${(challenge.challenger as any).display_name} tied with ${targetTotal.toLocaleString()} steps!`
                        : `${(challenge.challenger as any).display_name} won with ${challengerTotal.toLocaleString()} steps`,
                action_url: `/challenges/${challenge.id}`,
                metadata: {
                    challenge_id: challenge.id,
                    result: result.winner_id === challenge.target_id ? "won" : result.is_tie ? "tie" : "lost",
                    your_total: targetTotal,
                    opponent_total: challengerTotal,
                },
            };

            await adminClient.from("notifications").insert([
                challengerNotification,
                targetNotification,
            ]);

            results.resolved++;
        } catch (err) {
            results.failed++;
            results.errors.push(`Challenge ${challenge.id}: ${err instanceof Error ? err.message : "Unknown error"}`);
            console.error(`[Cron] Failed to resolve challenge ${challenge.id}:`, err);
        }
    }

    return NextResponse.json({
        message: `Resolved ${results.resolved} challenges`,
        ...results,
    });
}

// Also support GET for easy testing in browser
export async function GET(request: NextRequest) {
    // Only allow in development
    if (process.env.NODE_ENV !== "development") {
        return NextResponse.json(
            { error: "GET method only available in development" },
            { status: 405 }
        );
    }

    return POST(request);
}
