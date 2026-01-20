/**
 * Settings Registry Types
 * Based on best practices from:
 * - Slash Engineering registry pattern (scaling 1M+ LOC)
 * - Default/override pattern for efficient storage
 * - Type-safe validation with compile-time + runtime checks
 */

export type SettingType = "text" | "select" | "toggle" | "radio" | "date" | "number" | "textarea" | "json" | "custom" | "link";

export type SettingRole = "member" | "admin" | "owner" | "superadmin";

export interface SelectOption {
    value: string;
    label: string;
    description?: string;
}

/**
 * Base setting definition
 * All settings must extend this interface
 */
export interface SettingDefinition<T = unknown> {
    key: string;
    type: SettingType;
    label: string;
    description?: string;
    default: T;
    options?: SelectOption[];
    requiredRole?: SettingRole;
    validation?: (value: T) => boolean | string;
}

/**
 * Settings section grouping
 * Organizes related settings together
 */
export interface SettingsSection<T = unknown> {
    id: string;
    title: string;
    description?: string;
    settings: SettingDefinition<T>[];
}

/**
 * Settings context types
 * Each context has its own registry
 */
export type SettingsContext = "user" | "league" | "superadmin";

/**
 * Registry discriminator for type-safe registration
 * Follows Slash Engineering pattern
 */
export const SETTINGS_REGISTRY = Symbol("SETTINGS_REGISTRY");

export interface SettingsRegistryEntry {
    [SETTINGS_REGISTRY]: SettingsContext;
    sections: SettingsSection[];
}

/**
 * Helper type to extract setting values from a registry
 */
export type ExtractSettingValue<T extends SettingDefinition> = T extends SettingDefinition<infer V> ? V : never;

/**
 * Type-safe setting key type
 * Ensures only registered keys can be used
 */
export type UserPreferenceKey =
    | "default_landing"
    | "primary_league_id"
    | "reminder_style"
    | "theme"
    | "email_daily_reminder"
    | "email_weekly_digest"
    | "push_enabled";

