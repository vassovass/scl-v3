/**
 * ShareContentPicker Component Tests (PRD-57)
 *
 * Tests for the ShareContentPicker and ShareContentPickerInline components.
 * Covers selection behavior, category grouping, and availability states.
 *
 * Systems Thinking:
 * - Users can customize which blocks to include in share messages
 * - Blocks should be grouped by category
 * - Unavailable blocks should be disabled
 *
 * Design Patterns:
 * - Controlled component pattern (selectedBlocks, onChange)
 * - Category grouping for organization
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ShareContentPicker, ShareContentPickerInline } from "../ShareContentPicker";
import type { ShareContentBlock, ShareMessageData } from "@/lib/sharing/shareContentConfig";

// ============================================================================
// Test Data Factories
// ============================================================================

const createBasicData = (): ShareMessageData => ({
    totalSteps: 10000,
    dayCount: 5,
    startDate: "2026-01-15",
    endDate: "2026-01-19",
    averageSteps: 2000,
});

const createFullData = (): ShareMessageData => ({
    totalSteps: 50000,
    dayCount: 7,
    startDate: "2026-01-15",
    endDate: "2026-01-21",
    averageSteps: 7142,
    dailyBreakdown: [
        { date: "2026-01-15", steps: 8000 },
        { date: "2026-01-16", steps: 9000, isBestDay: true },
    ],
    bestDaySteps: 9000,
    bestDayDate: "2026-01-16",
    currentStreak: 14,
    rank: 3,
    totalMembers: 10,
    leagueName: "Family Steps",
    leagueAverage: 6000,
    previousPeriodSteps: 40000,
    improvementPercent: 25,
});

// ============================================================================
// ShareContentPicker Tests
// ============================================================================

describe("ShareContentPicker", () => {
    describe("rendering", () => {
        it("renders category sections", () => {
            const onChange = vi.fn();
            render(
                <ShareContentPicker
                    selectedBlocks={["total_steps"]}
                    onChange={onChange}
                    availableData={createBasicData()}
                />
            );

            expect(screen.getByText("Basic Stats")).toBeInTheDocument();
            expect(screen.getByText("Detailed Stats")).toBeInTheDocument();
            expect(screen.getByText("Comparisons")).toBeInTheDocument();
        });

        it("renders select all and clear buttons", () => {
            const onChange = vi.fn();
            render(
                <ShareContentPicker
                    selectedBlocks={["total_steps"]}
                    onChange={onChange}
                    availableData={createBasicData()}
                />
            );

            expect(screen.getByText("Select all")).toBeInTheDocument();
            expect(screen.getByText("Clear")).toBeInTheDocument();
        });

        it("shows selection count", () => {
            const onChange = vi.fn();
            render(
                <ShareContentPicker
                    selectedBlocks={["total_steps", "day_count"]}
                    onChange={onChange}
                    availableData={createBasicData()}
                />
            );

            expect(screen.getByText(/2 of \d+ selected/)).toBeInTheDocument();
        });

        it("renders block labels with emojis", () => {
            const onChange = vi.fn();
            render(
                <ShareContentPicker
                    selectedBlocks={[]}
                    onChange={onChange}
                    availableData={createFullData()}
                />
            );

            expect(screen.getByText("Total Steps")).toBeInTheDocument();
            expect(screen.getByText("Days Logged")).toBeInTheDocument();
            expect(screen.getByText("Daily Average")).toBeInTheDocument();
        });
    });

    describe("block selection", () => {
        it("calls onChange when block is checked", () => {
            const onChange = vi.fn();
            render(
                <ShareContentPicker
                    selectedBlocks={[]}
                    onChange={onChange}
                    availableData={createBasicData()}
                />
            );

            const checkbox = screen.getByRole("checkbox", { name: /total steps/i });
            fireEvent.click(checkbox);

            expect(onChange).toHaveBeenCalled();
            expect(onChange).toHaveBeenCalledWith(expect.arrayContaining(["total_steps"]));
        });

        it("calls onChange when block is unchecked", () => {
            const onChange = vi.fn();
            render(
                <ShareContentPicker
                    selectedBlocks={["total_steps", "day_count"]}
                    onChange={onChange}
                    availableData={createBasicData()}
                />
            );

            const checkbox = screen.getByRole("checkbox", { name: /total steps/i });
            fireEvent.click(checkbox);

            expect(onChange).toHaveBeenCalled();
            // Should remove total_steps from selection
            const callArg = onChange.mock.calls[0][0];
            expect(callArg).not.toContain("total_steps");
        });

        it("select all selects only available blocks", () => {
            const onChange = vi.fn();
            render(
                <ShareContentPicker
                    selectedBlocks={[]}
                    onChange={onChange}
                    availableData={createBasicData()} // Limited data
                />
            );

            const selectAllBtn = screen.getByText("Select all");
            fireEvent.click(selectAllBtn);

            expect(onChange).toHaveBeenCalled();
            // Should only select blocks that are available
            const callArg = onChange.mock.calls[0][0] as ShareContentBlock[];
            expect(callArg).toContain("total_steps");
            expect(callArg).toContain("day_count");
            // streak should not be available with basic data
            expect(callArg).not.toContain("streak");
        });

        it("clear removes all selections", () => {
            const onChange = vi.fn();
            render(
                <ShareContentPicker
                    selectedBlocks={["total_steps", "day_count"]}
                    onChange={onChange}
                    availableData={createBasicData()}
                />
            );

            const clearBtn = screen.getByText("Clear");
            fireEvent.click(clearBtn);

            expect(onChange).toHaveBeenCalledWith([]);
        });
    });

    describe("availability states", () => {
        it("disables blocks when data is not available", () => {
            const onChange = vi.fn();
            render(
                <ShareContentPicker
                    selectedBlocks={[]}
                    onChange={onChange}
                    availableData={{ totalSteps: 10000 }} // Only totalSteps
                />
            );

            // streak checkbox should be disabled
            const streakCheckbox = screen.getByRole("checkbox", { name: /current streak/i });
            expect(streakCheckbox).toBeDisabled();
        });

        it("enables blocks when data is available", () => {
            const onChange = vi.fn();
            render(
                <ShareContentPicker
                    selectedBlocks={[]}
                    onChange={onChange}
                    availableData={createFullData()}
                />
            );

            const streakCheckbox = screen.getByRole("checkbox", { name: /current streak/i });
            expect(streakCheckbox).not.toBeDisabled();
        });
    });

    describe("dependency handling", () => {
        it("auto-adds required dependencies when selecting a block", () => {
            const onChange = vi.fn();
            render(
                <ShareContentPicker
                    selectedBlocks={[]}
                    onChange={onChange}
                    availableData={createFullData()}
                />
            );

            // league_name requires rank
            const leagueNameCheckbox = screen.getByRole("checkbox", { name: /league name/i });
            fireEvent.click(leagueNameCheckbox);

            expect(onChange).toHaveBeenCalled();
            const callArg = onChange.mock.calls[0][0] as ShareContentBlock[];
            expect(callArg).toContain("league_name");
            expect(callArg).toContain("rank"); // Should auto-add dependency
        });

        it("removes dependent blocks when removing required block", () => {
            const onChange = vi.fn();
            render(
                <ShareContentPicker
                    selectedBlocks={["rank", "league_name"]}
                    onChange={onChange}
                    availableData={createFullData()}
                />
            );

            // Remove rank, which is required by league_name
            const rankCheckbox = screen.getByRole("checkbox", { name: /league rank/i });
            fireEvent.click(rankCheckbox);

            expect(onChange).toHaveBeenCalled();
            const callArg = onChange.mock.calls[0][0] as ShareContentBlock[];
            expect(callArg).not.toContain("rank");
            expect(callArg).not.toContain("league_name"); // Should also be removed
        });
    });

    describe("compact mode", () => {
        it("hides descriptions in compact mode", () => {
            const onChange = vi.fn();
            render(
                <ShareContentPicker
                    selectedBlocks={[]}
                    onChange={onChange}
                    availableData={createFullData()}
                    compact={true}
                />
            );

            // Description text should not be visible
            expect(screen.queryByText("Show total steps for the period")).not.toBeInTheDocument();
        });

        it("shows descriptions in normal mode", () => {
            const onChange = vi.fn();
            render(
                <ShareContentPicker
                    selectedBlocks={[]}
                    onChange={onChange}
                    availableData={createFullData()}
                    compact={false}
                />
            );

            // Description text should be visible
            expect(screen.getByText("Show total steps for the period")).toBeInTheDocument();
        });
    });

    describe("hideEmptyCategories option", () => {
        it("shows empty categories by default", () => {
            const onChange = vi.fn();
            render(
                <ShareContentPicker
                    selectedBlocks={[]}
                    onChange={onChange}
                    availableData={{ totalSteps: 10000 }} // Only basic data
                    hideEmptyCategories={false}
                />
            );

            // Comparison category should still show
            expect(screen.getByText("Comparisons")).toBeInTheDocument();
        });

        it("hides categories with no available blocks when hideEmptyCategories is true", () => {
            const onChange = vi.fn();
            render(
                <ShareContentPicker
                    selectedBlocks={[]}
                    onChange={onChange}
                    availableData={{ totalSteps: 10000 }} // Only basic data
                    hideEmptyCategories={true}
                />
            );

            // Comparison category should be hidden (no comparison data)
            expect(screen.queryByText("Comparisons")).not.toBeInTheDocument();
        });
    });
});

// ============================================================================
// ShareContentPickerInline Tests
// ============================================================================

describe("ShareContentPickerInline", () => {
    describe("rendering", () => {
        it("renders pill-style buttons", () => {
            const onChange = vi.fn();
            render(
                <ShareContentPickerInline
                    selectedBlocks={["total_steps"]}
                    onChange={onChange}
                    availableData={createBasicData()}
                />
            );

            // Should render as buttons, not checkboxes
            const buttons = screen.getAllByRole("button");
            expect(buttons.length).toBeGreaterThan(0);
        });

        it("shows only specified blocks when showOnly is provided", () => {
            const onChange = vi.fn();
            render(
                <ShareContentPickerInline
                    selectedBlocks={[]}
                    onChange={onChange}
                    availableData={createFullData()}
                    showOnly={["total_steps", "day_count"]}
                />
            );

            // Should only show 2 buttons
            const buttons = screen.getAllByRole("button");
            expect(buttons).toHaveLength(2);
        });

        it("shows all blocks when showOnly is not provided", () => {
            const onChange = vi.fn();
            render(
                <ShareContentPickerInline
                    selectedBlocks={[]}
                    onChange={onChange}
                    availableData={createFullData()}
                />
            );

            const buttons = screen.getAllByRole("button");
            expect(buttons.length).toBeGreaterThan(5); // Should show many blocks
        });
    });

    describe("toggle behavior", () => {
        it("toggles block on when clicked", () => {
            const onChange = vi.fn();
            render(
                <ShareContentPickerInline
                    selectedBlocks={[]}
                    onChange={onChange}
                    availableData={createBasicData()}
                    showOnly={["total_steps"]}
                />
            );

            const button = screen.getByRole("button");
            fireEvent.click(button);

            expect(onChange).toHaveBeenCalledWith(["total_steps"]);
        });

        it("toggles block off when already selected", () => {
            const onChange = vi.fn();
            render(
                <ShareContentPickerInline
                    selectedBlocks={["total_steps"]}
                    onChange={onChange}
                    availableData={createBasicData()}
                    showOnly={["total_steps"]}
                />
            );

            const button = screen.getByRole("button");
            fireEvent.click(button);

            expect(onChange).toHaveBeenCalledWith([]);
        });

        it("preserves other selections when toggling", () => {
            const onChange = vi.fn();
            render(
                <ShareContentPickerInline
                    selectedBlocks={["total_steps", "day_count"]}
                    onChange={onChange}
                    availableData={createBasicData()}
                    showOnly={["total_steps", "day_count"]}
                />
            );

            // Click total_steps to deselect it
            const totalStepsButton = screen.getAllByRole("button")[0];
            fireEvent.click(totalStepsButton);

            // Should preserve day_count
            const callArg = onChange.mock.calls[0][0] as ShareContentBlock[];
            expect(callArg).toContain("day_count");
        });
    });

    describe("disabled state", () => {
        it("disables unavailable blocks", () => {
            const onChange = vi.fn();
            render(
                <ShareContentPickerInline
                    selectedBlocks={[]}
                    onChange={onChange}
                    availableData={{ totalSteps: 10000 }} // Only totalSteps
                    showOnly={["total_steps", "streak"]}
                />
            );

            const buttons = screen.getAllByRole("button");
            // streak should be disabled
            const streakButton = buttons.find((btn) => btn.textContent?.includes("🔥"));
            expect(streakButton).toBeDisabled();
        });

        it("does not call onChange when clicking disabled button", () => {
            const onChange = vi.fn();
            render(
                <ShareContentPickerInline
                    selectedBlocks={[]}
                    onChange={onChange}
                    availableData={{ totalSteps: 10000 }}
                    showOnly={["total_steps", "streak"]}
                />
            );

            const buttons = screen.getAllByRole("button");
            const streakButton = buttons.find((btn) => btn.textContent?.includes("🔥"));
            if (streakButton) {
                fireEvent.click(streakButton);
            }

            // Should not have been called for streak
            expect(onChange).not.toHaveBeenCalledWith(expect.arrayContaining(["streak"]));
        });
    });

    describe("visual states", () => {
        it("applies selected variant to selected blocks", () => {
            render(
                <ShareContentPickerInline
                    selectedBlocks={["total_steps"]}
                    onChange={vi.fn()}
                    availableData={createBasicData()}
                    showOnly={["total_steps", "day_count"]}
                />
            );

            const buttons = screen.getAllByRole("button");
            const selectedButton = buttons[0]; // total_steps

            // Should have default variant (selected)
            expect(selectedButton).toHaveClass("bg-primary/90");
        });
    });
});

// ============================================================================
// Negative Tests
// ============================================================================

describe("Negative Tests", () => {
    describe("empty data", () => {
        it("handles completely empty data", () => {
            const onChange = vi.fn();
            render(
                <ShareContentPicker
                    selectedBlocks={[]}
                    onChange={onChange}
                    availableData={{}}
                />
            );

            // All checkboxes should be disabled
            const checkboxes = screen.getAllByRole("checkbox");
            checkboxes.forEach((checkbox) => {
                expect(checkbox).toBeDisabled();
            });
        });
    });

    describe("invalid selections", () => {
        it("handles selectedBlocks with unavailable data gracefully", () => {
            const onChange = vi.fn();
            // Passing streak as selected but no streak data
            render(
                <ShareContentPicker
                    selectedBlocks={["streak"]}
                    onChange={onChange}
                    availableData={{ totalSteps: 10000 }}
                />
            );

            // Should render without crashing
            expect(screen.getByText("Basic Stats")).toBeInTheDocument();
        });
    });

    describe("edge cases", () => {
        it("handles rapid clicking", async () => {
            const onChange = vi.fn();
            render(
                <ShareContentPickerInline
                    selectedBlocks={[]}
                    onChange={onChange}
                    availableData={createBasicData()}
                    showOnly={["total_steps"]}
                />
            );

            const button = screen.getByRole("button");

            // Rapid clicks
            fireEvent.click(button);
            fireEvent.click(button);
            fireEvent.click(button);

            // Should have been called 3 times
            expect(onChange).toHaveBeenCalledTimes(3);
        });
    });
});
