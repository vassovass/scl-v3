/**
 * Merge Feedback API
 * 
 * POST /api/admin/feedback/merge - Merge multiple items into one
 */

import { withApiHandler } from "@/lib/api/handler";
import { mergeSchema } from "@/lib/schemas/feedback";
import { generateMergedDescription, FeedbackItem } from "@/lib/server/gemini";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export const POST = withApiHandler({
    auth: 'superadmin',
    schema: mergeSchema,
}, async ({ body, adminClient }) => {
    const { primaryId, secondaryIds, mergedDescription: manualDescription, useAI } = body;

    // 1. Fetch all items involved
    const { data: items, error: fetchError } = await adminClient
        .from("feedback")
        .select("*")
        .in("id", [primaryId, ...secondaryIds]);

    if (fetchError || !items) {
        return { success: false, error: fetchError?.message || "Items not found" };
    }

    const primaryItem = items.find(i => i.id === primaryId);
    if (!primaryItem) {
        return { success: false, error: "Primary item not found" };
    }

    // 2. Generate Description (AI or Manual)
    let finalDescription = manualDescription || primaryItem.description || "";

    if (useAI) {
        // Use Gemini to generate description
        // Cast to FeedbackItem to ensure compatibility (types might mismatch slightly with DB row)
        // We know the shape matches enough for Gemini needs
        try {
            finalDescription = await generateMergedDescription(items as unknown as FeedbackItem[]);
        } catch (e) {
            console.error("Gemini Merge Error:", e);
            // Fallback to manual concat if AI fails
            if (!manualDescription) {
                finalDescription = items.map(i => `[${i.subject}]: ${i.description}`).join("\n\n---\n\n");
            }
        }
    }

    // 3. Handle Attachments (Pre-PRD 19 workaround)
    // Append secondary screenshots to description as markdown
    const secondaryScreenshots = items
        .filter(i => i.id !== primaryId && i.screenshot_url)
        .map((i, idx) => `\n\n![Merged Screenshot ${idx + 1}](${i.screenshot_url})`);

    if (secondaryScreenshots.length > 0) {
        finalDescription += "\n\n### Merged Attachments" + secondaryScreenshots.join("");
    }

    // PREVIEW MODE: Return description without updating DB
    const { preview } = body;
    if (preview) {
        return {
            success: true,
            description: finalDescription,
            mergedCount: secondaryIds.length
        };
    }

    // 4. Perform Updates (Transaction-like)

    // A. Update primary item
    const { error: updateError } = await adminClient
        .from("feedback")
        .update({
            description: finalDescription,
            updated_at: new Date().toISOString(),
        })
        .eq("id", primaryId);

    if (updateError) {
        return { success: false, error: updateError.message };
    }

    // B. Archive secondary items
    const { error: archiveError } = await adminClient
        .from("feedback")
        .update({
            board_status: "done", // Mark as done/archived
            merged_into_id: primaryId,
            updated_at: new Date().toISOString(),
        })
        .in("id", secondaryIds);

    if (archiveError) {
        console.error("Failed to archive secondary items:", archiveError);
        // We don't rollback primary update here as Supabase doesn't support easy rollback over HTTP
        // Ideally this would be a stored procedure
    }

    return {
        success: true,
        primaryId,
        mergedCount: secondaryIds.length
    };
});
