"use client";

import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useFirstVisit } from "@/hooks/useFirstVisit";
import { WORLD_LEAGUE } from "@/lib/constants/league";

export function DashboardWelcomeToast() {
    const { toast } = useToast();
    // PRD 44: Show welcome toast on first dashboard visit
    const isFirstVisit = useFirstVisit("dashboard_welcome");

    useEffect(() => {
        if (isFirstVisit) {
            // Delay slightly for better UX (after page load)
            const timer = setTimeout(() => {
                toast({
                    title: `Welcome to ${WORLD_LEAGUE.NAME}! 🌍`,
                    description: "You've been added to the global leaderboard. See how you rank worldwide!",
                    duration: 6000,
                });
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [isFirstVisit, toast]);

    return null; // Invisible component
}
