/**
 * User Identity Configuration
 * 
 * Centralized constants for user identity field terminology.
 * Update these values to change how user identity is referenced across the app.
 * 
 * @see PRD 43: Nickname Primary Identity
 */

/** The database column name for user identity */
export const IDENTITY_FIELD = 'display_name' as const;

/** User-facing label for the identity field */
export const IDENTITY_LABEL = 'Display Name';

/** Placeholder text for identity input fields */
export const IDENTITY_PLACEHOLDER = 'Your display name';

/** Description shown to users about the identity field */
export const IDENTITY_DESCRIPTION = 'This is how you appear to other members in leagues and leaderboards.';

/** Fallback text when identity is not set */
export const IDENTITY_FALLBACK = 'Anonymous';

/**
 * Get the display name from a user object, with fallback
 */
export function getDisplayName(user: { display_name?: string | null } | null | undefined): string {
    return user?.display_name || IDENTITY_FALLBACK;
}

/**
 * Type for user identity field - use in interfaces
 */
export type UserIdentity = {
    [IDENTITY_FIELD]: string | null;
};
