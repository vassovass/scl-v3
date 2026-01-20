"use client";

import { useState, useRef, useEffect } from "react";
import { APP_CONFIG } from "@/lib/config";
import { useShare } from "@/hooks/useShare";

/**
 * LeagueInviteControl - Theme-aware invite code dropdown with share options
 *
 * IMPORTANT: Text Overflow Prevention Pattern
 * All menu items use this flexbox pattern to prevent text overlap:
 *
 * <div className="flex items-center gap-3">
 *   <Icon className="flex-shrink-0" />  // Icon won't shrink
 *   <div className="flex-1 min-w-0">    // min-w-0 enables truncation
 *     <div className="truncate">Text</div>  // Truncates with ellipsis
 *   </div>
 * </div>
 *
 * The `min-w-0` is CRITICAL - without it, flex items have an implicit
 * `min-width: auto` which prevents truncation.
 */

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

    const handleShare = (platform: "native" | "whatsapp" | "x" | "copy") => {
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
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition hover:border-primary/50 hover:bg-secondary"
                data-tour="invite-button"
            >
                <span>Invite Code:</span>
                <span className="font-mono tracking-wider text-primary">{inviteCode}</span>
                <span className="text-xs text-muted-foreground ml-1">▼</span>
            </button>

            {isOpen && (
                <div
                    className="absolute left-0 top-full z-20 mt-2 w-64 rounded-xl border border-border bg-card p-2 shadow-xl"
                    onMouseLeave={() => setIsOpen(false)}
                >
                    <div className="mb-2 px-2 py-1.5 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                        Share Invite Link
                    </div>

                    <button
                        onClick={() => handleShare("copy")}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-secondary transition"
                    >
                        <span className="text-lg flex-shrink-0">{copied ? "✓" : "📋"}</span>
                        <div className="flex-1 min-w-0">
                            <div className="font-medium">{copied ? "Copied!" : "Copy Link"}</div>
                            {!copied && <div className="text-xs text-muted-foreground truncate overflow-hidden">{getInviteUrl()}</div>}
                        </div>
                    </button>

                    <div className="my-1 border-t border-border" />

                    <button
                        onClick={() => handleShare("whatsapp")}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-[hsl(var(--success)/0.1)] hover:text-[hsl(var(--success))] transition"
                    >
                        <span className="text-lg flex-shrink-0">💬</span>
                        <span className="flex-1 min-w-0 truncate">WhatsApp</span>
                    </button>

                    <button
                        onClick={() => handleShare("x")}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-secondary transition"
                    >
                        <span className="text-lg font-bold flex-shrink-0">𝕏</span>
                        <span className="flex-1 min-w-0 truncate">X</span>
                    </button>

                    {supportsNativeShare && (
                        <button
                            onClick={() => handleShare("native")}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-secondary transition"
                        >
                            <span className="text-lg flex-shrink-0">📤</span>
                            <span className="flex-1 min-w-0 truncate">More Options...</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

