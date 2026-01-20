import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
    const supabase = await createServerSupabaseClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { data: stats, error } = await supabase
            .from("user_records")
            .select("*")
            .eq("user_id", user.id)
            .single();

        if (error && error.code !== "PGRST116") { // PGRST116 = No rows found
            throw error;
        }

        // Return stats or defaults if no record exists yet
        return NextResponse.json({
            stats: stats || {
                best_day_steps: 0,
                best_day_date: null,
                current_streak: 0,
                longest_streak: 0,
                total_steps_lifetime: 0,
            },
        });
    } catch (error) {
        console.error("Error fetching user stats:", error);
        return NextResponse.json(
            { error: "Failed to fetch user stats" },
            { status: 500 }
        );
    }
}

