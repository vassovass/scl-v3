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

// GET: Fetch all feedback for kanban with pagination, filtering, and search
export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return unauthorized();

        // Check if superadmin
        const { data: isAdmin } = await supabase.rpc("is_superadmin");
        if (!isAdmin) return unauthorized("Superadmin access required");

        // Parse query params
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");
        const type = searchParams.get("type"); // bug, feature, etc.
        const status = searchParams.get("status"); // backlog, todo, in_progress, review, done
        const search = searchParams.get("search");
        const dateFrom = searchParams.get("dateFrom");
        const dateTo = searchParams.get("dateTo");
        const sortBy = searchParams.get("sortBy") || "priority_order";
        const sortOrder = searchParams.get("sortOrder") === "desc" ? false : true;

        const adminClient = createAdminClient();

        // Build query
        let query = adminClient
            .from("feedback")
            .select("*, users(nickname)", { count: "exact" });

        // Apply filters
        if (type) query = query.eq("type", type);
        if (status) query = query.eq("board_status", status);
        if (dateFrom) query = query.gte("created_at", dateFrom);
        if (dateTo) query = query.lte("created_at", dateTo);
        if (search) {
            query = query.or(`subject.ilike.%${search}%,description.ilike.%${search}%`);
        }

        // Apply sorting
        if (sortBy === "updated") {
            query = query.order("updated_at", { ascending: sortOrder });
        } else if (sortBy === "created") {
            query = query.order("created_at", { ascending: sortOrder });
        } else if (sortBy === "status_changed") {
            query = query.order("status_changed_at", { ascending: sortOrder, nullsFirst: false });
        } else {
            query = query
                .order("priority_order", { ascending: true })
                .order("created_at", { ascending: false });
        }

        // Apply pagination
        const offset = (page - 1) * limit;
        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) {
            return badRequest(error.message);
        }

        return json({
            data,
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit)
            }
        });
    } catch (error: any) {
        return badRequest(error.message || "Unknown error");
    }
}
