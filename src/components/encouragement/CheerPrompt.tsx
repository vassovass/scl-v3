"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { ENCOURAGEMENT_CONFIG, ZEN_ANIMATIONS } from "@/lib/encouragement/config";

interface CheerPromptProps {
    recipientName: string;
    recipientId: string;
    reason?: string; // e.g. "is 200 steps away" or "is close to a milestone"
    className?: string;
    onClose?: () => void;
}

export function CheerPrompt({
    recipientName,
    recipientId,
    reason,
    className,
    onClose
}: CheerPromptProps) {
    const [dismissed, setDismissed] = useState(false);
    const [sent, setSent] = useState(false);

    // Modular Config
    const theme = ENCOURAGEMENT_CONFIG.cheer;
    const Icon = theme.icon;

    if (dismissed) return null;

    const handleSendSupport = async () => {
        setSent(true);
        // In a real implementation, this would call the API
        try {
            await fetch("/api/high-fives", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ recipient_id: recipientId }),
            });
            // Auto-dismiss after short delay
            setTimeout(() => setDismissed(true), 2000);
        } catch (e) {
            console.error("Failed to cheer", e);
            setSent(false); // Revert if failed
        }
    };

    return (
        <div className={cn(
            "relative overflow-hidden rounded-lg border border-border/50 bg-card/40 p-3 shadow-sm",
            ZEN_ANIMATIONS.entrance,
            className
        )}>
            {/* Background decoration */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-[hsl(var(--primary)/0.05)] blur-2xl" />

            <div className="relative flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full",
                        theme.bgColor,
                        theme.color
                    )}>
                        <Icon className={cn("h-4 w-4", sent && theme.animation)} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-foreground">
                            {sent ? "Support sent!" : `Cheer on ${recipientName}?`}
                        </p>
                        {reason && !sent && (
                            <p className="text-xs text-muted-foreground">{recipientName} {reason}</p>
                        )}
                        {sent && (
                            <p className="text-xs text-muted-foreground">Thanks for being a supportive friend.</p>
                        )}
                    </div>
                </div>

                {!sent && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setDismissed(true)}
                            className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded transition-colors"
                        >
                            Skip
                        </button>
                        <button
                            onClick={handleSendSupport}
                            className={cn(
                                "rounded-md bg-[hsl(var(--primary))] px-3 py-1.5 text-xs font-medium text-[hsl(var(--primary-foreground))]",
                                "transition-all hover:bg-[hsl(var(--primary)/0.9)] hover:shadow-md active:scale-95"
                            )}
                        >
                            Send {theme.label}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

