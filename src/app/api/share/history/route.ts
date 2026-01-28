/**
 * Share History API
 *
 * GET /api/share/history
 * Returns the user's share card history for "Recently Shared" feature.
 *
 * PRD-51: Social Sharing & Stats Hub
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";

// Type for share card from database
interface ShareCardRow {
    id: string;
    short_code: string;
    card_type: string;
    metric_type: string;
    metric_value: number;
    period_start: string | null;
    period_end: string | null;
    league_id: string | null;
    rank: number | null;
    improvement_pct: number | null;
    custom_message: string | null;
    created_at: string;
    views: number;
    clicks: number;
}

export async function GET(request: NextRequest) {
    try {
        // Auth check
        const supabase = await createServerSupabaseClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get query params
        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);

        // Fetch share history
        const adminClient = createAdminClient();
        const { data: shareCards, error } = await adminClient
            .from("share_cards")
            .select(`
                id,
                short_code,
                card_type,
                metric_type,
                metric_value,
                period_start,
                period_end,
                league_id,
                rank,
                improvement_pct,
                custom_message,
                created_at,
                views,
                clicks
            `)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(limit);

        if (error) {
            console.error("Error fetching share history:", error);
            return NextResponse.json(
                { error: "Failed to fetch share history" },
                { status: 500 }
            );
        }

        // Format response
        const history = ((shareCards || []) as ShareCardRow[]).map((card: ShareCardRow) => ({
            id: card.id,
            shortCode: card.short_code,
            cardType: card.card_type,
            metricType: card.metric_type,
            value: card.metric_value,
            periodStart: card.period_start,
            periodEnd: card.period_end,
            leagueId: card.league_id,
            rank: card.rank,
            improvementPct: card.improvement_pct,
            customMessage: card.custom_message,
            createdAt: card.created_at,
            stats: {
                views: card.views || 0,
                clicks: card.clicks || 0,
            },
        }));

        return NextResponse.json({
            history,
            total: history.length,
        });
    } catch (error) {
        console.error("Share history error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
