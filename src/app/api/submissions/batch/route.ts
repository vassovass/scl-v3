import { z } from "zod";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { json, badRequest, unauthorized, forbidden, serverError } from "@/lib/api";
import { callVerificationFunction } from "@/lib/server/verify";

const batchSchema = z.object({
    league_id: z.string().uuid(),
    proof_path: z.string().min(3),
    auto_extract: z.boolean().default(true),
});

// POST /api/submissions/batch - Create submission with auto-extraction
export async function POST(request: Request): Promise<Response> {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return unauthorized();
        }

        const body = await request.json();
        const parsed = batchSchema.safeParse(body);

        if (!parsed.success) {
            return badRequest("Invalid payload");
        }

        const input = parsed.data;
        const adminClient = createAdminClient();

        // Check membership
        const { data: membership } = await adminClient
            .from("memberships")
            .select("role")
            .eq("league_id", input.league_id)
            .eq("user_id", user.id)
            .single();

        if (!membership) {
            return forbidden("You are not a member of this league");
        }

        // First, call verification to extract data from the image
        const verification = await callVerificationFunction({
            steps: 0, // Will be extracted
            for_date: new Date().toISOString().slice(0, 10), // Placeholder
            proof_path: input.proof_path,
            league_id: input.league_id,
            requester_id: user.id,
        });

        if (!verification.ok) {
            return json({
                submission: null,
                verification_error: {
                    error: verification.data.code ?? "extraction_failed",
                    message: verification.data.message ?? "Could not extract data from image",
                },
            }, { status: 422 });
        }

        const extractedSteps = verification.data.extracted_steps;
        const extractedDate = verification.data.extracted_date;

        if (!extractedSteps || extractedSteps <= 0) {
            return json({
                submission: null,
                verification_error: {
                    error: "no_steps_found",
                    message: "Could not detect step count in the screenshot",
                },
            }, { status: 422 });
        }

        // Use extracted date or today's date
        const forDate = normalizeDate(extractedDate);

        // Create submission with extracted values
        const { data: submission, error: insertError } = await adminClient
            .from("submissions")
            .insert({
                league_id: input.league_id,
                user_id: user.id,
                for_date: forDate,
                steps: extractedSteps,
                partial: false,
                proof_path: input.proof_path,
                verified: verification.data.verified ?? false,
                tolerance_used: verification.data.tolerance_used,
                extracted_km: verification.data.extracted_km,
                extracted_calories: verification.data.extracted_calories,
                verification_notes: verification.data.notes,
            })
            .select("id, league_id, user_id, for_date, steps, partial, verified, created_at")
            .single();

        if (insertError) {
            if (insertError.code === "23505") {
                return json({
                    submission: null,
                    verification_error: {
                        error: "duplicate",
                        message: `Submission already exists for ${forDate}`,
                    },
                }, { status: 409 });
            }
            console.error("Batch submission insert error:", insertError);
            return serverError(insertError.message);
        }

        return json({
            submission,
            verification: {
                verified: verification.data.verified ?? false,
                extracted_steps: extractedSteps,
                extracted_date: forDate,
                extracted_km: verification.data.extracted_km,
                extracted_calories: verification.data.extracted_calories,
                notes: verification.data.notes,
            },
        }, { status: 201 });
    } catch (error) {
        console.error("Batch submission error:", error);
        return serverError(error instanceof Error ? error.message : "Unknown error");
    }
}

function normalizeDate(dateStr: string | null | undefined): string {
    if (!dateStr) return new Date().toISOString().slice(0, 10);
    // Try to parse - handle variable formats if possible, or fallback to today
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
    return d.toISOString().slice(0, 10);
}
