"use client";

import { useEffect } from "react";
import { CopyableError } from "@/components/ui/CopyableError";
import { generateErrorId, ErrorCode } from "@/lib/errors";

interface ClaimErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

/**
 * Error boundary for the claim page.
 *
 * Catches any runtime errors and displays a user-friendly error page
 * with a copyable error ID for support.
 */
export default function ClaimError({ error, reset }: ClaimErrorProps) {
    useEffect(() => {
        // Log error to console for debugging
        console.error("[Claim Page Error]", {
            message: error.message,
            digest: error.digest,
            stack: error.stack,
        });
    }, [error]);

    const errorId = generateErrorId(ErrorCode.PROXY_CLAIM_FAILED);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-mesh p-4">
            <CopyableError
                title="Unable to Load Claim Page"
                message={error.message || "An unexpected error occurred while loading the claim page."}
                errorId={errorId}
                errorCode={ErrorCode.PROXY_CLAIM_FAILED}
                context={{
                    digest: error.digest,
                    name: error.name,
                }}
                actionButton={{
                    label: "Try Again",
                    onClick: reset,
                }}
            />
        </div>
    );
}
