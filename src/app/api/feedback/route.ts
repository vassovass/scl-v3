import { withApiHandler } from "@/lib/api/handler";
import { z } from "zod";
import { badRequest } from "@/lib/api";

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
}, async ({ user, body, adminClient, request }) => {
    const { type, subject, description, page_url, screenshot } = body;

    console.log("[Feedback API] Submitting feedback:", {
        type,
        subject,
        hasUser: !!user,
        userId: user?.id,
        page_url,
        hasScreenshot: !!screenshot,
    });

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
                console.error("[Feedback API] Screenshot upload error:", uploadError);
            } else if (uploadData) {
                const { data: urlData } = adminClient.storage.from("uploads").getPublicUrl(uploadData.path);
                screenshotUrl = urlData.publicUrl;
            }
        } catch (err) {
            console.error("[Feedback API] Screenshot upload failed:", err);
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

    console.log("[Feedback API] Inserting:", insertData);

    const { data, error: insertError } = await adminClient
        .from("feedback")
        .insert(insertData)
        .select()
        .single();

    if (insertError) {
        console.error("[Feedback API] Insert error:", insertError);
        return badRequest(`Failed to submit feedback: ${insertError.message}`);
    }

    console.log("[Feedback API] Success:", data?.id);
    return { success: true, id: data?.id };
});

