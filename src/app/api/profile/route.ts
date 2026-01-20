import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { json, unauthorized, serverError } from "@/lib/api";
import { z } from "zod";

export const dynamic = "force-dynamic";

// GET /api/profile - Fetch current user's profile
export async function GET() {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return unauthorized();
        }

        const adminClient = createAdminClient();
        const { data: profile, error } = await adminClient
            .from("users")
            .select("display_name")
            .eq("id", user.id)
            .single();

        if (error) {
            console.error("Profile fetch error:", error);
            return json({ display_name: null });
        }

        return json({
            display_name: profile?.display_name || null,
        });
    } catch (error) {
        console.error("Profile error:", error);
        return serverError(error instanceof Error ? error.message : "Unknown error");
    }
}

// PATCH /api/profile - Update current user's profile
const updateSchema = z.object({
    display_name: z.string().max(100).optional(),
});

export async function PATCH(request: Request) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return unauthorized();
        }

        const body = await request.json();
        console.log("[API] PATCH /api/profile received body:", body);
        const parsed = updateSchema.safeParse(body);

        if (!parsed.success) {
            console.error("[API] Validation failed:", parsed.error);
            return json({ error: "Invalid data" }, { status: 400 });
        }

        const updates: Record<string, string | null> = {};
        if (parsed.data.display_name !== undefined) {
            updates.display_name = parsed.data.display_name;
        }

        console.log("[API] Updates to apply:", updates);

        const adminClient = createAdminClient();
        const { error, data: updatedData } = await adminClient // Capture data if possible, though update returning * is needed
            .from("users")
            .update(updates)
            .eq("id", user.id)
            .select(); // Add select to see what happened

        if (error) {
            console.error("Profile update error:", error);
            return json({ error: "Failed to update profile" }, { status: 500 });
        }

        console.log("[API] Update result data:", updatedData);
        return json({ success: true, updated: updatedData });
    } catch (error) {
        console.error("Profile error:", error);
        return serverError(error instanceof Error ? error.message : "Unknown error");
    }
}


