"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ShareButton } from "@/components/ui/ShareButton";
import { generateShareMessage } from "@/lib/sharing";

interface ShareProgressWidgetProps {
    className?: string;
}

interface QuickStats {
    today_steps: number;
    current_streak: number;
    weekly_steps: number;
}

/**
 * Compact widget for dashboard showing quick stats with share actions.
 * Links to full Stats Hub page.
 * PRD-51: Social Sharing & Stats Hub
 */
export function ShareProgressWidget({ className }: ShareProgressWidgetProps) {
    const [stats, setStats] = useState<QuickStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch("/api/stats/hub?period=this_week");
                if (!res.ok) return;

                const data = await res.json();
                setStats({
                    today_steps: data.today_steps || 0,
                    current_streak: data.base_stats?.current_streak || 0,
                    weekly_steps: data.period_stats?.total_steps || 0,
                });
            } catch (err) {
                console.error("Failed to fetch quick stats:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className={cn(
                "rounded-xl border border-border bg-card/50 p-4 animate-pulse",
                className
            )}>
                <div className="h-4 w-24 bg-muted rounded mb-3" />
                <div className="grid grid-cols-3 gap-2">
                    <div className="h-12 bg-muted rounded" />
                    <div className="h-12 bg-muted rounded" />
                    <div className="h-12 bg-muted rounded" />
                </div>
            </div>
        );
    }

    if (!stats) return null;

    const hasActivity = stats.today_steps > 0 || stats.weekly_steps > 0;

    return (
        <div className={cn(
            "rounded-xl border border-border bg-card/50 p-4 transition hover:border-border/80 hover:bg-card",
            className
        )}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                    📊 Your Progress
                </h3>
                <Link
                    href="/my-stats"
                    className="text-xs text-primary hover:text-primary/80 transition"
                >
                    View All →
                </Link>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-3 gap-2 text-center">
                {/* Today */}
                <div className="rounded-lg bg-secondary/50 p-2">
                    <p className="text-lg font-bold text-foreground">
                        {stats.today_steps.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Today</p>
                </div>

                {/* Streak */}
                <div className="rounded-lg bg-secondary/50 p-2">
                    <p className="text-lg font-bold text-foreground">
                        {stats.current_streak}🔥
                    </p>
                    <p className="text-xs text-muted-foreground">Streak</p>
                </div>

                {/* Week */}
                <div className="rounded-lg bg-secondary/50 p-2">
                    <p className="text-lg font-bold text-foreground">
                        {(stats.weekly_steps / 1000).toFixed(1)}k
                    </p>
                    <p className="text-xs text-muted-foreground">This Week</p>
                </div>
            </div>

            {/* Share CTA (only show if user has activity) */}
            {hasActivity && (
                <div className="mt-3 pt-3 border-t border-border/50">
                    <ShareButton
                        message={generateShareMessage("weekly", {
                            value: stats.weekly_steps,
                            metricType: "steps",
                        }).text}
                        contentType="dashboard_widget"
                        className="w-full !py-2 text-xs"
                    >
                        📤 Share Progress
                    </ShareButton>
                </div>
            )}
        </div>
    );
}
