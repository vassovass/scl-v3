import { createAdminClient } from "@/lib/supabase/server";
import { json, badRequest, serverError } from "@/lib/api";

export async function POST(request: Request) {
    try {
        const formData = await request.formData();

        const type = formData.get("type") as string;
        const subject = formData.get("subject") as string;
        const description = formData.get("description") as string;
        const email = formData.get("email") as string;
        const screenshot = formData.get("screenshot") as File | null;

        if (!subject || !description) {
            return badRequest("Subject and description are required");
        }

        const adminClient = createAdminClient();

        // Upload screenshot if provided
        let screenshotUrl: string | null = null;
        if (screenshot && screenshot.size > 0) {
            const fileName = `feedback/${Date.now()}-${screenshot.name}`;
            const buffer = Buffer.from(await screenshot.arrayBuffer());

            const { data: uploadData, error: uploadError } = await adminClient.storage
                .from("uploads")
                .upload(fileName, buffer, {
                    contentType: screenshot.type,
                    upsert: false,
                });

            if (uploadError) {
                console.error("Screenshot upload error:", uploadError);
            } else {
                const { data: urlData } = adminClient.storage.from("uploads").getPublicUrl(uploadData.path);
                screenshotUrl = urlData.publicUrl;
            }
        }

        // Store feedback in database (or you could send email, use a webhook, etc.)
        const { error: insertError } = await adminClient
            .from("feedback")
            .insert({
                type,
                subject,
                description,
                email: email || null,
                screenshot_url: screenshotUrl,
                user_agent: request.headers.get("user-agent"),
                created_at: new Date().toISOString(),
            });

        if (insertError) {
            // If feedback table doesn't exist, log to console instead
            console.log("=== FEEDBACK RECEIVED ===");
            console.log("Type:", type);
            console.log("Subject:", subject);
            console.log("Description:", description);
            console.log("Email:", email);
            console.log("Screenshot:", screenshotUrl);
            console.log("=========================");
        }

        return json({ success: true });
    } catch (error) {
        console.error("Feedback error:", error);
        return serverError(error instanceof Error ? error.message : "Unknown error");
    }
}
