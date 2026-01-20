/**
 * App Settings Types
 * Type definitions for SuperAdmin configurable settings
 * PRD-26: SuperAdmin Settings & Feature Flags
 */

import { SettingType, SelectOption, SettingsSection } from "./types";

/**
 * All app setting keys
 * Feature flags are prefixed with 'feature_'
 */
export type AppSettingKey =
  // Existing
  | "development_stage"
  | "stage_descriptions"
  // Limits
  | "max_batch_uploads"
  | "max_backfill_days"
  | "max_league_members"
  | "max_proxies_per_user"  // PRD 41: Proxy quota
  // Features
  | "feature_high_fives"
  | "feature_streak_freeze"
  | "feature_analytics_export"
  | "feature_proxy_system"   // PRD 41: Enable/disable proxy feature
  | "feature_auto_enroll_world_league"  // PRD 44: Auto-enroll new users in World League
  // Defaults
  | "default_daily_step_goal"
  | "default_stepweek_start"
  | "proxy_max_claims"       // PRD 41: Claims per proxy
  | "proxy_activity_decay_days" // PRD 41: Days before auto-archive
  // Display
  | "show_global_leaderboard"
  | "maintenance_mode"
  // Appearance
  | "theme_variants"
  | "default_theme_mode"
  | "allow_theme_dark"
  | "allow_theme_light"
  | "allow_theme_system"
  // Branding (links to dedicated branding interface)
  | "branding_settings";

/**
 * Setting categories for organization
 */
export type AppSettingCategory = "limits" | "features" | "defaults" | "display" | "general" | "appearance" | "branding";

/**
 * Roles for visibility control
 */
export type SettingVisibilityRole = "superadmin" | "owner" | "admin" | "member";

/**
 * App setting definition with visibility controls
 */
export interface AppSettingDefinition<T = unknown> {
  key: AppSettingKey;
  type: SettingType;
  label: string;
  description?: string;
  default: T;
  options?: SelectOption[];
  constraints?: {
    min?: number;
    max?: number;
  };
  category: AppSettingCategory;
  visibleTo?: SettingVisibilityRole[];
  editableBy?: SettingVisibilityRole[];
  showInLeagueSettings?: boolean;
  showInUserSettings?: boolean;
}

/**
 * App settings section with category metadata
 */
export interface AppSettingsSection extends SettingsSection {
  id: AppSettingCategory;
  icon?: string;
  settings: AppSettingDefinition[];
}

/**
 * Database row shape for app_settings table
 */
export interface AppSettingRow {
  key: string;
  value: unknown;
  label: string;
  description?: string;
  category: string;
  value_type: string;
  value_options?: SelectOption[];
  value_constraints?: { min?: number; max?: number };
  visible_to?: string[];
  editable_by?: string[];
  show_in_league_settings?: boolean;
  show_in_user_settings?: boolean;
  updated_at?: string;
  updated_by?: string;
}

/**
 * Preset for environment configuration
 */
export interface AppSettingsPreset {
  id: string;
  name: string;
  description?: string;
  settings: Record<string, unknown>;
  created_by?: string;
  created_at?: string;
  is_default?: boolean;
}

/**
 * Audit log entry for settings changes
 */
export interface AppSettingsAuditEntry {
  id: string;
  setting_key: string;
  old_value: unknown;
  new_value: unknown;
  changed_by: string;
  changed_at: string;
  user?: {
    display_name?: string;
  };
}

