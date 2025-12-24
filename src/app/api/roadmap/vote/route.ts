import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { json, badRequest, unauthorized } from "@/lib/api";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return unauthorized("Sign in to vote");

        const body = await request.json();
        const { feedback_id, priority } = body;

        if (!feedback_id) return badRequest("Missing feedback_id");
        if (typeof priority !== "number" || priority < 1 || priority > 10) {
            return badRequest("Priority must be 1-10");
        }

        const adminClient = createAdminClient();

        // Upsert vote (insert or update)
        const { error: voteError } = await adminClient
            .from("roadmap_votes")
            .upsert(
                {
                    feedback_id,
                    user_id: user.id,
                    priority,
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: "feedback_id,user_id",
                }
            );

        if (voteError) {
            console.error("Vote error:", voteError);
            return badRequest(voteError.message);
        }

        // Get updated aggregates
        const { data: votes } = await adminClient
            .from("roadmap_votes")
            .select("priority")
            .eq("feedback_id", feedback_id);

        const voteCount = votes?.length || 0;
        const avgPriority = voteCount > 0
            ? votes!.reduce((sum, v) => sum + v.priority, 0) / voteCount
            : 0;

        return json({
            success: true,
            avg_priority: Math.round(avgPriority * 10) / 10,
            vote_count: voteCount,
        });
    } catch (error: any) {
        console.error("Vote API error:", error);
        return badRequest(error.message || "Unknown error");
    }
}
