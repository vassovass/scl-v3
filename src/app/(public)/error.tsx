"use client";

import { useEffect } from "react";
import { CopyableError } from "@/components/ui/CopyableError";
import { generateErrorId, ErrorCode } from "@/lib/errors";

/**
 * Public routes error boundary - catches crashes on public-facing pages
 * (leaderboard, public profiles, etc.)
 */
export default function PublicError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[Public Error Boundary]", error);
    }, [error]);

    const errorId = generateErrorId(ErrorCode.UNEXPECTED_ERROR);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <CopyableError
                title="Page Error"
                message={error.message || "Something went wrong loading this page."}
                errorId={errorId}
                errorCode={ErrorCode.UNEXPECTED_ERROR}
                context={{
                    digest: error.digest,
                    stack: error.stack?.split("\n").slice(0, 5).join("\n"),
                    name: error.name,
                }}
                showDashboardLink={true}
            >
                <div className="flex flex-col gap-2 w-full">
                    <button
                        onClick={reset}
                        className="w-full py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition"
                    >
                        Try Again
                    </button>
                    <a
                        href="/"
                        className="w-full py-2 px-4 rounded-lg border border-border text-sm font-medium hover:bg-secondary/50 transition text-center"
                    >
                        Go Home
                    </a>
                </div>
            </CopyableError>
        </div>
    );
}
