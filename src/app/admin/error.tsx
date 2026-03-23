"use client";

import { useEffect } from "react";
import { CopyableError } from "@/components/ui/CopyableError";
import { generateErrorId, ErrorCode } from "@/lib/errors";

/**
 * Admin routes error boundary - catches crashes on admin pages.
 */
export default function AdminError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[Admin Error Boundary]", error);
    }, [error]);

    const errorId = generateErrorId(ErrorCode.UNEXPECTED_ERROR);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <CopyableError
                title="Admin Error"
                message={error.message || "Something went wrong loading the admin page."}
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
                        href="/admin"
                        className="w-full py-2 px-4 rounded-lg border border-border text-sm font-medium hover:bg-secondary/50 transition text-center"
                    >
                        Reload Admin
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
