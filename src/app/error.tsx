"use client";

import { useEffect } from "react";
import { CopyableError } from "@/components/ui/CopyableError";
import { generateErrorId, ErrorCode } from "@/lib/errors";

/**
 * Root error boundary - catches any client-side crashes at the app level.
 *
 * This is critical for mobile users where provider initialization
 * (PostHog, Analytics, Auth) can fail on slow/unreliable networks.
 */
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[Global Error Boundary]", error);
    }, [error]);

    const errorId = generateErrorId(ErrorCode.UNEXPECTED_ERROR);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <CopyableError
                title="Something went wrong"
                message={error.message || "An unexpected error occurred while loading the page."}
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
                        href="/"
                        className="w-full py-2 px-4 rounded-lg border border-border text-sm font-medium hover:bg-secondary/50 transition text-center"
                    >
                        Go to Home
                    </a>
                </div>
            </CopyableError>
        </div>
    );
}
