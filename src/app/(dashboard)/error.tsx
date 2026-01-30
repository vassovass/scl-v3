"use client";

import { useEffect } from "react";
import { CopyableError } from "@/components/ui/CopyableError";
import { generateErrorId, ErrorCode } from "@/lib/errors";

/**
 * Dashboard routes error boundary - catches crashes on dashboard and related pages.
 *
 * This is the most critical error boundary for logged-in users.
 * Mobile users often hit issues here due to slow network + multiple API calls.
 */
export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[Dashboard Error Boundary]", error);
    }, [error]);

    const errorId = generateErrorId(ErrorCode.UNEXPECTED_ERROR);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <CopyableError
                title="Dashboard Error"
                message={error.message || "Something went wrong loading the dashboard. Please try again."}
                errorId={errorId}
                errorCode={ErrorCode.UNEXPECTED_ERROR}
                context={{
                    digest: error.digest,
                    stack: error.stack?.split("\n").slice(0, 5).join("\n"),
                    name: error.name,
                }}
                showDashboardLink={false}
            >
                <div className="flex flex-col gap-2 w-full">
                    <button
                        onClick={reset}
                        className="w-full py-2.5 px-4 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition"
                    >
                        Try Again
                    </button>
                    <a
                        href="/dashboard"
                        className="w-full py-2 px-4 rounded-lg border border-border text-sm font-medium hover:bg-secondary/50 transition text-center"
                    >
                        Reload Dashboard
                    </a>
                    <a
                        href="/reset"
                        className="w-full py-2 px-4 rounded-lg text-sm text-muted-foreground hover:text-foreground transition text-center"
                    >
                        Clear Cache & Retry
                    </a>
                </div>
            </CopyableError>
        </div>
    );
}
