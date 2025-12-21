"use client";

import { useState, useCallback } from "react";

interface ShareButtonProps {
    /** Pre-filled message to share */
    message: string;
    /** Optional URL to include (defaults to current page) */
    url?: string;
    /** Button text */
    children?: React.ReactNode;
    /** Additional CSS classes */
    className?: string;
}

type SharePlatform = "native" | "whatsapp" | "twitter" | "copy";

/**
 * Social share button with Web Share API and fallbacks.
 * Supports WhatsApp, Twitter/X, and copy-to-clipboard.
 */
export function ShareButton({
    message,
    url,
    children,
    className = "",
}: ShareButtonProps) {
    const [showMenu, setShowMenu] = useState(false);
    const [copied, setCopied] = useState(false);

    const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
    const fullMessage = `${message}\n${shareUrl}`;

    const supportsNativeShare = typeof navigator !== "undefined" && !!navigator.share;

    const handleShare = useCallback(async (platform: SharePlatform) => {
        setShowMenu(false);

        switch (platform) {
            case "native":
                if (supportsNativeShare) {
                    try {
                        await navigator.share({
                            title: "Step Counter League",
                            text: message,
                            url: shareUrl,
                        });
                    } catch (err) {
                        // User cancelled or error
                        console.log("Share cancelled");
                    }
                }
                break;

            case "whatsapp":
                const waUrl = `https://wa.me/?text=${encodeURIComponent(fullMessage)}`;
                window.open(waUrl, "_blank", "noopener,noreferrer");
                break;

            case "twitter":
                const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(shareUrl)}`;
                window.open(twitterUrl, "_blank", "noopener,noreferrer");
                break;

            case "copy":
                try {
                    await navigator.clipboard.writeText(fullMessage);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                } catch (err) {
                    console.error("Copy failed:", err);
                }
                break;
        }
    }, [message, shareUrl, fullMessage, supportsNativeShare]);

    return (
        <div className="relative inline-block">
            <button
                onClick={() => supportsNativeShare ? handleShare("native") : setShowMenu(!showMenu)}
                className={`inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 transition ${className}`}
            >
                <span>📤</span>
                {children || "Share"}
            </button>

            {/* Fallback dropdown menu */}
            {showMenu && !supportsNativeShare && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-700 bg-slate-900 shadow-xl z-50">
                    <button
                        onClick={() => handleShare("whatsapp")}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-800 rounded-t-lg"
                    >
                        <span className="text-lg">💬</span>
                        WhatsApp
                    </button>
                    <button
                        onClick={() => handleShare("twitter")}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-800"
                    >
                        <span className="text-lg">🐦</span>
                        Twitter / X
                    </button>
                    <button
                        onClick={() => handleShare("copy")}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-800 rounded-b-lg"
                    >
                        <span className="text-lg">{copied ? "✓" : "📋"}</span>
                        {copied ? "Copied!" : "Copy Link"}
                    </button>
                </div>
            )}

            {/* Click outside to close */}
            {showMenu && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMenu(false)}
                />
            )}
        </div>
    );
}

/**
 * Generate share messages for common achievements
 */
export function generateShareMessage(type: string, data: Record<string, unknown>): string {
    switch (type) {
        case "total_steps":
            return `🏃 I walked ${(data.steps as number).toLocaleString()} steps this ${data.period || "week"}! #StepCounterLeague`;

        case "streak":
            return `🔥 I'm on a ${data.days}-day step tracking streak! #StepCounterLeague`;

        case "rank":
            return `🏆 I'm ranked #${data.rank} in my league with ${(data.steps as number).toLocaleString()} steps! #StepCounterLeague`;

        case "personal_best":
            return `💪 New personal best! ${(data.steps as number).toLocaleString()} steps in one day! #StepCounterLeague`;

        case "league_leader":
            return `👑 I'm leading my Step Counter League with ${(data.steps as number).toLocaleString()} steps! #StepCounterLeague`;

        case "consistency":
            return `📊 ${data.days} days of step tracking this month! Consistency is key! #StepCounterLeague`;

        default:
            return `Check out my step counting progress! #StepCounterLeague`;
    }
}
