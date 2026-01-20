import { z } from "zod";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { json, badRequest, unauthorized, forbidden, serverError, jsonError } from "@/lib/api";
import { callVerificationFunction } from "@/lib/server/verify";
import { normalizeExtractedDate } from "@/lib/utils/date";

// PRD 41: proxy_member_id removed. Proxy submissions now use the proxy's user_id directly.
const batchSchema = z.object({
    league_id: z.string().uuid().nullable().optional(), // Can be null for global submissions
    proof_path: z.string().min(3),
    steps: z.number().int().positive().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    overwrite: z.boolean().default(false),
});

// POST /api/submissions/batch - Create submission (with optional pre-extracted data)
export async function POST(request: Request): Promise<Response> {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return unauthorized();
        }

        // PRD 41: Check X-Acting-As header for proxy submissions
        const actingAsId = request.headers.get("X-Acting-As");
        let targetUserId = user.id;

        const adminClient = createAdminClient();

        if (actingAsId && actingAsId !== user.id) {
            // Validate that actingAsId is a proxy managed by this user
            const { data: proxy, error: proxyError } = await adminClient
                .from("users")
                .select("id, display_name")
                .eq("id", actingAsId)
                .eq("managed_by", user.id)
                .eq("is_proxy", true)
                .is("deleted_at", null)
                .single();

            if (proxyError || !proxy) {
                console.error("[BatchSubmissions] Invalid proxy:", actingAsId, proxyError);
                return forbidden("Invalid proxy user");
            }

            targetUserId = actingAsId;
            console.log(`[BatchSubmissions] Acting as proxy: ${proxy.display_name} (${actingAsId})`);
        }

        const body = await request.json();
        const parsed = batchSchema.safeParse(body);

        if (!parsed.success) {
            return badRequest("Invalid payload");
        }

        const input = parsed.data;

        // Check membership (only for league-specific submissions)
        if (input.league_id) {
            const { data: membership } = await adminClient
                .from("memberships")
                .select("role")
                .eq("league_id", input.league_id)
                .eq("user_id", user.id)
                .single();

            if (!membership) {
                return forbidden("You are not a member of this league");
            }
        }


        let extractedSteps = input.steps;
        let forDate = input.date;
        let verificationData: Record<string, unknown> = {};

        // If steps/date not provided, extract from image
        if (!extractedSteps || !forDate) {
            const verification = await callVerificationFunction({
                steps: 0,
                for_date: new Date().toISOString().slice(0, 10),
                proof_path: input.proof_path,
                league_id: input.league_id ?? undefined,
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

            extractedSteps = extractedSteps ?? verification.data.extracted_steps ?? undefined;
            forDate = forDate ?? normalizeExtractedDate(verification.data.extracted_date);
            verificationData = verification.data;
        }

        if (!extractedSteps || extractedSteps <= 0) {
            return json({
                submission: null,
                verification_error: {
                    error: "no_steps_found",
                    message: "Could not detect step count in the screenshot",
                },
            }, { status: 422 });
        }

        forDate = forDate || new Date().toISOString().slice(0, 10);

        // Check for existing submission
        let existingQuery = adminClient
            .from("submissions")
            .select("id")
            .eq("user_id", targetUserId)
            .eq("for_date", forDate);

        if (input.league_id) {
            existingQuery = existingQuery.eq("league_id", input.league_id);
        } else {
            existingQuery = existingQuery.is("league_id", null);
        }

        const { data: existing } = await existingQuery.single();

        if (existing && !input.overwrite) {
            return jsonError(409, `Submission already exists for ${forDate}`);
        }

        const submissionData = {
            league_id: input.league_id ?? null, // null for global submissions
            user_id: targetUserId,
            for_date: forDate,
            steps: extractedSteps,
            partial: false,
            proof_path: input.proof_path,
            verified: (verificationData as Record<string, unknown>).verified ?? true,
            tolerance_used: (verificationData as Record<string, unknown>).tolerance_used,
            extracted_km: (verificationData as Record<string, unknown>).extracted_km,
            extracted_calories: (verificationData as Record<string, unknown>).extracted_calories,
            verification_notes: (verificationData as Record<string, unknown>).notes,
            // PRD 41: proxy_member_id removed - user_id now points directly to proxy user
        };

        let submission;
        let insertError;

        if (existing && input.overwrite) {
            const result = await adminClient
                .from("submissions")
                .update(submissionData)
                .eq("id", existing.id)
                .select("id, league_id, user_id, for_date, steps, partial, verified, created_at")
                .single();
            submission = result.data;
            insertError = result.error;
        } else {
            const result = await adminClient
                .from("submissions")
                .insert(submissionData)
                .select("id, league_id, user_id, for_date, steps, partial, verified, created_at")
                .single();
            submission = result.data;
            insertError = result.error;
        }

        if (insertError) {
            if (insertError.code === "23505") {
                return jsonError(409, `Submission already exists for ${forDate}`);
            }
            console.error("Batch submission insert error:", insertError);
            return serverError(insertError.message);
        }

        return json({
            submission,
            verification: {
                verified: true,
                extracted_steps: extractedSteps,
                extracted_date: forDate,
                extracted_km: (verificationData as Record<string, unknown>).extracted_km,
                extracted_calories: (verificationData as Record<string, unknown>).extracted_calories,
            },
        }, { status: 201 });
    } catch (error) {
        console.error("Batch submission error:", error);
        return serverError(error instanceof Error ? error.message : "Unknown error");
    }
}

function normalizeDate(dateStr: string | null | undefined): string {
    if (!dateStr) return new Date().toISOString().slice(0, 10);
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
    return d.toISOString().slice(0, 10);
}

