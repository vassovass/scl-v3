import { Metadata } from "next";
import { notFound } from "next/navigation";
import { APP_CONFIG } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/server";
import Link from "next/link";

interface ShareCardPageProps {
    params: Promise<{ code: string }>;
}

// Types matching database schema
type CardType = "daily" | "weekly" | "personal_best" | "streak" | "rank" | "challenge" | "rank_change";
type MetricType = "steps" | "calories" | "slp" | "distance" | "swimming" | "cycling" | "running";

interface ShareCard {
    id: string;
    short_code: string;
    user_id: string | null;
    card_type: CardType;
    metric_type: MetricType;
    metric_value: number;
    period_start: string | null;
    period_end: string | null;
    period_label: string | null;
    league_id: string | null;
    league_name: string | null;
    rank: number | null;
    improvement_pct: number | null;
    custom_message: string | null;
    theme: "light" | "dark";
    created_at: string;
    views: number;
    clicks: number;
    shares_completed: number;
}

// Metric display configurations
const METRIC_CONFIGS: Record<MetricType, { emoji: string; unit: string; formatValue: (v: number) => string }> = {
    steps: { emoji: '🚶', unit: 'steps', formatValue: (v) => v.toLocaleString() },
    calories: { emoji: '🔥', unit: 'kcal', formatValue: (v) => v.toLocaleString() },
    slp: { emoji: '⚡', unit: 'SLP', formatValue: (v) => v.toLocaleString() },
    distance: { emoji: '📍', unit: 'km', formatValue: (v) => v.toFixed(1) },
    swimming: { emoji: '🏊', unit: 'laps', formatValue: (v) => v.toLocaleString() },
    cycling: { emoji: '🚴', unit: 'km', formatValue: (v) => v.toFixed(1) },
    running: { emoji: '🏃', unit: 'km', formatValue: (v) => v.toFixed(1) },
};

// Card type display configurations
const CARD_TYPE_CONFIGS: Record<CardType, { title: string; emoji: string; color: string }> = {
    daily: { title: "Today's Achievement", emoji: '📅', color: 'text-primary' },
    weekly: { title: 'Weekly Total', emoji: '📊', color: 'text-primary' },
    personal_best: { title: 'New Personal Best!', emoji: '🏆', color: 'text-purple-400' },
    streak: { title: 'Streak!', emoji: '🔥', color: 'text-orange-400' },
    rank: { title: 'Ranked', emoji: '🥇', color: 'text-primary' },
    challenge: { title: 'Challenge', emoji: '💪', color: 'text-emerald-400' },
    rank_change: { title: 'Rank Up!', emoji: '🚀', color: 'text-green-400' },
};

async function getShareCard(code: string): Promise<ShareCard | null> {
    const adminClient = createAdminClient();

    const { data, error } = await adminClient
        .from("share_cards")
        .select("*")
        .eq("short_code", code)
        .single();

    if (error || !data) {
        return null;
    }

    // Increment view count (fire and forget)
    adminClient.rpc("increment_share_card_views", { card_short_code: code }).then(() => {});

    return data as ShareCard;
}

async function getUserDisplayName(userId: string | null): Promise<string> {
    if (!userId) return "Someone";

    const adminClient = createAdminClient();
    const { data } = await adminClient
        .from("users")
        .select("display_name")
        .eq("id", userId)
        .single();

    return data?.display_name || "Someone";
}

// Generate dynamic OG metadata
export async function generateMetadata({ params }: ShareCardPageProps): Promise<Metadata> {
    const { code } = await params;
    const card = await getShareCard(code);

    if (!card) {
        return {
            title: "Share Card Not Found",
            description: "This share card could not be found.",
        };
    }

    const userName = await getUserDisplayName(card.user_id);
    const metricConfig = METRIC_CONFIGS[card.metric_type];
    const cardConfig = CARD_TYPE_CONFIGS[card.card_type];
    const formattedValue = metricConfig.formatValue(card.metric_value);
    const periodText = card.period_label || "today";

    // Build title based on card type
    let title = "";
    let emoji = cardConfig.emoji;

    switch (card.card_type) {
        case "personal_best":
            title = `${emoji} ${userName} hit a new Personal Best!`;
            break;
        case "streak":
            title = `${emoji} ${userName} is on a streak!`;
            break;
        case "challenge":
            title = `${emoji} ${userName} challenges you!`;
            emoji = "💪";
            break;
        case "rank":
        case "rank_change":
            if (card.rank === 1) {
                title = `👑 ${userName} is #1${card.league_name ? ` in ${card.league_name}` : ""}!`;
                emoji = "👑";
            } else if (card.rank === 2) {
                title = `🥈 ${userName} came 2nd${card.league_name ? ` in ${card.league_name}` : ""}!`;
                emoji = "🥈";
            } else if (card.rank === 3) {
                title = `🥉 ${userName} came 3rd${card.league_name ? ` in ${card.league_name}` : ""}!`;
                emoji = "🥉";
            } else {
                title = `🏆 ${userName} ranked #${card.rank}${card.league_name ? ` in ${card.league_name}` : ""}!`;
            }
            break;
        default:
            title = `${emoji} ${userName}'s ${card.card_type} achievement!`;
    }

    const description = `${formattedValue} ${metricConfig.unit} ${periodText}${card.improvement_pct ? ` (+${card.improvement_pct}% improvement!)` : ""}. ${APP_CONFIG.hashtag}`;

    // Build OG Image URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://stepleague.app";
    const ogParams = new URLSearchParams({
        value: card.metric_value.toString(),
        metric_type: card.metric_type,
        card_type: card.card_type,
        theme: card.theme,
        period: periodText,
        name: userName,
        emoji,
    });

    if (card.rank) ogParams.set("rank", card.rank.toString());
    if (card.improvement_pct) ogParams.set("improvement", card.improvement_pct.toString());
    if (card.league_name) ogParams.set("league", card.league_name);

    const ogImageUrl = `${baseUrl}/api/og?${ogParams.toString()}`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: [
                {
                    url: ogImageUrl,
                    width: 1200,
                    height: 630,
                    alt: title,
                },
            ],
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [ogImageUrl],
        },
    };
}

export default async function ShareCardPage({ params }: ShareCardPageProps) {
    const { code } = await params;
    const card = await getShareCard(code);

    if (!card) {
        notFound();
    }

    const userName = await getUserDisplayName(card.user_id);
    const metricConfig = METRIC_CONFIGS[card.metric_type];
    const cardConfig = CARD_TYPE_CONFIGS[card.card_type];
    const formattedValue = metricConfig.formatValue(card.metric_value);
    const periodText = card.period_label || "today";

    // Determine display based on card type
    const getDisplay = () => {
        switch (card.card_type) {
            case "personal_best":
                return { emoji: "🏆", text: "New Personal Best!", color: "text-purple-400" };
            case "streak":
                return { emoji: "🔥", text: `${card.metric_value} Day Streak!`, color: "text-orange-400" };
            case "challenge":
                return { emoji: "💪", text: "Can you beat this?", color: "text-emerald-400" };
            case "rank_change":
                return { emoji: "🚀", text: "Rank Up!", color: "text-green-400" };
            case "rank":
                if (card.rank === 1) return { emoji: "👑", text: "1st Place!", color: "text-[hsl(var(--warning))]" };
                if (card.rank === 2) return { emoji: "🥈", text: "2nd Place!", color: "text-muted-foreground" };
                if (card.rank === 3) return { emoji: "🥉", text: "3rd Place!", color: "text-amber-500" };
                return { emoji: "🏆", text: `#${card.rank}`, color: "text-primary" };
            default:
                return { emoji: cardConfig.emoji, text: cardConfig.title, color: cardConfig.color };
        }
    };

    const display = getDisplay();
    const isChallenge = card.card_type === "challenge";
    const isStreak = card.card_type === "streak";

    return (
        <div className={`min-h-screen flex items-center justify-center p-6 ${card.theme === "dark" ? "bg-background" : "bg-muted"}`}>
            <div className="w-full max-w-md text-center">
                {/* Achievement Card */}
                <div className={`rounded-2xl p-8 border shadow-2xl ${card.theme === "dark"
                    ? "bg-gradient-to-br from-card via-secondary to-card border-border"
                    : "bg-gradient-to-br from-card via-muted to-card border-border"
                    }`}>
                    <div className="text-6xl mb-4">{display.emoji}</div>
                    <h1 className={`text-3xl font-bold ${display.color}`}>
                        {display.text}
                    </h1>
                    <p className="text-lg mt-2 text-muted-foreground">
                        {userName}
                    </p>

                    {card.league_name && (
                        <p className="text-sm mt-1 text-muted-foreground">
                            in {card.league_name}
                        </p>
                    )}

                    {/* Value display (not for streak cards which show days in title) */}
                    {!isStreak && (
                        <div className="mt-6 py-6 rounded-xl bg-gradient-to-r from-primary/20 to-emerald-600/20 border border-primary/30">
                            <div className="text-4xl font-bold text-foreground">
                                {formattedValue}
                            </div>
                            <div className="text-sm mt-1 text-muted-foreground">
                                {metricConfig.unit} {periodText}
                            </div>
                        </div>
                    )}

                    {/* Custom message */}
                    {card.custom_message && (
                        <div className="mt-4 text-sm italic text-muted-foreground">
                            "{card.custom_message}"
                        </div>
                    )}

                    {/* Improvement badge */}
                    {card.improvement_pct && card.improvement_pct > 0 && (
                        <div className="mt-4">
                            <span className="inline-block px-4 py-2 rounded-full bg-emerald-900/50 text-emerald-400 text-sm font-medium">
                                📈 +{card.improvement_pct}% vs last period
                            </span>
                        </div>
                    )}

                    {/* Branding */}
                    <div className="mt-8 pt-4 border-t border-border">
                        <div className="text-sm font-semibold text-muted-foreground">
                            Step<span className="text-primary">League</span>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="mt-6">
                    <Link
                        href={isChallenge ? "/sign-up" : "/dashboard"}
                        className="inline-block rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
                    >
                        {isChallenge ? "Accept the Challenge!" : "Join StepLeague!"}
                    </Link>
                </div>
            </div>
        </div>
    );
}
