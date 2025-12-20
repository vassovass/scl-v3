import { z } from "zod";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { json, badRequest, unauthorized, forbidden, serverError } from "@/lib/api";

const bulkDeleteSchema = z.object({
    league_ids: z.array(z.string().uuid()).min(1).max(50),
    permanent: z.boolean().default(false),
});

// DELETE /api/leagues/bulk - Bulk delete leagues
export async function DELETE(request: Request) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return unauthorized();
        }

        const body = await request.json();
        const parsed = bulkDeleteSchema.safeParse(body);

        if (!parsed.success) {
            return badRequest("Invalid payload");
        }

        const { league_ids, permanent } = parsed.data;
        const adminClient = createAdminClient();

        // Get leagues where user is admin
        const { data: memberships } = await adminClient
            .from("memberships")
            .select("league_id")
            .eq("user_id", user.id)
            .eq("role", "admin")
            .in("league_id", league_ids);

        const adminLeagueIds = memberships?.map((m) => m.league_id) ?? [];

        const results: { id: string; success: boolean; error?: string }[] = [];

        for (const leagueId of league_ids) {
            if (!adminLeagueIds.includes(leagueId)) {
                results.push({ id: leagueId, success: false, error: "Not admin" });
                continue;
            }

            try {
                if (permanent) {
                    // Delete related data first
                    await adminClient.from("submissions").delete().eq("league_id", leagueId);
                    await adminClient.from("memberships").delete().eq("league_id", leagueId);
                    await adminClient.from("leagues").delete().eq("id", leagueId);
                } else {
                    // Soft delete
                    await adminClient
                        .from("leagues")
                        .update({
                            deleted_at: new Date().toISOString(),
                            deleted_by: user.id,
                        })
                        .eq("id", leagueId);
                }
                results.push({ id: leagueId, success: true });
            } catch (err) {
                results.push({
                    id: leagueId,
                    success: false,
                    error: err instanceof Error ? err.message : "Unknown error",
                });
            }
        }

        const successCount = results.filter((r) => r.success).length;
        const failCount = results.filter((r) => !r.success).length;

        return json({
            message: `${successCount} league(s) ${permanent ? "permanently deleted" : "moved to trash"}, ${failCount} failed`,
            results,
        });
    } catch (error) {
        return serverError(error instanceof Error ? error.message : "Unknown error");
    }
}
