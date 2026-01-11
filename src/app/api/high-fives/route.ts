import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { recipient_id, submission_id, league_id } = body;

        if (!recipient_id) {
            return NextResponse.json({ error: "Recipient ID required" }, { status: 400 });
        }

        // Insert high five
        // If a high-five already exists for this sender/recipient/submission tuple, do nothing (idempotent)
        const { data, error } = await supabase
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
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });

    } catch (err) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { recipient_id, submission_id } = body;

        // Delete based on composite key (sender, recipient, submission)
        let query = supabase
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

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (err) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
