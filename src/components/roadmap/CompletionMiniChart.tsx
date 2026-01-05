/**
 * Completion Mini Chart (Sparkline style)
 * 
 * Displays a weekly completion velocity chart for the "Done" column header.
 * Visualizes momentum without heavy charting libraries.
 */

'use client';

import { useMemo } from "react";

interface CompletionMiniChartProps {
    /** 
     * Array of items with completed_at timestamps
     * Ideally pass ALL done items, not just the visible ones
     */
    completedItems: { completed_at: string | null }[];
    weeks?: number;
}

export default function CompletionMiniChart({ completedItems, weeks = 12 }: CompletionMiniChartProps) {
    // Calculate weekly stats
    const chartData = useMemo(() => {
        const now = new Date();
        const buckets = new Array(weeks).fill(0);
        const msPerWeek = 7 * 24 * 60 * 60 * 1000;

        completedItems.forEach(item => {
            if (!item.completed_at) return;

            const completedDate = new Date(item.completed_at);
            const diffMs = now.getTime() - completedDate.getTime();
            const weeksAgo = Math.floor(diffMs / msPerWeek);

            // Bucket 0 is "this week", Bucket weeks-1 is "oldest"
            // We want to display oldest -> newest (left to right)
            if (weeksAgo >= 0 && weeksAgo < weeks) {
                // Invert index so 0 is oldest shown (left)
                const index = (weeks - 1) - weeksAgo;
                buckets[index]++;
            }
        });

        return buckets;
    }, [completedItems, weeks]);

    const maxCount = Math.max(...chartData, 1);

    // Only show if we have data
    const hasData = completedItems.length > 0;

    if (!hasData) return null;

    return (
        <div className="flex items-end gap-0.5 h-full w-24 opacity-60 hover:opacity-100 transition-opacity" title="Shipping velocity (last 12 weeks)">
            {chartData.map((count, i) => {
                // Calculate height percentage (min 10% to be visible)
                const heightPct = count === 0 ? 10 : Math.max(15, (count / maxCount) * 100);

                return (
                    <div
                        key={i}
                        className={`flex-1 rounded-t-sm transition-all duration-300 ${count > 0
                            ? 'bg-emerald-500'
                            : 'bg-border opacity-30'
                            }`}
                        style={{ height: `${heightPct}%` }}
                    />
                );
            })}
        </div>
    );
}
