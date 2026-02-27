/**
 * useSubmissionHistory Hook Tests
 *
 * Tests the submission history hook that fetches change audit logs
 * for a given submission from /api/submissions/{id}.
 *
 * Strategy: Mock global fetch, use renderHook + waitFor for async states.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useSubmissionHistory } from "../useSubmissionHistory";
import type { SubmissionChange } from "@/types/database";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_CHANGES: SubmissionChange[] = [
  {
    id: "ch-1",
    submission_id: "sub-100",
    user_id: "user-1",
    field_name: "steps",
    old_value: "5000",
    new_value: "10000",
    reason: "Corrected entry",
    created_at: "2026-02-15T10:00:00Z",
  },
  {
    id: "ch-2",
    submission_id: "sub-100",
    user_id: "user-2",
    field_name: "steps",
    old_value: "10000",
    new_value: "12000",
    reason: null,
    created_at: "2026-02-16T12:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useSubmissionHistory", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  // 1. Does not fetch when enabled=false
  it("does not fetch when enabled is false", () => {
    globalThis.fetch = vi.fn() as unknown as typeof fetch;

    renderHook(() =>
      useSubmissionHistory({ submissionId: "sub-100", enabled: false })
    );

    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  // 2. Does not fetch when submissionId is empty
  it("does not fetch when submissionId is empty string", () => {
    globalThis.fetch = vi.fn() as unknown as typeof fetch;

    renderHook(() =>
      useSubmissionHistory({ submissionId: "", enabled: true })
    );

    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  // 3. Fetches on first access when enabled
  it("fetches from the correct URL on mount when enabled", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ changes: MOCK_CHANGES }),
    }) as unknown as typeof fetch;

    renderHook(() =>
      useSubmissionHistory({ submissionId: "sub-100", enabled: true })
    );

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith("/api/submissions/sub-100");
    });
  });

  // 4. Returns changes from API
  it("returns changes array from a successful API response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ changes: MOCK_CHANGES }),
    }) as unknown as typeof fetch;

    const { result } = renderHook(() =>
      useSubmissionHistory({ submissionId: "sub-100", enabled: true })
    );

    await waitFor(() => {
      expect(result.current.changes).toEqual(MOCK_CHANGES);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  // 5. Sets error on API failure
  // Note: The hook does not set hasFetched on error, so it retries on each
  // re-render. We verify fetch was called and the error message was set at
  // least once during the retry cycle.
  it("sets error string when the API returns non-ok status", async () => {
    const errors: (string | null)[] = [];
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: "Internal server error" }),
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => {
      const hookResult = useSubmissionHistory({ submissionId: "sub-100", enabled: true });
      errors.push(hookResult.error);
      return hookResult;
    });

    await waitFor(() => {
      expect(errors).toContain("Internal server error");
    });

    expect(result.current.changes).toEqual([]);
  });

  // 6. refetch re-fetches data
  it("refetch triggers a new API call", async () => {
    let callCount = 0;
    globalThis.fetch = vi.fn(async () => {
      callCount++;
      return {
        ok: true,
        json: async () => ({ changes: MOCK_CHANGES }),
      };
    }) as unknown as typeof fetch;

    const { result } = renderHook(() =>
      useSubmissionHistory({ submissionId: "sub-100", enabled: true })
    );

    // Wait for initial fetch
    await waitFor(() => {
      expect(callCount).toBeGreaterThanOrEqual(1);
    });

    const countAfterInit = callCount;

    // Trigger refetch
    await act(async () => {
      await result.current.refetch();
    });

    expect(callCount).toBeGreaterThan(countAfterInit);
  });

  // 7. Loading state transitions
  it("transitions isLoading from true to false after fetch completes", async () => {
    let resolveFetch!: (value: unknown) => void;
    globalThis.fetch = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    ) as unknown as typeof fetch;

    const { result } = renderHook(() =>
      useSubmissionHistory({ submissionId: "sub-100", enabled: true })
    );

    // Should be loading after triggering the fetch
    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    // Resolve the fetch
    await act(async () => {
      resolveFetch({
        ok: true,
        json: async () => ({ changes: [] }),
      });
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  // 8. Handles network error (fetch throws)
  // Same retry caveat as test 5 -- hook retries on error since hasFetched
  // is never set to true on failure.
  it("sets error when fetch throws a network error", async () => {
    const errors: (string | null)[] = [];
    globalThis.fetch = vi
      .fn()
      .mockRejectedValue(new Error("Network failure")) as unknown as typeof fetch;

    renderHook(() => {
      const hookResult = useSubmissionHistory({ submissionId: "sub-100", enabled: true });
      errors.push(hookResult.error);
      return hookResult;
    });

    await waitFor(() => {
      expect(errors).toContain("Network failure");
    });
  });

  // 9. Returns empty changes when API returns no changes key
  it("defaults to empty array when API response has no changes field", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }) as unknown as typeof fetch;

    const { result } = renderHook(() =>
      useSubmissionHistory({ submissionId: "sub-100", enabled: true })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.changes).toEqual([]);
  });

  // 10. Error message fallback when JSON parse fails on error response
  // Same retry caveat as test 5.
  it("uses generic error message when error response is not valid JSON", async () => {
    const errors: (string | null)[] = [];
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("Bad JSON");
      },
    }) as unknown as typeof fetch;

    renderHook(() => {
      const hookResult = useSubmissionHistory({ submissionId: "sub-100", enabled: true });
      errors.push(hookResult.error);
      return hookResult;
    });

    await waitFor(() => {
      expect(errors).toContain("Failed to fetch history");
    });
  });
});
