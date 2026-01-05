import { z } from "zod";
import { withApiHandler } from "@/lib/api/handler";

const checkSchema = z.object({
    dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1).max(31),
    league_id: z.string().uuid().optional().nullable(),
});

interface ExistingSubmission {
    id: string;
    for_date: string;
    steps: number;
    verified: boolean | null;
    proof_path: string | null;
    created_at: string;
}

interface ConflictInfo {
    date: string;
    existing: ExistingSubmission;
    source: "screenshot" | "manual";
}

/**
 * POST /api/submissions/check-conflict
 * 
 * Check if submissions already exist for the given dates.
 * Returns conflict info for pre-submission UI decisions.
 */
export const POST = withApiHandler({
    auth: "required",
    schema: checkSchema,
}, async ({ user, body, adminClient }) => {
    const { dates, league_id } = body;

    // Build query for existing submissions
    let query = adminClient
        .from("submissions")
        .select("id, for_date, steps, verified, proof_path, created_at")
        .eq("user_id", user!.id)
        .in("for_date", dates);

    if (league_id) {
        query = query.eq("league_id", league_id);
    } else {
        query = query.is("league_id", null);
    }

    const { data: existingSubmissions, error } = await query;

    if (error) {
        console.error("Check conflict query error:", error);
        return { conflicts: [], error: error.message };
    }

    // Map to conflict info
    const conflicts: ConflictInfo[] = (existingSubmissions || []).map((sub: ExistingSubmission) => ({
        date: sub.for_date,
        existing: sub,
        source: sub.proof_path ? "screenshot" : "manual",
    }));

    return {
        has_conflicts: conflicts.length > 0,
        conflicts,
        conflict_dates: conflicts.map(c => c.date),
    };
});
