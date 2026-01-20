/**
 * Encouragement System Configuration
 * Shared constants, types, and logic for social features (PRD 31)
 */

import { Hand, Heart, Sparkles, Trophy, Star } from "lucide-react";

// Types
export type EncouragementType = "high_five" | "cheer" | "milestone" | "streak_celebration";

export interface EncouragementTheme {
    icon: any; // Lucide icon component
    color: string; // Tailwind text class
    bgColor: string; // Tailwind bg class
    label: string;
    animation: string; // Description or class
}

// Configuration
export const ENCOURAGEMENT_CONFIG: Record<EncouragementType, EncouragementTheme> = {
    high_five: {
        icon: Hand,
        color: "text-[hsl(var(--primary))]",
        bgColor: "bg-[hsl(var(--primary)/0.1)]",
        label: "Support",
        animation: "scale-100", // Standard scale
    },
    cheer: {
        icon: Sparkles,
        color: "text-amber-500",
        bgColor: "bg-amber-500/10",
        label: "Cheer",
        animation: "animate-pulse",
    },
    milestone: {
        icon: Trophy,
        color: "text-purple-500",
        bgColor: "bg-purple-500/10",
        label: "Celebrate",
        animation: "animate-bounce",
    },
    streak_celebration: {
        icon: Star,
        color: "text-orange-500",
        bgColor: "bg-orange-500/10",
        label: "On Fire",
        animation: "animate-spin-slow",
    },
};

// Shared "Mindful" Quotes/Copy
export const MINDFUL_QUOTES = [
    "We rise by lifting others.",
    "Small steps lead to big changes.",
    "Progress, not perfection.",
    "Your effort inspires others.",
    "Every step counts.",
];

export function getRandomQuote(): string {
    const idx = Math.floor(Math.random() * MINDFUL_QUOTES.length);
    return MINDFUL_QUOTES[idx];
}

// Shared "Zen" Animation Constants
export const ZEN_ANIMATIONS = {
    pulse: "transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
    glow: "animate-ping opacity-75",
    entrance: "animate-in fade-in slide-in-from-bottom-2 duration-700 ease-out",
};

