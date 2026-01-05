import { z } from "zod";
import { withApiHandler } from "@/lib/api/handler";
import { callVerificationFunction } from "@/lib/server/verify";
import { json } from "@/lib/api";

const resolutionSchema = z.object({
    resolutions: z.array(z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        action: z.enum(["keep_existing", "use_incoming", "skip"]),
        incoming_data: z.object({
            steps: z.number().int().positive(),
            proof_path: z.string().nullable().optional(),
        }).optional(),
    })).min(1),
    league_id: z.string().uuid().optional().nullable(),
});

interface ResolutionResult {
    date: string;
    action: string;
    success: boolean;
    message?: string;
    submission_id?: string;
}

/**
 * POST /api/submissions/resolve
 * 
 * Resolve submission conflicts by applying user's decisions for each date.
 * Supports bulk resolution for batch uploads.
 */
export const POST = withApiHandler({
    auth: "required",
    schema: resolutionSchema,
}, async ({ user, body, adminClient }) => {
    const { resolutions, league_id } = body;
    const results: ResolutionResult[] = [];

    // If league specified, verify membership (using adminClient for consistency)
    if (league_id) {
        const { data: membership } = await adminClient
            .from("memberships")
            .select("role")
            .eq("league_id", league_id)
            .eq("user_id", user!.id)
            .single();

        if (!membership) {
            return json({ error: "You are not a member of this league" }, { status: 403 });
        }
    }

    for (const resolution of resolutions) {
        const { date, action, incoming_data } = resolution;

        try {
            if (action === "skip") {
                results.push({
                    date,
                    action: "skip",
                    success: true,
                    message: "Skipped - no changes made",
                });
                continue;
            }

            if (action === "keep_existing") {
                results.push({
                    date,
                    action: "keep_existing",
                    success: true,
                    message: "Kept existing submission",
                });
                continue;
            }

            // action === "use_incoming"
            if (!incoming_data) {
                results.push({
                    date,
                    action: "use_incoming",
                    success: false,
                    message: "Missing incoming data for replacement",
                });
                continue;
            }

            // Find existing submission
            let existingQuery = adminClient
                .from("submissions")
                .select("id")
                .eq("user_id", user!.id)
                .eq("for_date", date);

            if (league_id) {
                existingQuery = existingQuery.eq("league_id", league_id);
            } else {
                existingQuery = existingQuery.is("league_id", null);
            }

            const { data: existing } = await existingQuery.single();

            const submissionData = {
                league_id: league_id || null,
                user_id: user!.id,
                for_date: date,
                steps: incoming_data.steps,
                proof_path: incoming_data.proof_path || null,
                partial: false,
                verified: incoming_data.proof_path ? null : false,
                verification_notes: existing
                    ? "[Conflict Resolution] Replaced previous entry"
                    : null,
            };

            let result;
            if (existing) {
                result = await adminClient
                    .from("submissions")
                    .update(submissionData)
                    .eq("id", existing.id)
                    .select("id")
                    .single();
            } else {
                result = await adminClient
                    .from("submissions")
                    .insert(submissionData)
                    .select("id")
                    .single();
            }

            if (result.error) {
                results.push({
                    date,
                    action: "use_incoming",
                    success: false,
                    message: result.error.message,
                });
                continue;
            }

            // Trigger verification if has proof and league
            if (incoming_data.proof_path && league_id) {
                try {
                    await callVerificationFunction({
                        steps: incoming_data.steps,
                        for_date: date,
                        proof_path: incoming_data.proof_path,
                        league_id: league_id,
                        submission_id: result.data.id,
                        requester_id: user!.id,
                    });
                } catch (verifyErr) {
                    console.error("Verification failed for resolved submission:", verifyErr);
                }
            }

            results.push({
                date,
                action: "use_incoming",
                success: true,
                message: existing ? "Replaced existing submission" : "Created new submission",
                submission_id: result.data.id,
            });
        } catch (err) {
            results.push({
                date,
                action,
                success: false,
                message: String(err),
            });
        }
    }

    const successCount = results.filter(r => r.success).length;
    const status = successCount === resolutions.length ? 200 : 207;

    return json({
        resolved: successCount,
        total: resolutions.length,
        results,
    }, { status });
});
