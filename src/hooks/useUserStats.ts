"use client";

import { useState, useEffect } from "react";

export interface UserStats {
    best_day_steps: number;
    best_day_date: string | null;
    current_streak: number;
    longest_streak: number;
    total_steps_lifetime: number;
}

export function useUserStats() {
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch("/api/user/stats");
                if (!res.ok) throw new Error("Failed to fetch");
                const data = await res.json();
                if (data.stats) setStats(data.stats);
            } catch (err) {
                console.error("Failed to fetch user stats", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return { stats, loading };
}

