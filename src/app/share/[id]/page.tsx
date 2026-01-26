import { Metadata } from "next";
import { APP_CONFIG } from "@/lib/config";
import Link from "next/link";

interface SharePageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ [key: string]: string | undefined }>;
}

// Types for PRD-51 support
type CardType = "daily" | "weekly" | "personal_best" | "streak" | "rank" | "challenge" | "rank_change";
type MetricType = "steps" | "calories" | "slp" | "distance" | "swimming" | "cycling" | "running";

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

// Dynamic OG metadata based on URL parameters
export async function generateMetadata({ searchParams: searchParamsPromise }: SharePageProps): Promise<Metadata> {
    const searchParams = await searchParamsPromise;

    // Parse parameters with PRD-51 support
    const rank = parseInt(searchParams.rank || "1");
    const value = parseInt(searchParams.steps || searchParams.value || "0");
    const period = searchParams.period || "this week";
    const name = searchParams.name || "Someone";
    const league = searchParams.league || APP_CONFIG.name;
    const improvement = searchParams.improvement ? parseInt(searchParams.improvement) : null;
    const type = (searchParams.type || searchParams.card_type || "rank") as CardType;
    const metricType = (searchParams.metric_type || "steps") as MetricType;
    const theme = (searchParams.theme || "dark") as "light" | "dark";
    const streakDays = searchParams.streak_days ? parseInt(searchParams.streak_days) : null;

    const metricConfig = METRIC_CONFIGS[metricType] || METRIC_CONFIGS.steps;
    const formattedValue = metricConfig.formatValue(value);

    // Generate title based on type/rank
    let title = "";
    let emoji = "🏆";

    switch (type) {
        case "personal_best":
            title = `💪 ${name} hit a new Personal Best!`;
            emoji = "💪";
            break;
        case "streak":
            title = `🔥 ${name} is on a ${streakDays || value} day streak!`;
            emoji = "🔥";
            break;
        case "challenge":
            title = `💪 ${name} challenges you to beat ${formattedValue} ${metricConfig.unit}!`;
            emoji = "💪";
            break;
        case "rank_change":
            title = `🚀 ${name} moved up the ranks!`;
            emoji = "🚀";
            break;
        case "daily":
            title = `📅 ${name}'s daily achievement!`;
            emoji = "📅";
            break;
        case "weekly":
            title = `📊 ${name}'s weekly total!`;
            emoji = "📊";
            break;
        case "rank":
        default:
            if (rank === 1) {
                title = `👑 ${name} is #1 in ${league}!`;
                emoji = "👑";
            } else if (rank === 2) {
                title = `🥈 ${name} came 2nd in ${league}!`;
                emoji = "🥈";
            } else if (rank === 3) {
                title = `🥉 ${name} came 3rd in ${league}!`;
                emoji = "🥉";
            } else {
                title = `🏆 ${name} ranked #${rank} in ${league}!`;
            }
    }

    const description = `${formattedValue} ${metricConfig.unit} ${period}${improvement ? ` (+${improvement}% improvement!)` : ""}. Join the challenge! ${APP_CONFIG.hashtag}`;

    // Dynamic OG Image URL with PRD-51 parameters
    const ogImageUrl = new URL("/api/og", process.env.NEXT_PUBLIC_APP_URL || "https://stepleague.app");
    ogImageUrl.searchParams.set("rank", rank.toString());
    ogImageUrl.searchParams.set("value", value.toString());
    ogImageUrl.searchParams.set("steps", value.toString()); // Backwards compatibility
    ogImageUrl.searchParams.set("name", name);
    ogImageUrl.searchParams.set("period", period);
    ogImageUrl.searchParams.set("emoji", emoji);
    ogImageUrl.searchParams.set("metric_type", metricType);
    ogImageUrl.searchParams.set("card_type", type);
    ogImageUrl.searchParams.set("theme", theme);
    if (type === "personal_best") ogImageUrl.searchParams.set("title", "New Personal Best!");
    if (improvement) ogImageUrl.searchParams.set("improvement", improvement.toString());
    if (streakDays) ogImageUrl.searchParams.set("streak_days", streakDays.toString());
    if (league !== APP_CONFIG.name) ogImageUrl.searchParams.set("league", league);

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: [
                {
                    url: ogImageUrl.toString(),
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
            images: [ogImageUrl.toString()],
        },
    };
}

export default async function SharePage({ searchParams: searchParamsPromise }: SharePageProps) {
    const searchParams = await searchParamsPromise;

    // Parse parameters with PRD-51 support
    const rank = parseInt(searchParams.rank || "1");
    const value = parseInt(searchParams.steps || searchParams.value || "0");
    const period = searchParams.period || "this week";
    const name = searchParams.name || "Someone";
    const league = searchParams.league || APP_CONFIG.name;
    const improvement = searchParams.improvement ? parseInt(searchParams.improvement) : null;
    const type = (searchParams.type || searchParams.card_type || "rank") as CardType;
    const metricType = (searchParams.metric_type || "steps") as MetricType;
    const theme = (searchParams.theme || "dark") as "light" | "dark";
    const streakDays = searchParams.streak_days ? parseInt(searchParams.streak_days) : null;
    const customMessage = searchParams.message;

    const metricConfig = METRIC_CONFIGS[metricType] || METRIC_CONFIGS.steps;
    const formattedValue = metricConfig.formatValue(value);

    const getRankDisplay = () => {
        switch (type) {
            case "personal_best":
                return { emoji: "🏆", text: "New Personal Best!", color: "text-purple-400" };
            case "streak":
                return { emoji: "🔥", text: `${streakDays || value} Day Streak!`, color: "text-orange-400" };
            case "challenge":
                return { emoji: "💪", text: "Can you beat this?", color: "text-emerald-400" };
            case "rank_change":
                return { emoji: "🚀", text: "Rank Up!", color: "text-green-400" };
            case "daily":
                return { emoji: "📅", text: "Today's Achievement", color: "text-primary" };
            case "weekly":
                return { emoji: "📊", text: "Weekly Total", color: "text-primary" };
            case "rank":
            default:
                if (rank === 1) return { emoji: "👑", text: "1st Place!", color: "text-[hsl(var(--warning))]" };
                if (rank === 2) return { emoji: "🥈", text: "2nd Place!", color: "text-slate-300" };
                if (rank === 3) return { emoji: "🥉", text: "3rd Place!", color: "text-amber-500" };
                return { emoji: "🏆", text: `#${rank}`, color: "text-primary" };
        }
    };

    const rankDisplay = getRankDisplay();
    const isChallenge = type === "challenge";
    const isStreak = type === "streak";

    return (
        <div className={`min-h-screen flex items-center justify-center p-6 ${theme === "dark" ? "bg-slate-950" : "bg-slate-100"}`}>
            <div className="w-full max-w-md text-center">
                {/* Achievement Card */}
                <div className={`rounded-2xl p-8 border shadow-2xl ${theme === "dark"
                    ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700"
                    : "bg-gradient-to-br from-white via-slate-50 to-white border-slate-200"
                    }`}>
                    <div className="text-6xl mb-4">{rankDisplay.emoji}</div>
                    <h1 className={`text-3xl font-bold ${rankDisplay.color}`}>
                        {rankDisplay.text}
                    </h1>
                    <p className={`text-lg mt-2 ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}>
                        {name}
                    </p>

                    {league !== APP_CONFIG.name && (
                        <p className={`text-sm mt-1 ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>
                            in {league}
                        </p>
                    )}

                    {/* Value display (not for streak cards which show days in title) */}
                    {!isStreak && (
                        <div className="mt-6 py-6 rounded-xl bg-gradient-to-r from-primary/20 to-emerald-600/20 border border-primary/30">
                            <div className={`text-4xl font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                                {formattedValue}
                            </div>
                            <div className={`text-sm mt-1 ${theme === "dark" ? "text-slate-300" : "text-slate-500"}`}>
                                {metricConfig.unit} {period}
                            </div>
                        </div>
                    )}

                    {/* Custom message */}
                    {customMessage && (
                        <div className={`mt-4 text-sm italic ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                            "{customMessage}"
                        </div>
                    )}

                    {/* Improvement badge */}
                    {improvement && improvement > 0 && (
                        <div className="mt-4">
                            <span className="inline-block px-4 py-2 rounded-full bg-emerald-900/50 text-emerald-400 text-sm font-medium">
                                📈 +{improvement}% vs last period
                            </span>
                        </div>
                    )}

                    {/* Branding */}
                    <div className={`mt-8 pt-4 border-t ${theme === "dark" ? "border-slate-700" : "border-slate-200"}`}>
                        <div className={`text-sm font-semibold ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}>
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
