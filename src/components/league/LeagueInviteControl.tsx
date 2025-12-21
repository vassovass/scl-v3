"use client";

import { useState, useRef, useEffect } from "react";
import { APP_CONFIG } from "@/lib/config";

interface LeagueInviteControlProps {
    inviteCode: string;
    leagueName: string;
    className?: string;
}

export function LeagueInviteControl({ inviteCode, leagueName, className = "" }: LeagueInviteControlProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
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

    const getInviteUrl = () => {
        return `${window.location.origin}/invite/${inviteCode}`;
    };

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(getInviteUrl());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            setIsOpen(false);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const shareNative = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Join ${leagueName}`,
                    text: `Join me in ${leagueName} on ${APP_CONFIG.name}!`,
                    url: getInviteUrl(),
                });
                setIsOpen(false);
            } catch (err) {
                console.log("Share cancelled:", err);
            }
        } else {
            copyLink();
        }
    };

    const shareWhatsApp = () => {
        const text = `Join me in ${leagueName} on ${APP_CONFIG.name}! ${getInviteUrl()}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
        setIsOpen(false);
    };

    const shareTwitter = () => {
        const text = `Join me in ${leagueName} on ${APP_CONFIG.name}!`;
        window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(getInviteUrl())}`,
            "_blank"
        );
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                onMouseEnter={() => setIsOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-6 py-3 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:bg-slate-800 hover:text-white"
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
                        onClick={copyLink}
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
                        onClick={shareWhatsApp}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-emerald-900/30 hover:text-emerald-400 transition"
                    >
                        <span className="text-lg">💬</span>
                        WhatsApp
                    </button>

                    <button
                        onClick={shareTwitter}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-sky-900/30 hover:text-sky-400 transition"
                    >
                        <span className="text-lg">🐦</span>
                        Twitter
                    </button>

                    {typeof navigator !== "undefined" && "share" in navigator && (
                        <button
                            onClick={shareNative}
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
