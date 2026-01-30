"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import posthog from "posthog-js";

interface CopyableErrorProps {
    /** Error title displayed prominently */
    title?: string;
    /** User-friendly error message */
    message: string;
    /** Unique error ID for support reference (e.g., SCL-PROXYNOT-x7k2m) */
    errorId?: string;
    /** Technical error code */
    errorCode?: string;
    /** Additional context for debugging */
    context?: Record<string, unknown>;
    /** Show copy button (default: true) */
    showCopyButton?: boolean;
    /** Show link to dashboard (default: true) */
    showDashboardLink?: boolean;
    /** Show "Report to Developer" button (default: true) */
    showReportButton?: boolean;
    /** Custom action button */
    actionButton?: {
        label: string;
        href?: string;
        onClick?: () => void;
    };
    /** Children rendered in the action area (e.g., custom buttons) */
    children?: React.ReactNode;
}

/**
 * Get debug info for error reporting
 */
function getDebugInfo() {
    if (typeof window === "undefined") return {};

    // Get PostHog session info
    let posthogSessionId: string | undefined;
    let posthogDistinctId: string | undefined;
    let posthogSessionUrl: string | undefined;

    try {
        if (posthog.__loaded) {
            posthogSessionId = posthog.get_session_id() ?? undefined;
            posthogDistinctId = posthog.get_distinct_id() ?? undefined;
            // Construct PostHog session replay URL
            if (posthogSessionId) {
                posthogSessionUrl = `https://us.posthog.com/project/95091/replay/${posthogSessionId}`;
            }
        }
    } catch {
        // PostHog not loaded
    }

    return {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
        posthogSessionId,
        posthogDistinctId,
        posthogSessionUrl,
        online: navigator.onLine,
    };
}

/**
 * Reusable error display component with copy-to-clipboard functionality.
 *
 * Users can copy the full error details as JSON to share with support/developers.
 * This makes debugging much easier as it includes:
 * - Unique error ID
 * - Error code
 * - Message
 * - Timestamp
 * - Current URL
 * - PostHog session ID for replay
 * - Any additional context
 */
export function CopyableError({
    title = "Something went wrong",
    message,
    errorId,
    errorCode,
    context,
    showCopyButton = true,
    showDashboardLink = true,
    showReportButton = true,
    actionButton,
    children,
}: CopyableErrorProps) {
    const { toast } = useToast();
    const [copied, setCopied] = useState(false);
    const [reporting, setReporting] = useState(false);
    const [reported, setReported] = useState(false);
    const [autoReportFailed, setAutoReportFailed] = useState(false);
    const [debugInfo, setDebugInfo] = useState<ReturnType<typeof getDebugInfo>>({});

    // Get debug info on mount
    useEffect(() => {
        setDebugInfo(getDebugInfo());
    }, []);

    // Auto-report error on mount (fire and forget)
    useEffect(() => {
        if (!errorId && !errorCode) return; // Only auto-report if we have error details
        if (reported || reporting) return; // Don't double-report

        const autoReport = async () => {
            setReporting(true);
            try {
                const info = getDebugInfo();
                const errorData = {
                    errorId,
                    code: errorCode,
                    message,
                    ...info,
                    ...(context && { context }),
                };

                const description = `
**Auto-Reported Error**

Error ID: \`${errorId || "N/A"}\`
Error Code: \`${errorCode || "N/A"}\`
Message: ${message}

**Debug Info:**
- URL: ${info.url}
- Time: ${info.timestamp}
- Timezone: ${info.timezone}
- Screen: ${info.screenSize}
- Online: ${info.online}
${info.posthogSessionUrl ? `- Session Replay: ${info.posthogSessionUrl}` : ""}

**Full Error Data:**
\`\`\`json
${JSON.stringify(errorData, null, 2)}
\`\`\`
`.trim();

                const res = await fetch("/api/feedback", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        type: "bug",
                        subject: `[Auto] Error: ${errorCode || errorId || "Unknown"}`,
                        description,
                        page_url: info.url,
                    }),
                });

                if (res.ok) {
                    setReported(true);
                    console.log("[CopyableError] Auto-reported error to developer");
                } else {
                    setAutoReportFailed(true);
                }
            } catch (err) {
                console.error("[CopyableError] Auto-report failed:", err);
                setAutoReportFailed(true);
            } finally {
                setReporting(false);
            }
        };

        // Small delay to ensure component is fully mounted
        const timeout = setTimeout(autoReport, 500);
        return () => clearTimeout(timeout);
    }, [errorId, errorCode, message, context, reported, reporting]);

    const getErrorData = () => ({
        errorId,
        code: errorCode,
        message,
        ...debugInfo,
        ...(context && { context }),
    });

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(JSON.stringify(getErrorData(), null, 2));
            setCopied(true);
            toast({
                title: "Copied!",
                description: "Error details copied to clipboard",
            });
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for browsers that don't support clipboard API
            toast({
                title: "Copy failed",
                description: "Please manually copy the error ID below",
                variant: "destructive",
            });
        }
    };

    const reportToFeedback = async () => {
        setReporting(true);
        try {
            const errorData = getErrorData();
            const description = `
**Error Report (Auto-generated)**

Error ID: \`${errorId || "N/A"}\`
Error Code: \`${errorCode || "N/A"}\`
Message: ${message}

**Debug Info:**
- URL: ${debugInfo.url}
- Time: ${debugInfo.timestamp}
- Timezone: ${debugInfo.timezone}
- Screen: ${debugInfo.screenSize}
- Online: ${debugInfo.online}
${debugInfo.posthogSessionUrl ? `- Session Replay: ${debugInfo.posthogSessionUrl}` : ""}

**Full Error Data:**
\`\`\`json
${JSON.stringify(errorData, null, 2)}
\`\`\`
`.trim();

            const res = await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "bug",
                    subject: `Error Report: ${errorCode || errorId || "Unknown Error"}`,
                    description,
                    page_url: debugInfo.url,
                }),
            });

            if (!res.ok) throw new Error("Failed to submit");

            setReported(true);
            toast({
                title: "Report sent!",
                description: "The developer has been notified. Thank you!",
            });
        } catch (err) {
            toast({
                title: "Failed to send report",
                description: "Please copy the error details and share them manually.",
                variant: "destructive",
            });
        } finally {
            setReporting(false);
        }
    };

    return (
        <div className="max-w-md w-full mx-4 p-6 rounded-lg bg-card/80 border border-destructive/50 text-center space-y-4">
            <span className="text-4xl block">
                {errorCode?.includes("PROXY") ? "🔗" : "❌"}
            </span>

            <h1 className="text-xl font-semibold text-destructive">
                {title}
            </h1>

            <p className="text-muted-foreground">
                {message}
            </p>

            {errorId && (
                <div className="bg-secondary/50 rounded-lg p-3 space-y-1">
                    <p className="text-xs text-muted-foreground">Error Reference</p>
                    <code className="text-sm font-mono text-foreground select-all">
                        {errorId}
                    </code>
                </div>
            )}

            {/* PostHog Session Link (for developers) */}
            {debugInfo.posthogSessionId && (
                <div className="bg-[hsl(var(--info)/0.1)] rounded-lg p-2 text-xs">
                    <p className="text-[hsl(var(--info))]">Session ID: <code className="select-all">{debugInfo.posthogSessionId}</code></p>
                </div>
            )}

            <div className="flex flex-col gap-2">
                {/* Auto-report status */}
                {reporting && (
                    <div className="w-full py-2.5 px-4 rounded-lg bg-[hsl(var(--info)/0.1)] border border-[hsl(var(--info)/0.3)] text-[hsl(var(--info))] text-sm font-medium flex items-center justify-center gap-2">
                        <span className="animate-spin">⏳</span>
                        Automatically reporting to developer...
                    </div>
                )}

                {reported && (
                    <div className="w-full py-2.5 px-4 rounded-lg bg-[hsl(var(--success)/0.1)] border border-[hsl(var(--success)/0.3)] text-[hsl(var(--success))] text-sm font-medium flex items-center justify-center gap-2">
                        <CheckIcon className="w-4 h-4" />
                        Error automatically reported - we&apos;re on it!
                    </div>
                )}

                {/* Manual report button - only show if auto-report failed */}
                {showReportButton && autoReportFailed && !reported && (
                    <button
                        onClick={reportToFeedback}
                        disabled={reporting}
                        className="w-full py-2.5 px-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <BugIcon className="w-4 h-4" />
                        Report to Developer (auto-report failed)
                    </button>
                )}

                {showCopyButton && (
                    <button
                        onClick={copyToClipboard}
                        className="w-full py-2 px-4 rounded-lg border border-border text-sm font-medium hover:bg-secondary/50 transition flex items-center justify-center gap-2"
                    >
                        {copied ? (
                            <>
                                <CheckIcon className="w-4 h-4 text-[hsl(var(--success))]" />
                                Copied!
                            </>
                        ) : (
                            <>
                                <CopyIcon className="w-4 h-4" />
                                Copy Error Details
                            </>
                        )}
                    </button>
                )}

                {actionButton && (
                    actionButton.href ? (
                        <Link
                            href={actionButton.href}
                            className="w-full py-2 px-4 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition text-center"
                        >
                            {actionButton.label}
                        </Link>
                    ) : (
                        <button
                            onClick={actionButton.onClick}
                            className="w-full py-2 px-4 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition"
                        >
                            {actionButton.label}
                        </button>
                    )
                )}

                {showDashboardLink && !actionButton && !children && (
                    <Link
                        href="/dashboard"
                        className="w-full py-2 px-4 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition text-center"
                    >
                        Go to Dashboard
                    </Link>
                )}

                {/* Custom children (e.g., reset button from error boundaries) */}
                {children}
            </div>

            {/* Help text with guidance */}
            <div className="text-xs text-muted-foreground space-y-2 border-t border-border/50 pt-3 mt-3">
                {reported && (
                    <div className="mb-2 p-2 rounded bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]">
                        <p className="font-medium">This error has been automatically reported to Vasso.</p>
                        <p>No action needed - we&apos;ll investigate and fix it!</p>
                    </div>
                )}
                <p className="font-medium text-foreground">While you wait, try these quick fixes:</p>
                <ul className="space-y-1 text-left">
                    <li className="flex items-start gap-2">
                        <span className="text-primary">1.</span>
                        <span><button onClick={() => window.location.reload()} className="text-primary hover:underline">Refresh this page</button> - sometimes that&apos;s all it takes</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-primary">2.</span>
                        <span>Make sure you&apos;re <a href="/sign-in" className="text-primary hover:underline">signed in</a> to your account</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-primary">3.</span>
                        <span>Try a different browser or device</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-primary">4.</span>
                        <span>Check your internet connection</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-primary">5.</span>
                        <span><a href="/reset" className="text-primary hover:underline">Clear app cache</a> and sign in again</span>
                    </li>
                </ul>
                <div className="mt-3 p-2 rounded bg-[hsl(var(--info)/0.1)] text-[hsl(var(--info))]">
                    <p>Vasso appreciates your patience! If you need urgent help, copy the error details above and send via WhatsApp.</p>
                </div>
            </div>
        </div>
    );
}

// Simple icon components
function CopyIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
        </svg>
    );
}

function CheckIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}

function BugIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="m8 2 1.88 1.88" />
            <path d="M14.12 3.88 16 2" />
            <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" />
            <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" />
            <path d="M12 20v-9" />
            <path d="M6.53 9C4.6 8.8 3 7.1 3 5" />
            <path d="M6 13H2" />
            <path d="M3 21c0-2.1 1.7-3.9 3.8-4" />
            <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4" />
            <path d="M22 13h-4" />
            <path d="M17.2 17c2.1.1 3.8 1.9 3.8 4" />
        </svg>
    );
}
