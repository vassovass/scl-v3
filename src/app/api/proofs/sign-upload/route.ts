import { z } from "zod";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { json, badRequest, unauthorized, serverError } from "@/lib/api";

const payloadSchema = z.object({
    content_type: z.string(),
});

const ALLOWED_TYPES: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/heic": "heic",
};

const PROOFS_BUCKET = "proofs";

export async function POST(request: Request): Promise<Response> {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return unauthorized();
        }

        const body = await request.json();
        const parsed = payloadSchema.safeParse(body);

        if (!parsed.success) {
            return badRequest("Invalid payload");
        }

        const { content_type } = parsed.data;
        const extension = ALLOWED_TYPES[content_type.toLowerCase()];

        if (!extension) {
            return badRequest(`Unsupported content type. Supported: ${Object.keys(ALLOWED_TYPES).join(", ")}`);
        }

        const fileKey = buildFileKey(user.id, extension);
        const adminClient = createAdminClient();

        const { data, error } = await adminClient
            .storage
            .from(PROOFS_BUCKET)
            .createSignedUploadUrl(fileKey);

        if (error || !data) {
            console.error("Failed to create signed upload URL:", error);
            return serverError("Failed to create upload URL");
        }

        return json({
            upload_url: data.signedUrl,
            path: fileKey,
            token: data.token,
        });
    } catch (error) {
        console.error("Sign upload error:", error);
        return serverError(error instanceof Error ? error.message : "Unknown error");
    }
}

function buildFileKey(userId: string, extension: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `${userId}/${timestamp}-${random}.${extension}`;
}

