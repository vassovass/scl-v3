/**
 * Subscribe Button for Roadmap
 * 
 * Allows users to:
 * 1. Subscribe via email (redirects to sign-up with params)
 * 2. Copy RSS feed URL for power users
 */

'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';

export default function RoadmapSubscribe() {
    const [showOptions, setShowOptions] = useState(false);
    const [copied, setCopied] = useState(false);

    // Get full URL for RSS feed
    const getRssUrl = () => {
        if (typeof window === 'undefined') return '';
        return `${window.location.origin}/api/roadmap/rss`;
    };

    const handleCopyRss = async () => {
        try {
            await navigator.clipboard.writeText(getRssUrl());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowOptions(!showOptions)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-card hover:bg-muted/50 text-foreground rounded-lg border border-border transition-colors"
                aria-haspopup="true"
                aria-expanded={showOptions}
            >
                <span>📫</span>
                <span>Get Updates</span>
            </button>

            {showOptions && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowOptions(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-xl shadow-lg z-20 overflow-hidden animate-fade-in">
                        <div className="p-3 border-b border-border bg-muted/50">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Stay Updated
                            </h3>
                        </div>

                        <div className="p-2 space-y-1 bg-card">
                            {/* Email Option */}
                            <a
                                href="/sign-in?redirect=/roadmap"
                                className="flex items-center gap-3 w-full p-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors text-left"
                            >
                                <span className="text-lg">📧</span>
                                <div>
                                    <div className="font-medium">Via Email</div>
                                    <div className="text-xs text-muted-foreground">Get notified of major releases</div>
                                </div>
                            </a>

                            {/* RSS Option */}
                            <button
                                onClick={handleCopyRss}
                                className="flex items-center gap-3 w-full p-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors text-left group"
                            >
                                <span className="text-lg">📡</span>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium flex items-center justify-between">
                                        <span>RSS Feed</span>
                                        {copied && (
                                            <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                                COPIED
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate">
                                        {getRssUrl().replace(/^https?:\/\//, '')}
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
