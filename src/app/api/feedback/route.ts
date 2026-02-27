import { withApiHandler } from "@/lib/api/handler";
import { z } from "zod";
import { badRequest } from "@/lib/api";
import { log } from "@/lib/server/logger";

const feedbackSchema = z.object({
    type: z.enum(["bug", "feature", "general", "positive", "negative"]),
    subject: z.string().optional(),
    description: z.string().min(1, "Description is required"),
    page_url: z.string().nullable().optional(),
    screenshot: z.string().nullable().optional(), // base64 data URL
});

/**
 * POST /api/feedback
 * Submit user feedback (anonymous or authenticated)
 */
export const POST = withApiHandler({
    auth: 'none', // Feedback can be anonymous
    schema: feedbackSchema,
    rateLimit: { maxRequests: 3, windowMs: 60_000 },
}, async ({ user, body, adminClient, request }) => {
    const { type, subject, description, page_url, screenshot } = body;

    log("info", "feedback_submitting", {
        type,
        subject,
        hasUser: !!user,
        page_url,
        hasScreenshot: !!screenshot,
    }, user?.id);

    // Upload screenshot if provided
    let screenshotUrl: string | null = null;
    if (screenshot && screenshot.startsWith("data:image")) {
        try {
            const base64Data = screenshot.replace(/^data:image\/\w+;base64,/, "");
            const buffer = Buffer.from(base64Data, "base64");
            const fileName = `feedback/${Date.now()}-${user?.id || 'anon'}.png`;

            const { data: uploadData, error: uploadError } = await adminClient.storage
                .from("uploads")
                .upload(fileName, buffer, {
                    contentType: "image/png",
                    upsert: false,
                });

            if (uploadError) {
                log("error", "feedback_screenshot_upload_error", { error: uploadError.message }, user?.id);
            } else if (uploadData) {
                const { data: urlData } = adminClient.storage.from("uploads").getPublicUrl(uploadData.path);
                screenshotUrl = urlData.publicUrl;
            }
        } catch (err) {
            log("error", "feedback_screenshot_upload_failed", { error: err instanceof Error ? err.message : "Unknown" }, user?.id);
        }
    }

    // Insert feedback record
    const insertData = {
        user_id: user?.id || null,
        type,
        subject: subject || null,
        description,
        page_url: page_url || null,
        screenshot_url: screenshotUrl,
        user_agent: request.headers.get("user-agent"),
        status: "pending",
        board_status: "backlog", // Ensure it appears in kanban
    };

    log("debug", "feedback_inserting", { type, subject, hasScreenshot: !!screenshotUrl }, user?.id);

    const { data, error: insertError } = await adminClient
        .from("feedback")
        .insert(insertData)
        .select()
        .single();

    if (insertError) {
        log("error", "feedback_insert_error", { error: insertError.message }, user?.id);
        return badRequest(`Failed to submit feedback: ${insertError.message}`);
    }

    log("info", "feedback_submitted", { feedbackId: data?.id, type }, user?.id);
    return { success: true, id: data?.id };
});


