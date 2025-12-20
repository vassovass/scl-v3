import { z } from "zod";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { json, badRequest, unauthorized, forbidden, serverError, jsonError } from "@/lib/api";
import { callVerificationFunction } from "@/lib/server/verify";

const verifySchema = z.object({
    submission_id: z.string().uuid(),
    league_id: z.string().uuid(),
    steps: z.number().int().positive(),
    for_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    proof_path: z.string().min(3),
});

// POST /api/submissions/verify - Retry verification for a submission
export async function POST(request: Request): Promise<Response> {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return unauthorized();
        }

        // Get session for access token (needed for verification function)
        const { data: { session } } = await supabase.auth.getSession();

        const body = await request.json();
        const parsed = verifySchema.safeParse(body);

        if (!parsed.success) {
            return badRequest("Invalid payload");
        }

        const input = parsed.data;
        const adminClient = createAdminClient();

        // Verify user is a member of the league
        const { data: membership } = await adminClient
            .from("memberships")
            .select("role")
            .eq("league_id", input.league_id)
            .eq("user_id", user.id)
            .single();

        if (!membership) {
            return forbidden("You are not a member of this league");
        }

        // Verify the submission belongs to this user
        const { data: submission, error: submissionError } = await adminClient
            .from("submissions")
            .select("id, user_id, verified")
            .eq("id", input.submission_id)
            .eq("league_id", input.league_id)
            .single();

        if (submissionError || !submission) {
            return jsonError(404, "Submission not found");
        }

        if (submission.user_id !== user.id) {
            return forbidden("You can only verify your own submissions");
        }

        // Call verification function
        const verification = await callVerificationFunction({
            steps: input.steps,
            for_date: input.for_date,
            proof_path: input.proof_path,
            league_id: input.league_id,
            submission_id: input.submission_id,
            requester_id: user.id,
        });

        // If rate limited, return 429 with retry_after
        if (verification.status === 429) {
            const data = verification.data as { retry_after?: number };
            return json(
                { error: "rate_limited", retry_after: data?.retry_after ?? 10 },
                { status: 429 }
            );
        }

        if (!verification.ok) {
            return json(
                { error: "verification_failed", details: verification.data },
                { status: verification.status }
            );
        }

        // Fetch updated submission
        const { data: updatedSubmission } = await adminClient
            .from("submissions")
            .select("id, verified, tolerance_used, extracted_km, extracted_calories, verification_notes")
            .eq("id", input.submission_id)
            .single();

        return json({
            verified: updatedSubmission?.verified ?? false,
            submission: updatedSubmission,
            verification: verification.data,
        });
    } catch (error) {
        console.error("Verify POST error:", error);
        return serverError(error instanceof Error ? error.message : "Unknown error");
    }
}
