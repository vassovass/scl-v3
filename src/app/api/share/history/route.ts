/**
 * Share History API
 *
 * GET /api/share/history
 * Returns the user's share card history with performance metrics.
 *
 * PRD-51: Social Sharing & Stats Hub
 * PRD-56: Extended with CTR calculation and best_performing highlight
 */

import { withApiHandler } from "@/lib/api/handler";
import { serverError } from "@/lib/api";

export const GET = withApiHandler({
    auth: 'required',
}, async ({ user, adminClient, request }) => {
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "10"), 50);
    const page = Math.max(parseInt(url.searchParams.get("page") || "1"), 1);
    const offset = (page - 1) * limit;

    // Fetch share history with pagination
    const { data: shareCards, error, count } = await adminClient
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
        `, { count: 'exact' })
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        return serverError("Failed to fetch share history");
    }

    // PRD-56: Calculate CTR and find best performing share
    const history = (shareCards || []).map((card: Record<string, unknown>) => {
        const views = (card.views as number) || 0;
        const clicks = (card.clicks as number) || 0;
        const ctr = views > 0 ? Math.round((clicks / views) * 1000) / 10 : 0;

        return {
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
                views,
                clicks,
                ctr, // PRD-56: Click-through rate percentage
            },
        };
    });

    // PRD-56: Find best performing share (most views with at least 1 view)
    const bestPerforming = history
        .filter((h) => h.stats.views > 0)
        .sort((a, b) => b.stats.views - a.stats.views)[0] || null;

    return {
        history,
        total: count || history.length,
        pagination: {
            page,
            limit,
            totalPages: count ? Math.ceil(count / limit) : 1,
        },
        bestPerforming, // PRD-56: Highlight best performing share
    };
});
