"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { analytics } from "@/lib/analytics";
import { ENCOURAGEMENT_CONFIG, ZEN_ANIMATIONS } from "@/lib/encouragement/config";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip";

interface HighFiveButtonProps {
    submissionId?: string; // Optional: if specific to a submission
    recipientId: string;
    initialCount?: number;
    initialHasHighFived?: boolean;
    className?: string;
    size?: "sm" | "md" | "lg";
    onHighFive?: (newState: boolean) => void;
    disabled?: boolean;
}

export function HighFiveButton({
    submissionId,
    recipientId,
    initialCount = 0,
    initialHasHighFived = false,
    className,
    size = "md",
    onHighFive,
    disabled
}: HighFiveButtonProps) {
    const [count, setCount] = useState(initialCount);
    const [hasHighFived, setHasHighFived] = useState(initialHasHighFived);
    const [isAnimating, setIsAnimating] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (loading || disabled) return;

        // Optimistic update
        const previousState = hasHighFived;
        const previousCount = count;
        const newState = !previousState;

        setHasHighFived(newState);
        setCount(newState ? count + 1 : Math.max(0, count - 1));

        if (newState) {
            setIsAnimating(true);
            // Zen Pulse Effect: shorter, softer animation
            setTimeout(() => setIsAnimating(false), 1000);
        }

        try {
            setLoading(true);

            const payload = {
                recipient_id: recipientId,
                submission_id: submissionId,
            };

            const res = await fetch("/api/high-fives", {
                method: newState ? "POST" : "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                throw new Error("Failed to update");
            }

            if (onHighFive) onHighFive(newState);

            // Track high five interaction
            analytics.highFiveSent(recipientId, newState);

        } catch (error) {
            // Revert on error
            console.error("High five failed:", error);
            setHasHighFived(previousState);
            setCount(previousCount);
        } finally {
            setLoading(false);
        }
    };

    const iconSizes = {
        sm: "h-3 w-3",
        md: "h-4 w-4",
        lg: "h-5 w-5"
    };

    const theme = ENCOURAGEMENT_CONFIG.high_five;
    const Icon = theme.icon;

    return (
        <TooltipProvider delayDuration={300}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={handleClick}
                        disabled={disabled}
                        className={cn(
                            "group relative flex items-center gap-1.5 rounded-full transition-all duration-300 ease-out",
                            // Mindful Interaction: Soft background on hover
                            "hover:bg-[hsl(var(--primary)/0.08)]",
                            hasHighFived ? theme.color : "text-muted-foreground hover:text-[hsl(var(--primary))]",
                            className
                        )}
                        aria-label={hasHighFived ? "Remove support" : "Send support"}
                    >
                        <div className="relative">
                            <Icon
                                className={cn(
                                    iconSizes[size],
                                    ZEN_ANIMATIONS.pulse,
                                    isAnimating && "scale-125",
                                    hasHighFived && !isAnimating && "scale-100",
                                    !hasHighFived && "group-hover:scale-110"
                                )}
                            />

                            {/* Zen Glow Effect (Pulse) */}
                            {isAnimating && (
                                <span className={cn(
                                    "absolute inset-0 -z-10 rounded-full bg-[hsl(var(--primary)/0.3)]",
                                    ZEN_ANIMATIONS.glow
                                )} />
                            )}
                        </div>

                        {count > 0 && (
                            <span className={cn(
                                "font-medium tabular-nums transition-colors duration-300",
                                size === "sm" ? "text-[10px]" : "text-xs",
                                hasHighFived ? "text-[hsl(var(--primary))]" : "text-muted-foreground"
                            )}>
                                {count}
                            </span>
                        )}
                    </button>
                </TooltipTrigger>
                <TooltipContent
                    side="top"
                    className="bg-background/95 backdrop-blur-sm border-border/50 text-foreground text-xs shadow-sm"
                >
                    {hasHighFived ? "Supported!" : theme.label}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
