/**
 * User Preferences Settings Registry
 * Defines all user-specific settings following the registry pattern
 *
 * To add a new setting:
 * 1. Add column to user_preferences table (migration)
 * 2. Update UserPreferences type in database.ts
 * 3. Add definition here in the appropriate section
 * 4. Update UserPreferenceKey type in types.ts
 */

import { SettingsSection, SettingDefinition } from "./types";

// Navigation Settings
const navigationSettings: SettingDefinition[] = [
    {
        key: "default_landing",
        type: "select",
        label: "Default Landing Page",
        description: "Where to navigate after login",
        default: "dashboard",
        options: [
            { value: "dashboard", label: "My Leagues" },
            { value: "submit", label: "Submit Steps" },
            { value: "progress", label: "My Progress" },
            { value: "rankings", label: "League Rankings" },
        ],
    },
    {
        key: "primary_league_id",
        type: "select",
        label: "Primary League",
        description: "Used for quick links and default actions",
        default: null,
        options: [], // Populated dynamically from user's leagues
    },
];

// Reminder Settings
const reminderSettings: SettingDefinition[] = [
    {
        key: "reminder_style",
        type: "radio",
        label: "Reminder Display",
        description: "How to show step submission reminders",
        default: "floating",
        options: [
            {
                value: "floating",
                label: "Floating button",
                description: "Always visible in corner of screen",
            },
            {
                value: "badge",
                label: "Badge only",
                description: "Subtle notification dot on league cards",
            },
            {
                value: "card",
                label: "Card in league hub",
                description: "Shows on league page only",
            },
        ],
    },
];

// Appearance Settings (future-ready)
const appearanceSettings: SettingDefinition[] = [
    {
        key: "theme",
        type: "radio",
        label: "Theme",
        description: "Choose your preferred color scheme",
        default: "dark",
        options: [
            { value: "dark", label: "Dark", description: "Dark theme" },
            { value: "light", label: "Light", description: "Light theme" },
            { value: "system", label: "System", description: "Follow system preference" },
        ],
    },
];

// Notification Settings (future-ready)
const notificationSettings: SettingDefinition[] = [
    {
        key: "email_daily_reminder",
        type: "toggle",
        label: "Daily Email Reminder",
        description: "Receive a daily email reminder to submit steps",
        default: false,
    },
    {
        key: "email_weekly_digest",
        type: "toggle",
        label: "Weekly Digest",
        description: "Receive a weekly summary of your leagues",
        default: true,
    },
    {
        key: "push_enabled",
        type: "toggle",
        label: "Push Notifications",
        description: "Enable push notifications (requires PWA install)",
        default: false,
    },
];

// PRD-56: Share Settings
const shareSettings: SettingDefinition[] = [
    {
        key: "share_nudge_frequency",
        type: "select",
        label: "Share Reminders",
        description: "How often to remind you to share your achievements",
        default: "daily",
        options: [
            { value: "daily", label: "Daily" },
            { value: "weekly", label: "Weekly" },
            { value: "off", label: "Off" },
        ],
    },
    {
        key: "share_post_submission_prompt",
        type: "toggle",
        label: "Post-Submission Share Prompt",
        description: "Show a share prompt after submitting steps",
        default: true,
    },
];

/**
 * User Preferences Registry
 * Exports all user preference sections
 */
export const USER_PREFERENCE_SECTIONS: SettingsSection[] = [
    {
        id: "navigation",
        title: "Navigation",
        description: "Control your app flow and default actions",
        settings: navigationSettings,
    },
    {
        id: "reminders",
        title: "Step Reminders",
        description: "Customize how you're reminded to submit steps",
        settings: reminderSettings,
    },
    {
        id: "appearance",
        title: "Appearance",
        description: "Customize the look and feel",
        settings: appearanceSettings,
    },
    {
        id: "notifications",
        title: "Notifications",
        description: "Manage email and push notification preferences",
        settings: notificationSettings,
    },
    {
        id: "sharing",
        title: "Sharing",
        description: "Control sharing reminders and prompts",
        settings: shareSettings,
    },
];

/**
 * Helper to get default values for all user preferences
 * Used when initializing new user or missing preferences
 */
export function getUserPreferenceDefaults(): Record<string, unknown> {
    const defaults: Record<string, unknown> = {};

    USER_PREFERENCE_SECTIONS.forEach((section) => {
        section.settings.forEach((setting) => {
            defaults[setting.key] = setting.default;
        });
    });

    return defaults;
}

/**
 * Helper to find a setting definition by key
 */
export function getUserPreferenceSetting(key: string): SettingDefinition | undefined {
    for (const section of USER_PREFERENCE_SECTIONS) {
        const setting = section.settings.find((s) => s.key === key);
        if (setting) return setting;
    }
    return undefined;
}

