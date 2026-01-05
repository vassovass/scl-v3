"use client";

import { useState, useCallback } from "react";
import { APP_CONFIG } from "@/lib/config";
import { useShare, SharePlatform } from "@/hooks/useShare";

interface ShareButtonProps {
    /** Pre-filled message to share */
    message: string;
    /** Optional URL to include (defaults to current page) */
    url?: string;
    /** Button text */
    children?: React.ReactNode;
    /** Additional CSS classes */
    className?: string;
    /** Content type for analytics */
    contentType?: string;
    /** ID of the shared item */
    itemId?: string;
}




/**
 * Social share button with Web Share API and fallbacks.
 * Supports WhatsApp, X, and copy-to-clipboard.
 */
export function ShareButton({
    message,
    url,
    children,
    className = "",
    contentType,
    itemId,
}: ShareButtonProps) {
    const [showMenu, setShowMenu] = useState(false);
    const { share, copied, supportsNativeShare } = useShare({
        contentType,
        itemId
    });

    const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");

    const handleShareClick = (platform: SharePlatform) => {
        setShowMenu(false);
        share({ text: message, url: shareUrl }, platform);
    };

    return (
        <div className="relative inline-block">
            <button
                onClick={() => supportsNativeShare ? handleShareClick("native") : setShowMenu(!showMenu)}
                className={`inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 transition ${className}`}
            >
                <span>📤</span>
                {children || "Share"}
            </button>

            {/* Fallback dropdown menu */}
            {showMenu && !supportsNativeShare && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-700 bg-slate-900 shadow-xl z-50">
                    <button
                        onClick={() => handleShareClick("whatsapp")}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-800 rounded-t-lg"
                    >
                        <span className="text-lg">💬</span>
                        WhatsApp
                    </button>
                    <button
                        onClick={() => handleShareClick("x")}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-800"
                    >
                        <span className="text-lg font-bold">𝕏</span>
                        X
                    </button>
                    <button
                        onClick={() => handleShareClick("copy")}
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
            return `🏃 I walked ${(data.steps as number).toLocaleString()} steps this ${data.period || "week"}! ${APP_CONFIG.hashtag}`;

        case "streak":
            return `🔥 I'm on a ${data.days}-day step tracking streak! ${APP_CONFIG.hashtag}`;

        case "rank":
            return `🏆 I'm ranked #${data.rank} in my league with ${(data.steps as number).toLocaleString()} steps! ${APP_CONFIG.hashtag}`;

        case "personal_best":
            return `💪 New personal best! ${(data.steps as number).toLocaleString()} steps in one day! ${APP_CONFIG.hashtag}`;

        case "league_leader":
            return `👑 I'm leading my ${APP_CONFIG.name} with ${(data.steps as number).toLocaleString()} steps! ${APP_CONFIG.hashtag}`;

        case "consistency":
            return `📊 ${data.days} days of step tracking this month! Consistency is key! ${APP_CONFIG.hashtag}`;

        default:
            return `Check out my step counting progress! ${APP_CONFIG.hashtag}`;
    }
}
