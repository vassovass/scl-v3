"use client";

import { useAppSettings } from "./useAppSettings";
import { AppSettingKey } from "@/lib/settings/appSettingsTypes";

/**
 * Simple hook to check if a feature flag is enabled
 * PRD-26: SuperAdmin Settings & Feature Flags
 *
 * @example
 * const canHighFive = useFeatureFlag('feature_high_fives');
 * if (canHighFive) { ... }
 *
 * @example
 * // With loading state
 * const { enabled, isLoading } = useFeatureFlagWithLoading('feature_streak_freeze');
 */
export function useFeatureFlag(key: AppSettingKey): boolean {
  const { isFeatureEnabled, isLoading } = useAppSettings();

  // Default to false while loading for safety
  if (isLoading) return false;

  return isFeatureEnabled(key);
}

/**
 * Feature flag hook with loading state
 * Use when you need to show a loading indicator while checking the flag
 */
export function useFeatureFlagWithLoading(key: AppSettingKey): {
  enabled: boolean;
  isLoading: boolean;
} {
  const { isFeatureEnabled, isLoading } = useAppSettings();

  return {
    enabled: isLoading ? false : isFeatureEnabled(key),
    isLoading,
  };
}

/**
 * Check multiple feature flags at once
 *
 * @example
 * const flags = useFeatureFlags(['feature_high_fives', 'feature_streak_freeze']);
 * if (flags.feature_high_fives) { ... }
 */
export function useFeatureFlags<K extends AppSettingKey>(
  keys: K[]
): Record<K, boolean> {
  const { isFeatureEnabled, isLoading } = useAppSettings();

  return keys.reduce((acc, key) => {
    acc[key] = isLoading ? false : isFeatureEnabled(key);
    return acc;
  }, {} as Record<K, boolean>);
}

