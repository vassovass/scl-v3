import { withApiHandler } from "@/lib/api/handler";
import { z } from "zod";

/**
 * Agent Current Work API (SuperAdmin only)
 *
 * POST: Set current work item
 * PATCH: Mark work as pending_review
 * GET: Get current active agent work
 * DELETE: Clear agent work
 */

const postSchema = z.object({
  feedback_id: z.string().uuid().optional(),
  subject: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(["feature", "bug", "improvement", "question"]).default("feature"),
});

const patchSchema = z.object({
  feedback_id: z.string().uuid(),
  action: z.enum(["pending_review"]),
});

// POST: Set current work (agent starts working)
export const POST = withApiHandler({
  auth: 'superadmin',
  schema: postSchema,
}, async ({ body, adminClient }) => {
  const { feedback_id, subject, description, type } = body;

  // Clear any existing agent work first
  await adminClient
    .from("feedback")
    .update({
      is_agent_working: false,
      agent_work_started_at: null
    })
    .eq("is_agent_working", true);

  let targetId = feedback_id;

  // If no feedback_id but have subject, check for existing entry first
  if (!feedback_id && subject) {
    const { data: existing } = await adminClient
      .from("feedback")
      .select("id, subject, description")
      .eq("subject", subject)
      .limit(1)
      .maybeSingle();

    if (existing) {
      const { data, error } = await adminClient
        .from("feedback")
        .update({
          description: description || existing.description,
          board_status: "in_progress",
          target_release: "now",
          is_agent_working: true,
          agent_work_started_at: new Date().toISOString(),
          completion_status: "in_progress",
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return { success: true, data, updated: true, message: "Updated existing entry" };
    }

    // No existing entry found, create new one
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

    if (createError) throw new Error(createError.message);
    return { success: true, data: newItem, created: true };
  }

  // Mark existing item as active (when feedback_id is provided)
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

    if (error) throw new Error(error.message);
    return { success: true, data, created: false };
  }

  throw new Error("Must provide feedback_id or subject");
});

// PATCH: Mark work as pending_review
export const PATCH = withApiHandler({
  auth: 'superadmin',
  schema: patchSchema,
}, async ({ body, adminClient }) => {
  const { feedback_id, action } = body;

  if (action === "pending_review") {
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

    if (error) throw new Error(error.message);
    return { success: true, data, status: "pending_review" };
  }

  throw new Error("Invalid action. Use: pending_review");
});

// GET: Get current active agent work
export const GET = withApiHandler({
  auth: 'superadmin',
}, async ({ adminClient }) => {
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

  if (error) throw new Error(error.message);
  return { data };
});

// DELETE: Clear agent work
export const DELETE = withApiHandler({
  auth: 'superadmin',
}, async ({ adminClient }) => {
  const { data, error } = await adminClient
    .from("feedback")
    .update({
      is_agent_working: false,
      agent_work_started_at: null
    })
    .eq("is_agent_working", true)
    .select();

  if (error) throw new Error(error.message);
  return { success: true, cleared: data?.length || 0 };
});
