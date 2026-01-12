/**
 * Cache Registry
 * 
 * Source of Truth for all server-side cache keys and tags.
 * Defines strict types for cache operations to prevent "magic string" errors.
 */

export const CacheTTL = {
    MINUTE: 60,
    HOUR: 3600,
    DAY: 86400,
    WEEK: 604800,
} as const;

/**
 * Standardized Cache Tags
 * Used for invalidation (revalidateTag)
 */
export const CacheTags = {
    BRANDING: "branding",
    LEAGUES: "leagues",
    USER_LEAGUES: (userId: string) => `user:${userId}:leagues`,
    LEAGUE_DETAILS: (leagueId: string) => `league:${leagueId}:details`,
    LEAGUE_MEMBERS: (leagueId: string) => `league:${leagueId}:members`,
    LEAGUE_RANKINGS: (leagueId: string) => `league:${leagueId}:rankings`,
} as const;

/**
 * Configuration Registry
 * 
 * Maps specific data fetchers to their default TTL and Tags.
 * Use this when defining new cached functions.
 */
export const CacheConfig = {
    branding: {
        tags: [CacheTags.BRANDING],
        revalidate: CacheTTL.HOUR,
    },
    userLeagues: (userId: string) => ({
        tags: [CacheTags.USER_LEAGUES(userId), CacheTags.LEAGUES],
        revalidate: CacheTTL.MINUTE * 5, // 5 minutes default for league lists
    }),
    leagueDetails: (leagueId: string) => ({
        tags: [CacheTags.LEAGUE_DETAILS(leagueId), CacheTags.LEAGUES],
        revalidate: CacheTTL.MINUTE * 1, // 1 minute for active league dashboards
    }),
};
