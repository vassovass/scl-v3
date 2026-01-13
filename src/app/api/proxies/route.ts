import { z } from "zod";
import { withApiHandler } from "@/lib/api/handler";
import { reportErrorClient, AppError, ErrorCode } from "@/lib/errors";

const createProxySchema = z.object({
    display_name: z.string().min(1, "Name is required").max(50, "Name too long"),
});

// GET /api/proxies - List all proxies managed by the current user
export const GET = withApiHandler({
    auth: "required",
}, async ({ user, adminClient }) => {
    const { data: proxies, error } = await adminClient
        .from("users")
        .select("id, display_name, nickname, created_at, invite_code")
        .eq("managed_by", user!.id)
        .eq("is_proxy", true)
        .order("created_at", { ascending: false });

    if (error) {
        throw new AppError({
            code: ErrorCode.DB_QUERY_FAILED,
            message: "Failed to fetch proxies",
            cause: error
        });
    }

    return { proxies };
});

// POST /api/proxies - Create a new proxy user
export const POST = withApiHandler({
    auth: "required",
    schema: createProxySchema,
}, async ({ user, body, adminClient }) => {
    // Generate a random UUID for the new user ID
    // Note: We use adminClient to insert into users table as it might bypassing RLS for exact UUID generation if needed, 
    // but RLS should allow insert where managed_by = auth.uid()

    // We need to generate a unique invite code
    // Simple alphanumeric 8 chars
    const inviteCode = Math.random().toString(36).substring(2, 10);

    const { data: newProxy, error } = await adminClient
        .from("users")
        .insert({
            id: crypto.randomUUID(), // Generate ID user-side or let DB do it? DB default is gen_random_uuid() usually, but users table might differ.
            // Checking schema... users.id is UUID.
            display_name: body.display_name,
            nickname: body.display_name,
            managed_by: user!.id,
            is_proxy: true,
            invite_code: inviteCode,
            is_superadmin: false,
        })
        .select()
        .single();

    if (error) {
        throw new AppError({
            code: ErrorCode.DB_INSERT_FAILED,
            message: "Failed to create proxy user",
            cause: error
        });
    }

    return { proxy: newProxy };
});

// DELETE /api/proxies?id=xxx - Delete a proxy user
export const DELETE = withApiHandler({
    auth: "required",
}, async ({ user, request, adminClient }) => {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
        return { error: "Proxy ID required", status: 400 };
    }

    // Verify ownership before delete (RLS does this, but good to be explicit/safe with adminClient)
    const { data: proxy } = await adminClient
        .from("users")
        .select("id, managed_by")
        .eq("id", id)
        .single();

    if (!proxy || proxy.managed_by !== user!.id) {
        return { error: "Proxy not found or unauthorized", status: 404 };
    }

    const { error } = await adminClient
        .from("users")
        .delete()
        .eq("id", id);

    if (error) {
        throw new AppError({
            code: ErrorCode.DB_DELETE_FAILED,
            message: "Failed to delete proxy",
            cause: error
        });
    }

    return { success: true };
});
