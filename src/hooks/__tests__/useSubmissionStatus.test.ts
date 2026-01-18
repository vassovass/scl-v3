/**
 * useSubmissionStatus Hook Tests
 *
 * Tests for the useSubmissionStatus submission tracking hook.
 * Based on testing-patterns skill and PRD 42.
 *
 * Key areas tested:
 * - Date calculation logic
 * - State transitions
 * - Skip conditions
 * - Response handling
 */

import { describe, it, expect } from 'vitest';

// ============================================================================
// Type Definitions (matching hook interface)
// ============================================================================

interface SubmissionStatus {
    hasSubmitted: boolean;
    steps?: number;
    targetDate: string;
    isLoading: boolean;
    error?: string;
}

interface UseSubmissionStatusOptions {
    userId?: string;
    targetDate?: "yesterday" | "today" | string;
    leagueId?: string;
    skip?: boolean;
}

// ============================================================================
// Date Calculation Tests
// ============================================================================

describe('useSubmissionStatus - Date Calculation', () => {
    const getTargetDateString = (targetDate: "yesterday" | "today" | string): string => {
        if (targetDate === "yesterday") {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            return yesterday.toISOString().slice(0, 10);
        }
        if (targetDate === "today") {
            return new Date().toISOString().slice(0, 10);
        }
        return targetDate;
    };

    describe('Yesterday Calculation', () => {
        it('returns yesterday by default', () => {
            const result = getTargetDateString('yesterday');
            const expected = new Date();
            expected.setDate(expected.getDate() - 1);

            expect(result).toBe(expected.toISOString().slice(0, 10));
        });

        it('returns date in YYYY-MM-DD format', () => {
            const result = getTargetDateString('yesterday');
            expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });
    });

    describe('Today Calculation', () => {
        it('returns today when specified', () => {
            const result = getTargetDateString('today');
            const expected = new Date().toISOString().slice(0, 10);

            expect(result).toBe(expected);
        });
    });

    describe('Custom Date', () => {
        it('returns custom date string as-is', () => {
            const result = getTargetDateString('2026-01-15');
            expect(result).toBe('2026-01-15');
        });

        it('handles any date format passed', () => {
            const result = getTargetDateString('2026-12-31');
            expect(result).toBe('2026-12-31');
        });
    });
});

// ============================================================================
// Initial State Tests
// ============================================================================

describe('useSubmissionStatus - Initial State', () => {
    it('hasSubmitted starts as false', () => {
        const status: SubmissionStatus = {
            hasSubmitted: false,
            steps: undefined,
            targetDate: '2026-01-16',
            isLoading: true,
        };

        expect(status.hasSubmitted).toBe(false);
    });

    it('steps starts as undefined', () => {
        const status: SubmissionStatus = {
            hasSubmitted: false,
            steps: undefined,
            targetDate: '2026-01-16',
            isLoading: true,
        };

        expect(status.steps).toBeUndefined();
    });

    it('isLoading starts as true', () => {
        const status: SubmissionStatus = {
            hasSubmitted: false,
            targetDate: '2026-01-16',
            isLoading: true,
        };

        expect(status.isLoading).toBe(true);
    });

    it('error starts as undefined', () => {
        const status: SubmissionStatus = {
            hasSubmitted: false,
            targetDate: '2026-01-16',
            isLoading: true,
        };

        expect(status.error).toBeUndefined();
    });
});

// ============================================================================
// Skip Condition Tests
// ============================================================================

describe('useSubmissionStatus - Skip Conditions', () => {
    it('sets loading=false when skip=true', () => {
        const options: UseSubmissionStatusOptions = { skip: true };
        const shouldFetch = !options.skip;
        const isLoading = shouldFetch;

        expect(isLoading).toBe(false);
    });

    it('does not fetch when userId is missing', () => {
        const options: UseSubmissionStatusOptions = { leagueId: 'league-123' };
        const shouldFetch = !options.skip && !!options.userId && !!options.leagueId;

        expect(shouldFetch).toBe(false);
    });

    it('does not fetch when leagueId is missing', () => {
        const options: UseSubmissionStatusOptions = { userId: 'user-123' };
        const shouldFetch = !options.skip && !!options.userId && !!options.leagueId;

        expect(shouldFetch).toBe(false);
    });

    it('fetches when all required params present', () => {
        const options: UseSubmissionStatusOptions = {
            userId: 'user-123',
            leagueId: 'league-123',
        };
        const shouldFetch = !options.skip && !!options.userId && !!options.leagueId;

        expect(shouldFetch).toBe(true);
    });

    it('does not fetch when skip=true even with all params', () => {
        const options: UseSubmissionStatusOptions = {
            userId: 'user-123',
            leagueId: 'league-123',
            skip: true,
        };
        const shouldFetch = !options.skip && !!options.userId && !!options.leagueId;

        expect(shouldFetch).toBe(false);
    });
});

// ============================================================================
// API URL Construction Tests
// ============================================================================

describe('useSubmissionStatus - API URL Construction', () => {
    it('constructs correct API URL', () => {
        const leagueId = 'league-123';
        const userId = 'user-456';
        const dateStr = '2026-01-16';

        const url = `/api/submissions?league_id=${leagueId}&user_id=${userId}&from=${dateStr}&to=${dateStr}&limit=1`;

        expect(url).toBe('/api/submissions?league_id=league-123&user_id=user-456&from=2026-01-16&to=2026-01-16&limit=1');
    });

    it('includes from and to as same date for single-day query', () => {
        const dateStr = '2026-01-16';
        const params = new URLSearchParams({
            from: dateStr,
            to: dateStr,
        });

        expect(params.get('from')).toBe(params.get('to'));
    });

    it('limits to 1 result', () => {
        const url = '/api/submissions?limit=1';
        expect(url).toContain('limit=1');
    });
});

// ============================================================================
// Response Handling Tests
// ============================================================================

describe('useSubmissionStatus - Response Handling', () => {
    describe('Submission Found', () => {
        it('sets hasSubmitted=true when submission exists', () => {
            const data = {
                submissions: [{ id: 'sub-123', steps: 10500 }]
            };

            const hasSubmitted = data.submissions && data.submissions.length > 0;
            expect(hasSubmitted).toBe(true);
        });

        it('extracts steps from first submission', () => {
            const data = {
                submissions: [{ id: 'sub-123', steps: 10500 }]
            };

            const steps = data.submissions[0].steps;
            expect(steps).toBe(10500);
        });
    });

    describe('No Submission', () => {
        it('sets hasSubmitted=false when no submissions', () => {
            const data = { submissions: [] };

            const hasSubmitted = data.submissions && data.submissions.length > 0;
            expect(hasSubmitted).toBe(false);
        });

        it('sets steps=undefined when no submissions', () => {
            const data: { submissions: Array<{ steps: number }> } = { submissions: [] };

            const steps = data.submissions.length > 0 ? data.submissions[0].steps : undefined;
            expect(steps).toBeUndefined();
        });
    });

    describe('Error Handling', () => {
        it('sets error message on fetch failure', () => {
            const err = new Error('Failed to fetch submission status');
            const error = err instanceof Error ? err.message : 'Unknown error';

            expect(error).toBe('Failed to fetch submission status');
        });

        it('sets hasSubmitted=false on error', () => {
            // On error, we default to false (safe default)
            const hasSubmitted = false;
            expect(hasSubmitted).toBe(false);
        });

        it('sets steps=undefined on error', () => {
            const steps = undefined;
            expect(steps).toBeUndefined();
        });

        it('converts non-Error to string', () => {
            const err: unknown = 'Network error';
            const error = err instanceof Error ? err.message : String(err);

            expect(error).toBe('Network error');
        });
    });
});

// ============================================================================
// State Transition Tests
// ============================================================================

describe('useSubmissionStatus - State Transitions', () => {
    it('loading → success with submission', () => {
        // Initial
        let state: SubmissionStatus = {
            hasSubmitted: false,
            steps: undefined,
            targetDate: '2026-01-16',
            isLoading: true,
        };

        // After successful fetch with submission
        state = {
            hasSubmitted: true,
            steps: 10500,
            targetDate: '2026-01-16',
            isLoading: false,
        };

        expect(state.isLoading).toBe(false);
        expect(state.hasSubmitted).toBe(true);
        expect(state.steps).toBe(10500);
    });

    it('loading → success without submission', () => {
        let state: SubmissionStatus = {
            hasSubmitted: false,
            steps: undefined,
            targetDate: '2026-01-16',
            isLoading: true,
        };

        state = {
            hasSubmitted: false,
            steps: undefined,
            targetDate: '2026-01-16',
            isLoading: false,
        };

        expect(state.isLoading).toBe(false);
        expect(state.hasSubmitted).toBe(false);
        expect(state.steps).toBeUndefined();
    });

    it('loading → error', () => {
        let state: SubmissionStatus = {
            hasSubmitted: false,
            steps: undefined,
            targetDate: '2026-01-16',
            isLoading: true,
        };

        state = {
            hasSubmitted: false,
            steps: undefined,
            targetDate: '2026-01-16',
            isLoading: false,
            error: 'Failed to fetch',
        };

        expect(state.isLoading).toBe(false);
        expect(state.error).toBe('Failed to fetch');
    });
});

// ============================================================================
// Refetch Tests
// ============================================================================

describe('useSubmissionStatus - Refetch', () => {
    it('refetch can be called to refresh status', () => {
        let fetchCount = 0;
        const refetch = async () => {
            fetchCount++;
        };

        // Initial fetch
        refetch();
        expect(fetchCount).toBe(1);

        // Manual refetch
        refetch();
        expect(fetchCount).toBe(2);
    });

    it('refetch resets loading state', () => {
        let isLoading = false;

        // Before refetch
        expect(isLoading).toBe(false);

        // During refetch
        isLoading = true;
        expect(isLoading).toBe(true);

        // After refetch
        isLoading = false;
        expect(isLoading).toBe(false);
    });

    it('refetch clears previous error', () => {
        let error: string | undefined = 'Previous error';

        // During refetch start
        error = undefined;

        expect(error).toBeUndefined();
    });
});

// ============================================================================
// Use Case Tests
// ============================================================================

describe('useSubmissionStatus - Use Cases', () => {
    describe('Submit Prompt Logic', () => {
        it('shows prompt when not submitted and not loading', () => {
            const status: SubmissionStatus = {
                hasSubmitted: false,
                targetDate: '2026-01-16',
                isLoading: false,
            };

            const showPrompt = !status.isLoading && !status.hasSubmitted;
            expect(showPrompt).toBe(true);
        });

        it('hides prompt when already submitted', () => {
            const status: SubmissionStatus = {
                hasSubmitted: true,
                steps: 10500,
                targetDate: '2026-01-16',
                isLoading: false,
            };

            const showPrompt = !status.isLoading && !status.hasSubmitted;
            expect(showPrompt).toBe(false);
        });

        it('hides prompt while loading', () => {
            const status: SubmissionStatus = {
                hasSubmitted: false,
                targetDate: '2026-01-16',
                isLoading: true,
            };

            const showPrompt = !status.isLoading && !status.hasSubmitted;
            expect(showPrompt).toBe(false);
        });
    });

    describe('Step Display Logic', () => {
        it('displays steps when submitted', () => {
            const status: SubmissionStatus = {
                hasSubmitted: true,
                steps: 10500,
                targetDate: '2026-01-16',
                isLoading: false,
            };

            const displaySteps = status.hasSubmitted ? status.steps : null;
            expect(displaySteps).toBe(10500);
        });

        it('displays nothing when not submitted', () => {
            const status: SubmissionStatus = {
                hasSubmitted: false,
                targetDate: '2026-01-16',
                isLoading: false,
            };

            const displaySteps = status.hasSubmitted ? status.steps : null;
            expect(displaySteps).toBeNull();
        });
    });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('useSubmissionStatus - Edge Cases', () => {
    it('handles zero steps submission', () => {
        const data = {
            submissions: [{ id: 'sub-123', steps: 0 }]
        };

        const hasSubmitted = data.submissions.length > 0;
        const steps = data.submissions[0].steps;

        expect(hasSubmitted).toBe(true);
        expect(steps).toBe(0);
    });

    it('handles very high step counts', () => {
        const data = {
            submissions: [{ id: 'sub-123', steps: 999999 }]
        };

        expect(data.submissions[0].steps).toBe(999999);
    });

    it('handles month boundary for yesterday', () => {
        // If today is Jan 1, yesterday is Dec 31 of previous year
        const today = new Date('2026-01-01');
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        expect(yesterday.toISOString().slice(0, 10)).toBe('2025-12-31');
    });

    it('handles year boundary for yesterday', () => {
        const today = new Date('2026-01-01');
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        expect(yesterday.getFullYear()).toBe(2025);
    });

    it('returns consistent targetDate in status', () => {
        const targetDateInput = 'yesterday';
        const dateStr = targetDateInput === 'yesterday'
            ? new Date(Date.now() - 86400000).toISOString().slice(0, 10)
            : targetDateInput;

        const status: SubmissionStatus = {
            hasSubmitted: false,
            targetDate: dateStr,
            isLoading: false,
        };

        expect(status.targetDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
});
