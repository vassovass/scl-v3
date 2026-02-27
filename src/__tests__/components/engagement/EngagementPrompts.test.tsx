import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MissedDayCard } from "@/components/engagement/MissedDayCard";
import { StreakWarning } from "@/components/engagement/StreakWarning";

// Mock analytics
vi.mock("@/lib/analytics", () => ({
    trackEvent: vi.fn(),
}));

describe("MissedDayCard", () => {
    const mockDismiss = vi.fn();

    beforeEach(() => {
        mockDismiss.mockClear();
    });

    it("renders with missed date info", () => {
        render(<MissedDayCard missedDate="2026-02-26" onDismiss={mockDismiss} />);

        expect(screen.getByText(/Keep your history complete/)).toBeInTheDocument();
        // Description contains the missed date (format varies by locale)
        expect(screen.getByText(/haven't submitted/i)).toBeInTheDocument();
    });

    it("has CTA link to submit-steps with date param", () => {
        render(<MissedDayCard missedDate="2026-02-26" onDismiss={mockDismiss} />);

        const link = screen.getByRole("link");
        expect(link).toHaveAttribute("href", "/submit-steps?date=2026-02-26");
    });

    it("calls onDismiss when dismiss button clicked", () => {
        render(<MissedDayCard missedDate="2026-02-26" onDismiss={mockDismiss} />);

        const dismissBtn = screen.getByLabelText("Dismiss");
        fireEvent.click(dismissBtn);
        expect(mockDismiss).toHaveBeenCalledOnce();
    });

    it("has data-tour attribute for tour targeting", () => {
        render(<MissedDayCard missedDate="2026-02-26" onDismiss={mockDismiss} />);
        expect(document.querySelector('[data-tour="engagement-missed-day"]')).toBeInTheDocument();
    });
});

describe("StreakWarning", () => {
    const mockDismiss = vi.fn();

    beforeEach(() => {
        mockDismiss.mockClear();
    });

    it("renders streak count in title", () => {
        render(<StreakWarning currentStreak={5} onDismiss={mockDismiss} />);

        expect(screen.getByText(/5-day streak at risk/)).toBeInTheDocument();
    });

    it("has CTA link to submit-steps", () => {
        render(<StreakWarning currentStreak={5} onDismiss={mockDismiss} />);

        const link = screen.getByRole("link");
        expect(link).toHaveAttribute("href", "/submit-steps");
    });

    it("calls onDismiss when dismiss button clicked", () => {
        render(<StreakWarning currentStreak={5} onDismiss={mockDismiss} />);

        const dismissBtn = screen.getByLabelText("Dismiss");
        fireEvent.click(dismissBtn);
        expect(mockDismiss).toHaveBeenCalledOnce();
    });

    it("shows encouraging message", () => {
        render(<StreakWarning currentStreak={10} onDismiss={mockDismiss} />);

        expect(screen.getByText(/Don't break the chain/)).toBeInTheDocument();
    });
});
