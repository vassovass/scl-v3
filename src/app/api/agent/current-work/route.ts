import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { json, badRequest, unauthorized } from "@/lib/api";
import { NextRequest } from "next/server";

/**
 * Agent Current Work API
 * 
 * POST: Set current work item
 * - feedback_id: Mark existing item as active
 * - OR subject/description/type: Create new item and mark active
 * 
 * GET: Get current active agent work
 * 
 * DELETE: Clear agent work (when task completes)
 */

// POST: Set current work (agent starts working)
export async function POST(request: NextRequest) {
    try {
        const adminClient = createAdminClient();
        const body = await request.json();
        const { feedback_id, subject, description, type = "feature" } = body;

        // Clear any existing agent work first
        await adminClient
            .from("feedback")
            .update({
                is_agent_working: false,
                agent_work_started_at: null
            })
            .eq("is_agent_working", true);

        let targetId = feedback_id;

        // If no feedback_id, create a new item
        if (!feedback_id && subject) {
            const { data: newItem, error: createError } = await adminClient
                .from("feedback")
                .insert({
                    type,
                    subject,
                    description: description || "",
                    board_status: "in_progress",
                    target_release: "now",
                    is_public: true,
                    is_agent_working: true,
                    agent_work_started_at: new Date().toISOString(),
                    completion_status: "in_progress",
                })
                .select()
                .single();

            if (createError) {
                console.error("Create agent work error:", createError);
                return badRequest(createError.message);
            }

            return json({ success: true, data: newItem, created: true });
        }

        // Mark existing item as active
        if (targetId) {
            const { data, error } = await adminClient
                .from("feedback")
                .update({
                    is_agent_working: true,
                    agent_work_started_at: new Date().toISOString(),
                    board_status: "in_progress",
                    target_release: "now",
                    completion_status: "in_progress",
                })
                .eq("id", targetId)
                .select()
                .single();

            if (error) {
                console.error("Update agent work error:", error);
                return badRequest(error.message);
            }

            return json({ success: true, data, created: false });
        }

        return badRequest("Must provide feedback_id or subject");
    } catch (error: any) {
        console.error("Agent work API error:", error);
        return badRequest(error.message || "Unknown error");
    }
}

// PATCH: Mark work as pending_review (agent finished coding, awaiting superadmin verification)
export async function PATCH(request: NextRequest) {
    try {
        const adminClient = createAdminClient();
        const body = await request.json();
        const { feedback_id, action } = body;

        if (!feedback_id) {
            return badRequest("feedback_id required");
        }

        if (action === "pending_review") {
            // Agent finished coding, move to pending review
            const { data, error } = await adminClient
                .from("feedback")
                .update({
                    is_agent_working: false,
                    agent_work_started_at: null,
                    completion_status: "pending_review",
                    board_status: "review",
                })
                .eq("id", feedback_id)
                .select()
                .single();

            if (error) {
                return badRequest(error.message);
            }

            // TODO: Send notification to superadmin
            console.log(`[NOTIFICATION] Feature "${data.subject}" is ready for verification`);

            return json({ success: true, data, status: "pending_review" });
        }

        return badRequest("Invalid action. Use: pending_review");
    } catch (error: any) {
        return badRequest(error.message || "Unknown error");
    }
}

// GET: Get current active agent work
export async function GET() {
    try {
        const adminClient = createAdminClient();

        // Get items where agent is working, clear if stale (>24h)
        const staleThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        // Clear stale work
        await adminClient
            .from("feedback")
            .update({
                is_agent_working: false,
                agent_work_started_at: null
            })
            .eq("is_agent_working", true)
            .lt("agent_work_started_at", staleThreshold);

        // Get active agent work
        const { data, error } = await adminClient
            .from("feedback")
            .select("*")
            .eq("is_agent_working", true)
            .order("agent_work_started_at", { ascending: false });

        if (error) {
            return badRequest(error.message);
        }

        return json({ data });
    } catch (error: any) {
        return badRequest(error.message || "Unknown error");
    }
}

// DELETE: Clear agent work
export async function DELETE() {
    try {
        const adminClient = createAdminClient();

        const { data, error } = await adminClient
            .from("feedback")
            .update({
                is_agent_working: false,
                agent_work_started_at: null
            })
            .eq("is_agent_working", true)
            .select();

        if (error) {
            return badRequest(error.message);
        }

        return json({ success: true, cleared: data?.length || 0 });
    } catch (error: any) {
        return badRequest(error.message || "Unknown error");
    }
}
