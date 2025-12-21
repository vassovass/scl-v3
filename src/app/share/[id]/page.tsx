import { Metadata } from "next";

interface SharePageProps {
    params: { id: string };
    searchParams: { [key: string]: string | undefined };
}

// Dynamic OG metadata based on URL parameters
export async function generateMetadata({ searchParams }: SharePageProps): Promise<Metadata> {
    const rank = parseInt(searchParams.rank || "1");
    const steps = parseInt(searchParams.steps || "0");
    const period = searchParams.period || "this week";
    const name = searchParams.name || "Someone";
    const league = searchParams.league || "Step Counter League";
    const improvement = searchParams.improvement ? parseInt(searchParams.improvement) : null;
    const type = searchParams.type || "rank";

    // Generate title based on type/rank
    let title = "";
    let emoji = "🏆";

    if (type === "personal_best") {
        title = `💪 ${name} hit a new Personal Best!`;
        emoji = "💪";
    } else if (rank === 1) {
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

    const description = `${steps.toLocaleString()} steps ${period}${improvement ? ` (+${improvement}% improvement!)` : ""}. Join the challenge! #StepCountLeague`;

    // Dynamic OG Image URL (Vercel OG)
    const ogImageUrl = new URL("/api/og", process.env.NEXT_PUBLIC_APP_URL || "https://scl-v3.vercel.app");
    ogImageUrl.searchParams.set("rank", rank.toString());
    ogImageUrl.searchParams.set("steps", steps.toString());
    ogImageUrl.searchParams.set("name", name);
    ogImageUrl.searchParams.set("period", period);
    ogImageUrl.searchParams.set("emoji", emoji);
    ogImageUrl.searchParams.set("type", type);
    if (type === "personal_best") ogImageUrl.searchParams.set("title", "New Personal Best!");
    if (improvement) ogImageUrl.searchParams.set("improvement", improvement.toString());

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

export default function SharePage({ searchParams }: SharePageProps) {
    const rank = parseInt(searchParams.rank || "1");
    const steps = parseInt(searchParams.steps || "0");
    const period = searchParams.period || "this week";
    const name = searchParams.name || "Someone";
    const league = searchParams.league || "Step Counter League";
    const improvement = searchParams.improvement ? parseInt(searchParams.improvement) : null;
    const type = searchParams.type || "rank";

    const getRankDisplay = () => {
        if (type === "personal_best") return { emoji: "💪", text: "New Personal Best!", color: "text-sky-400" };
        if (rank === 1) return { emoji: "👑", text: "1st Place!", color: "text-yellow-400" };
        if (rank === 2) return { emoji: "🥈", text: "2nd Place!", color: "text-slate-300" };
        if (rank === 3) return { emoji: "🥉", text: "3rd Place!", color: "text-amber-600" };
        return { emoji: "🏆", text: `#${rank}`, color: "text-sky-400" };
    };

    const rankDisplay = getRankDisplay();

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
            <div className="w-full max-w-md text-center">
                {/* Achievement Card */}
                <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 border border-slate-700 shadow-2xl">
                    <div className="text-6xl mb-4">{rankDisplay.emoji}</div>
                    <h1 className={`text-3xl font-bold ${rankDisplay.color}`}>
                        {rankDisplay.text}
                    </h1>
                    <p className="text-lg text-slate-300 mt-2">{name}</p>

                    <div className="mt-6 py-6 rounded-xl bg-gradient-to-r from-sky-600/20 to-emerald-600/20 border border-sky-500/30">
                        <div className="text-4xl font-bold text-white">
                            {steps.toLocaleString()}
                        </div>
                        <div className="text-sm text-slate-300 mt-1">steps {period}</div>
                    </div>

                    {improvement && (
                        <div className="mt-4">
                            <span className="inline-block px-4 py-2 rounded-full bg-emerald-900/50 text-emerald-400 text-sm font-medium">
                                📈 +{improvement}% improvement!
                            </span>
                        </div>
                    )}

                    <div className="mt-6 text-sm text-slate-500">{league}</div>

                    <div className="mt-8 pt-4 border-t border-slate-700">
                        <div className="text-sm font-semibold text-slate-300">
                            Step<span className="text-sky-400">Count</span>League
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="mt-6">
                    <a
                        href="/dashboard"
                        className="inline-block rounded-xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white hover:bg-sky-500 transition"
                    >
                        Join the Challenge!
                    </a>
                </div>
            </div>
        </div>
    );
}
