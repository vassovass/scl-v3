/**
 * useAppSettings Hook Tests
 *
 * Tests for the centralized app settings hook (PRD-26).
 * Covers fetch lifecycle, fallback logic, typed getters,
 * and the updateSetting write path.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useAppSettings } from "../useAppSettings";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal settings API response */
function makeSettingsResponse(
  settings: Record<string, { value: unknown; show_in_league_settings?: boolean }>
) {
  const mapped: Record<string, unknown> = {};
  for (const [key, cfg] of Object.entries(settings)) {
    mapped[key] = {
      key,
      value: cfg.value,
      label: key,
      category: "general",
      value_type: "string",
      show_in_league_settings: cfg.show_in_league_settings ?? false,
    };
  }
  return { settings: mapped };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.restoreAllMocks();
  global.fetch = vi.fn();
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useAppSettings", () => {
  // -----------------------------------------------------------------------
  // 1. Initial loading state
  // -----------------------------------------------------------------------
  it("starts in a loading state", () => {
    // Never resolve so we stay in loading
    vi.mocked(global.fetch).mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useAppSettings());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  // -----------------------------------------------------------------------
  // 2. Successful fetch populates settings
  // -----------------------------------------------------------------------
  it("populates settings after successful fetch", async () => {
    const payload = makeSettingsResponse({
      feature_high_fives: { value: true },
      max_batch_uploads: { value: "10" },
    });

    vi.mocked(global.fetch).mockResolvedValue(jsonResponse(payload));

    const { result } = renderHook(() => useAppSettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.settings).toHaveProperty("feature_high_fives");
    expect(result.current.settings).toHaveProperty("max_batch_uploads");
    expect(result.current.error).toBeNull();
  });

  // -----------------------------------------------------------------------
  // 3. getSetting returns default when key missing
  // -----------------------------------------------------------------------
  it("getSetting returns the default value for a missing key", async () => {
    const payload = makeSettingsResponse({});
    vi.mocked(global.fetch).mockResolvedValue(jsonResponse(payload));

    const { result } = renderHook(() => useAppSettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.getSetting("nonexistent_key", "fallback")).toBe(
      "fallback"
    );
  });

  // -----------------------------------------------------------------------
  // 4. getSetting returns value when key exists
  // -----------------------------------------------------------------------
  it("getSetting returns the stored value when the key exists", async () => {
    const payload = makeSettingsResponse({
      development_stage: { value: { stage: "beta", badge_visible: true } },
    });
    vi.mocked(global.fetch).mockResolvedValue(jsonResponse(payload));

    const { result } = renderHook(() => useAppSettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const stage = result.current.getSetting("development_stage", {
      stage: "alpha",
      badge_visible: false,
    });
    expect(stage).toEqual({ stage: "beta", badge_visible: true });
  });

  // -----------------------------------------------------------------------
  // 5. isFeatureEnabled returns false while loading
  // -----------------------------------------------------------------------
  it("isFeatureEnabled returns false while still loading", () => {
    vi.mocked(global.fetch).mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useAppSettings());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isFeatureEnabled("feature_high_fives" as any)).toBe(
      false
    );
  });

  // -----------------------------------------------------------------------
  // 6. isFeatureEnabled returns true for enabled features
  // -----------------------------------------------------------------------
  it("isFeatureEnabled returns true for an enabled boolean feature", async () => {
    const payload = makeSettingsResponse({
      feature_high_fives: { value: true },
    });
    vi.mocked(global.fetch).mockResolvedValue(jsonResponse(payload));

    const { result } = renderHook(() => useAppSettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isFeatureEnabled("feature_high_fives" as any)).toBe(
      true
    );
  });

  it('isFeatureEnabled treats the string "true" as enabled', async () => {
    const payload = makeSettingsResponse({
      feature_high_fives: { value: "true" },
    });
    vi.mocked(global.fetch).mockResolvedValue(jsonResponse(payload));

    const { result } = renderHook(() => useAppSettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isFeatureEnabled("feature_high_fives" as any)).toBe(
      true
    );
  });

  it("isFeatureEnabled returns false for a disabled feature", async () => {
    const payload = makeSettingsResponse({
      feature_high_fives: { value: false },
    });
    vi.mocked(global.fetch).mockResolvedValue(jsonResponse(payload));

    const { result } = renderHook(() => useAppSettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isFeatureEnabled("feature_high_fives" as any)).toBe(
      false
    );
  });

  // -----------------------------------------------------------------------
  // 7. getNumericSetting parses string numbers
  // -----------------------------------------------------------------------
  it("getNumericSetting parses a string number into an integer", async () => {
    const payload = makeSettingsResponse({
      max_batch_uploads: { value: "15" },
    });
    vi.mocked(global.fetch).mockResolvedValue(jsonResponse(payload));

    const { result } = renderHook(() => useAppSettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(
      result.current.getNumericSetting("max_batch_uploads" as any, 7)
    ).toBe(15);
  });

  it("getNumericSetting returns the default for non-numeric strings", async () => {
    const payload = makeSettingsResponse({
      max_batch_uploads: { value: "not-a-number" },
    });
    vi.mocked(global.fetch).mockResolvedValue(jsonResponse(payload));

    const { result } = renderHook(() => useAppSettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(
      result.current.getNumericSetting("max_batch_uploads" as any, 7)
    ).toBe(7);
  });

  it("getNumericSetting passes through actual numbers unchanged", async () => {
    const payload = makeSettingsResponse({
      max_batch_uploads: { value: 42 },
    });
    vi.mocked(global.fetch).mockResolvedValue(jsonResponse(payload));

    const { result } = renderHook(() => useAppSettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(
      result.current.getNumericSetting("max_batch_uploads" as any, 7)
    ).toBe(42);
  });

  // -----------------------------------------------------------------------
  // 8. Falls back to public endpoint on 401
  // -----------------------------------------------------------------------
  it("falls back to /api/settings/public when admin endpoint returns 401", async () => {
    const publicPayload = makeSettingsResponse({
      development_stage: { value: "beta" },
    });

    vi.mocked(global.fetch)
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(jsonResponse(publicPayload));

    const { result } = renderHook(() => useAppSettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Admin endpoint called first
    expect(vi.mocked(global.fetch).mock.calls[0][0]).toBe(
      "/api/admin/settings"
    );
    // Then the public fallback
    expect(vi.mocked(global.fetch).mock.calls[1][0]).toBe(
      "/api/settings/public"
    );

    expect(result.current.getSetting("development_stage", "alpha")).toBe(
      "beta"
    );
    expect(result.current.error).toBeNull();
  });

  // -----------------------------------------------------------------------
  // 9. Handles timeout (AbortError)
  // -----------------------------------------------------------------------
  it("handles AbortError from timeout gracefully", async () => {
    const abortError = new DOMException("The operation was aborted.", "AbortError");
    vi.mocked(global.fetch).mockRejectedValue(abortError);

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { result } = renderHook(() => useAppSettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Error is stored
    expect(result.current.error).toBeTruthy();
    expect(result.current.error.name).toBe("AbortError");

    // Data is set to empty so defaults work
    expect(result.current.settings).toEqual({});

    warnSpy.mockRestore();
  });

  // -----------------------------------------------------------------------
  // 10. Sets empty settings on error so defaults work
  // -----------------------------------------------------------------------
  it("sets empty settings on fetch error so getSetting defaults still work", async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error("Network failure"));

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useAppSettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // getSetting returns the provided default even after error
    expect(result.current.getSetting("any_key", "safe_default")).toBe(
      "safe_default"
    );
    expect(result.current.getNumericSetting("any_key" as any, 99)).toBe(99);
    expect(result.current.isFeatureEnabled("any_key" as any)).toBe(false);

    errorSpy.mockRestore();
  });

  // -----------------------------------------------------------------------
  // 11. getLeagueInheritedSettings filters correctly
  // -----------------------------------------------------------------------
  it("getLeagueInheritedSettings returns only settings with show_in_league_settings", async () => {
    const payload = makeSettingsResponse({
      max_batch_uploads: { value: "10", show_in_league_settings: true },
      feature_high_fives: { value: true, show_in_league_settings: false },
      default_daily_step_goal: { value: "8000", show_in_league_settings: true },
    });
    vi.mocked(global.fetch).mockResolvedValue(jsonResponse(payload));

    const { result } = renderHook(() => useAppSettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const leagueSettings = result.current.getLeagueInheritedSettings();
    expect(leagueSettings).toHaveLength(2);
    const keys = leagueSettings.map((s) => s.key);
    expect(keys).toContain("max_batch_uploads");
    expect(keys).toContain("default_daily_step_goal");
    expect(keys).not.toContain("feature_high_fives");
  });

  // -----------------------------------------------------------------------
  // 12. updateSetting PATCHes and reloads
  // -----------------------------------------------------------------------
  it("updateSetting sends a PATCH and reloads settings", async () => {
    const initialPayload = makeSettingsResponse({
      feature_high_fives: { value: false },
    });
    const updatedPayload = makeSettingsResponse({
      feature_high_fives: { value: true },
    });

    vi.mocked(global.fetch)
      // Initial load
      .mockResolvedValueOnce(jsonResponse(initialPayload))
      // PATCH response
      .mockResolvedValueOnce(jsonResponse({ success: true }))
      // Reload after update
      .mockResolvedValueOnce(jsonResponse(updatedPayload));

    const { result } = renderHook(() => useAppSettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isFeatureEnabled("feature_high_fives" as any)).toBe(
      false
    );

    await act(async () => {
      await result.current.updateSetting("feature_high_fives", true);
    });

    // Verify PATCH was called with correct args
    const patchCall = vi.mocked(global.fetch).mock.calls[1];
    expect(patchCall[0]).toBe("/api/admin/settings/feature_high_fives");
    expect(patchCall[1]).toMatchObject({
      method: "PATCH",
      body: JSON.stringify({ value: true }),
    });

    // Settings reloaded
    await waitFor(() => {
      expect(
        result.current.isFeatureEnabled("feature_high_fives" as any)
      ).toBe(true);
    });
  });
});
