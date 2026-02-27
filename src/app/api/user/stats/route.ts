import { withApiHandler } from "@/lib/api/handler";

export const dynamic = "force-dynamic";

export const GET = withApiHandler({
    auth: 'required',
}, async ({ user, adminClient }) => {
    const { data: stats, error } = await adminClient
        .from("user_records")
        .select("*")
        .eq("user_id", user!.id)
        .single();

    if (error && error.code !== "PGRST116") {
        throw error;
    }

    return {
        stats: stats || {
            best_day_steps: 0,
            best_day_date: null,
            current_streak: 0,
            longest_streak: 0,
            total_steps_lifetime: 0,
        },
    };
});
