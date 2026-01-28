"use client";

import { useEffect, useState } from "react";
import { Award } from "lucide-react";

interface StatItem {
    value: number;
    formatted: string;
    label: string;
}

interface PublicStats {
    activeUsers: StatItem;
    leagues: StatItem;
    totalSteps: StatItem;
    shareCards: StatItem;
}

// Fallback stats for initial render and error cases
const FALLBACK_STATS: PublicStats = {
    activeUsers: { value: 0, formatted: "10K+", label: "Active Users" },
    leagues: { value: 0, formatted: "500+", label: "Leagues" },
    totalSteps: { value: 0, formatted: "1M+", label: "Steps Tracked" },
    shareCards: { value: 0, formatted: "50K+", label: "Cards Created" },
};

/**
 * DynamicSocialProof Component
 *
 * Fetches live stats from /api/stats/public and displays them.
 * Falls back to static values if the fetch fails.
 *
 * PRD-53 P-2: Dynamic social proof stats
 */
export function DynamicSocialProof() {
    const [stats, setStats] = useState<PublicStats>(FALLBACK_STATS);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const response = await fetch("/api/stats/public");
                if (response.ok) {
                    const data = await response.json();
                    setStats(data);
                }
            } catch (error) {
                // Keep fallback stats on error
                console.error("Failed to fetch public stats:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, []);

    const displayStats = [
        { value: stats.activeUsers.formatted, label: stats.activeUsers.label },
        { value: stats.leagues.formatted, label: stats.leagues.label },
        { value: stats.totalSteps.formatted, label: stats.totalSteps.label },
        { value: stats.shareCards.formatted, label: stats.shareCards.label },
    ];

    return (
        <section className="bg-muted/30 py-24">
            <div className="px-6 lg:px-8 max-w-5xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
                    <Award className="w-4 h-4" />
                    <span>Join the Community</span>
                </div>
                <h2 className="text-3xl font-bold mb-6">Thousands Already Sharing</h2>
                <p className="text-lg text-muted-foreground mb-12 max-w-xl mx-auto">
                    Step enthusiasts around the world are tracking and sharing their progress.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {displayStats.map((stat) => (
                        <div key={stat.label} className="text-center">
                            <div
                                className={`text-4xl font-bold text-primary mb-2 ${
                                    loading ? "animate-pulse" : ""
                                }`}
                            >
                                {stat.value}
                            </div>
                            <div className="text-sm text-muted-foreground">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
