/**
 * App Settings Registry
 * Defines all SuperAdmin-configurable app-wide settings
 * PRD-26: SuperAdmin Settings & Feature Flags
 *
 * To add a new setting:
 * 1. Add to AppSettingKey type in appSettingsTypes.ts
 * 2. Add definition here in the appropriate section
 * 3. Create database migration to insert the setting
 * 4. Update CHANGELOG.md
 */

import { AppSettingDefinition, AppSettingsSection, AppSettingKey } from "./appSettingsTypes";

// ============================================================================
// LIMITS SETTINGS
// ============================================================================

const limitsSettings: AppSettingDefinition[] = [
  {
    key: "max_batch_uploads",
    type: "number",
    label: "Max Batch Uploads",
    description: "Maximum number of days that can be uploaded at once",
    default: 7,
    constraints: { min: 1, max: 100 },
    category: "limits",
    visibleTo: ["superadmin"],
    editableBy: ["superadmin"],
    showInLeagueSettings: true,
  },
  {
    key: "max_backfill_days",
    type: "number",
    label: "Max Backfill Days",
    description: "How many days back users can submit steps",
    default: 7,
    constraints: { min: 1, max: 30 },
    category: "limits",
    visibleTo: ["superadmin"],
    editableBy: ["superadmin"],
    showInLeagueSettings: true,
  },
  {
    key: "max_league_members",
    type: "number",
    label: "Max League Members",
    description: "Default maximum members per league",
    default: 50,
    constraints: { min: 2, max: 500 },
    category: "limits",
    visibleTo: ["superadmin"],
    editableBy: ["superadmin"],
    showInLeagueSettings: false,
  },
];

// ============================================================================
// FEATURE FLAGS
// ============================================================================

const featureSettings: AppSettingDefinition[] = [
  {
    key: "feature_high_fives",
    type: "toggle",
    label: "High Fives",
    description: "Allow users to send high fives to celebrate achievements (PRD 31)",
    default: true,
    category: "features",
    visibleTo: ["superadmin"],
    editableBy: ["superadmin"],
  },
  {
    key: "feature_streak_freeze",
    type: "toggle",
    label: "Streak Freeze",
    description: "Allow users to freeze their streak once per week (PRD 28)",
    default: false,
    category: "features",
    visibleTo: ["superadmin"],
    editableBy: ["superadmin"],
  },
  {
    key: "feature_analytics_export",
    type: "toggle",
    label: "Analytics Export",
    description: "Allow users to export their analytics data as CSV/PDF (PRD 32)",
    default: false,
    category: "features",
    visibleTo: ["superadmin"],
    editableBy: ["superadmin"],
  },
];

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const defaultsSettings: AppSettingDefinition[] = [
  {
    key: "default_daily_step_goal",
    type: "number",
    label: "Default Daily Step Goal",
    description: "Default step goal for new leagues",
    default: 10000,
    constraints: { min: 1000, max: 100000 },
    category: "defaults",
    visibleTo: ["superadmin"],
    editableBy: ["superadmin"],
  },
  {
    key: "default_stepweek_start",
    type: "select",
    label: "Default Week Start",
    description: "Default start day for step weeks in new leagues",
    default: "monday",
    options: [
      { value: "monday", label: "Monday" },
      { value: "sunday", label: "Sunday" },
    ],
    category: "defaults",
    visibleTo: ["superadmin"],
    editableBy: ["superadmin"],
  },
];

// ============================================================================
// DISPLAY SETTINGS
// ============================================================================

const displaySettings: AppSettingDefinition[] = [
  {
    key: "show_global_leaderboard",
    type: "toggle",
    label: "Global Leaderboard",
    description: "Display a cross-league leaderboard showing top performers",
    default: false,
    category: "display",
    visibleTo: ["superadmin"],
    editableBy: ["superadmin"],
  },
  {
    key: "maintenance_mode",
    type: "toggle",
    label: "Maintenance Mode",
    description: "Show a maintenance banner to all users",
    default: false,
    category: "display",
    visibleTo: ["superadmin"],
    editableBy: ["superadmin"],
  },
];

// ============================================================================
// GENERAL SETTINGS (existing from partial implementation)
// ============================================================================

const generalSettings: AppSettingDefinition[] = [
  {
    key: "development_stage",
    type: "select",
    label: "Development Stage",
    description: "Current development stage of the application",
    default: { stage: "pre-alpha", badge_visible: true },
    options: [
      { value: "pre-alpha", label: "Pre-Alpha" },
      { value: "alpha", label: "Alpha" },
      { value: "beta", label: "Beta" },
      { value: "product-hunt", label: "Product Hunt" },
      { value: "production", label: "Production" },
    ],
    category: "general",
    visibleTo: ["superadmin"],
    editableBy: ["superadmin"],
  },
  {
    key: "stage_descriptions",
    type: "textarea",
    label: "Stage Descriptions",
    description: "Descriptions for each development stage shown on the info page",
    default: {},
    category: "general",
    visibleTo: ["superadmin"],
    editableBy: ["superadmin"],
  },
];

// ============================================================================
// APPEARANCE SETTINGS
// ============================================================================

/**
 * Theme variant definition for SuperAdmin-configurable themes
 */
export interface ThemeVariant {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
}

const appearanceSettings: AppSettingDefinition[] = [
  {
    key: "default_theme_mode",
    type: "select",
    label: "Default Theme Mode",
    description: "Default theme mode applied to new and signed-out users.",
    default: "system",
    options: [
      { value: "dark", label: "Dark" },
      { value: "light", label: "Light" },
      { value: "system", label: "System" },
    ],
    category: "appearance",
    visibleTo: ["superadmin"],
    editableBy: ["superadmin"],
    showInUserSettings: false,
  },
  {
    key: "allow_theme_dark",
    type: "toggle",
    label: "Allow Dark Mode",
    description: "Enable dark mode selection for users.",
    default: true,
    category: "appearance",
    visibleTo: ["superadmin"],
    editableBy: ["superadmin"],
    showInUserSettings: false,
  },
  {
    key: "allow_theme_light",
    type: "toggle",
    label: "Allow Light Mode",
    description: "Enable light mode selection for users.",
    default: true,
    category: "appearance",
    visibleTo: ["superadmin"],
    editableBy: ["superadmin"],
    showInUserSettings: false,
  },
  {
    key: "allow_theme_system",
    type: "toggle",
    label: "Allow System Mode",
    description: "Enable system theme selection for users.",
    default: true,
    category: "appearance",
    visibleTo: ["superadmin"],
    editableBy: ["superadmin"],
    showInUserSettings: false,
  },
  {
    key: "theme_variants",
    type: "json",
    label: "Theme Variants",
    description: "Available theme variants for users to choose from. By default, only 'dark' and 'light' modes exist.",
    default: [
      {
        id: "dark",
        name: "Dark",
        description: "Default dark theme",
        enabled: true,
      },
      {
        id: "light",
        name: "Light",
        description: "Light theme for better readability in bright environments",
        enabled: true,
      },
    ] as ThemeVariant[],
    category: "appearance",
    visibleTo: ["superadmin"],
    editableBy: ["superadmin"],
    showInUserSettings: false,
  },
];

// ============================================================================
// BRANDING SETTINGS
// ============================================================================

const brandingSettings: AppSettingDefinition[] = [
  {
    key: "branding_settings",
    type: "custom" as any, // Special type for embedded branding UI
    label: "Logo & Branding",
    description: "Customize app logo, favicons, and theme colors. Changes affect the entire application including browser tabs, bookmarks, and PWA icons.",
    default: null, // Handled by brand_settings table
    category: "branding" as any,
    visibleTo: ["superadmin"],
    editableBy: ["superadmin"],
  },
];

// ============================================================================
// REGISTRY EXPORT
// ============================================================================

/**
 * App Settings Registry
 * Organized by category for the admin UI
 */
export const APP_SETTING_SECTIONS: AppSettingsSection[] = [
  {
    id: "limits",
    title: "System Limits",
    description: "Control resource limits across the platform",
    icon: "Sliders",
    settings: limitsSettings,
  },
  {
    id: "features",
    title: "Feature Flags",
    description: "Enable or disable platform features",
    icon: "Flag",
    settings: featureSettings,
  },
  {
    id: "defaults",
    title: "Default Values",
    description: "Default settings for new leagues",
    icon: "Settings2",
    settings: defaultsSettings,
  },
  {
    id: "display",
    title: "Display Settings",
    description: "Control what users see across the platform",
    icon: "Eye",
    settings: displaySettings,
  },
  {
    id: "general",
    title: "General",
    description: "General application settings",
    icon: "Settings",
    settings: generalSettings,
  },
  {
    id: "appearance",
    title: "Appearance",
    description: "Theme variants and visual customization",
    icon: "Palette",
    settings: appearanceSettings,
  },
  {
    id: "branding" as any,
    title: "Branding",
    description: "Customize logo, favicons, and theme colors",
    icon: "Paintbrush",
    settings: brandingSettings,
  },
];

/**
 * Flat map of all settings for quick lookup
 */
export const APP_SETTINGS_MAP: Record<AppSettingKey, AppSettingDefinition> = APP_SETTING_SECTIONS.reduce(
  (acc, section) => {
    section.settings.forEach((setting) => {
      acc[setting.key] = setting;
    });
    return acc;
  },
  {} as Record<AppSettingKey, AppSettingDefinition>
);

/**
 * Get all default values for app settings
 */
export function getAppSettingDefaults(): Record<AppSettingKey, unknown> {
  const defaults: Record<string, unknown> = {};

  APP_SETTING_SECTIONS.forEach((section) => {
    section.settings.forEach((setting) => {
      defaults[setting.key] = setting.default;
    });
  });

  return defaults as Record<AppSettingKey, unknown>;
}

/**
 * Find a setting definition by key
 */
export function getAppSettingDefinition(key: AppSettingKey): AppSettingDefinition | undefined {
  return APP_SETTINGS_MAP[key];
}

/**
 * Get all settings for a category
 */
export function getAppSettingsByCategory(category: string): AppSettingDefinition[] {
  const section = APP_SETTING_SECTIONS.find((s) => s.id === category);
  return section?.settings || [];
}

/**
 * Get settings that should be shown in league settings
 */
export function getLeagueInheritedSettings(): AppSettingDefinition[] {
  return APP_SETTING_SECTIONS.flatMap((section) =>
    section.settings.filter((setting) => setting.showInLeagueSettings)
  );
}

/**
 * Check if a setting key is a feature flag
 */
export function isFeatureFlag(key: string): boolean {
  return key.startsWith("feature_");
}
