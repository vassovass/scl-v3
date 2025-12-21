import { z } from "zod";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { json, badRequest, unauthorized, forbidden, serverError, jsonError } from "@/lib/api";
import { callVerificationFunction } from "@/lib/server/verify";

const createSchema = z.object({
    league_id: z.string().uuid(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    steps: z.number().int().positive(),
    partial: z.boolean().optional().default(false),
    proof_path: z.string().min(3),
    proxy_member_id: z.string().uuid().optional(),
});

const querySchema = z.object({
    league_id: z.string().uuid(),
    user_id: z.string().uuid().optional(),
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    limit: z.coerce.number().int().min(1).max(200).default(50),
    offset: z.coerce.number().int().min(0).default(0),
});

const submissionSelect = "id, league_id, user_id, for_date, steps, partial, proof_path, verified, tolerance_used, extracted_km, extracted_calories, verification_notes, created_at";

// POST /api/submissions - Create a new step submission
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
        const parsed = createSchema.safeParse(body);

        if (!parsed.success) {
            return badRequest("Invalid payload");
        }

        const input = parsed.data;
        const adminClient = createAdminClient();

        // Check membership and backfill limit
        const { data: membershipData } = await adminClient
            .from("memberships")
            .select("role, league:leagues(backfill_limit)")
            .eq("league_id", input.league_id)
            .eq("user_id", user.id)
            .single();

        if (!membershipData) {
            return forbidden("You are not a member of this league");
        }

        // Check backfill limit
        const league = membershipData.league as unknown as { backfill_limit: number | null };
        if (league?.backfill_limit !== null && league?.backfill_limit !== undefined) {
            const limitDays = league.backfill_limit;
            const submissionDate = new Date(input.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Calculate difference in days
            const diffTime = today.getTime() - submissionDate.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > limitDays) {
                return badRequest(`This league only allows submissions for the past ${limitDays} day${limitDays === 1 ? '' : 's'}.`);
            }
        }

        // Check if submission already exists for this date
        const { data: existingSubmission } = await adminClient
            .from("submissions")
            .select("id")
            .eq("league_id", input.league_id)
            .eq("user_id", user.id)
            .eq("for_date", input.date)
            .single();

        const wantsOverwrite = (body as any).overwrite === true;

        if (existingSubmission && !wantsOverwrite) {
            return jsonError(409, "Submission already exists for this date");
        }

        // Build submission data
        const submissionData = {
            league_id: input.league_id,
            user_id: user.id,
            for_date: input.date,
            steps: input.steps,
            partial: input.partial,
            proof_path: input.proof_path,
            flagged: (body as any).flagged ?? false,
            flag_reason: (body as any).flag_reason ?? null,
            proxy_member_id: input.proxy_member_id ?? null,
        };

        let submission;
        let insertError;

        if (existingSubmission && wantsOverwrite) {
            // Update existing
            const result = await adminClient
                .from("submissions")
                .update(submissionData)
                .eq("id", existingSubmission.id)
                .select(submissionSelect)
                .single();
            submission = result.data;
            insertError = result.error;
        } else {
            // Insert new
            const result = await adminClient
                .from("submissions")
                .insert(submissionData)
                .select(submissionSelect)
                .single();
            submission = result.data;
            insertError = result.error;
        }

        if (insertError) {
            if (insertError.code === "23505") {
                return jsonError(409, "Submission already exists for this date");
            }
            console.error("Submission insert/update error:", insertError);
            return serverError(insertError.message);
        }

        if (!submission) {
            return serverError("Failed to create submission");
        }

        // Trigger verification (non-blocking, catch errors)
        const verification = await callVerificationFunction({
            steps: input.steps,
            for_date: input.date,
            proof_path: input.proof_path,
            league_id: input.league_id,
            submission_id: submission.id,
            requester_id: user.id,
        }).catch((err) => {
            return {
                status: 500,
                ok: false,
                data: {
                    code: "internal_error",
                    message: String(err),
                    should_retry: false,
                    retry_after: undefined
                }
            };
        });

        // Fetch updated submission (verification may have updated it)
        const { data: refreshed } = await adminClient
            .from("submissions")
            .select(submissionSelect)
            .eq("id", submission.id)
            .single();

        const payload: Record<string, unknown> = {
            submission: refreshed ?? submission,
        };

        if (verification.ok) {
            payload.verification = verification.data;
        } else {
            payload.verification_error = {
                // Map new structure to what client expects, or pass through
                error: verification.data.code ?? "verification_failed",
                message: verification.data.message ?? "Verification failed",
                retry_after: verification.data.retry_after,
                should_retry: verification.data.should_retry,
            };
        }

        const status = verification.ok ? 201 : 202;
        return json(payload, { status });
    } catch (error) {
        console.error("Submission POST error:", error);
        return serverError(error instanceof Error ? error.message : "Unknown error");
    }
}

// GET /api/submissions - List submissions for a league
export async function GET(request: Request): Promise<Response> {
    try {
        const url = new URL(request.url);
        const rawParams = Object.fromEntries(url.searchParams.entries());
        const parsed = querySchema.safeParse(rawParams);

        if (!parsed.success) {
            return badRequest("Invalid query parameters");
        }

        const { league_id, user_id, from, to, limit, offset } = parsed.data;

        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return unauthorized();
        }

        const adminClient = createAdminClient();

        // Check membership
        const { data: membership } = await adminClient
            .from("memberships")
            .select("role")
            .eq("league_id", league_id)
            .eq("user_id", user.id)
            .single();

        if (!membership) {
            return forbidden("You are not a member of this league");
        }

        // Build query
        let query = adminClient
            .from("submissions")
            .select(submissionSelect, { count: "exact" })
            .eq("league_id", league_id)
            .order("for_date", { ascending: false })
            .order("created_at", { ascending: false });

        if (user_id) {
            query = query.eq("user_id", user_id);
        }
        if (from) {
            query = query.gte("for_date", from);
        }
        if (to) {
            query = query.lte("for_date", to);
        }

        const rangeStart = offset;
        const rangeEnd = offset + limit - 1;
        const { data, error, count } = await query.range(rangeStart, rangeEnd);

        if (error) {
            console.error("Submissions GET error:", error);
            return serverError(error.message);
        }

        const total = count ?? 0;
        const end = data ? rangeStart + data.length - 1 : rangeStart;

        const response = json({ submissions: data ?? [], total });
        response.headers.set("Content-Range", `items ${rangeStart}-${end}/${total}`);
        response.headers.set("X-Total-Count", String(total));
        return response;
    } catch (error) {
        console.error("Submissions GET error:", error);
        return serverError(error instanceof Error ? error.message : "Unknown error");
    }
}
