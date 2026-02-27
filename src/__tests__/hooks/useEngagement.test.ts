import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useEngagement } from "@/hooks/useEngagement";

// Mock sessionStorage
const mockStorage: Record<string, string> = {};
beforeEach(() => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(
        (key) => mockStorage[key] ?? null
    );
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(
        (key, value) => { mockStorage[key] = value; }
    );
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe("useEngagement", () => {
    it("detects missed yesterday when hasSubmittedYesterday is false", () => {
        const { result } = renderHook(() =>
            useEngagement({
                hasSubmittedToday: true,
                hasSubmittedYesterday: false,
                currentStreak: 3,
            })
        );

        expect(result.current.missedYesterday).toBe(true);
    });

    it("does not flag missed yesterday when hasSubmittedYesterday is true", () => {
        const { result } = renderHook(() =>
            useEngagement({
                hasSubmittedToday: true,
                hasSubmittedYesterday: true,
                currentStreak: 5,
            })
        );

        expect(result.current.missedYesterday).toBe(false);
    });

    it("detects streak at risk when evening + no today + active streak", () => {
        // Force "evening" by setting eveningHour to 0 (always evening)
        const { result } = renderHook(() =>
            useEngagement({
                hasSubmittedToday: false,
                hasSubmittedYesterday: true,
                currentStreak: 7,
                eveningHour: 0, // hour >= 0 is always true
            })
        );

        expect(result.current.streakAtRisk).toBe(true);
        expect(result.current.currentStreak).toBe(7);
    });

    it("streak not at risk when already submitted today", () => {
        const { result } = renderHook(() =>
            useEngagement({
                hasSubmittedToday: true,
                hasSubmittedYesterday: true,
                currentStreak: 7,
                eveningHour: 0,
            })
        );

        expect(result.current.streakAtRisk).toBe(false);
    });

    it("streak not at risk when streak is 0 (no streak to protect)", () => {
        const { result } = renderHook(() =>
            useEngagement({
                hasSubmittedToday: false,
                hasSubmittedYesterday: false,
                currentStreak: 0,
                eveningHour: 0,
            })
        );

        expect(result.current.streakAtRisk).toBe(false);
    });

    it("streak not at risk before evening hour", () => {
        const { result } = renderHook(() =>
            useEngagement({
                hasSubmittedToday: false,
                hasSubmittedYesterday: true,
                currentStreak: 5,
                eveningHour: 25, // hour >= 25 is never true
            })
        );

        expect(result.current.streakAtRisk).toBe(false);
    });

    it("returns yesterday's date as missedDate", () => {
        const { result } = renderHook(() =>
            useEngagement({
                hasSubmittedToday: false,
                hasSubmittedYesterday: false,
                currentStreak: 0,
            })
        );

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const expected = yesterday.toISOString().slice(0, 10);
        expect(result.current.missedDate).toBe(expected);
    });

    it("dismiss persists key to sessionStorage", () => {
        const { result } = renderHook(() =>
            useEngagement({
                hasSubmittedToday: false,
                hasSubmittedYesterday: false,
                currentStreak: 0,
            })
        );

        expect(result.current.dismissed.has("missed_day")).toBe(false);

        act(() => {
            result.current.dismiss("missed_day");
        });

        expect(result.current.dismissed.has("missed_day")).toBe(true);
        expect(mockStorage["scl_engagement_dismissed"]).toContain("missed_day");
    });

    it("restores dismissed state from sessionStorage on init", () => {
        mockStorage["scl_engagement_dismissed"] = JSON.stringify(["streak_warning"]);

        const { result } = renderHook(() =>
            useEngagement({
                hasSubmittedToday: false,
                hasSubmittedYesterday: false,
                currentStreak: 0,
            })
        );

        expect(result.current.dismissed.has("streak_warning")).toBe(true);
    });
});
