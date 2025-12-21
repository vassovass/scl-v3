/**
 * Centralized app configuration for branding.
 * Change these values to rebrand the entire app.
 */
export const APP_CONFIG = {
    /** Display name used throughout the UI */
    name: "StepLeague",

    /** Short version for tight spaces */
    shortName: "StepLeague",

    /** Tagline for marketing/meta descriptions */
    tagline: "Step competition with friends",

    /** Hashtag for social sharing */
    hashtag: "#StepLeague",

    /** Primary domain (without https://) */
    domain: "stepleague.app",

    /** Full URL */
    url: "https://stepleague.app",

    /** Current version */
    version: "v3",
} as const;

/** Helper to get the full app title with optional suffix */
export function getAppTitle(suffix?: string): string {
    return suffix ? `${suffix} | ${APP_CONFIG.name}` : APP_CONFIG.name;
}
