import { withApiHandler } from "@/lib/api/handler";
import { createAdminClient } from "@/lib/supabase/server";
import { json, badRequest } from "@/lib/api";
import { NextRequest } from "next/server";
import { z } from "zod";

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic';

// Schema for PUT updates
const kanbanUpdateSchema = z.object({
    id: z.string().uuid(),
    board_status: z.enum(["backlog", "todo", "in_progress", "review", "done"]).optional(),
    priority_order: z.number().optional(),
    is_public: z.boolean().optional(),
    completed_at: z.string().nullable().optional(),
    target_release: z.enum(["now", "next", "later", "future"]).nullable().optional(),
});

/**
 * PUT /api/admin/kanban
 * Update a kanban card (superadmin only)
 */
export const PUT = withApiHandler({
    auth: 'superadmin',
    schema: kanbanUpdateSchema,
}, async ({ body, adminClient }) => {
    const { id, board_status, priority_order, is_public, completed_at, target_release } = body;

    // Build update object
    const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
    };

    if (board_status !== undefined) updates.board_status = board_status;
    if (priority_order !== undefined) updates.priority_order = priority_order;
    if (is_public !== undefined) updates.is_public = is_public;
    if (completed_at !== undefined) updates.completed_at = completed_at;
    if (target_release !== undefined) updates.target_release = target_release;

    // Update using admin client (bypasses RLS)
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

    return { success: true, data };
});

/**
 * GET /api/admin/kanban
 * Fetch all feedback for kanban with pagination, filtering, and search (superadmin only)
 */
export const GET = withApiHandler({
    auth: 'superadmin',
}, async ({ request }) => {
    const adminClient = createAdminClient();

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

    return {
        data,
        pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit)
        }
    };
});
