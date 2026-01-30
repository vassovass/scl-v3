"use client";

import { useEffect } from "react";
import { CopyableError } from "@/components/ui/CopyableError";
import { generateErrorId, ErrorCode } from "@/lib/errors";

/**
 * Auth routes error boundary - catches crashes on sign-in, sign-up, claim pages.
 *
 * These pages often have complex redirects and auth state that can fail
 * on mobile or slow networks.
 */
export default function AuthError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[Auth Error Boundary]", error);
    }, [error]);

    const errorId = generateErrorId(ErrorCode.AUTH_REDIRECT_FAILED);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <CopyableError
                title="Authentication Error"
                message={error.message || "Something went wrong during authentication. Please try again."}
                errorId={errorId}
                errorCode={ErrorCode.AUTH_REDIRECT_FAILED}
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
                        href="/sign-in"
                        className="w-full py-2 px-4 rounded-lg border border-border text-sm font-medium hover:bg-secondary/50 transition text-center"
                    >
                        Go to Sign In
                    </a>
                    <a
                        href="/"
                        className="w-full py-2 px-4 rounded-lg text-sm text-muted-foreground hover:text-foreground transition text-center"
                    >
                        Go to Home
                    </a>
                </div>
            </CopyableError>
        </div>
    );
}
