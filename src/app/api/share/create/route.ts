import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { nanoid } from "nanoid";

// Types matching database schema
type CardType = "daily" | "weekly" | "personal_best" | "streak" | "rank" | "challenge" | "rank_change";
type MetricType = "steps" | "calories" | "slp" | "distance" | "swimming" | "cycling" | "running";
type Theme = "light" | "dark";

interface CreateShareCardRequest {
    card_type: CardType;
    metric_type?: MetricType;
    metric_value: number;
    period_start?: string;
    period_end?: string;
    period_label?: string;
    league_id?: string;
    league_name?: string;
    rank?: number;
    improvement_pct?: number;
    custom_message?: string;
    theme?: Theme;
}

/**
 * POST /api/share/create
 * Creates a persistent share card and returns the short URL
 */
export async function POST(request: NextRequest) {
    const supabase = await createServerSupabaseClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body: CreateShareCardRequest = await request.json();

        // Validate required fields
        if (!body.card_type || body.metric_value === undefined) {
            return NextResponse.json(
                { error: "Missing required fields: card_type, metric_value" },
                { status: 400 }
            );
        }

        // Validate card_type
        const validCardTypes: CardType[] = ["daily", "weekly", "personal_best", "streak", "rank", "challenge", "rank_change"];
        if (!validCardTypes.includes(body.card_type)) {
            return NextResponse.json(
                { error: `Invalid card_type. Must be one of: ${validCardTypes.join(", ")}` },
                { status: 400 }
            );
        }

        // Validate metric_type if provided
        const validMetricTypes: MetricType[] = ["steps", "calories", "slp", "distance", "swimming", "cycling", "running"];
        if (body.metric_type && !validMetricTypes.includes(body.metric_type)) {
            return NextResponse.json(
                { error: `Invalid metric_type. Must be one of: ${validMetricTypes.join(", ")}` },
                { status: 400 }
            );
        }

        // Generate unique short code (8 characters for URL-safe sharing)
        const shortCode = nanoid(8);

        // Use admin client to insert (bypasses potential RLS issues during creation)
        const adminClient = createAdminClient();

        const { data: shareCard, error } = await adminClient
            .from("share_cards")
            .insert({
                short_code: shortCode,
                user_id: user.id,
                card_type: body.card_type,
                metric_type: body.metric_type || "steps",
                metric_value: body.metric_value,
                period_start: body.period_start || null,
                period_end: body.period_end || null,
                period_label: body.period_label || null,
                league_id: body.league_id || null,
                league_name: body.league_name || null,
                rank: body.rank || null,
                improvement_pct: body.improvement_pct || null,
                custom_message: body.custom_message || null,
                theme: body.theme || "dark",
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating share card:", error);
            return NextResponse.json(
                { error: "Failed to create share card" },
                { status: 500 }
            );
        }

        // Build the share URL
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://stepleague.app";
        const shareUrl = `${baseUrl}/s/${shortCode}`;

        // Build OG image URL for preview
        const ogParams = new URLSearchParams({
            value: body.metric_value.toString(),
            metric_type: body.metric_type || "steps",
            card_type: body.card_type,
            theme: body.theme || "dark",
            period: body.period_label || "",
            name: user.user_metadata?.display_name || "Player",
        });

        if (body.rank) ogParams.set("rank", body.rank.toString());
        if (body.improvement_pct) ogParams.set("improvement", body.improvement_pct.toString());
        if (body.league_name) ogParams.set("league", body.league_name);

        const ogImageUrl = `${baseUrl}/api/og?${ogParams.toString()}`;

        return NextResponse.json({
            success: true,
            share_card: {
                id: shareCard.id,
                short_code: shortCode,
                card_type: body.card_type,
                metric_type: body.metric_type || "steps",
                metric_value: body.metric_value,
            },
            urls: {
                share: shareUrl,
                og_image: ogImageUrl,
            },
        });
    } catch (error) {
        console.error("Error in share/create:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/share/create
 * Returns 405 Method Not Allowed
 */
export async function GET() {
    return NextResponse.json(
        { error: "Method not allowed. Use POST to create a share card." },
        { status: 405 }
    );
}
