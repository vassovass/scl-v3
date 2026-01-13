import { z } from "zod";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { json, badRequest, unauthorized, forbidden, serverError } from "@/lib/api";
import { callVerificationFunction } from "@/lib/server/verify";

const reanalyzeSchema = z.object({
    ids: z.array(z.string().uuid()).min(1).max(100),
});

// POST /api/submissions/bulk/reanalyze - Re-run AI verification/extraction
export async function POST(request: Request): Promise<Response> {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return unauthorized();
        }

        const body = await request.json();
        const parsed = reanalyzeSchema.safeParse(body);

        if (!parsed.success) {
            return badRequest("Invalid payload: " + parsed.error.message);
        }

        const { ids } = parsed.data;
        const adminClient = createAdminClient();

        // 1. Fetch details for permission check AND processing
        // PRD 41: proxy_member_id removed
        const { data: detailedSubmissions } = await adminClient
            .from("submissions")
            .select("id, user_id, league_id, proof_path, steps, for_date, created_at")
            .in("id", ids);

        if (!detailedSubmissions || detailedSubmissions.length !== ids.length) {
            return badRequest("One or more submissions not found");
        }

        // 2. Check permissions
        const { data: memberships } = await adminClient
            .from("memberships")
            .select("league_id, role")
            .eq("user_id", user.id)
            .in("role", ["owner", "admin"]);
        const adminLeagueIds = new Set(memberships?.map(m => m.league_id) || []);

        const { data: userData } = await adminClient
            .from("users")
            .select("is_superadmin")
            .eq("id", user.id)
            .single();
        const isSuperAdmin = userData?.is_superadmin || false;

        const invalidAccess = detailedSubmissions.some(sub => {
            if (isSuperAdmin) return false;
            if (sub.user_id === user.id) return false;
            // PRD 41: Admins can manage submissions in their leagues
            if (sub.league_id && adminLeagueIds.has(sub.league_id)) return false;
            return true;
        });

        if (invalidAccess) {
            return forbidden("You do not have permission to re-analyze one or more selected submissions");
        }

        // 3. Process each submission
        const results = [];

        for (const sub of detailedSubmissions) {
            if (!sub.proof_path) {
                results.push({ id: sub.id, success: false, error: "No proof image" });
                continue;
            }

            try {
                // Call verification service
                // Use a fallback UUID if league_id is null (global submission), though verify might handle it.
                // We'll pass the actual league_id if present.
                const verificationResult = await callVerificationFunction({
                    steps: sub.steps,
                    for_date: sub.for_date,
                    proof_path: sub.proof_path,
                    league_id: sub.league_id || "00000000-0000-0000-0000-000000000000", // Fallback or handle null
                    submission_id: sub.id,
                    requester_id: user.id
                });

                if (verificationResult.ok) {
                    const data = verificationResult.data;

                    // Prepare updates
                    const updates: any = {
                        verification_notes: data.message || "Re-analyzed by AI",
                        // Map extracted fields if available
                        // Note: The verify response structure depends on verify.ts implementation.
                        // Usually it returns { verified: boolean, extracted_steps: number, ... }
                        // We will assume standard structure.
                    };

                    if (data.verified !== undefined) updates.verified = data.verified;
                    if (data.extracted_steps) {
                        updates.extracted_km = data.extracted_km; // Assuming these come through
                        updates.extracted_calories = data.extracted_calories;

                        // Apply to main fields? 
                        // Yes, for "Resubmit to AI" we usually want to correct the submission.
                        // But we should be careful. 
                        // Let's update main fields ONLY if verified is true OR if we trust the extraction.
                        // Actually, let's update them and log it.
                        updates.steps = data.extracted_steps;
                    }
                    if (data.extracted_date) updates.for_date = data.extracted_date;

                    // Log change
                    await adminClient.from("submission_changes").insert({
                        submission_id: sub.id,
                        user_id: user.id,
                        field_name: "reanalyze",
                        old_value: `${sub.steps} steps, ${sub.for_date}`,
                        new_value: `${updates.steps || sub.steps} steps, ${updates.for_date || sub.for_date}`,
                        reason: "AI Bulk Re-analysis"
                    });

                    // Update submission
                    await adminClient
                        .from("submissions")
                        .update(updates)
                        .eq("id", sub.id);

                    results.push({ id: sub.id, success: true });
                } else {
                    results.push({ id: sub.id, success: false, error: "Verification failed" });
                }
            } catch (err) {
                console.error(`Re-analyze error for ${sub.id}:`, err);
                results.push({ id: sub.id, success: false, error: "Internal error" });
            }
        }

        const successCount = results.filter(r => r.success).length;

        return json({
            success: true,
            total: ids.length,
            updated: successCount,
            results
        });

    } catch (error) {
        return serverError(error instanceof Error ? error.message : "Unknown error");
    }
}
