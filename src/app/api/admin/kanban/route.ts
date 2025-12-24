import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { json, badRequest, unauthorized } from "@/lib/api";
import { NextRequest } from "next/server";

export async function PUT(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return unauthorized();

        // Check if superadmin
        const { data: isAdmin } = await supabase.rpc("is_superadmin");
        if (!isAdmin) return unauthorized("Superadmin access required");

        const body = await request.json();
        const { id, board_status, priority_order, is_public, completed_at, target_release } = body;

        if (!id) return badRequest("Missing id");

        // Build update object
        const updates: Record<string, any> = {
            updated_at: new Date().toISOString(),
        };

        if (board_status !== undefined) updates.board_status = board_status;
        if (priority_order !== undefined) updates.priority_order = priority_order;
        if (is_public !== undefined) updates.is_public = is_public;
        if (completed_at !== undefined) updates.completed_at = completed_at;
        if (target_release !== undefined) updates.target_release = target_release;

        // Update using admin client (bypasses RLS)
        const adminClient = createAdminClient();
        const { data, error } = await adminClient
            .from("feedback")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("Kanban update error:", error);
            return badRequest(error.message);
        }

        return json({ success: true, data });
    } catch (error: any) {
        console.error("Kanban API error:", error);
        return badRequest(error.message || "Unknown error");
    }
}

// GET: Fetch all feedback for kanban
export async function GET() {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return unauthorized();

        // Check if superadmin
        const { data: isAdmin } = await supabase.rpc("is_superadmin");
        if (!isAdmin) return unauthorized("Superadmin access required");

        const adminClient = createAdminClient();
        const { data, error } = await adminClient
            .from("feedback")
            .select("*, users(display_name, email)")
            .order("priority_order", { ascending: true })
            .order("created_at", { ascending: false });

        if (error) {
            return badRequest(error.message);
        }

        return json({ data });
    } catch (error: any) {
        return badRequest(error.message || "Unknown error");
    }
}
