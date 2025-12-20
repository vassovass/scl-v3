import { z } from "zod";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { json, badRequest, unauthorized, forbidden, serverError } from "@/lib/api";
import { callVerificationFunction } from "@/lib/server/verify";
import { normalizeExtractedDate } from "@/lib/utils/date";

const extractSchema = z.object({
    league_id: z.string().uuid(),
    proof_path: z.string().min(3),
});

/**
 * POST /api/submissions/extract - Extract data from image without creating submission
 * Returns extracted steps, date, km, calories for user review
 */
export async function POST(request: Request): Promise<Response> {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return unauthorized();
        }

        const body = await request.json();
        const parsed = extractSchema.safeParse(body);

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

        // Call verification to extract data from the image (extraction only, no DB write)
        const verification = await callVerificationFunction({
            steps: 0, // Will be extracted
            for_date: new Date().toISOString().slice(0, 10), // Placeholder
            proof_path: input.proof_path,
            league_id: input.league_id,
            requester_id: user.id,
        });

        if (!verification.ok) {
            return json({
                error: verification.data.code ?? "extraction_failed",
                message: verification.data.message ?? "Could not extract data from image",
            }, { status: 422 });
        }

        const extractedSteps = verification.data.extracted_steps;
        // Use smart date normalization (handles missing years)
        const extractedDate = normalizeExtractedDate(verification.data.extracted_date);

        return json({
            extracted_steps: extractedSteps,
            extracted_date: extractedDate,
            extracted_km: verification.data.extracted_km,
            extracted_calories: verification.data.extracted_calories,
            notes: verification.data.notes,
        });
    } catch (error) {
        console.error("Extract error:", error);
        return serverError(error instanceof Error ? error.message : "Unknown error");
    }
}
