"use client";

import { useState, useRef, useEffect } from "react";
import { APP_CONFIG } from "@/lib/config";
import { useShare } from "@/hooks/useShare";

interface LeagueInviteControlProps {
    inviteCode: string;
    leagueName: string;
    className?: string;
}

export function LeagueInviteControl({ inviteCode, leagueName, className = "" }: LeagueInviteControlProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const { share, copied, supportsNativeShare } = useShare({
        onShare: () => setIsOpen(false),
        contentType: 'league_invite',
        itemId: inviteCode
    });

    const getInviteUrl = () => {
        return `${window.location.origin}/invite/${inviteCode}`;
    };

    const inviteText = `Join me in ${leagueName} on ${APP_CONFIG.name}!`;

    const handleShare = (platform: "native" | "whatsapp" | "twitter" | "copy") => {
        share({
            title: `Join ${leagueName}`,
            text: inviteText,
            url: getInviteUrl(),
        }, platform);
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                onMouseEnter={() => setIsOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-6 py-3 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:bg-slate-800 hover:text-white"
                data-tour="invite-button"
            >
                <span>Invite Code:</span>
                <span className="font-mono tracking-wider text-sky-400">{inviteCode}</span>
                <span className="text-xs text-slate-500 ml-1">▼</span>
            </button>

            {isOpen && (
                <div
                    className="absolute left-0 top-full z-20 mt-2 w-64 rounded-xl border border-slate-700 bg-slate-800 p-2 shadow-xl ring-1 ring-black/5"
                    onMouseLeave={() => setIsOpen(false)}
                >
                    <div className="mb-2 px-2 py-1.5 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                        Share Invite Link
                    </div>

                    <button
                        onClick={() => handleShare("copy")}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-700 hover:text-white transition"
                    >
                        <span className="text-lg">{copied ? "✓" : "📋"}</span>
                        <div className="flex-1">
                            <div>{copied ? "Copied!" : "Copy Link"}</div>
                            {!copied && <div className="text-xs text-slate-500 truncate">{getInviteUrl()}</div>}
                        </div>
                    </button>

                    <div className="my-1 border-t border-slate-700/50" />

                    <button
                        onClick={() => handleShare("whatsapp")}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-emerald-900/30 hover:text-emerald-400 transition"
                    >
                        <span className="text-lg">💬</span>
                        WhatsApp
                    </button>

                    <button
                        onClick={() => handleShare("twitter")}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-sky-900/30 hover:text-sky-400 transition"
                    >
                        <span className="text-lg">🐦</span>
                        Twitter
                    </button>

                    {supportsNativeShare && (
                        <button
                            onClick={() => handleShare("native")}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-700 hover:text-white transition"
                        >
                            <span className="text-lg">📤</span>
                            More Options...
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
