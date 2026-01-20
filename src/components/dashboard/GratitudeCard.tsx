"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { ENCOURAGEMENT_CONFIG, MINDFUL_QUOTES, getRandomQuote } from "@/lib/encouragement/config";

interface GratitudeCardProps {
    count: number;
    className?: string;
}

export function GratitudeCard({ count, className }: GratitudeCardProps) {
    const [quote, setQuote] = useState("");

    useEffect(() => {
        setQuote(getRandomQuote());
    }, []);

    if (count === 0) return null;

    const theme = ENCOURAGEMENT_CONFIG.high_five; // Base theme on High Five/Support
    const Icon = theme.icon;

    return (
        <div className={cn(
            "group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-card/80 to-card/40 p-5 shadow-sm",
            className
        )}>
            {/* Gentle background gradient/glow */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-[hsl(var(--primary)/0.05)] blur-3xl transition-opacity duration-1000 group-hover:opacity-100" />

            <div className="relative flex items-start gap-4">
                <div className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full opacity-80",
                    theme.bgColor,
                    theme.color
                )}>
                    <Icon className="h-5 w-5 fill-current" />
                </div>

                <div className="space-y-1">
                    <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                        Warm Fuzzies
                        <Sparkles className="h-3 w-3 text-amber-400" />
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        <span className="font-semibold text-foreground">{count} friends</span> sent you {theme.label.toLowerCase()} today.
                    </p>
                    <p className="text-xs text-muted-foreground italic pt-1">
                        "{quote}"
                    </p>
                </div>
            </div>
        </div>
    );
}

