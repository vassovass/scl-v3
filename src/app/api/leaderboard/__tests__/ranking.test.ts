/**
 * Leaderboard Ranking & Scoring Tests
 * 
 * Tests for score aggregation, ranking logic, badge assignment.
 * Based on /api/leaderboard route logic.
 */

import { describe, it, expect, vi } from 'vitest';

// Types based on actual leaderboard route
interface UserStats {
    user_id: string;
    display_name: string | null;
    total_steps: number;
    days_submitted: number;
    average_per_day: number;
    streak: number;
    is_proxy?: boolean;
}

interface LeaderboardEntry {
    rank: number;
    user_id: string;
    display_name: string | null;
    total_steps: number;
    badges: string[];
    improvement_pct: number | null;
}

describe('Leaderboard - Score Aggregation', () => {
    describe('Step totals', () => {
        it('sums all submission steps correctly', () => {
            const submissions = [
                { steps: 5000 },
                { steps: 7500 },
                { steps: 3000 },
            ];
            const total = submissions.reduce((sum, s) => sum + s.steps, 0);
            expect(total).toBe(15500);
        });

        it('handles single submission', () => {
            const submissions = [{ steps: 10000 }];
            const total = submissions.reduce((sum, s) => sum + s.steps, 0);
            expect(total).toBe(10000);
        });

        it('handles zero submissions', () => {
            const submissions: { steps: number }[] = [];
            const total = submissions.reduce((sum, s) => sum + s.steps, 0);
            expect(total).toBe(0);
        });
    });

    describe('Average calculation', () => {
        it('calculates daily average correctly', () => {
            const totalSteps = 35000;
            const daysSubmitted = 7;
            const average = daysSubmitted > 0 ? totalSteps / daysSubmitted : 0;
            expect(average).toBe(5000);
        });

        it('handles zero days', () => {
            const totalSteps = 0;
            const daysSubmitted = 0;
            const average = daysSubmitted > 0 ? totalSteps / daysSubmitted : 0;
            expect(average).toBe(0);
        });

        it('rounds average properly', () => {
            const totalSteps = 33333;
            const daysSubmitted = 7;
            const average = Math.round(totalSteps / daysSubmitted);
            expect(average).toBe(4762);
        });
    });

    describe('Deduplication', () => {
        it('takes highest steps when duplicate dates exist', () => {
            const submissions = [
                { user_id: 'u1', for_date: '2026-01-15', steps: 5000 },
                { user_id: 'u1', for_date: '2026-01-15', steps: 7000 }, // Duplicate, higher
            ];

            const deduped = new Map<string, typeof submissions[0]>();
            for (const sub of submissions) {
                const key = `${sub.user_id}_${sub.for_date}`;
                const existing = deduped.get(key);
                if (!existing || sub.steps > existing.steps) {
                    deduped.set(key, sub);
                }
            }

            expect(deduped.size).toBe(1);
            expect(deduped.get('u1_2026-01-15')?.steps).toBe(7000);
        });
    });
});

describe('Leaderboard - Ranking', () => {
    const createEntry = (overrides: Partial<LeaderboardEntry>): LeaderboardEntry => ({
        rank: 0,
        user_id: 'user-1',
        display_name: 'User',
        total_steps: 0,
        badges: [],
        improvement_pct: null,
        ...overrides,
    });

    describe('Sorting by total steps', () => {
        it('ranks by descending total steps', () => {
            const entries = [
                createEntry({ user_id: 'u1', total_steps: 5000 }),
                createEntry({ user_id: 'u2', total_steps: 10000 }),
                createEntry({ user_id: 'u3', total_steps: 7500 }),
            ];

            entries.sort((a, b) => b.total_steps - a.total_steps);
            entries.forEach((e, i) => { e.rank = i + 1; });

            expect(entries[0].user_id).toBe('u2');
            expect(entries[0].rank).toBe(1);
            expect(entries[1].user_id).toBe('u3');
            expect(entries[2].user_id).toBe('u1');
        });

        it('handles ties (same steps)', () => {
            const entries = [
                createEntry({ user_id: 'u1', total_steps: 5000 }),
                createEntry({ user_id: 'u2', total_steps: 5000 }),
            ];

            entries.sort((a, b) => b.total_steps - a.total_steps);
            entries.forEach((e, i) => { e.rank = i + 1; });

            // Both should have sequential ranks (tied users get sequential)
            expect(entries[0].rank).toBe(1);
            expect(entries[1].rank).toBe(2);
        });
    });

    describe('Sorting by improvement', () => {
        it('ranks by descending improvement percentage', () => {
            const entries = [
                createEntry({ user_id: 'u1', improvement_pct: 10 }),
                createEntry({ user_id: 'u2', improvement_pct: 50 }),
                createEntry({ user_id: 'u3', improvement_pct: -5 }),
            ];

            entries.sort((a, b) =>
                (b.improvement_pct ?? -Infinity) - (a.improvement_pct ?? -Infinity)
            );

            expect(entries[0].user_id).toBe('u2');
            expect(entries[1].user_id).toBe('u1');
            expect(entries[2].user_id).toBe('u3');
        });

        it('handles null improvement (no comparison data)', () => {
            const entries = [
                createEntry({ user_id: 'u1', improvement_pct: null }),
                createEntry({ user_id: 'u2', improvement_pct: 10 }),
            ];

            entries.sort((a, b) =>
                (b.improvement_pct ?? -Infinity) - (a.improvement_pct ?? -Infinity)
            );

            expect(entries[0].user_id).toBe('u2');
            expect(entries[1].user_id).toBe('u1');
        });
    });

    describe('Improvement calculation', () => {
        it('calculates positive improvement', () => {
            const periodA = 10000;
            const periodB = 8000;
            const improvement = ((periodA - periodB) / periodB) * 100;
            expect(improvement).toBe(25);
        });

        it('calculates negative improvement', () => {
            const periodA = 6000;
            const periodB = 8000;
            const improvement = ((periodA - periodB) / periodB) * 100;
            expect(improvement).toBe(-25);
        });

        it('handles zero baseline (no previous data)', () => {
            const periodA = 10000;
            const periodB = 0;
            const improvement = periodB > 0 ? ((periodA - periodB) / periodB) * 100 : null;
            expect(improvement).toBeNull();
        });
    });
});

describe('Leaderboard - Badge Assignment', () => {
    const assignBadges = (entries: LeaderboardEntry[], currentStreakMap: Map<string, number>, lifetimeMap: Map<string, number>) => {
        if (entries.length === 0) return;

        // Leader badge
        entries[0].badges.push('leader');

        // Most Improved
        const byImprovement = [...entries]
            .filter(e => e.improvement_pct !== null && e.improvement_pct > 0)
            .sort((a, b) => (b.improvement_pct ?? 0) - (a.improvement_pct ?? 0));

        for (let i = 0; i < Math.min(3, byImprovement.length); i++) {
            byImprovement[i].badges.push('most_improved');
        }

        // Streak badges
        for (const e of entries) {
            const streak = currentStreakMap.get(e.user_id) ?? 0;
            if (streak >= 30) e.badges.push('streak_30');
            else if (streak >= 7) e.badges.push('streak_7');
            else if (streak >= 3) e.badges.push('streak_3');

            // Lifetime badges
            const lifetime = lifetimeMap.get(e.user_id) ?? 0;
            if (lifetime >= 1000000) e.badges.push('million_club');
            else if (lifetime >= 500000) e.badges.push('500k_club');
            else if (lifetime >= 100000) e.badges.push('100k_club');
        }
    };

    it('assigns leader badge to first place', () => {
        const entries = [
            { rank: 1, user_id: 'u1', display_name: 'User 1', total_steps: 10000, badges: [], improvement_pct: null },
            { rank: 2, user_id: 'u2', display_name: 'User 2', total_steps: 8000, badges: [], improvement_pct: null },
        ];

        assignBadges(entries, new Map(), new Map());

        expect(entries[0].badges).toContain('leader');
        expect(entries[1].badges).not.toContain('leader');
    });

    it('assigns streak_7 badge for 7+ day streak', () => {
        const entries = [
            { rank: 1, user_id: 'u1', display_name: 'User 1', total_steps: 10000, badges: [], improvement_pct: null },
        ];
        const streakMap = new Map([['u1', 10]]);

        assignBadges(entries, streakMap, new Map());

        expect(entries[0].badges).toContain('streak_7');
    });

    it('assigns streak_30 badge for 30+ day streak', () => {
        const entries = [
            { rank: 1, user_id: 'u1', display_name: 'User 1', total_steps: 10000, badges: [], improvement_pct: null },
        ];
        const streakMap = new Map([['u1', 35]]);

        assignBadges(entries, streakMap, new Map());

        expect(entries[0].badges).toContain('streak_30');
        expect(entries[0].badges).not.toContain('streak_7');
    });

    it('assigns million_club badge for 1M+ lifetime steps', () => {
        const entries = [
            { rank: 1, user_id: 'u1', display_name: 'User 1', total_steps: 10000, badges: [], improvement_pct: null },
        ];
        const lifetimeMap = new Map([['u1', 1500000]]);

        assignBadges(entries, new Map(), lifetimeMap);

        expect(entries[0].badges).toContain('million_club');
    });

    it('assigns most_improved to top 3 with positive improvement', () => {
        const entries: LeaderboardEntry[] = [
            { rank: 1, user_id: 'u1', display_name: 'User 1', total_steps: 10000, badges: [], improvement_pct: 50 },
            { rank: 2, user_id: 'u2', display_name: 'User 2', total_steps: 9000, badges: [], improvement_pct: 40 },
            { rank: 3, user_id: 'u3', display_name: 'User 3', total_steps: 8000, badges: [], improvement_pct: 30 },
            { rank: 4, user_id: 'u4', display_name: 'User 4', total_steps: 7000, badges: [], improvement_pct: 20 },
        ];

        assignBadges(entries, new Map(), new Map());

        const improvedUsers = entries.filter(e => e.badges.includes('most_improved'));
        expect(improvedUsers.length).toBe(3);
        expect(entries[3].badges).not.toContain('most_improved');
    });
});

describe('Leaderboard - Date Range Helpers', () => {
    const calculateDaysBetween = (start: string, end: string): number => {
        const startDate = new Date(start + 'T00:00:00');
        const endDate = new Date(end + 'T00:00:00');
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    };

    it('calculates one week correctly', () => {
        expect(calculateDaysBetween('2026-01-01', '2026-01-07')).toBe(7);
    });

    it('calculates single day', () => {
        expect(calculateDaysBetween('2026-01-15', '2026-01-15')).toBe(1);
    });

    it('calculates month correctly', () => {
        expect(calculateDaysBetween('2026-01-01', '2026-01-31')).toBe(31);
    });
});
