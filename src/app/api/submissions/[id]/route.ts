import { z } from "zod";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { json, badRequest, unauthorized, forbidden, notFound, serverError } from "@/lib/api";

// Schema for PATCH updates
const updateSchema = z.object({
    for_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    steps: z.number().int().min(0).max(150000).optional(),
    proof_path: z.string().nullable().optional(),
    reason: z.string().max(500).optional(), // User comment for audit log
});

// PRD 41: Use "*" to avoid runtime 500s when DB schema changes.
// proxy_member_id was removed - proxies now use user_id directly.
const submissionSelect = "*";

// GET /api/submissions/[id] - Fetch single submission with change history
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
    try {
        const { id } = await params;

        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return unauthorized();
        }

        const adminClient = createAdminClient();

        // Fetch submission
        const { data: submission, error: subError } = await adminClient
            .from("submissions")
            .select(submissionSelect)
            .eq("id", id)
            .single();

        if (subError || !submission) {
            return notFound("Submission not found");
        }

        // Verify ownership or proxy admin status
        if (submission.user_id !== user.id) {
            let hasAccess = false;

            // Check if superadmin
            const { data: userData } = await adminClient
                .from("users")
                .select("is_superadmin")
                .eq("id", user.id)
                .single();

            if (userData?.is_superadmin) {
                hasAccess = true;
            } else {
                // PRD 41: Check if submission belongs to a proxy managed by current user
                const { data: proxyUser } = await adminClient
                    .from("users")
                    .select("managed_by")
                    .eq("id", submission.user_id)
                    .maybeSingle();

                if (proxyUser?.managed_by === user.id) {
                    hasAccess = true;
                }
            }

            if (!hasAccess) {
                return forbidden("You do not have permission to view this submission");
            }
        }

        // Fetch change history
        const { data: changes } = await adminClient
            .from("submission_changes")
            .select("id, field_name, old_value, new_value, reason, created_at")
            .eq("submission_id", id)
            .order("created_at", { ascending: false })
            .limit(50);

        return json({
            submission,
            changes: changes || [],
        });
    } catch (error) {
        console.error("Submission GET error:", error);
        return serverError(error instanceof Error ? error.message : "Unknown error");
    }
}

// PATCH /api/submissions/[id] - Update submission with audit logging
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
    try {
        const { id } = await params;

        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return unauthorized();
        }

        const body = await request.json();
        const parsed = updateSchema.safeParse(body);

        if (!parsed.success) {
            return badRequest("Invalid payload: " + parsed.error.message);
        }

        const input = parsed.data;
        const adminClient = createAdminClient();

        // Fetch existing submission
        const { data: existing, error: fetchError } = await adminClient
            .from("submissions")
            .select("id, user_id, for_date, steps, proof_path, league_id")
            .eq("id", id)
            .single();

        if (fetchError || !existing) {
            return notFound("Submission not found");
        }

        // Verify ownership or proxy manager status
        if (existing.user_id !== user.id) {
            let hasAccess = false;

            // PRD 41: Check if submission belongs to a proxy managed by current user
            const { data: proxyUser } = await adminClient
                .from("users")
                .select("managed_by")
                .eq("id", existing.user_id)
                .maybeSingle();

            if (proxyUser?.managed_by === user.id) {
                hasAccess = true;
            }

            // Also allow superadmin
            const { data: userData } = await adminClient
                .from("users")
                .select("is_superadmin")
                .eq("id", user.id)
                .single();
            if (userData?.is_superadmin) hasAccess = true;

            if (!hasAccess) {
                return forbidden("You do not have permission to edit this submission");
            }
        }

        // Validate: no future dates
        if (input.for_date) {
            const today = new Date();
            today.setHours(23, 59, 59, 999);
            const newDate = new Date(input.for_date + "T00:00:00");

            if (newDate > today) {
                return badRequest("Cannot set date to a future date");
            }
        }

        // Build update object and track changes
        const updates: Record<string, unknown> = {};
        const changes: Array<{
            field_name: string;
            old_value: string | null;
            new_value: string | null;
        }> = [];

        if (input.for_date !== undefined && input.for_date !== existing.for_date) {
            updates.for_date = input.for_date;
            changes.push({
                field_name: "for_date",
                old_value: existing.for_date,
                new_value: input.for_date,
            });
        }

        if (input.steps !== undefined && input.steps !== existing.steps) {
            updates.steps = input.steps;
            // When steps change manually, clear verified status
            updates.verified = null;
            updates.verification_notes = "Steps manually edited - verification cleared";
            changes.push({
                field_name: "steps",
                old_value: String(existing.steps),
                new_value: String(input.steps),
            });
        }

        if (input.proof_path !== undefined && input.proof_path !== existing.proof_path) {
            updates.proof_path = input.proof_path;
            // Clear verification when proof changes
            if (input.proof_path === null) {
                updates.verified = null;
                updates.verification_notes = "Proof removed - verification cleared";
            }
            changes.push({
                field_name: "proof_path",
                old_value: existing.proof_path,
                new_value: input.proof_path,
            });
        }

        if (Object.keys(updates).length === 0) {
            return badRequest("No changes provided");
        }

        // Log changes to audit table
        if (changes.length > 0) {
            const changeRecords = changes.map(c => ({
                submission_id: id,
                user_id: user.id,
                field_name: c.field_name,
                old_value: c.old_value,
                new_value: c.new_value,
                reason: input.reason || null,
            }));

            const { error: logError } = await adminClient
                .from("submission_changes")
                .insert(changeRecords);

            if (logError) {
                console.error("Failed to log submission changes:", logError);
                // Don't fail the request, just log the error
            }
        }

        // Apply updates
        const { data: updated, error: updateError } = await adminClient
            .from("submissions")
            .update(updates)
            .eq("id", id)
            .select(submissionSelect)
            .single();

        if (updateError) {
            console.error("Submission update error:", updateError);
            return serverError(updateError.message);
        }

        return json({
            submission: updated,
            changes_logged: changes.length,
        });
    } catch (error) {
        console.error("Submission PATCH error:", error);
        return serverError(error instanceof Error ? error.message : "Unknown error");
    }
}

// DELETE /api/submissions/[id] - Delete submission with audit logging
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
    try {
        const { id } = await params;

        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return unauthorized();
        }

        // Get optional reason from query params
        const url = new URL(request.url);
        const reason = url.searchParams.get("reason") || "Deleted by user";

        const adminClient = createAdminClient();

        // Fetch existing submission
        const { data: existing, error: fetchError } = await adminClient
            .from("submissions")
            .select("id, user_id, for_date, steps, league_id")
            .eq("id", id)
            .single();

        if (fetchError || !existing) {
            return notFound("Submission not found");
        }

        // Verify ownership or proxy manager status
        if (existing.user_id !== user.id) {
            let hasAccess = false;

            // PRD 41: Check if submission belongs to a proxy managed by current user
            const { data: proxyUser } = await adminClient
                .from("users")
                .select("managed_by")
                .eq("id", existing.user_id)
                .maybeSingle();

            if (proxyUser?.managed_by === user.id) {
                hasAccess = true;
            }

            const { data: userData } = await adminClient
                .from("users")
                .select("is_superadmin")
                .eq("id", user.id)
                .single();
            if (userData?.is_superadmin) hasAccess = true;

            if (!hasAccess) {
                return forbidden("You do not have permission to delete this submission");
            }
        }

        // Log deletion before removing
        await adminClient.from("submission_changes").insert({
            submission_id: id,
            user_id: user.id,
            field_name: "deleted",
            old_value: JSON.stringify({
                for_date: existing.for_date,
                steps: existing.steps,
            }),
            new_value: null,
            reason,
        });

        // Delete the submission
        const { error: deleteError } = await adminClient
            .from("submissions")
            .delete()
            .eq("id", id);

        if (deleteError) {
            console.error("Submission delete error:", deleteError);
            return serverError(deleteError.message);
        }

        return json({ success: true, deleted_id: id });
    } catch (error) {
        console.error("Submission DELETE error:", error);
        return serverError(error instanceof Error ? error.message : "Unknown error");
    }
}
