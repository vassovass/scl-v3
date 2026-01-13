import { z } from "zod";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { json, badRequest, unauthorized, forbidden, serverError, jsonError } from "@/lib/api";
import { callVerificationFunction } from "@/lib/server/verify";

const createSchema = z.object({
    league_id: z.string().uuid().optional().nullable(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    steps: z.number().int().positive(),
    partial: z.boolean().optional().default(false),
    proof_path: z.string().min(3).nullable().optional(),
    user_id: z.string().uuid().optional(), // For submitting on behalf of a proxy
    flagged: z.boolean().optional(),
    flag_reason: z.string().nullable().optional(),
    overwrite: z.boolean().optional(),
});

const querySchema = z.object({
    league_id: z.string().uuid(),
    user_id: z.string().uuid().optional(),
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
    order_by: z.enum(["for_date", "created_at"]).default("for_date"),
    exclude_proxy: z.enum(["true", "false"]).default("true").transform(v => v === "true"),
    proxy_member_id: z.string().uuid().optional(),
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

        const body = await request.json();
        const parsed = createSchema.safeParse(body);

        if (!parsed.success) {
            return badRequest("Invalid payload");
        }

        const input = parsed.data;
        const adminClient = createAdminClient();

        // Determine target user ID
        let targetUserId = user.id;

        // If submitting for another user (Act As Proxy)
        if (input.user_id && input.user_id !== user.id) {
            // Verify permission: Allow if user manages the target (proxy) or is superadmin
            // Check if target is a proxy managed by auth user
            const { data: proxyData } = await adminClient
                .from("users")
                .select("managed_by, is_proxy")
                .eq("id", input.user_id)
                .single();

            // We also need to check if caller is superadmin (though rare for step submission via API)
            // But main check is "managed_by"
            const isManager = proxyData?.managed_by === user.id;

            if (!isManager) {
                // Double check superadmin status if needed, but for now strict proxy management
                // Fetch auth user superadmin status?
                // For simplicity/speed, assuming only managers submit for proxies.
                return forbidden("You do not have permission to submit for this user.");
            }
            targetUserId = input.user_id;
        }

        let targetLeagueId = input.league_id;

        // Settings defaults (permissive for leagueless)
        let requirePhoto = false;
        let allowManual = true;
        let backfillLimit: number | null = null;

        // If target exists, enforce its rules
        if (targetLeagueId) {
            // Check membership and backfill limit of the TARGET user
            const { data: membershipData } = await adminClient
                .from("memberships")
                .select("role, league:leagues(backfill_limit, require_verification_photo, allow_manual_entry)")
                .eq("league_id", targetLeagueId)
                .eq("user_id", targetUserId)
                .single();

            // If acting as proxy, they might not be in the league yet?
            // Proxies should be added to leagues via invitation or auto-add.
            // If membership missing, deny.
            if (!membershipData) {
                return forbidden("Target user is not a member of the target league");
            }

            const league = membershipData.league as unknown as { backfill_limit: number | null, require_verification_photo: boolean | null, allow_manual_entry: boolean | null };

            requirePhoto = league?.require_verification_photo === true;
            allowManual = league?.allow_manual_entry !== false;
            backfillLimit = league?.backfill_limit ?? null;
        }

        // Enforce photo requirement
        const requiresProof = requirePhoto || (!allowManual);

        if (requiresProof && !input.proof_path) {
            return badRequest("Verification photo is required for this submission.");
        }

        if (backfillLimit !== null) {
            const limitDays = backfillLimit;
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
        let query = adminClient
            .from("submissions")
            .select("id")
            .eq("user_id", targetUserId)
            .eq("for_date", input.date);

        if (targetLeagueId) {
            query = query.eq("league_id", targetLeagueId);
        } else {
            query = query.is("league_id", null);
        }

        const { data: existingSubmission } = await query.single();

        const wantsOverwrite = input.overwrite === true;

        if (existingSubmission && !wantsOverwrite) {
            return jsonError(409, "Submission already exists for this date");
        }

        // Build submission data
        const submissionData = {
            league_id: input.league_id,
            user_id: targetUserId,
            for_date: input.date,
            steps: input.steps,
            partial: input.partial,
            proof_path: input.proof_path,
            flagged: input.flagged ?? false,
            flag_reason: input.flag_reason ?? null,
            // proxy_member_id removed
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
        let verification;

        if (input.proof_path && targetLeagueId) {
            verification = await callVerificationFunction({
                steps: input.steps,
                for_date: input.date,
                proof_path: input.proof_path ?? undefined,
                league_id: targetLeagueId,
                submission_id: submission.id,
                requester_id: targetUserId, // Verify as the target user (for logic involving their history)
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
        }

        // Fetch updated submission (verification may have updated it)
        const { data: refreshed } = await adminClient
            .from("submissions")
            .select(submissionSelect)
            .eq("id", submission.id)
            .single();

        const payload: Record<string, unknown> = {
            submission: refreshed ?? submission,
        };

        if (verification) {
            if (verification.ok) {
                payload.verification = verification.data;
            } else {
                payload.verification_error = {
                    error: verification.data.code ?? "verification_failed",
                    message: verification.data.message ?? "Verification failed",
                    retry_after: verification.data.retry_after,
                    should_retry: verification.data.should_retry,
                };
            }
        }

        const status = (verification?.ok ?? true) ? 201 : 202;
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

        const { league_id, user_id, from, to, limit, offset, order_by, exclude_proxy, proxy_member_id: proxyMemberIdFilter } = parsed.data;

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

        // Build query - Agnostic of league_id for the submission itself
        // Order by the specified field (for_date for calendar view, created_at for recent uploads)
        const primaryOrder = order_by === "created_at" ? "created_at" : "for_date";
        const secondaryOrder = order_by === "created_at" ? "for_date" : "created_at";

        let query = adminClient
            .from("submissions")
            .select(submissionSelect, { count: "exact" })
            // .eq("league_id", league_id) // Removed to show ALL user submissions
            .order(primaryOrder, { ascending: false })
            .order(secondaryOrder, { ascending: false });

        // Filter by specific proxy member (for viewing proxy's submissions)
        if (user_id) {
            query = query.eq("user_id", user_id);
            // "exclude_proxy" might be irrelevant now if proxies are "users", but maybe we still want to separate?
            // If proxies are users, they are just "user_id".
            // If we want "my submissions excluding my managed proxies", we need to filter by `is_proxy = false` join?
            // But this query is usually specific for a dashboard or list.
            // If I am a manager, I see my own submissions.
            // If I act as proxy, I see proxy submissions.
            // We can probably ignore exclude_proxy for now unless required.
        } else {
            // If user_id not provided, we must fallback to filtering by league to avoid exposing others' data 
            // without explicit intent (though usually this endpoint is consumed by the user for themselves).
            // But the frontend usually passes user_id.
            // Safety fallback: if no user_id, strict league scope.
            query = query.eq("league_id", league_id);
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
