"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

/**
 * AuthErrorAlert
 * 
 * Displays a prominent alert when an auth error is detected from the URL.
 * Uses AuthProvider as single source of truth for auth error state.
 * 
 * Place this in layouts where auth errors should be visible (e.g., dashboard).
 */
export function AuthErrorAlert() {
    const { authError, clearAuthError } = useAuth();

    if (!authError) return null;

    // Map error codes to user-friendly messages
    const errorMessages: Record<string, { title: string; description: string }> = {
        auth_callback_failed: {
            title: "Authentication Failed",
            description: "The sign-in link may have been opened in the wrong browser. Please sign in again.",
        },
        auth_code_exchange_failed: {
            title: "Verification Failed",
            description: "This verification link was opened in a different browser than where you signed up. Please sign in again.",
        },
        auth_session_conflict: {
            title: "Session Conflict",
            description: "A different account was already signed in. Please sign in with the correct account.",
        },
        auth_link_expired: {
            title: "Link Expired",
            description: "This verification link has expired. Please request a new one.",
        },
    };

    const { title, description } = errorMessages[authError] || {
        title: "Authentication Error",
        description: "An error occurred during sign-in. Please try again.",
    };

    return (
        <Alert variant="destructive" className="mx-4 mt-4 border-destructive/50 bg-destructive/10">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span>{description}</span>
                <div className="flex gap-2">
                    <Link
                        href="/sign-in"
                        onClick={clearAuthError}
                        className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        Sign In
                    </Link>
                    <button
                        onClick={clearAuthError}
                        className="text-sm text-muted-foreground hover:text-foreground"
                    >
                        Dismiss
                    </button>
                </div>
            </AlertDescription>
        </Alert>
    );
}
