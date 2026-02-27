/**
 * useFilterPersistence Hook Tests
 *
 * Tests URL-synced and localStorage-backed filter persistence.
 *
 * Strategy:
 * - Mock next/navigation per-test (override the global vitest.setup mock)
 * - Mock filterStorage module
 * - Use renderHook + act for state updates
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mocks — next/navigation
// ---------------------------------------------------------------------------

const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/test",
}));

// ---------------------------------------------------------------------------
// Mocks — filterStorage
// ---------------------------------------------------------------------------

const mockGetStoredFilters = vi.fn();
const mockSetStoredFilters = vi.fn();

vi.mock("@/lib/filters/filterStorage", () => ({
  getStoredFilters: (...args: unknown[]) => mockGetStoredFilters(...args),
  setStoredFilters: (...args: unknown[]) => mockSetStoredFilters(...args),
}));

// ---------------------------------------------------------------------------
// Import under test (AFTER mocks are declared)
// ---------------------------------------------------------------------------

import { useFilterPersistence } from "../useFilterPersistence";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface TestFilters extends Record<string, string> {
  status: string;
  sort: string;
}

const DEFAULTS: TestFilters = {
  status: "all",
  sort: "newest",
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useFilterPersistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    mockGetStoredFilters.mockReturnValue(null);
    // Ensure window.location.origin is available for shareableUrl
    Object.defineProperty(window, "location", {
      value: { origin: "https://example.com", href: "https://example.com/test" },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // 1. Returns defaults initially
  it("returns default filter values before hydration", () => {
    const { result } = renderHook(() =>
      useFilterPersistence({
        storageKey: "test-page",
        defaults: DEFAULTS,
      })
    );

    // Immediately after render (before useEffect fires), filters = defaults
    expect(result.current.filters.status).toBe("all");
    expect(result.current.filters.sort).toBe("newest");
  });

  // 2. isHydrated becomes true after mount
  it("sets isHydrated to true after initial mount effect", async () => {
    const { result } = renderHook(() =>
      useFilterPersistence({
        storageKey: "test-page",
        defaults: DEFAULTS,
      })
    );

    await waitFor(() => {
      expect(result.current.isHydrated).toBe(true);
    });
  });

  // 3. setFilter updates a single filter
  it("setFilter updates one key and pushes new URL", async () => {
    const { result } = renderHook(() =>
      useFilterPersistence({
        storageKey: "test-page",
        defaults: DEFAULTS,
      })
    );

    await waitFor(() => {
      expect(result.current.isHydrated).toBe(true);
    });

    act(() => {
      result.current.setFilter("status", "active");
    });

    expect(result.current.filters.status).toBe("active");
    expect(result.current.filters.sort).toBe("newest"); // unchanged

    // URL should be pushed with the non-default value
    expect(mockPush).toHaveBeenCalled();
    const pushedUrl: string = mockPush.mock.calls[mockPush.mock.calls.length - 1][0];
    expect(pushedUrl).toContain("status=active");
  });

  // 4. setFilters updates multiple filters
  it("setFilters updates multiple keys at once", async () => {
    const { result } = renderHook(() =>
      useFilterPersistence({
        storageKey: "test-page",
        defaults: DEFAULTS,
      })
    );

    await waitFor(() => {
      expect(result.current.isHydrated).toBe(true);
    });

    act(() => {
      result.current.setFilters({ status: "completed", sort: "oldest" });
    });

    expect(result.current.filters.status).toBe("completed");
    expect(result.current.filters.sort).toBe("oldest");
  });

  // 5. resetFilters restores defaults
  it("resetFilters reverts all filters to their defaults", async () => {
    const { result } = renderHook(() =>
      useFilterPersistence({
        storageKey: "test-page",
        defaults: DEFAULTS,
      })
    );

    await waitFor(() => {
      expect(result.current.isHydrated).toBe(true);
    });

    // Change filters first
    act(() => {
      result.current.setFilters({ status: "active", sort: "oldest" });
    });
    expect(result.current.filters.status).toBe("active");

    // Reset
    act(() => {
      result.current.resetFilters();
    });

    expect(result.current.filters.status).toBe("all");
    expect(result.current.filters.sort).toBe("newest");

    // URL should be clean (no query params since all are default)
    const lastCall = mockPush.mock.calls[mockPush.mock.calls.length - 1];
    expect(lastCall[0]).toBe("/test");
  });

  // 6. URL params take priority over localStorage
  it("hydrates from URL params over localStorage values", async () => {
    mockSearchParams = new URLSearchParams("status=archived");
    mockGetStoredFilters.mockReturnValue({ status: "active", sort: "oldest" });

    const { result } = renderHook(() =>
      useFilterPersistence({
        storageKey: "test-page",
        defaults: DEFAULTS,
      })
    );

    await waitFor(() => {
      expect(result.current.isHydrated).toBe(true);
    });

    // URL param wins for status; sort stays default because URL had params
    // (the hook only falls back to localStorage when NO URL params exist)
    expect(result.current.filters.status).toBe("archived");
    expect(result.current.filters.sort).toBe("newest");
  });

  // 7. Falls back to localStorage when no URL params
  it("hydrates from localStorage when URL has no matching params", async () => {
    mockSearchParams = new URLSearchParams(); // empty
    mockGetStoredFilters.mockReturnValue({ status: "active", sort: "oldest" });

    const { result } = renderHook(() =>
      useFilterPersistence({
        storageKey: "test-page",
        defaults: DEFAULTS,
      })
    );

    await waitFor(() => {
      expect(result.current.isHydrated).toBe(true);
    });

    expect(result.current.filters.status).toBe("active");
    expect(result.current.filters.sort).toBe("oldest");
    expect(mockGetStoredFilters).toHaveBeenCalledWith("test-page", "default");
  });

  // 8. shareableUrl includes non-default filter values
  it("builds a shareable URL containing only non-default values", async () => {
    const { result } = renderHook(() =>
      useFilterPersistence({
        storageKey: "test-page",
        defaults: DEFAULTS,
      })
    );

    await waitFor(() => {
      expect(result.current.isHydrated).toBe(true);
    });

    // With defaults, shareable URL should have no query params
    expect(result.current.shareableUrl).toBe("https://example.com/test");

    act(() => {
      result.current.setFilter("status", "active");
    });

    expect(result.current.shareableUrl).toContain("status=active");
    // sort is still default, so should NOT appear in URL
    expect(result.current.shareableUrl).not.toContain("sort=");
  });

  // 9. persistToStorage writes to localStorage via setStoredFilters
  it("persists filters to localStorage when persistToStorage is true", async () => {
    const { result } = renderHook(() =>
      useFilterPersistence({
        storageKey: "test-page",
        defaults: DEFAULTS,
        persistToStorage: true,
      })
    );

    await waitFor(() => {
      expect(result.current.isHydrated).toBe(true);
    });

    act(() => {
      result.current.setFilter("status", "active");
    });

    expect(mockSetStoredFilters).toHaveBeenCalledWith(
      "test-page",
      expect.objectContaining({ status: "active" }),
      "default"
    );
  });

  // 10. Uses contextId when provided
  it("passes contextId to filterStorage functions", async () => {
    mockGetStoredFilters.mockReturnValue(null);

    const { result } = renderHook(() =>
      useFilterPersistence({
        storageKey: "leaderboard",
        contextId: "league-42",
        defaults: DEFAULTS,
      })
    );

    await waitFor(() => {
      expect(result.current.isHydrated).toBe(true);
    });

    // getStoredFilters should have been called with the contextId
    expect(mockGetStoredFilters).toHaveBeenCalledWith("leaderboard", "league-42");

    act(() => {
      result.current.setFilter("sort", "oldest");
    });

    expect(mockSetStoredFilters).toHaveBeenCalledWith(
      "leaderboard",
      expect.objectContaining({ sort: "oldest" }),
      "league-42"
    );
  });
});
