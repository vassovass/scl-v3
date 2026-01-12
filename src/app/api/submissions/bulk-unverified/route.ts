import { z } from "zod";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { json, badRequest, unauthorized, forbidden, serverError } from "@/lib/api";

const entrySchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    steps: z.number().int().positive(),
});

const bulkUnverifiedSchema = z.object({
    league_id: z.string().uuid(),
    reason: z.string().min(10, "Please provide a reason (at least 10 characters)"),
    entries: z.array(entrySchema).min(1).max(31), // Max 31 entries (roughly a month)
    proxy_member_id: z.string().uuid().optional(),
});

interface Conflict {
    date: string;
    existing_steps: number;
    verified: boolean;
}

interface EntryError {
    date: string;
    reason: string;
}

// POST /api/submissions/bulk-unverified - Submit multiple unverified step entries
export async function POST(request: Request): Promise<Response> {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return unauthorized();
        }

        const body = await request.json();
        const parsed = bulkUnverifiedSchema.safeParse(body);

        if (!parsed.success) {
            const firstError = parsed.error.errors[0];
            return badRequest(firstError?.message || "Invalid payload");
        }

        const { league_id, reason, entries, proxy_member_id } = parsed.data;
        const adminClient = createAdminClient();

        // Check membership/roles and permissions
        // If submitting for proxy, must be admin/owner
        const { data: membershipData } = await adminClient
            .from("memberships")
            .select("role, league:leagues(backfill_limit)")
            .eq("league_id", league_id)
            .eq("user_id", user.id)
            .single();

        if (!membershipData) {
            return forbidden("You are not a member of this league");
        }

        if (proxy_member_id) {
            if (!["owner", "admin"].includes(membershipData.role)) {
                return forbidden("Only league admins can submit for proxy members");
            }
            // Verify proxy exists in this league
            const { data: proxyMember } = await adminClient
                .from("proxy_members")
                .select("id")
                .eq("id", proxy_member_id)
                .eq("league_id", league_id)
                .single();

            if (!proxyMember) {
                return badRequest("Proxy member not found in this league");
            }
        }

        const league = membershipData.league as unknown as { backfill_limit: number | null };
        const backfillLimit = league?.backfill_limit;

        // Get today's date for backfill checking
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get all dates we're trying to submit
        const dates = entries.map(e => e.date);

        // Fetch existing submissions for these dates
        const { data: existingSubmissions } = await adminClient
            .from("submissions")
            .select("for_date, steps, verified")
            .eq("league_id", league_id)
            .eq("user_id", user.id)
            .in("for_date", dates);

        const existingByDate = new Map(
            (existingSubmissions || []).map(s => [s.for_date, s])
        );

        const inserted: string[] = [];
        const skipped: string[] = [];
        const conflicts: Conflict[] = [];
        const errors: EntryError[] = [];

        // Process each entry
        for (const entry of entries) {
            const submissionDate = new Date(entry.date);

            // Check backfill limit
            if (backfillLimit !== null && backfillLimit !== undefined) {
                const diffTime = today.getTime() - submissionDate.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays > backfillLimit) {
                    errors.push({
                        date: entry.date,
                        reason: `Exceeds backfill limit of ${backfillLimit} days`,
                    });
                    continue;
                }
            }

            // Check for future dates
            if (submissionDate > today) {
                errors.push({
                    date: entry.date,
                    reason: "Cannot submit for future dates",
                });
                continue;
            }

            // Check for existing submission
            const existing = existingByDate.get(entry.date);
            if (existing) {
                if (existing.verified === true) {
                    // Conflict with verified submission - flag for user
                    conflicts.push({
                        date: entry.date,
                        existing_steps: existing.steps,
                        verified: true,
                    });
                } else {
                    // Already has unverified submission - just skip
                    skipped.push(entry.date);
                }
                continue;
            }

            // Insert new submission
            const { error: insertError } = await adminClient
                .from("submissions")
                .insert({
                    league_id,
                    user_id: user.id,
                    for_date: entry.date,
                    steps: entry.steps,
                    partial: false,
                    proof_path: null,
                    verified: false,
                    verification_notes: `[Bulk Manual] ${reason}`,
                    proxy_member_id: proxy_member_id || null,
                });

            if (insertError) {
                if (insertError.code === "23505") {
                    skipped.push(entry.date);
                } else {
                    errors.push({
                        date: entry.date,
                        reason: insertError.message,
                    });
                }
            } else {
                inserted.push(entry.date);
            }
        }

        return json({
            inserted: inserted.length,
            skipped: skipped.length,
            conflicts,
            errors,
            inserted_dates: inserted,
        }, { status: inserted.length > 0 ? 201 : 200 });
    } catch (error) {
        console.error("Bulk unverified submission error:", error);
        return serverError(error instanceof Error ? error.message : "Unknown error");
    }
}
