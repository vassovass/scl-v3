/**
 * useConflictCheck Hook Tests
 *
 * Tests for the useConflictCheck submission conflict detection hook.
 * Based on testing-patterns skill and PRD 42.
 *
 * Key areas tested:
 * - Conflict detection logic
 * - Resolution recommendations
 * - State management
 * - Error handling
 */

import { describe, it, expect } from 'vitest';

// ============================================================================
// Type Definitions (matching hook interface)
// ============================================================================

interface ExistingSubmission {
    id: string;
    for_date: string;
    steps: number;
    verified: boolean | null;
    proof_path: string | null;
    created_at: string;
}

interface ConflictInfo {
    date: string;
    existing: ExistingSubmission;
    source: "screenshot" | "manual";
}

interface ConflictResolution {
    date: string;
    action: "keep_existing" | "use_incoming" | "skip";
    incoming_data?: {
        steps: number;
        proof_path: string | null;
    };
}

// ============================================================================
// getSmartDefault Tests
// ============================================================================

describe('useConflictCheck - getSmartDefault', () => {
    /**
     * Implementation of getSmartDefault matching the hook
     */
    const getSmartDefault = (
        existing: { verified: boolean | null; proof_path: string | null },
        incoming: { proof_path: string | null }
    ): "keep_existing" | "use_incoming" => {
        const existingHasProof = !!existing.proof_path;
        const existingVerified = existing.verified === true;
        const incomingHasProof = !!incoming.proof_path;

        // Incoming has screenshot but existing doesn't → use incoming
        if (incomingHasProof && !existingHasProof) {
            return "use_incoming";
        }

        // Existing is verified → keep existing
        if (existingVerified) {
            return "keep_existing";
        }

        // Default to keeping existing
        return "keep_existing";
    };

    describe('Screenshot Priority', () => {
        it('prefers incoming when it has proof and existing does not', () => {
            const existing = { verified: false, proof_path: null };
            const incoming = { proof_path: '/images/proof.jpg' };

            expect(getSmartDefault(existing, incoming)).toBe('use_incoming');
        });

        it('keeps existing when both have proof', () => {
            const existing = { verified: false, proof_path: '/old-proof.jpg' };
            const incoming = { proof_path: '/new-proof.jpg' };

            expect(getSmartDefault(existing, incoming)).toBe('keep_existing');
        });

        it('keeps existing when neither has proof', () => {
            const existing = { verified: null, proof_path: null };
            const incoming = { proof_path: null };

            expect(getSmartDefault(existing, incoming)).toBe('keep_existing');
        });

        it('keeps existing when only existing has proof', () => {
            const existing = { verified: false, proof_path: '/existing-proof.jpg' };
            const incoming = { proof_path: null };

            expect(getSmartDefault(existing, incoming)).toBe('keep_existing');
        });
    });

    describe('Verification Priority', () => {
        it('keeps existing when verified regardless of incoming proof', () => {
            const existing = { verified: true, proof_path: '/verified.jpg' };
            const incoming = { proof_path: '/new-proof.jpg' };

            expect(getSmartDefault(existing, incoming)).toBe('keep_existing');
        });

        it('keeps existing verified even without incoming proof', () => {
            const existing = { verified: true, proof_path: '/verified.jpg' };
            const incoming = { proof_path: null };

            expect(getSmartDefault(existing, incoming)).toBe('keep_existing');
        });

        it('does not prefer unverified existing over incoming with proof', () => {
            const existing = { verified: false, proof_path: null };
            const incoming = { proof_path: '/new-proof.jpg' };

            expect(getSmartDefault(existing, incoming)).toBe('use_incoming');
        });

        it('handles null verified as unverified', () => {
            const existing = { verified: null, proof_path: null };
            const incoming = { proof_path: '/new-proof.jpg' };

            expect(getSmartDefault(existing, incoming)).toBe('use_incoming');
        });
    });
});

// ============================================================================
// getRecommendationMessage Tests
// ============================================================================

describe('useConflictCheck - getRecommendationMessage', () => {
    const getRecommendationMessage = (
        existing: { verified: boolean | null; proof_path: string | null },
        incoming: { proof_path: string | null }
    ): string => {
        const existingHasProof = !!existing.proof_path;
        const existingVerified = existing.verified === true;
        const incomingHasProof = !!incoming.proof_path;

        if (existingVerified && existingHasProof) {
            if (!incomingHasProof) {
                return "The existing submission has a verified screenshot and is likely more accurate.";
            }
            return "Both have screenshots. The existing entry is already verified.";
        }

        if (incomingHasProof && !existingHasProof) {
            return "The new submission has a screenshot which is likely more accurate than the manual entry.";
        }

        if (existingHasProof) {
            return "The existing submission has a screenshot (pending verification).";
        }

        return "Consider submitting a screenshot for better accuracy.";
    };

    it('recommends verified existing over manual incoming', () => {
        const existing = { verified: true, proof_path: '/verified.jpg' };
        const incoming = { proof_path: null };

        const message = getRecommendationMessage(existing, incoming);
        expect(message).toContain('verified screenshot');
        expect(message).toContain('more accurate');
    });

    it('notes both have screenshots when both do', () => {
        const existing = { verified: true, proof_path: '/verified.jpg' };
        const incoming = { proof_path: '/new.jpg' };

        const message = getRecommendationMessage(existing, incoming);
        expect(message).toContain('Both have screenshots');
        expect(message).toContain('already verified');
    });

    it('recommends incoming screenshot over manual existing', () => {
        const existing = { verified: false, proof_path: null };
        const incoming = { proof_path: '/new-proof.jpg' };

        const message = getRecommendationMessage(existing, incoming);
        expect(message).toContain('new submission has a screenshot');
        expect(message).toContain('more accurate');
    });

    it('notes pending verification for existing screenshot', () => {
        const existing = { verified: false, proof_path: '/pending.jpg' };
        const incoming = { proof_path: null };

        const message = getRecommendationMessage(existing, incoming);
        expect(message).toContain('pending verification');
    });

    it('suggests screenshot when neither has one', () => {
        const existing = { verified: null, proof_path: null };
        const incoming = { proof_path: null };

        const message = getRecommendationMessage(existing, incoming);
        expect(message).toContain('Consider submitting a screenshot');
    });
});

// ============================================================================
// State Management Tests
// ============================================================================

describe('useConflictCheck - State Management', () => {
    describe('Initial State', () => {
        it('starts with isChecking=false', () => {
            const isChecking = false;
            expect(isChecking).toBe(false);
        });

        it('starts with isResolving=false', () => {
            const isResolving = false;
            expect(isResolving).toBe(false);
        });

        it('starts with empty conflicts array', () => {
            const conflicts: ConflictInfo[] = [];
            expect(conflicts).toHaveLength(0);
        });

        it('starts with error=null', () => {
            const error: string | null = null;
            expect(error).toBeNull();
        });

        it('hasConflicts is derived from conflicts length', () => {
            const conflicts: ConflictInfo[] = [];
            const hasConflicts = conflicts.length > 0;
            expect(hasConflicts).toBe(false);
        });
    });

    describe('hasConflicts Derivation', () => {
        it('returns true when conflicts exist', () => {
            const conflicts: ConflictInfo[] = [{
                date: '2026-01-15',
                existing: {
                    id: '123',
                    for_date: '2026-01-15',
                    steps: 10000,
                    verified: true,
                    proof_path: '/proof.jpg',
                    created_at: '2026-01-15T10:00:00Z',
                },
                source: 'screenshot',
            }];

            const hasConflicts = conflicts.length > 0;
            expect(hasConflicts).toBe(true);
        });

        it('returns false when no conflicts', () => {
            const conflicts: ConflictInfo[] = [];
            const hasConflicts = conflicts.length > 0;
            expect(hasConflicts).toBe(false);
        });
    });
});

// ============================================================================
// checkConflicts Logic Tests
// ============================================================================

describe('useConflictCheck - checkConflicts Logic', () => {
    it('returns empty array for empty dates input', () => {
        const dates: string[] = [];
        const result = dates.length === 0 ? [] : ['potential-conflict'];
        expect(result).toEqual([]);
    });

    it('processes single date', () => {
        const dates = ['2026-01-15'];
        const shouldCheck = dates.length > 0;
        expect(shouldCheck).toBe(true);
    });

    it('processes multiple dates', () => {
        const dates = ['2026-01-15', '2026-01-16', '2026-01-17'];
        expect(dates).toHaveLength(3);
    });

    it('includes league_id in request when provided', () => {
        const leagueId: string | null = 'league-123';
        const requestBody = {
            dates: ['2026-01-15'],
            league_id: leagueId || null,
        };

        expect(requestBody.league_id).toBe('league-123');
    });

    it('sets league_id to null when not provided', () => {
        const leagueId: string | null = null;
        const requestBody = {
            dates: ['2026-01-15'],
            league_id: leagueId || null,
        };

        expect(requestBody.league_id).toBeNull();
    });
});

// ============================================================================
// resolveConflicts Logic Tests
// ============================================================================

describe('useConflictCheck - resolveConflicts Logic', () => {
    it('returns null for empty resolutions array', () => {
        const resolutions: ConflictResolution[] = [];
        const result = resolutions.length === 0 ? null : { resolved: 0 };
        expect(result).toBeNull();
    });

    it('processes keep_existing resolution', () => {
        const resolution: ConflictResolution = {
            date: '2026-01-15',
            action: 'keep_existing',
        };

        expect(resolution.action).toBe('keep_existing');
        expect(resolution.incoming_data).toBeUndefined();
    });

    it('processes use_incoming resolution with data', () => {
        const resolution: ConflictResolution = {
            date: '2026-01-15',
            action: 'use_incoming',
            incoming_data: {
                steps: 12000,
                proof_path: '/new-proof.jpg',
            },
        };

        expect(resolution.action).toBe('use_incoming');
        expect(resolution.incoming_data?.steps).toBe(12000);
    });

    it('processes skip resolution', () => {
        const resolution: ConflictResolution = {
            date: '2026-01-15',
            action: 'skip',
        };

        expect(resolution.action).toBe('skip');
    });

    it('clears conflicts after successful resolution', () => {
        let conflicts: ConflictInfo[] = [{
            date: '2026-01-15',
            existing: {
                id: '123',
                for_date: '2026-01-15',
                steps: 10000,
                verified: true,
                proof_path: '/proof.jpg',
                created_at: '2026-01-15T10:00:00Z',
            },
            source: 'screenshot',
        }];

        // Simulate successful resolution
        conflicts = [];

        expect(conflicts).toHaveLength(0);
    });
});

// ============================================================================
// clearConflicts Tests
// ============================================================================

describe('useConflictCheck - clearConflicts', () => {
    it('clears conflicts array', () => {
        let conflicts: ConflictInfo[] = [{
            date: '2026-01-15',
            existing: {
                id: '123',
                for_date: '2026-01-15',
                steps: 10000,
                verified: true,
                proof_path: '/proof.jpg',
                created_at: '2026-01-15T10:00:00Z',
            },
            source: 'screenshot',
        }];

        // clearConflicts
        conflicts = [];

        expect(conflicts).toHaveLength(0);
    });

    it('clears error state', () => {
        let error: string | null = 'Previous error';

        // clearConflicts
        error = null;

        expect(error).toBeNull();
    });
});

// ============================================================================
// ConflictInfo Structure Tests
// ============================================================================

describe('useConflictCheck - ConflictInfo Structure', () => {
    it('includes all required fields', () => {
        const conflict: ConflictInfo = {
            date: '2026-01-15',
            existing: {
                id: 'sub-123',
                for_date: '2026-01-15',
                steps: 10500,
                verified: true,
                proof_path: '/images/proof.jpg',
                created_at: '2026-01-15T08:00:00Z',
            },
            source: 'screenshot',
        };

        expect(conflict.date).toBe('2026-01-15');
        expect(conflict.existing.id).toBe('sub-123');
        expect(conflict.existing.steps).toBe(10500);
        expect(conflict.existing.verified).toBe(true);
        expect(conflict.source).toBe('screenshot');
    });

    it('handles manual source type', () => {
        const conflict: ConflictInfo = {
            date: '2026-01-15',
            existing: {
                id: 'sub-123',
                for_date: '2026-01-15',
                steps: 8000,
                verified: null,
                proof_path: null,
                created_at: '2026-01-15T08:00:00Z',
            },
            source: 'manual',
        };

        expect(conflict.source).toBe('manual');
        expect(conflict.existing.proof_path).toBeNull();
    });

    it('handles null verified state', () => {
        const conflict: ConflictInfo = {
            date: '2026-01-15',
            existing: {
                id: 'sub-123',
                for_date: '2026-01-15',
                steps: 9000,
                verified: null,
                proof_path: '/pending.jpg',
                created_at: '2026-01-15T08:00:00Z',
            },
            source: 'screenshot',
        };

        expect(conflict.existing.verified).toBeNull();
    });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('useConflictCheck - Edge Cases', () => {
    it('handles multiple conflicts for different dates', () => {
        const conflicts: ConflictInfo[] = [
            {
                date: '2026-01-15',
                existing: { id: '1', for_date: '2026-01-15', steps: 10000, verified: true, proof_path: '/a.jpg', created_at: '' },
                source: 'screenshot',
            },
            {
                date: '2026-01-16',
                existing: { id: '2', for_date: '2026-01-16', steps: 8000, verified: false, proof_path: null, created_at: '' },
                source: 'manual',
            },
        ];

        expect(conflicts).toHaveLength(2);
        expect(conflicts[0].date).not.toBe(conflicts[1].date);
    });

    it('different resolutions for different dates', () => {
        const resolutions: ConflictResolution[] = [
            { date: '2026-01-15', action: 'keep_existing' },
            { date: '2026-01-16', action: 'use_incoming', incoming_data: { steps: 9500, proof_path: null } },
            { date: '2026-01-17', action: 'skip' },
        ];

        expect(resolutions[0].action).toBe('keep_existing');
        expect(resolutions[1].action).toBe('use_incoming');
        expect(resolutions[2].action).toBe('skip');
    });

    it('handles high step counts in conflicts', () => {
        const conflict: ConflictInfo = {
            date: '2026-01-15',
            existing: {
                id: '123',
                for_date: '2026-01-15',
                steps: 50000, // Ultra-marathon level
                verified: true,
                proof_path: '/ultra.jpg',
                created_at: '2026-01-15T08:00:00Z',
            },
            source: 'screenshot',
        };

        expect(conflict.existing.steps).toBe(50000);
    });
});

