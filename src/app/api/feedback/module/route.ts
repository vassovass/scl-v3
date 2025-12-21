import { createAdminClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { json, badRequest, serverError } from "@/lib/api";
import { z } from "zod";

const payloadSchema = z.object({
    module_id: z.string().min(1),
    module_name: z.string().optional(),
    feedback_type: z.enum(["positive", "negative"]),
    comment: z.string().nullable().optional(),
    screenshot: z.string().nullable().optional(), // base64 data URL
    page_url: z.string().nullable().optional(),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const parsed = payloadSchema.safeParse(body);

        if (!parsed.success) {
            return badRequest("Invalid payload");
        }

        const { module_id, module_name, feedback_type, comment, screenshot, page_url } = parsed.data;

        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        const adminClient = createAdminClient();

        // Upload screenshot if provided
        let screenshotUrl: string | null = null;
        if (screenshot && screenshot.startsWith("data:image")) {
            try {
                // Convert base64 to buffer
                const base64Data = screenshot.replace(/^data:image\/\w+;base64,/, "");
                const buffer = Buffer.from(base64Data, "base64");
                const fileName = `module-feedback/${Date.now()}-${module_id}.png`;

                const { data: uploadData, error: uploadError } = await adminClient.storage
                    .from("uploads")
                    .upload(fileName, buffer, {
                        contentType: "image/png",
                        upsert: false,
                    });

                if (!uploadError && uploadData) {
                    const { data: urlData } = adminClient.storage.from("uploads").getPublicUrl(uploadData.path);
                    screenshotUrl = urlData.publicUrl;
                }
            } catch (err) {
                console.error("Screenshot upload failed:", err);
            }
        }

        // Insert feedback record
        const { error: insertError } = await adminClient
            .from("module_feedback")
            .insert({
                module_id,
                module_name: module_name || module_id,
                feedback_type,
                comment: comment || null,
                screenshot_url: screenshotUrl,
                page_url: page_url || null,
                user_id: user?.id || null,
                user_agent: request.headers.get("user-agent"),
            });

        if (insertError) {
            // Fallback: log to console if table doesn't exist
            console.log("=== MODULE FEEDBACK ===");
            console.log("Module:", module_id, module_name);
            console.log("Type:", feedback_type);
            console.log("Comment:", comment);
            console.log("Screenshot:", screenshotUrl ? "Yes" : "No");
            console.log("User:", user?.id || "Anonymous");
            console.log("=======================");
        }

        return json({ success: true });
    } catch (error) {
        console.error("Module feedback error:", error);
        return serverError(error instanceof Error ? error.message : "Unknown error");
    }
}
