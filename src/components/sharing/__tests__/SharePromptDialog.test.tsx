/**
 * SharePromptDialog Component Tests (PRD-57)
 *
 * Tests for the SharePromptDialog component.
 * Covers dialog behavior, share actions, analytics, and customization.
 *
 * Systems Thinking:
 * - Dialog should prompt users to share achievements
 * - Share actions should trigger analytics
 * - Customization should allow toggling content blocks
 *
 * Design Patterns:
 * - Controlled dialog pattern (open, onOpenChange)
 * - Analytics tracking on share
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SharePromptDialog } from "../SharePromptDialog";
import type { ShareMessageData, ShareContext } from "@/lib/sharing/shareContentConfig";
import { analytics } from "@/lib/analytics";

// ============================================================================
// Mocks
// ============================================================================

vi.mock("@/lib/analytics", () => ({
    analytics: {
        shareFunnel: {
            completed: vi.fn(),
            promptDismissed: vi.fn(),
        },
    },
}));

vi.mock("@/hooks/useShare", () => ({
    useShare: () => ({
        share: vi.fn().mockResolvedValue(undefined),
        isSharing: false,
        copied: false,
    }),
}));

vi.mock("@/hooks/use-toast", () => ({
    useToast: () => ({
        toast: vi.fn(),
    }),
}));

// Mock window.open for WhatsApp share
const mockWindowOpen = vi.fn();
Object.defineProperty(window, "open", {
    value: mockWindowOpen,
    writable: true,
});

// Mock clipboard API
Object.defineProperty(navigator, "clipboard", {
    value: {
        writeText: vi.fn().mockResolvedValue(undefined),
    },
    writable: true,
});

// ============================================================================
// Test Data Factories
// ============================================================================

const createBasicData = (overrides: Partial<ShareMessageData> = {}): ShareMessageData => ({
    totalSteps: 10000,
    dayCount: 5,
    startDate: "2026-01-15",
    endDate: "2026-01-19",
    averageSteps: 2000,
    ...overrides,
});

const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    data: createBasicData(),
    context: "batch_submission" as ShareContext,
};

// ============================================================================
// Rendering Tests
// ============================================================================

describe("SharePromptDialog", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("rendering", () => {
        it("renders when open is true", () => {
            render(<SharePromptDialog {...defaultProps} />);

            expect(screen.getByText("Submission Complete!")).toBeInTheDocument();
        });

        it("does not render when open is false", () => {
            render(<SharePromptDialog {...defaultProps} open={false} />);

            expect(screen.queryByText("Submission Complete!")).not.toBeInTheDocument();
        });

        it("displays celebration emoji", () => {
            render(<SharePromptDialog {...defaultProps} />);

            expect(screen.getByText("🎉")).toBeInTheDocument();
        });

        it("displays custom title when provided", () => {
            render(<SharePromptDialog {...defaultProps} title="Great Job!" />);

            expect(screen.getByText("Great Job!")).toBeInTheDocument();
        });

        it("displays custom emoji when provided", () => {
            render(<SharePromptDialog {...defaultProps} emoji="🏆" />);

            expect(screen.getByText("🏆")).toBeInTheDocument();
        });

        it("displays stats summary", () => {
            render(<SharePromptDialog {...defaultProps} />);

            // Should show steps and days (locale-agnostic)
            expect(screen.getByText(/10.?000 steps/)).toBeInTheDocument();
            expect(screen.getByText(/5 days/)).toBeInTheDocument();
        });
    });

    describe("share buttons", () => {
        it("renders WhatsApp share button", () => {
            render(<SharePromptDialog {...defaultProps} />);

            expect(screen.getByRole("button", { name: /share on whatsapp/i })).toBeInTheDocument();
        });

        it("renders Copy button", () => {
            render(<SharePromptDialog {...defaultProps} />);

            expect(screen.getByRole("button", { name: /copy/i })).toBeInTheDocument();
        });

        it("renders Maybe Later button", () => {
            render(<SharePromptDialog {...defaultProps} />);

            expect(screen.getByRole("button", { name: /maybe later/i })).toBeInTheDocument();
        });
    });

    describe("customization toggle", () => {
        it("renders customize button", () => {
            render(<SharePromptDialog {...defaultProps} />);

            expect(screen.getByRole("button", { name: /customize what to share/i })).toBeInTheDocument();
        });

        it("shows content picker when customize is clicked", () => {
            render(<SharePromptDialog {...defaultProps} />);

            const customizeBtn = screen.getByRole("button", { name: /customize what to share/i });
            fireEvent.click(customizeBtn);

            // Should show preview section
            expect(screen.getByText("Preview")).toBeInTheDocument();
        });

        it("shows character count in preview", () => {
            render(<SharePromptDialog {...defaultProps} />);

            const customizeBtn = screen.getByRole("button", { name: /customize what to share/i });
            fireEvent.click(customizeBtn);

            // Should show character count
            expect(screen.getByText(/\d+ chars/)).toBeInTheDocument();
        });
    });

    describe("dialog actions", () => {
        it("calls onOpenChange with false when Maybe Later is clicked", () => {
            const onOpenChange = vi.fn();
            render(<SharePromptDialog {...defaultProps} onOpenChange={onOpenChange} />);

            const maybeLaterBtn = screen.getByRole("button", { name: /maybe later/i });
            fireEvent.click(maybeLaterBtn);

            expect(onOpenChange).toHaveBeenCalledWith(false);
        });

        it("calls onDismiss when Maybe Later is clicked", () => {
            const onDismiss = vi.fn();
            render(<SharePromptDialog {...defaultProps} onDismiss={onDismiss} />);

            const maybeLaterBtn = screen.getByRole("button", { name: /maybe later/i });
            fireEvent.click(maybeLaterBtn);

            expect(onDismiss).toHaveBeenCalled();
        });
    });

    describe("analytics tracking", () => {
        it("tracks prompt dismissed when Maybe Later is clicked", () => {
            render(<SharePromptDialog {...defaultProps} />);

            const maybeLaterBtn = screen.getByRole("button", { name: /maybe later/i });
            fireEvent.click(maybeLaterBtn);

            expect(analytics.shareFunnel.promptDismissed).toHaveBeenCalledWith("batch_submission");
        });
    });

    describe("date range display", () => {
        it("displays date range when start and end dates provided", () => {
            render(<SharePromptDialog {...defaultProps} />);

            // Should show date range
            expect(screen.getByText(/Jan/)).toBeInTheDocument();
        });

        it("displays single date when start and end are same", () => {
            const data = createBasicData({
                startDate: "2026-01-15",
                endDate: "2026-01-15",
            });
            render(<SharePromptDialog {...defaultProps} data={data} />);

            // Should show single date
            expect(screen.getByText(/15 Jan 2026/)).toBeInTheDocument();
        });

        it("displays average when provided", () => {
            render(<SharePromptDialog {...defaultProps} />);

            // Should show average (locale-agnostic)
            expect(screen.getByText(/2.?000 steps\/day/)).toBeInTheDocument();
        });
    });

    describe("context-based defaults", () => {
        it("uses batch_submission defaults", () => {
            render(
                <SharePromptDialog
                    {...defaultProps}
                    context="batch_submission"
                />
            );

            // Should render without errors using batch_submission defaults
            expect(screen.getByText("Submission Complete!")).toBeInTheDocument();
        });

        it("uses league_rank defaults for league context", () => {
            const data = createBasicData({
                rank: 3,
                leagueName: "Family Steps",
            });
            render(
                <SharePromptDialog
                    {...defaultProps}
                    data={data}
                    context="league_rank"
                />
            );

            expect(screen.getByText("Submission Complete!")).toBeInTheDocument();
        });
    });
});

// ============================================================================
// Negative Tests
// ============================================================================

describe("Negative Tests", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("missing data", () => {
        it("handles missing totalSteps gracefully", () => {
            const data: ShareMessageData = { dayCount: 5 };
            render(<SharePromptDialog {...defaultProps} data={data} />);

            // Should render without crashing
            expect(screen.getByText("Submission Complete!")).toBeInTheDocument();
        });

        it("handles empty data object", () => {
            const data: ShareMessageData = {};
            render(<SharePromptDialog {...defaultProps} data={data} />);

            // Should render without crashing
            expect(screen.getByText("Submission Complete!")).toBeInTheDocument();
        });

        it("handles missing date range", () => {
            const data = createBasicData({
                startDate: undefined,
                endDate: undefined,
            });
            render(<SharePromptDialog {...defaultProps} data={data} />);

            // Should render without date range
            expect(screen.getByText("Submission Complete!")).toBeInTheDocument();
        });
    });

    describe("edge cases", () => {
        it("handles zero totalSteps", () => {
            const data = createBasicData({ totalSteps: 0 });
            render(<SharePromptDialog {...defaultProps} data={data} />);

            // Should contain 0 steps in the description
            const description = screen.getByText(/0 steps across/);
            expect(description).toBeInTheDocument();
        });

        it("handles single day submission", () => {
            const data = createBasicData({ dayCount: 1 });
            render(<SharePromptDialog {...defaultProps} data={data} />);

            expect(screen.getByText(/1 day/)).toBeInTheDocument();
        });

        it("handles very large numbers", () => {
            const data = createBasicData({ totalSteps: 999999999 });
            render(<SharePromptDialog {...defaultProps} data={data} />);

            expect(screen.getByText(/999/)).toBeInTheDocument();
        });
    });

    describe("callback handling", () => {
        it("handles missing onShare callback", () => {
            render(
                <SharePromptDialog
                    {...defaultProps}
                    onShare={undefined}
                />
            );

            // Should render and function without onShare
            expect(screen.getByText("Submission Complete!")).toBeInTheDocument();
        });

        it("handles missing onDismiss callback", () => {
            render(
                <SharePromptDialog
                    {...defaultProps}
                    onDismiss={undefined}
                />
            );

            const maybeLaterBtn = screen.getByRole("button", { name: /maybe later/i });
            fireEvent.click(maybeLaterBtn);

            // Should not crash
            expect(defaultProps.onOpenChange).toHaveBeenCalled();
        });
    });
});

// ============================================================================
// Accessibility Tests
// ============================================================================

describe("Accessibility", () => {
    it("has accessible dialog title", () => {
        render(<SharePromptDialog {...defaultProps} />);

        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Submission Complete!" })).toBeInTheDocument();
    });

    it("has accessible buttons", () => {
        render(<SharePromptDialog {...defaultProps} />);

        expect(screen.getByRole("button", { name: /share on whatsapp/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /copy/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /maybe later/i })).toBeInTheDocument();
    });
});
