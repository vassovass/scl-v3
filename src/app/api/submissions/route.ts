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

        // Create submission
        const { data: submission, error: insertError } = await adminClient
            .from("submissions")
            .insert({
                league_id: input.league_id,
                user_id: user.id,
                for_date: input.date,
                steps: input.steps,
                partial: input.partial,
                proof_path: input.proof_path,
            })
            .select(submissionSelect)
            .single();

        if (insertError) {
            if (insertError.code === "23505") {
                return jsonError(409, "Submission already exists for this date");
            }
            console.error("Submission insert error:", insertError);
            return serverError(insertError.message);
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
