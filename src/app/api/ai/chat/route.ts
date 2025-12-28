/**
 * AI Chat API
 * 
 * POST /api/ai/chat - Interactive chat with context of feedback items
 */

import { withApiHandler } from "@/lib/api/handler";
import { aiChatSchema } from "@/lib/schemas/feedback";
import { chatWithAI, FeedbackItem } from "@/lib/server/gemini";

export const dynamic = 'force-dynamic';

export const POST = withApiHandler({
    auth: 'superadmin',
    schema: aiChatSchema,
}, async ({ body, adminClient }) => {
    const { message, conversationHistory } = body;

    // 1. Fetch relevant items for context
    // We prioritize "active" items (not done/ignored) to keep context focused
    // and within reasonable token limits.
    const { data: items, error } = await adminClient
        .from("feedback")
        .select("id, subject, type, board_status, priority_order, description")
        .in("board_status", ["backlog", "todo", "in_progress", "review"])
        .order("priority_order", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(100);

    if (error) {
        return { success: false, error: error.message };
    }

    // 2. Call Gemini Chat
    try {
        // Cast items to match FeedbackItem interface (missing screenshot_url is fine here)
        const response = await chatWithAI(
            message,
            (items || []) as unknown as FeedbackItem[],
            conversationHistory
        );

        return {
            success: true,
            data: response
        };
    } catch (e) {
        console.error("AI Chat Error:", e);
        return {
            success: false,
            error: "Failed to generate AI response"
        };
    }
});
