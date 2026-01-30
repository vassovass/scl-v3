'use client';

/**
 * Global Error Boundary for Root Layout Errors
 *
 * CRITICAL: This is a SPECIAL error boundary that catches errors in the ROOT LAYOUT.
 * Regular error.tsx files do NOT catch layout errors - only global-error.tsx does.
 *
 * This component MUST:
 * - Be at src/app/global-error.tsx (exact path)
 * - Include its own <html> and <body> tags (replaces the broken layout)
 * - Use inline styles (no external CSS that might fail to load)
 * - NOT import complex components that could also crash
 *
 * Use case: Provider initialization failures on mobile devices
 */

import { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log error to console for debugging
        console.error('[GlobalError] Root layout crash:', error);

        // Try to send error report (fire and forget)
        try {
            const errorData = {
                message: error.message,
                digest: error.digest,
                stack: error.stack?.split('\n').slice(0, 5).join('\n'),
                url: typeof window !== 'undefined' ? window.location.href : 'unknown',
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
                timestamp: new Date().toISOString(),
            };

            // Use sendBeacon for best-effort error reporting
            if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
                navigator.sendBeacon('/api/feedback', JSON.stringify({
                    type: 'bug',
                    subject: '[GlobalError] Root layout crash',
                    description: `**Auto-reported root layout crash**\n\n\`\`\`json\n${JSON.stringify(errorData, null, 2)}\n\`\`\``,
                    page_url: errorData.url,
                }));
            }
        } catch {
            // Ignore errors in error reporting
        }
    }, [error]);

    return (
        <html lang="en">
            <body style={{
                backgroundColor: '#0a0a0a',
                color: '#ffffff',
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                padding: '1rem',
                margin: 0,
            }}>
                <div style={{
                    maxWidth: '400px',
                    textAlign: 'center',
                    padding: '2rem',
                }}>
                    {/* Error icon */}
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>

                    <h1 style={{
                        fontSize: '1.5rem',
                        fontWeight: 600,
                        marginBottom: '0.75rem',
                        color: '#ef4444',
                    }}>
                        Something went wrong
                    </h1>

                    <p style={{
                        color: '#a1a1aa',
                        marginBottom: '1.5rem',
                        lineHeight: 1.5,
                    }}>
                        {error.message || 'An unexpected error occurred while loading the app.'}
                    </p>

                    {/* Error digest for debugging */}
                    {error.digest && (
                        <p style={{
                            fontSize: '0.75rem',
                            color: '#71717a',
                            marginBottom: '1.5rem',
                            fontFamily: 'monospace',
                            backgroundColor: '#1f1f23',
                            padding: '0.5rem',
                            borderRadius: '0.375rem',
                        }}>
                            Error ID: {error.digest}
                        </p>
                    )}

                    {/* Action buttons */}
                    <div style={{
                        display: 'flex',
                        gap: '0.75rem',
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                    }}>
                        <button
                            onClick={reset}
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                fontWeight: 500,
                                fontSize: '0.875rem',
                            }}
                        >
                            Try Again
                        </button>
                        <a
                            href="/"
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: 'transparent',
                                color: 'white',
                                border: '1px solid #3f3f46',
                                borderRadius: '0.5rem',
                                textDecoration: 'none',
                                fontWeight: 500,
                                fontSize: '0.875rem',
                            }}
                        >
                            Go Home
                        </a>
                        <a
                            href="/reset"
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: 'transparent',
                                color: '#a1a1aa',
                                border: '1px solid #27272a',
                                borderRadius: '0.5rem',
                                textDecoration: 'none',
                                fontWeight: 500,
                                fontSize: '0.875rem',
                            }}
                        >
                            Clear Cache
                        </a>
                    </div>

                    {/* Help text */}
                    <p style={{
                        marginTop: '1.5rem',
                        fontSize: '0.75rem',
                        color: '#52525b',
                    }}>
                        This error has been automatically reported.
                        <br />
                        If the problem persists, try clearing your browser cache.
                    </p>
                </div>
            </body>
        </html>
    );
}
