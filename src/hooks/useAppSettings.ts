"use client";

import { useState, useEffect, useCallback } from 'react';

interface AppSetting {
  key: string;
  value: any;
  label: string;
  description?: string;
  category: string;
  value_type: string;
  value_options?: Array<{ value: string; label: string; color?: string }>;
  visible_to?: string[];
  editable_by?: string[];
}

interface AppSettingsResponse {
  settings: Record<string, AppSetting>;
}

/**
 * Hook to access app-wide settings (SuperAdmin configurable)
 *
 * @example
 * const { getSetting } = useAppSettings();
 * const stage = getSetting('development_stage', { stage: 'beta', badge_visible: true });
 */
export function useAppSettings() {
  const [data, setData] = useState<AppSettingsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const loadSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err: any) {
      console.error('Error loading app settings:', err);
      setError(err);
      // Set empty data on error so getSetting fallbacks work
      setData({ settings: {} });
    } finally {
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

  return {
    settings: data?.settings || {},
    getSetting,
    updateSetting,
    isLoading,
    error,
  };
}
