/**
 * useBranding Hook
 *
 * Manages branding state with SWR caching.
 * Provides real-time branding data and update functions.
 *
 * @example
 * const { branding, updateBranding, isLoading } = useBranding();
 *
 * // Update logo text
 * await updateBranding({
 *   logo: { textPrimary: 'New', textSecondary: 'Brand' }
 * });
 */

'use client';

import useSWR from 'swr';
import { BrandSettings, DEFAULT_BRANDING } from '@/lib/branding';
import { AppError, ErrorCode, normalizeError } from '@/lib/errors';

interface BrandingResponse {
  data: BrandSettings;
}

/**
 * Fetch branding from API.
 */
async function fetchBranding(url: string): Promise<BrandSettings> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    // Return defaults if fetch fails (offline, server error, etc.)
    console.warn('Failed to fetch branding, using defaults');
    return DEFAULT_BRANDING;
  }

  const json: BrandingResponse = await res.json();
  return json.data;
}

/**
 * Hook for managing branding state.
 */
export function useBranding() {
  const { data, error, mutate, isLoading } = useSWR<BrandSettings>(
    '/api/admin/branding',
    fetchBranding,
    {
      fallbackData: DEFAULT_BRANDING,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  );

  /**
   * Update branding settings.
   * Supports partial updates.
   *
   * @param updates - Partial branding settings to update
   * @returns Updated branding settings
   * @throws AppError if update fails
   */
  const updateBranding = async (updates: Partial<BrandSettings>): Promise<BrandSettings> => {
    try {
      const res = await fetch('/api/admin/branding', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new AppError({
          code: ErrorCode.API_REQUEST_FAILED,
          message: errorData.error || 'Failed to update branding',
          context: { status: res.status, updates },
          recoverable: true,
        });
      }

      const json = await res.json();
      const updated = json.data;

      // Update cache optimistically
      await mutate(updated, false);

      return updated;
    } catch (err) {
      const appError = normalizeError(err, ErrorCode.API_REQUEST_FAILED);
      throw appError;
    }
  };

  /**
   * Refresh branding from server.
   */
  const refresh = () => {
    mutate();
  };

  return {
    /** Current branding settings */
    branding: data || DEFAULT_BRANDING,
    /** True while initial load is in progress */
    isLoading: isLoading && !data,
    /** Error if fetch failed */
    error,
    /** Update branding settings */
    updateBranding,
    /** Refresh branding from server */
    refresh,
  };
}
