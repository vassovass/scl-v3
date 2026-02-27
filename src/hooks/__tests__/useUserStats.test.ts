/**
 * useUserStats Hook Tests
 *
 * Tests for the user stats hook that fetches personal
 * statistics (best day, streaks, lifetime steps) from
 * /api/user/stats.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useUserStats, type UserStats } from "../useUserStats";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MOCK_STATS: UserStats = {
  best_day_steps: 24_567,
  best_day_date: "2025-11-12",
  current_streak: 14,
  longest_streak: 30,
  total_steps_lifetime: 1_250_000,
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.restoreAllMocks();
  global.fetch = vi.fn();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useUserStats", () => {
  // -----------------------------------------------------------------------
  // 1. Initial loading state
  // -----------------------------------------------------------------------
  it("starts with loading=true and stats=null", () => {
    // Never resolve so we stay in loading
    vi.mocked(global.fetch).mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useUserStats());

    expect(result.current.loading).toBe(true);
    expect(result.current.stats).toBeNull();
  });

  // -----------------------------------------------------------------------
  // 2. Successful fetch returns stats
  // -----------------------------------------------------------------------
  it("populates stats after a successful fetch", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      jsonResponse({ stats: MOCK_STATS })
    );

    const { result } = renderHook(() => useUserStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats).toEqual(MOCK_STATS);
  });

  // -----------------------------------------------------------------------
  // 3. Failed fetch (non-ok) returns null stats
  // -----------------------------------------------------------------------
  it("returns null stats when fetch responds with a non-ok status", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(null, { status: 500 })
    );

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useUserStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats).toBeNull();

    errorSpy.mockRestore();
  });

  // -----------------------------------------------------------------------
  // 4. Loading becomes false after successful fetch
  // -----------------------------------------------------------------------
  it("sets loading to false after a successful fetch completes", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      jsonResponse({ stats: MOCK_STATS })
    );

    const { result } = renderHook(() => useUserStats());

    // Initially loading
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // 5. Network error handling
  // -----------------------------------------------------------------------
  it("handles a network error and sets stats to null", async () => {
    vi.mocked(global.fetch).mockRejectedValue(new TypeError("Failed to fetch"));

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useUserStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats).toBeNull();

    errorSpy.mockRestore();
  });

  // -----------------------------------------------------------------------
  // 6. Loading becomes false after error
  // -----------------------------------------------------------------------
  it("sets loading to false even when the fetch errors", async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error("Oops"));

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useUserStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    errorSpy.mockRestore();
  });

  // -----------------------------------------------------------------------
  // 7. Calls the correct endpoint
  // -----------------------------------------------------------------------
  it("fetches from /api/user/stats", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      jsonResponse({ stats: MOCK_STATS })
    );

    renderHook(() => useUserStats());

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    expect(vi.mocked(global.fetch).mock.calls[0][0]).toBe("/api/user/stats");
  });

  // -----------------------------------------------------------------------
  // 8. Response without stats key leaves stats null
  // -----------------------------------------------------------------------
  it("leaves stats null when response JSON has no stats property", async () => {
    vi.mocked(global.fetch).mockResolvedValue(jsonResponse({ other: "data" }));

    const { result } = renderHook(() => useUserStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats).toBeNull();
  });

  // -----------------------------------------------------------------------
  // 9. Handles partial stats from server
  // -----------------------------------------------------------------------
  it("accepts partial stats from the server", async () => {
    const partialStats: UserStats = {
      best_day_steps: 5000,
      best_day_date: null,
      current_streak: 0,
      longest_streak: 0,
      total_steps_lifetime: 5000,
    };

    vi.mocked(global.fetch).mockResolvedValue(
      jsonResponse({ stats: partialStats })
    );

    const { result } = renderHook(() => useUserStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats).toEqual(partialStats);
    expect(result.current.stats!.best_day_date).toBeNull();
  });

  // -----------------------------------------------------------------------
  // 10. Fetch is called only once on mount
  // -----------------------------------------------------------------------
  it("fetches only once on mount", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      jsonResponse({ stats: MOCK_STATS })
    );

    const { result, rerender } = renderHook(() => useUserStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Re-render should not trigger another fetch
    rerender();

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
