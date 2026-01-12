"use client";

import React, { useState, useEffect } from "react";
// Note: We need a server action to fetch stats because serverCache is server-side only
// For now, we'll create a simple UI and assume the data comes from an action or API
// In a real implementation, we'd add `getCacheHealth` to a server action.

export function CacheDevTools({ initialStats }: { initialStats?: any }) {
    const [isOpen, setIsOpen] = useState(false);
    const [stats, setStats] = useState(initialStats || {});

    // Only show in development
    if (process.env.NODE_ENV !== "development") return null;

    return (
        <div className="fixed bottom-4 left-4 z-50 font-mono text-xs">
            {!isOpen ? (
                <button
                    onClick={() => setIsOpen(true)}
                    className="rounded bg-black/80 px-2 py-1 text-white hover:bg-black"
                >
                    ⚡ Cache
                </button>
            ) : (
                <div className="w-64 rounded border border-border bg-background p-4 shadow-xl">
                    <div className="mb-2 flex items-center justify-between">
                        <h3 className="font-bold">Cache Stats</h3>
                        <button onClick={() => setIsOpen(false)}>✕</button>
                    </div>

                    <div className="space-y-2">
                        {Object.entries(stats).length === 0 ? (
                            <p className="text-muted-foreground">No stats collected yet.</p>
                        ) : (
                            Object.entries(stats).map(([tag, stat]: [string, any]) => (
                                <div key={tag} className="border-b border-border pb-1">
                                    <div className="font-semibold text-primary">{tag}</div>
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Hits: {stat.hits}</span>
                                        <span>Misses: {stat.misses}</span>
                                    </div>
                                    {stat.timeouts > 0 && (
                                        <div className="text-red-500">Timeouts: {stat.timeouts}</div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    <div className="mt-2 text-[10px] text-muted-foreground">
                        * Stats allow-listed for Dev environment only
                    </div>
                </div>
            )}
        </div>
    );
}
