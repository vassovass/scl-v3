"use client";

import { useState, useCallback } from "react";
import { APP_CONFIG } from "@/lib/config";
import { useShare } from "@/hooks/useShare";

export interface AchievementData {
    type: "rank" | "personal_best" | "streak" | "improvement" | "leader" | "custom";
    value: number;
    label: string;
    subtext?: string;
    rank?: number;
    totalMembers?: number;
    userName?: string;
    leagueName?: string;
    date?: string;
    period?: string;
    periodLabel?: string;
    improvementPct?: number;
    comparisonPeriod?: string;
    dateRange?: string;
    comparisonDateRange?: string;
}

interface AchievementShareCardProps {
    achievement: AchievementData;
    onClose?: () => void;
}

/**
 * Shareable achievement card with URL-based sharing.
 * Generates a link with dynamic OG preview for social media.
 */
export function AchievementShareCard({ achievement, onClose }: AchievementShareCardProps) {
    const { share, isSharing, copied, supportsNativeShare } = useShare({
        contentType: 'achievement',
        itemId: achievement.type
    });

    const getEmoji = () => {
        switch (achievement.type) {
            case "rank": return achievement.rank === 1 ? "👑" : "🏆";
            case "personal_best": return "💪";
            case "streak": return "🔥";
            case "improvement": return "📈";
            case "leader": return "👑";
            default: return "⭐";
        }
    };

    const getPeriodText = useCallback(() => {
        if (achievement.dateRange) return achievement.dateRange;
        if (achievement.periodLabel && achievement.period !== "custom") return achievement.periodLabel.toLowerCase();
        switch (achievement.period) {
            case "today": return "today";
            case "yesterday": return "yesterday";
            case "this_week": return "this week";
            case "last_week": return "last week";
            case "this_month": return "this month";
            case "last_month": return "last month";
            case "last_7_days": return "in the last 7 days";
            case "last_30_days": return "in the last 30 days";
            case "all_time": return "all time";
            default: return "this period";
        }
    }, [achievement.period, achievement.periodLabel]);

    const getTitle = () => {
        switch (achievement.type) {
            case "rank":
                if (achievement.rank === 1) return "League Leader!";
                if (achievement.rank === 2) return "2nd Place!";
                if (achievement.rank === 3) return "3rd Place!";
                return `Ranked #${achievement.rank}!`;
            case "personal_best": return "New Personal Best!";
            case "streak": return `${achievement.value}-Day Streak!`;
            case "improvement": return `${achievement.value}% Better!`;
            case "leader": return "I'm Leading!";
            default: return achievement.label;
        }
    };

    // Generate share URL with parameters for OG preview
    const getShareUrl = useCallback(() => {
        const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
        const shareId = `${Date.now()}`;
        const params = new URLSearchParams({
            rank: (achievement.rank || 1).toString(),
            steps: achievement.value.toString(),
            name: achievement.userName || "Player",
            period: getPeriodText(),
            league: achievement.leagueName || APP_CONFIG.name,
            type: achievement.type,
        });
        if (achievement.improvementPct !== undefined) {
            params.set("improvement", achievement.improvementPct.toString());
        }
        return `${baseUrl}/share/${shareId}?${params.toString()}`;
    }, [achievement, getPeriodText]);

    const getMessage = useCallback(() => {
        const name = achievement.userName || "I";
        const periodText = getPeriodText();
        const improvementText = achievement.improvementPct
            ? ` That's +${achievement.improvementPct}% vs ${achievement.comparisonDateRange || achievement.comparisonPeriod || "last period"}!`
            : "";

        switch (achievement.type) {
            case "rank":
                if (achievement.rank === 1) {
                    return `${name} came 1st in ${achievement.leagueName || APP_CONFIG.name} ${periodText} with ${achievement.value.toLocaleString()} steps! 👑${improvementText}`;
                }
                return `${name} ranked #${achievement.rank} out of ${achievement.totalMembers} ${periodText} with ${achievement.value.toLocaleString()} steps! 🏆${improvementText}`;
            case "personal_best":
                return `${name} hit a new personal best: ${achievement.value.toLocaleString()} steps ${periodText}! 💪`;
            case "streak":
                return `${name}'m on a ${achievement.value}-day step tracking streak! 🔥`;
            case "improvement":
                return `${name} improved by ${achievement.value}% ${periodText} compared to ${achievement.comparisonPeriod || "last period"}! 📈`;
            case "leader":
                return `${name}'m leading ${achievement.leagueName || APP_CONFIG.name} ${periodText} with ${achievement.value.toLocaleString()} steps! 👑${improvementText}`;
            default:
                return `${achievement.label}: ${achievement.value.toLocaleString()} steps ${periodText}!`;
        }
    }, [achievement, getPeriodText]);

    const shareUrl = getShareUrl();
    const shareMessage = getMessage();

    const handleShare = useCallback(() => {
        share({
            title: getTitle(),
            text: shareMessage,
            url: shareUrl,
        }, "native");
    }, [shareMessage, shareUrl, share, getTitle]);

    const shareToWhatsApp = useCallback(() => {
        share({ text: shareMessage, url: shareUrl }, "whatsapp");
    }, [shareMessage, shareUrl, share]);

    const shareToX = useCallback(() => {
        share({ text: shareMessage, url: shareUrl }, "x");
    }, [shareMessage, shareUrl, share]);

    const copyLink = useCallback(() => {
        share({ text: shareMessage, url: shareUrl }, "copy");
    }, [shareMessage, shareUrl, share]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm">
                {/* Preview card */}
                <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 border border-slate-700 shadow-2xl">
                    <div className="text-center mb-4">
                        <div className="text-5xl mb-2">{getEmoji()}</div>
                        <h2 className="text-2xl font-bold text-white">{getTitle()}</h2>
                        <p className="text-sm text-slate-400 mt-1">{achievement.userName || "You"}</p>
                    </div>

                    <div className="text-center py-6 rounded-xl bg-gradient-to-r from-sky-600/20 to-emerald-600/20 border border-sky-500/30">
                        <div className="text-4xl font-bold text-white">
                            {achievement.value.toLocaleString()}
                        </div>
                        <div className="text-sm text-slate-300 mt-1">steps {getPeriodText()}</div>
                    </div>

                    {achievement.improvementPct !== undefined && (
                        <div className="mt-4 text-center">
                            <span className={`inline-block px-3 py-1 rounded-full text-sm ${achievement.improvementPct >= 0 ? "bg-emerald-900/50 text-emerald-400" : "bg-rose-900/50 text-rose-400"}`}>
                                {achievement.improvementPct >= 0 ? "📈 +" : "📉 "}{achievement.improvementPct}% vs {achievement.comparisonDateRange || achievement.comparisonPeriod || "last period"}
                            </span>
                        </div>
                    )}

                    <div className="mt-4 text-center text-xs text-slate-500">
                        {achievement.leagueName} • #{achievement.rank} of {achievement.totalMembers}
                    </div>
                </div>

                {/* Share buttons */}
                <div className="mt-4 space-y-2">
                    {supportsNativeShare && (
                        <button
                            onClick={handleShare}
                            disabled={isSharing}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50 transition"
                        >
                            📤 {isSharing ? "Sharing..." : "Share"}
                        </button>
                    )}

                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={shareToWhatsApp}
                            className="flex flex-col items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-500 transition"
                        >
                            <span className="text-lg">💬</span>
                            WhatsApp
                        </button>
                        <button
                            onClick={shareToX}
                            className="flex flex-col items-center gap-1 rounded-xl bg-slate-700 px-3 py-2 text-xs font-medium text-white hover:bg-slate-600 transition"
                        >
                            <span className="text-lg font-bold">𝕏</span>
                            X
                        </button>
                        <button
                            onClick={copyLink}
                            className="flex flex-col items-center gap-1 rounded-xl bg-slate-700 px-3 py-2 text-xs font-medium text-white hover:bg-slate-600 transition"
                        >
                            <span className="text-lg">{copied ? "✓" : "📋"}</span>
                            {copied ? "Copied!" : "Copy"}
                        </button>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:text-white hover:border-slate-500 transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Small share trigger button
 */
interface ShareAchievementButtonProps {
    achievement: AchievementData;
    children?: React.ReactNode;
    className?: string;
}

export function ShareAchievementButton({ achievement, children, className = "" }: ShareAchievementButtonProps) {
    const [showCard, setShowCard] = useState(false);

    return (
        <>
            <button
                onClick={() => setShowCard(true)}
                className={`inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 transition ${className}`}
            >
                {children || "🎉 Share"}
            </button>

            {showCard && (
                <AchievementShareCard
                    achievement={achievement}
                    onClose={() => setShowCard(false)}
                />
            )}
        </>
    );
}
