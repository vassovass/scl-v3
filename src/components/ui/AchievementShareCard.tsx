"use client";

import { useState, useRef, useCallback } from "react";
import html2canvas from "html2canvas";

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
}

interface AchievementShareCardProps {
    achievement: AchievementData;
    onClose?: () => void;
}

/**
 * Shareable achievement card with screenshot capture.
 * Creates a beautiful branded card that can be shared as an image.
 */
export function AchievementShareCard({ achievement, onClose }: AchievementShareCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [sharing, setSharing] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    const getTitle = () => {
        switch (achievement.type) {
            case "rank":
                if (achievement.rank === 1) return "League Leader!";
                if (achievement.rank === 2) return "2nd Place!";
                if (achievement.rank === 3) return "3rd Place!";
                return `Ranked #${achievement.rank}!`;
            case "personal_best": return "New Personal Best!";
            case "streak": return `${achievement.value}-Day Streak!`;
            case "improvement": return `${achievement.value}% Improvement!`;
            case "leader": return "I'm Leading!";
            default: return achievement.label;
        }
    };

    const getMessage = () => {
        const name = achievement.userName || "I";
        switch (achievement.type) {
            case "rank":
                if (achievement.rank === 1) {
                    return `${name} came 1st in ${achievement.leagueName || "my league"} with ${achievement.value.toLocaleString()} steps! 👑`;
                }
                return `${name} ranked #${achievement.rank} out of ${achievement.totalMembers} with ${achievement.value.toLocaleString()} steps! 🏆`;
            case "personal_best":
                return `${name} hit a new personal best: ${achievement.value.toLocaleString()} steps in one day! 💪`;
            case "streak":
                return `${name}'m on a ${achievement.value}-day step tracking streak! 🔥`;
            case "improvement":
                return `${name} improved by ${achievement.value}% compared to last week! 📈`;
            case "leader":
                return `${name}'m leading ${achievement.leagueName || "my league"} with ${achievement.value.toLocaleString()} steps! 👑`;
            default:
                return `${achievement.label}: ${achievement.value.toLocaleString()} steps! #StepCountLeague`;
        }
    };

    const captureAndShare = useCallback(async () => {
        if (!cardRef.current) return;
        setSharing(true);
        setError(null);

        try {
            // Capture the card as image
            const canvas = await html2canvas(cardRef.current, {
                backgroundColor: "#0f172a",
                scale: 2,
                useCORS: true,
            });

            const blob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob((b) => {
                    if (b) resolve(b);
                    else reject(new Error("Failed to create image"));
                }, "image/png");
            });

            const file = new File([blob], "achievement.png", { type: "image/png" });
            const shareMessage = getMessage() + "\n\n#StepCountLeague";

            // Try native share with image (works on mobile)
            if (navigator.share && navigator.canShare?.({ files: [file] })) {
                await navigator.share({
                    text: shareMessage,
                    files: [file],
                });
            } else {
                // Fallback: Download image
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `scl-achievement-${Date.now()}.png`;
                a.click();
                URL.revokeObjectURL(url);

                // Also copy message to clipboard
                await navigator.clipboard.writeText(shareMessage);
                alert("Image downloaded! Share message copied to clipboard.");
            }
        } catch (err) {
            console.error("Share failed:", err);
            setError("Sharing failed. Try again.");
        } finally {
            setSharing(false);
        }
    }, [getMessage]);

    const shareToWhatsApp = useCallback(async () => {
        if (!cardRef.current) return;
        setSharing(true);
        setError(null);

        try {
            const canvas = await html2canvas(cardRef.current, {
                backgroundColor: "#0f172a",
                scale: 2,
            });

            const blob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob((b) => b ? resolve(b) : reject(new Error("Failed")), "image/png");
            });

            const file = new File([blob], "achievement.png", { type: "image/png" });
            const shareMessage = getMessage();

            // Try native share to WhatsApp with image
            if (navigator.share && navigator.canShare?.({ files: [file] })) {
                await navigator.share({
                    text: shareMessage,
                    files: [file],
                });
            } else {
                // Fallback: Open WhatsApp with text only, download image
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `scl-achievement.png`;
                a.click();
                URL.revokeObjectURL(url);

                const waUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage + "\n\n(Image downloaded - attach it!)")}`;
                window.open(waUrl, "_blank");
            }
        } catch (err) {
            setError("WhatsApp share failed");
        } finally {
            setSharing(false);
        }
    }, [getMessage]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm">
                {/* The shareable card */}
                <div
                    ref={cardRef}
                    className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 border border-slate-700 shadow-2xl"
                >
                    {/* Header */}
                    <div className="text-center mb-4">
                        <div className="text-5xl mb-2">{getEmoji()}</div>
                        <h2 className="text-2xl font-bold text-white">{getTitle()}</h2>
                        {achievement.subtext && (
                            <p className="text-sm text-slate-400 mt-1">{achievement.subtext}</p>
                        )}
                    </div>

                    {/* Main stat */}
                    <div className="text-center py-6 rounded-xl bg-gradient-to-r from-sky-600/20 to-emerald-600/20 border border-sky-500/30">
                        <div className="text-4xl font-bold text-white">
                            {achievement.value.toLocaleString()}
                        </div>
                        <div className="text-sm text-slate-300 mt-1">{achievement.label}</div>
                    </div>

                    {/* League info */}
                    {achievement.leagueName && (
                        <div className="mt-4 text-center text-sm text-slate-400">
                            {achievement.leagueName}
                            {achievement.rank && achievement.totalMembers && (
                                <span className="ml-2 text-sky-400">
                                    #{achievement.rank} of {achievement.totalMembers}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Branding */}
                    <div className="mt-6 pt-4 border-t border-slate-700 text-center">
                        <div className="text-sm font-semibold text-slate-300">
                            Step<span className="text-sky-400">Count</span>League
                        </div>
                        <div className="text-xs text-slate-500">scl-v3.vercel.app</div>
                    </div>
                </div>

                {/* Share buttons */}
                <div className="mt-4 space-y-2">
                    <button
                        onClick={captureAndShare}
                        disabled={sharing}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50 transition"
                    >
                        {sharing ? "Creating image..." : "📤 Share Achievement"}
                    </button>

                    <button
                        onClick={shareToWhatsApp}
                        disabled={sharing}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition"
                    >
                        💬 Share to WhatsApp
                    </button>

                    {error && <p className="text-xs text-red-400 text-center">{error}</p>}

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
 * Small share trigger button that opens the achievement card modal
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
