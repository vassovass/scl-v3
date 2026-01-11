import { withApiHandler } from "@/lib/api/handler";
import { z } from "zod";

// Schema for POST
const HighFiveSchema = z.object({
    recipient_id: z.string().uuid(),
    submission_id: z.string().uuid().optional(),
    league_id: z.string().uuid().optional(),
});

export const POST = withApiHandler({
    auth: 'required',
    schema: HighFiveSchema
}, async ({ user, body, adminClient }) => {
    if (!user) throw new Error("User required");

    const { recipient_id, submission_id, league_id } = body;

    const { data, error } = await adminClient
        .from('high_fives')
        .upsert({
            sender_id: user.id,
            recipient_id,
            submission_id: submission_id || null, // Optional
            league_id: league_id || null // Optional if not tied to league context yet
        }, {
            onConflict: 'sender_id, submission_id, recipient_id',
            ignoreDuplicates: true
        })
        .select()
        .single();

    if (error) {
        console.error("High five error:", error);
        throw new Error(error.message);
    }

    return { success: true, data };
});

const DeleteHighFiveSchema = z.object({
    recipient_id: z.string().uuid().optional(),
    submission_id: z.string().uuid().optional()
});

export const DELETE = withApiHandler({
    auth: 'required',
    schema: DeleteHighFiveSchema
}, async ({ user, body, adminClient }) => {
    if (!user) throw new Error("User required");

    const { recipient_id, submission_id } = body;

    let query = adminClient
        .from('high_fives')
        .delete()
        .eq('sender_id', user.id);

    if (recipient_id) query = query.eq('recipient_id', recipient_id);
    if (submission_id) {
        query = query.eq('submission_id', submission_id);
    } else {
        // If no submission_id, we might be deleting a 'general' high five? 
        // For now, assume strict matching. If submission_id is undefined in body, 
        // we should probably look for null.
        query = query.is('submission_id', null);
    }

    const { error } = await query;

    if (error) throw new Error(error.message);

    return { success: true };
});
