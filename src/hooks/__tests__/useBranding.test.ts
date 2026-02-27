/**
 * useBranding Hook Tests
 *
 * Tests the SWR-backed branding hook that fetches, caches, and updates
 * brand settings via /api/admin/branding.
 *
 * Strategy: Mock global fetch and let SWR work naturally with cache isolation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { SWRConfig } from "swr";
import React from "react";
import { useBranding } from "../useBranding";
import { DEFAULT_BRANDING, BrandSettings } from "@/lib/branding";
import { AppError } from "@/lib/errors";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** SWR wrapper that isolates cache between tests */
const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(
    SWRConfig,
    { value: { provider: () => new Map(), dedupingInterval: 0 } },
    children
  );

const CUSTOM_BRANDING: BrandSettings = {
  logo: {
    emoji: "🏆",
    textPrimary: "Custom",
    textSecondary: "Brand",
  },
  favicon: {
    favicon32: "/custom-favicon.ico",
    favicon16: "/custom-favicon.ico",
    appleTouchIcon: "/custom-apple.png",
    icon192: "/custom-192.png",
    icon512: "/custom-512.png",
  },
  themeColorLight: "#f0f0f0",
  themeColorDark: "#111111",
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useBranding", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  // 1. Returns DEFAULT_BRANDING initially (fallbackData)
  it("returns DEFAULT_BRANDING as fallback before fetch resolves", () => {
    // Fetch that never resolves so we stay in the initial state
    globalThis.fetch = vi.fn(
      () => new Promise<Response>(() => {})
    ) as unknown as typeof fetch;

    const { result } = renderHook(() => useBranding(), { wrapper });

    expect(result.current.branding).toEqual(DEFAULT_BRANDING);
  });

  // 2. Successful fetch returns branding data
  it("returns fetched branding data on successful API response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: CUSTOM_BRANDING }),
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useBranding(), { wrapper });

    await waitFor(() => {
      expect(result.current.branding).toEqual(CUSTOM_BRANDING);
    });

    expect(result.current.error).toBeUndefined();
  });

  // 3. Failed fetch returns DEFAULT_BRANDING
  it("returns DEFAULT_BRANDING when the API fetch fails", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: "Server error" }),
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useBranding(), { wrapper });

    // fetchBranding returns DEFAULT_BRANDING on non-ok response
    await waitFor(() => {
      expect(result.current.branding).toEqual(DEFAULT_BRANDING);
    });
  });

  // 4. updateBranding calls PATCH and mutates cache
  it("updateBranding sends PATCH and updates cached branding", async () => {
    const updatedBranding: BrandSettings = {
      ...CUSTOM_BRANDING,
      logo: { ...CUSTOM_BRANDING.logo, textPrimary: "Updated" },
    };

    // First call: initial GET; second call: PATCH from updateBranding
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: CUSTOM_BRANDING }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: updatedBranding }),
      }) as unknown as typeof fetch;

    const { result } = renderHook(() => useBranding(), { wrapper });

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.branding).toEqual(CUSTOM_BRANDING);
    });

    // Call updateBranding
    let returned: BrandSettings | undefined;
    await act(async () => {
      returned = await result.current.updateBranding({
        logo: { ...CUSTOM_BRANDING.logo, textPrimary: "Updated" },
      });
    });

    expect(returned).toEqual(updatedBranding);

    // Verify PATCH was called
    const calls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;
    const patchCall = calls.find(
      (c: unknown[]) =>
        (c[1] as RequestInit | undefined)?.method === "PATCH"
    );
    expect(patchCall).toBeDefined();
    expect(patchCall![0]).toBe("/api/admin/branding");

    // Cache should reflect the updated branding
    await waitFor(() => {
      expect(result.current.branding.logo.textPrimary).toBe("Updated");
    });
  });

  // 5. updateBranding throws AppError on failure
  it("updateBranding throws AppError when PATCH fails", async () => {
    globalThis.fetch = vi
      .fn()
      // GET succeeds
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: CUSTOM_BRANDING }),
      })
      // PATCH fails
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: "Forbidden" }),
      }) as unknown as typeof fetch;

    const { result } = renderHook(() => useBranding(), { wrapper });

    await waitFor(() => {
      expect(result.current.branding).toEqual(CUSTOM_BRANDING);
    });

    await expect(
      act(async () => {
        await result.current.updateBranding({ themeColorLight: "#000000" });
      })
    ).rejects.toThrow();

    // Verify the thrown error is an AppError
    try {
      await result.current.updateBranding({ themeColorLight: "#000000" });
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).code).toBe("API_REQUEST_FAILED");
    }
  });

  // 6. refresh triggers revalidation (calls mutate which re-fetches)
  it("refresh triggers a new fetch via SWR revalidation", async () => {
    let fetchCount = 0;
    globalThis.fetch = vi.fn(async () => {
      fetchCount++;
      return {
        ok: true,
        json: async () => ({ data: CUSTOM_BRANDING }),
      };
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useBranding(), { wrapper });

    // Wait for initial fetch
    await waitFor(() => {
      expect(fetchCount).toBeGreaterThanOrEqual(1);
    });

    const countBefore = fetchCount;

    // Trigger refresh
    act(() => {
      result.current.refresh();
    });

    await waitFor(() => {
      expect(fetchCount).toBeGreaterThan(countBefore);
    });
  });

  // 7. isLoading is false when fallback data is used
  it("isLoading is false when fallbackData is present", () => {
    globalThis.fetch = vi.fn(
      () => new Promise<Response>(() => {})
    ) as unknown as typeof fetch;

    const { result } = renderHook(() => useBranding(), { wrapper });

    // Because fallbackData exists, isLoading should be false even before fetch resolves
    // The hook computes: isLoading && !data => since data = fallbackData, it is false
    expect(result.current.isLoading).toBe(false);
  });

  // 8. updateBranding throws AppError when JSON parse fails on error response
  it("updateBranding handles non-JSON error response gracefully", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: CUSTOM_BRANDING }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      }) as unknown as typeof fetch;

    const { result } = renderHook(() => useBranding(), { wrapper });

    await waitFor(() => {
      expect(result.current.branding).toEqual(CUSTOM_BRANDING);
    });

    try {
      await act(async () => {
        await result.current.updateBranding({ themeColorDark: "#fff" });
      });
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).message).toBe("Failed to update branding");
    }
  });
});
