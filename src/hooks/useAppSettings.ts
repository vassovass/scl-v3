"use client";

import { useState, useEffect, useCallback } from 'react';
import { AppSettingKey } from '@/lib/settings/appSettingsTypes';

interface AppSetting {
  key: string;
  value: any;
  label: string;
  description?: string;
  category: string;
  value_type: string;
  value_options?: Array<{ value: string; label: string; color?: string }>;
  value_constraints?: { min?: number; max?: number };
  visible_to?: string[];
  editable_by?: string[];
  show_in_league_settings?: boolean;
}

interface AppSettingsResponse {
  settings: Record<string, AppSetting>;
}

/**
 * Hook to access app-wide settings (SuperAdmin configurable)
 * PRD-26: SuperAdmin Settings & Feature Flags
 *
 * @example
 * const { getSetting, isFeatureEnabled, getNumericSetting } = useAppSettings();
 * const stage = getSetting('development_stage', { stage: 'beta', badge_visible: true });
 * const highFivesEnabled = isFeatureEnabled('feature_high_fives');
 * const maxUploads = getNumericSetting('max_batch_uploads', 7);
 */
export function useAppSettings() {
  const [data, setData] = useState<AppSettingsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const loadSettings = useCallback(async () => {
    // Add timeout to prevent hanging on slow mobile networks
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      // Try admin endpoint first (for authenticated users with full settings)
      let response = await fetch('/api/admin/settings', {
        signal: controller.signal,
      });

      // If unauthorized, fall back to public endpoint (for guests)
      if (response.status === 401) {
        response = await fetch('/api/settings/public', {
          signal: controller.signal,
        });
      }

      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.warn('[useAppSettings] Request timeout - using defaults');
      } else {
        console.error('Error loading app settings:', err);
      }
      setError(err);
      // Set empty data on error so getSetting fallbacks work
      setData({ settings: {} });
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  /**
   * Get a setting value with fallback default
   */
  const getSetting = <T,>(key: string, defaultValue: T): T => {
    if (!data?.settings || !data.settings[key]) {
      return defaultValue;
    }
    return data.settings[key].value as T;
  };

  /**
   * Check if a feature flag is enabled
   * @example const canHighFive = isFeatureEnabled('feature_high_fives');
   */
  const isFeatureEnabled = (key: AppSettingKey): boolean => {
    if (isLoading) return false; // Default to false while loading for safety
    const value = getSetting<unknown>(key, false);
    return value === true || value === 'true';
  };

  /**
   * Get a numeric setting with constraint validation
   * @example const maxDays = getNumericSetting('max_batch_uploads', 7);
   */
  const getNumericSetting = (key: AppSettingKey, defaultValue: number): number => {
    const value = getSetting(key, defaultValue);
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? defaultValue : parsed;
    }
    return defaultValue;
  };

  /**
   * Get settings that should be shown in league settings
   */
  const getLeagueInheritedSettings = (): AppSetting[] => {
    if (!data?.settings) return [];
    return Object.values(data.settings).filter(
      (setting) => setting.show_in_league_settings === true
    );
  };

  /**
   * Update a setting (SuperAdmin only)
   */
  const updateSetting = async (key: string, value: unknown) => {
    const response = await fetch(`/api/admin/settings/${key}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update setting');
    }

    // Reload settings after update
    await loadSettings();
    return response.json();
  };

  /**
   * Update visibility settings for a setting (SuperAdmin only)
   */
  const updateVisibility = async (
    key: string,
    visibility: {
      visible_to?: string[];
      editable_by?: string[];
      show_in_league_settings?: boolean;
    }
  ) => {
    const response = await fetch(`/api/admin/settings/${key}/visibility`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(visibility),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update visibility');
    }

    // Reload settings after update
    await loadSettings();
    return response.json();
  };

  /**
   * Reload settings from server
   */
  const refresh = () => loadSettings();

  return {
    settings: data?.settings || {},
    getSetting,
    isFeatureEnabled,
    getNumericSetting,
    getLeagueInheritedSettings,
    updateSetting,
    updateVisibility,
    refresh,
    isLoading,
    error,
  };
}

