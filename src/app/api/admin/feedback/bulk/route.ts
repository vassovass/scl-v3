import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { json, badRequest, unauthorized } from "@/lib/api";
import { NextRequest } from "next/server";

// POST: Bulk update multiple feedback items at once
export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return unauthorized();

        // Check if superadmin
        const { data: isAdmin } = await supabase.rpc("is_superadmin");
        if (!isAdmin) return unauthorized("Superadmin access required");

        const body = await request.json();
        const { ids, updates } = body;

        // Validate input
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return badRequest("Missing or empty 'ids' array");
        }
        if (!updates || typeof updates !== "object") {
            return badRequest("Missing 'updates' object");
        }
        if (ids.length > 100) {
            return badRequest("Maximum 100 items per bulk operation");
        }

        // Build update object with only allowed fields
        const allowedFields = [
            "board_status",
            "priority_order",
            "is_public",
            "completed_at",
            "target_release",
            "completion_status"
        ];

        const sanitizedUpdates: Record<string, any> = {
            updated_at: new Date().toISOString(),
        };

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                sanitizedUpdates[field] = updates[field];
            }
        }

        // If only updated_at was set, no valid fields provided
        if (Object.keys(sanitizedUpdates).length === 1) {
            return badRequest("No valid update fields provided. Allowed: " + allowedFields.join(", "));
        }

        // Perform bulk update using admin client
        const adminClient = createAdminClient();
        const { data, error, count } = await adminClient
            .from("feedback")
            .update(sanitizedUpdates)
            .in("id", ids)
            .select("id, board_status, is_public, priority_order");

        if (error) {
            console.error("Bulk update error:", error);
            return badRequest(error.message);
        }

        return json({
            success: true,
            updated: data?.length || 0,
            data
        });
    } catch (error: any) {
        console.error("Bulk API error:", error);
        return badRequest(error.message || "Unknown error");
    }
}
