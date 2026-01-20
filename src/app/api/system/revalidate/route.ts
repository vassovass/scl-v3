import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { CacheTags } from "@/lib/cache/registry";

// Secure token to prevent unauthorized invalidation
// In production, this should be in process.env.REVALIDATION_TOKEN
const SYSTEM_TOKEN = process.env.REVALIDATION_TOKEN || "deployment-token";

export async function POST(req: NextRequest) {
    try {
        const token = req.headers.get("x-admin-token");

        if (token !== SYSTEM_TOKEN) {
            return NextResponse.json({ message: "Invalid token" }, { status: 401 });
        }

        const body = await req.json();
        const { type, record, old_record } = body;

        // Logic to map DB events to Cache Tags
        // This expects Supabase Webhooks payload format
        let tagsToInvalidate: string[] = [];

        // Table: leagues
        if (body.table === "leagues") {
            // Invalidate the generic list
            tagsToInvalidate.push(CacheTags.LEAGUES);

            // If updating/deleting, invalidate specific league
            if (record?.id) {
                tagsToInvalidate.push(CacheTags.LEAGUE_DETAILS(record.id));
            }
            if (old_record?.id) {
                tagsToInvalidate.push(CacheTags.LEAGUE_DETAILS(old_record.id));
            }
        }

        // Table: memberships
        if (body.table === "memberships") {
            // Invalidate the user's league list
            if (record?.user_id) tagsToInvalidate.push(CacheTags.USER_LEAGUES(record.user_id));
            if (old_record?.user_id) tagsToInvalidate.push(CacheTags.USER_LEAGUES(old_record.user_id));

            // Invalidate league member lists
            if (record?.league_id) tagsToInvalidate.push(CacheTags.LEAGUE_MEMBERS(record.league_id));
        }

        // Table: branding
        if (body.table === "brand_settings") {
            tagsToInvalidate.push(CacheTags.BRANDING);
        }

        if (tagsToInvalidate.length === 0) {
            return NextResponse.json({ message: "No tags matched", revalidated: false });
        }

        // Deduplicate
        const uniqueTags = Array.from(new Set(tagsToInvalidate));

        // Execute revalidation
        for (const tag of uniqueTags) {
            revalidateTag(tag);
        }

        return NextResponse.json({
            revalidated: true,
            tags: uniqueTags,
            now: Date.now()
        });

    } catch (err) {
        console.error("Webhook Error:", err);
        return NextResponse.json({ message: "Error revalidating" }, { status: 500 });
    }
}

