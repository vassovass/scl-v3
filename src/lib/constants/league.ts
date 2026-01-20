/**
 * World League Constants
 * PRD 44: Auto-Enroll World League
 * 
 * Central source of truth for World League identifiers.
 * Used by enrollment logic, leave prevention, and UI components.
 */

export const WORLD_LEAGUE = {
    /** Fixed UUID for the global World League */
    ID: '00000000-0000-0000-0000-000000000001',
    /** Human-readable invite code */
    INVITE_CODE: 'WORLD',
    /** Display name */
    NAME: 'StepLeague World',
} as const;

/** Type for World League ID (for type safety in function params) */
export type WorldLeagueId = typeof WORLD_LEAGUE.ID;
