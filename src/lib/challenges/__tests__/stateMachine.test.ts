/**
 * Challenge State Machine Tests (PRD-54)
 */

import { describe, it, expect } from "vitest";
import {
    canTransition,
    getNextState,
    transition,
    getValidEvents,
    isTerminalState,
    isActiveState,
    isPendingState,
    canUserPerformEvent,
    STATUS_LABELS,
    EVENT_LABELS,
} from "../stateMachine";
import type { ChallengeStatus, ChallengeEvent } from "../types";

// ============================================================================
// State Transition Tests
// ============================================================================

describe("canTransition", () => {
    it("allows valid transitions from pending", () => {
        expect(canTransition("pending", "accept")).toBe(true);
        expect(canTransition("pending", "decline")).toBe(true);
        expect(canTransition("pending", "cancel")).toBe(true);
        expect(canTransition("pending", "expire")).toBe(true);
    });

    it("disallows invalid transitions from pending", () => {
        expect(canTransition("pending", "complete")).toBe(false);
    });

    it("allows valid transitions from accepted", () => {
        expect(canTransition("accepted", "complete")).toBe(true);
        expect(canTransition("accepted", "cancel")).toBe(true);
    });

    it("disallows invalid transitions from accepted", () => {
        expect(canTransition("accepted", "accept")).toBe(false);
        expect(canTransition("accepted", "decline")).toBe(false);
        expect(canTransition("accepted", "expire")).toBe(false);
    });

    it("disallows all transitions from terminal states", () => {
        const terminalStates: ChallengeStatus[] = ["declined", "completed", "cancelled", "expired"];
        const allEvents: ChallengeEvent[] = ["accept", "decline", "cancel", "complete", "expire"];

        for (const state of terminalStates) {
            for (const event of allEvents) {
                expect(canTransition(state, event)).toBe(false);
            }
        }
    });
});

describe("getNextState", () => {
    it("returns correct next state for valid transitions", () => {
        expect(getNextState("pending", "accept")).toBe("accepted");
        expect(getNextState("pending", "decline")).toBe("declined");
        expect(getNextState("pending", "cancel")).toBe("cancelled");
        expect(getNextState("pending", "expire")).toBe("expired");
        expect(getNextState("accepted", "complete")).toBe("completed");
        expect(getNextState("accepted", "cancel")).toBe("cancelled");
    });

    it("returns null for invalid transitions", () => {
        expect(getNextState("pending", "complete")).toBeNull();
        expect(getNextState("accepted", "accept")).toBeNull();
        expect(getNextState("completed", "cancel")).toBeNull();
    });
});

describe("transition", () => {
    it("returns next state for valid transitions", () => {
        expect(transition("pending", "accept")).toBe("accepted");
        expect(transition("accepted", "complete")).toBe("completed");
    });

    it("throws for invalid transitions", () => {
        expect(() => transition("pending", "complete")).toThrow();
        expect(() => transition("completed", "cancel")).toThrow();
    });
});

describe("getValidEvents", () => {
    it("returns valid events for pending state", () => {
        const events = getValidEvents("pending");
        expect(events).toContain("accept");
        expect(events).toContain("decline");
        expect(events).toContain("cancel");
        expect(events).toContain("expire");
    });

    it("returns valid events for accepted state", () => {
        const events = getValidEvents("accepted");
        expect(events).toContain("complete");
        expect(events).toContain("cancel");
        expect(events).not.toContain("accept");
    });

    it("returns empty array for terminal states", () => {
        expect(getValidEvents("completed")).toHaveLength(0);
        expect(getValidEvents("declined")).toHaveLength(0);
        expect(getValidEvents("cancelled")).toHaveLength(0);
        expect(getValidEvents("expired")).toHaveLength(0);
    });
});

// ============================================================================
// State Type Tests
// ============================================================================

describe("isTerminalState", () => {
    it("returns true for terminal states", () => {
        expect(isTerminalState("completed")).toBe(true);
        expect(isTerminalState("declined")).toBe(true);
        expect(isTerminalState("cancelled")).toBe(true);
        expect(isTerminalState("expired")).toBe(true);
    });

    it("returns false for non-terminal states", () => {
        expect(isTerminalState("pending")).toBe(false);
        expect(isTerminalState("accepted")).toBe(false);
    });
});

describe("isActiveState", () => {
    it("returns true only for accepted state", () => {
        expect(isActiveState("accepted")).toBe(true);
    });

    it("returns false for other states", () => {
        expect(isActiveState("pending")).toBe(false);
        expect(isActiveState("completed")).toBe(false);
        expect(isActiveState("declined")).toBe(false);
    });
});

describe("isPendingState", () => {
    it("returns true only for pending state", () => {
        expect(isPendingState("pending")).toBe(true);
    });

    it("returns false for other states", () => {
        expect(isPendingState("accepted")).toBe(false);
        expect(isPendingState("completed")).toBe(false);
    });
});

// ============================================================================
// Authorization Tests
// ============================================================================

describe("canUserPerformEvent", () => {
    const challenger = "user-1";
    const target = "user-2";
    const other = "user-3";

    it("allows only target to accept", () => {
        expect(canUserPerformEvent("accept", target, challenger, target)).toBe(true);
        expect(canUserPerformEvent("accept", challenger, challenger, target)).toBe(false);
        expect(canUserPerformEvent("accept", other, challenger, target)).toBe(false);
    });

    it("allows only target to decline", () => {
        expect(canUserPerformEvent("decline", target, challenger, target)).toBe(true);
        expect(canUserPerformEvent("decline", challenger, challenger, target)).toBe(false);
        expect(canUserPerformEvent("decline", other, challenger, target)).toBe(false);
    });

    it("allows both participants to cancel", () => {
        expect(canUserPerformEvent("cancel", challenger, challenger, target)).toBe(true);
        expect(canUserPerformEvent("cancel", target, challenger, target)).toBe(true);
        expect(canUserPerformEvent("cancel", other, challenger, target)).toBe(false);
    });

    it("disallows system events for all users", () => {
        expect(canUserPerformEvent("complete", challenger, challenger, target)).toBe(false);
        expect(canUserPerformEvent("complete", target, challenger, target)).toBe(false);
        expect(canUserPerformEvent("expire", challenger, challenger, target)).toBe(false);
        expect(canUserPerformEvent("expire", target, challenger, target)).toBe(false);
    });
});

// ============================================================================
// Labels Tests
// ============================================================================

describe("STATUS_LABELS", () => {
    it("has labels for all states", () => {
        const states: ChallengeStatus[] = ["pending", "accepted", "declined", "completed", "cancelled", "expired"];
        for (const state of states) {
            expect(STATUS_LABELS[state]).toBeDefined();
            expect(typeof STATUS_LABELS[state]).toBe("string");
        }
    });
});

describe("EVENT_LABELS", () => {
    it("has labels for all events", () => {
        const events: ChallengeEvent[] = ["accept", "decline", "cancel", "complete", "expire"];
        for (const event of events) {
            expect(EVENT_LABELS[event]).toBeDefined();
            expect(typeof EVENT_LABELS[event]).toBe("string");
        }
    });
});
