/**
 * useShare Hook Tests
 *
 * Tests for the social sharing hook covering native share,
 * WhatsApp, X/Twitter, clipboard copy, analytics tracking,
 * and callback behaviour.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// Mock analytics before importing the hook
vi.mock("@/lib/analytics", () => ({
  analytics: {
    share: vi.fn(),
  },
}));

// Mock APP_CONFIG
vi.mock("@/lib/config", () => ({
  APP_CONFIG: {
    name: "StepLeague",
    domain: "stepleague.app",
    url: "https://stepleague.app",
  },
}));

import { useShare, type SharePlatform } from "../useShare";
import { analytics } from "@/lib/analytics";

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

let windowOpenSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.restoreAllMocks();
  vi.mocked(analytics.share).mockClear();

  // Default: navigator.share NOT supported
  Object.defineProperty(navigator, "share", {
    value: undefined,
    writable: true,
    configurable: true,
  });

  // Mock clipboard
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    writable: true,
    configurable: true,
  });

  // Mock window.open
  windowOpenSpy = vi.fn();
  vi.stubGlobal("open", windowOpenSpy);

  // Mock window.location.href for URL fallback
  Object.defineProperty(window, "location", {
    value: { href: "https://stepleague.app/test" },
    writable: true,
    configurable: true,
  });

  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useShare", () => {
  // -----------------------------------------------------------------------
  // 1. Initial state
  // -----------------------------------------------------------------------
  it("has correct initial state", () => {
    const { result } = renderHook(() => useShare());

    expect(result.current.isSharing).toBe(false);
    expect(result.current.copied).toBe(false);
    expect(typeof result.current.share).toBe("function");
  });

  // -----------------------------------------------------------------------
  // 2. Copy to clipboard sets copied=true then resets after 2s
  // -----------------------------------------------------------------------
  it('copy platform writes to clipboard and resets copied after 2 seconds', async () => {
    const { result } = renderHook(() => useShare());

    await act(async () => {
      await result.current.share(
        { text: "Check this out!", url: "https://stepleague.app" },
        "copy"
      );
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining("Check this out!")
    );
    expect(result.current.copied).toBe(true);

    // Advance timers by 2 seconds
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.copied).toBe(false);
  });

  // -----------------------------------------------------------------------
  // 3. WhatsApp opens correct URL
  // -----------------------------------------------------------------------
  it("whatsapp platform opens wa.me with encoded message", async () => {
    const { result } = renderHook(() => useShare());

    await act(async () => {
      await result.current.share(
        { text: "Join my league!", url: "https://stepleague.app/invite/abc" },
        "whatsapp"
      );
    });

    expect(windowOpenSpy).toHaveBeenCalledTimes(1);
    const openedUrl = windowOpenSpy.mock.calls[0][0] as string;
    expect(openedUrl).toContain("https://wa.me/?text=");
    expect(openedUrl).toContain(encodeURIComponent("Join my league!"));
    expect(openedUrl).toContain(
      encodeURIComponent("https://stepleague.app/invite/abc")
    );
  });

  // -----------------------------------------------------------------------
  // 4. X/Twitter opens correct URL
  // -----------------------------------------------------------------------
  it("x platform opens twitter intent URL with text and url params", async () => {
    const { result } = renderHook(() => useShare());

    await act(async () => {
      await result.current.share(
        { text: "I walked 10k steps!", url: "https://stepleague.app/share" },
        "x"
      );
    });

    expect(windowOpenSpy).toHaveBeenCalledTimes(1);
    const openedUrl = windowOpenSpy.mock.calls[0][0] as string;
    expect(openedUrl).toContain("https://twitter.com/intent/tweet");
    expect(openedUrl).toContain(
      `text=${encodeURIComponent("I walked 10k steps!")}`
    );
    expect(openedUrl).toContain(
      `url=${encodeURIComponent("https://stepleague.app/share")}`
    );
  });

  // -----------------------------------------------------------------------
  // 5. Native share calls navigator.share
  // -----------------------------------------------------------------------
  it("native platform calls navigator.share when supported", async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", {
      value: shareMock,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useShare());

    await act(async () => {
      await result.current.share(
        {
          title: "My Achievement",
          text: "I hit a new record!",
          url: "https://stepleague.app/achievement/1",
        },
        "native"
      );
    });

    expect(shareMock).toHaveBeenCalledWith({
      title: "My Achievement",
      text: "I hit a new record!",
      url: "https://stepleague.app/achievement/1",
    });
  });

  // -----------------------------------------------------------------------
  // 6. Native share falls back to clipboard when not supported
  // -----------------------------------------------------------------------
  it("native platform falls back to clipboard when navigator.share is absent", async () => {
    // navigator.share is already undefined from beforeEach
    const { result } = renderHook(() => useShare());

    await act(async () => {
      await result.current.share(
        { text: "Fallback text", url: "https://stepleague.app" },
        "native"
      );
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    expect(result.current.copied).toBe(true);
  });

  // -----------------------------------------------------------------------
  // 7. Calls onShare callback
  // -----------------------------------------------------------------------
  it("invokes the onShare callback with the platform", async () => {
    const onShare = vi.fn();
    const { result } = renderHook(() => useShare({ onShare }));

    await act(async () => {
      await result.current.share(
        { text: "shared", url: "https://stepleague.app" },
        "whatsapp"
      );
    });

    expect(onShare).toHaveBeenCalledWith("whatsapp");
  });

  it("native fallback to copy calls onShare with 'copy' instead of 'native'", async () => {
    const onShare = vi.fn();
    const { result } = renderHook(() => useShare({ onShare }));

    await act(async () => {
      await result.current.share(
        { text: "test", url: "https://stepleague.app" },
        "native"
      );
    });

    // When native is not supported, onShare receives "copy"
    expect(onShare).toHaveBeenCalledWith("copy");
  });

  // -----------------------------------------------------------------------
  // 8. Calls onError on failure
  // -----------------------------------------------------------------------
  it("invokes onError when sharing fails", async () => {
    const shareError = new Error("User cancelled");
    const shareMock = vi.fn().mockRejectedValue(shareError);
    Object.defineProperty(navigator, "share", {
      value: shareMock,
      writable: true,
      configurable: true,
    });

    const onError = vi.fn();
    const { result } = renderHook(() => useShare({ onError }));

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await act(async () => {
      await result.current.share(
        { text: "will fail", url: "https://stepleague.app" },
        "native"
      );
    });

    expect(onError).toHaveBeenCalledWith(shareError);

    errorSpy.mockRestore();
  });

  // -----------------------------------------------------------------------
  // 9. Tracks analytics when contentType provided
  // -----------------------------------------------------------------------
  it("tracks analytics.share when contentType is provided", async () => {
    const { result } = renderHook(() =>
      useShare({ contentType: "achievement", itemId: "ach-42" })
    );

    await act(async () => {
      await result.current.share(
        { text: "New badge!", url: "https://stepleague.app" },
        "whatsapp"
      );
    });

    expect(analytics.share).toHaveBeenCalledWith(
      "achievement",
      "ach-42",
      "whatsapp"
    );
  });

  it("does not track analytics when contentType is not provided", async () => {
    const { result } = renderHook(() => useShare());

    await act(async () => {
      await result.current.share(
        { text: "No tracking", url: "https://stepleague.app" },
        "copy"
      );
    });

    expect(analytics.share).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // 10. isSharing resets after share completes
  // -----------------------------------------------------------------------
  it("resets isSharing to false after the share completes", async () => {
    const { result } = renderHook(() => useShare());

    await act(async () => {
      await result.current.share(
        { text: "Done", url: "https://stepleague.app" },
        "copy"
      );
    });

    expect(result.current.isSharing).toBe(false);
  });

  // -----------------------------------------------------------------------
  // 11. URL not duplicated when already in message text
  // -----------------------------------------------------------------------
  it("does not append URL when text already contains stepleague.app", async () => {
    const { result } = renderHook(() => useShare());

    await act(async () => {
      await result.current.share(
        {
          text: "Check stepleague.app/my-page for my steps!",
          url: "https://stepleague.app/my-page",
        },
        "copy"
      );
    });

    // The clipboard should receive the original text WITHOUT url appended
    const written = vi.mocked(navigator.clipboard.writeText).mock.calls[0][0];
    expect(written).toBe("Check stepleague.app/my-page for my steps!");
  });
});
