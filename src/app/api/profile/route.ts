import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { json, unauthorized, serverError } from "@/lib/api";
import { z } from "zod";

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
            .select("display_name, nickname")
            .eq("id", user.id)
            .single();

        if (error) {
            console.error("Profile fetch error:", error);
            return json({ display_name: null, nickname: null });
        }

        return json({
            display_name: profile?.display_name || null,
            nickname: profile?.nickname || null,
        });
    } catch (error) {
        console.error("Profile error:", error);
        return serverError(error instanceof Error ? error.message : "Unknown error");
    }
}

// PATCH /api/profile - Update current user's profile
const updateSchema = z.object({
    display_name: z.string().max(100).optional(),
    nickname: z.string().max(50).optional().nullable(),
});

export async function PATCH(request: Request) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return unauthorized();
        }

        const body = await request.json();
        const parsed = updateSchema.safeParse(body);

        if (!parsed.success) {
            return json({ error: "Invalid data" }, { status: 400 });
        }

        const updates: Record<string, string | null> = {};
        if (parsed.data.display_name !== undefined) {
            updates.display_name = parsed.data.display_name;
        }
        if (parsed.data.nickname !== undefined) {
            updates.nickname = parsed.data.nickname || null;
        }

        const adminClient = createAdminClient();
        const { error } = await adminClient
            .from("users")
            .update(updates)
            .eq("id", user.id);

        if (error) {
            console.error("Profile update error:", error);
            return json({ error: "Failed to update profile" }, { status: 500 });
        }

        return json({ success: true });
    } catch (error) {
        console.error("Profile error:", error);
        return serverError(error instanceof Error ? error.message : "Unknown error");
    }
}
