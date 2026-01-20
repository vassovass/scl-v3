"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

/**
 * LoadingWatchdog Provider
 *
 * Monitors the auth loading state and shows a recovery toast if the app
 * appears stuck (loading for too long). This is a systems-level safeguard
 * that works automatically across all pages.
 *
 * How it works:
 * 1. Watches AuthProvider's `loading` state
 * 2. Starts a timer when loading is true
 * 3. If loading is true for > STUCK_THRESHOLD_MS, shows toast with reset action
 * 4. If loading becomes false, clears the timer
 *
 * Uses existing shadcn toast infrastructure per AGENTS.md patterns.
 */

const STUCK_THRESHOLD_MS = 15000; // 15 seconds

export function LoadingWatchdog({ children }: { children: React.ReactNode }) {
    const { loading } = useAuth();
    const toastShownRef = useRef(false);

    useEffect(() => {
        // Reset if loading completes
        if (!loading) {
            toastShownRef.current = false;
            return;
        }

        // Don't show multiple toasts
        if (toastShownRef.current) return;

        // Start stuck detection timer
        const timer = setTimeout(() => {
            console.log("[LoadingWatchdog] Loading stuck for 15s, showing recovery toast");
            toastShownRef.current = true;

            toast({
                title: "Taking too long?",
                description: "The app may be stuck. Try resetting to fix loading issues.",
                action: (
                    <ToastAction
                        altText="Reset app"
                        onClick={() => {
                            window.location.href = "/reset";
                        }}
                    >
                        Reset App
                    </ToastAction>
                ),
                duration: 30000, // Keep visible for 30 seconds
            });
        }, STUCK_THRESHOLD_MS);

        return () => clearTimeout(timer);
    }, [loading]);

    return <>{children}</>;
}

