import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { StepBankCard } from "@/components/progress/StepBankCard";
import { PersonalProgressView } from "@/components/progress/PersonalProgressView";

// Mock analytics
vi.mock("@/lib/analytics", () => ({
    trackEvent: vi.fn(),
}));

describe("StepBankCard", () => {
    it("renders lifetime steps and total label", () => {
        render(
            <StepBankCard
                lifetimeSteps={1240000}
                bestDaySteps={25000}
                bestDayDate="2026-02-15"
            />
        );

        expect(screen.getByText(/Lifetime Step Bank/)).toBeInTheDocument();
        expect(screen.getByText(/total steps/)).toBeInTheDocument();
    });

    it("shows best day info when available", () => {
        render(
            <StepBankCard
                lifetimeSteps={50000}
                bestDaySteps={12000}
                bestDayDate="2026-01-10"
            />
        );

        expect(screen.getByText(/Best day/)).toBeInTheDocument();
    });

    it("hides best day when steps are 0", () => {
        render(
            <StepBankCard
                lifetimeSteps={0}
                bestDaySteps={0}
                bestDayDate={null}
            />
        );

        expect(screen.queryByText(/Best day/)).not.toBeInTheDocument();
    });
});

describe("PersonalProgressView", () => {
    it("shows empty state when no stats", () => {
        render(<PersonalProgressView stats={null} isLoading={false} />);

        expect(screen.getByText(/No progress data yet/)).toBeInTheDocument();
        expect(screen.getByText(/Submit Steps/)).toBeInTheDocument();
    });

    it("shows loading skeleton when loading", () => {
        const { container } = render(
            <PersonalProgressView stats={null} isLoading={true} />
        );

        expect(container.querySelectorAll(".animate-pulse")).toHaveLength(3);
    });

    it("renders step bank and streak cards with data", () => {
        render(
            <PersonalProgressView
                stats={{
                    total_steps_lifetime: 500000,
                    best_day_steps: 20000,
                    best_day_date: "2026-02-20",
                    current_streak: 7,
                    longest_streak: 14,
                }}
                isLoading={false}
            />
        );

        // StepBankCard renders — look for Lifetime Step Bank label
        expect(screen.getByText(/Lifetime Step Bank/)).toBeInTheDocument();
        expect(screen.getByText(/7 days/)).toBeInTheDocument();
        expect(screen.getByText(/14 days/)).toBeInTheDocument();
    });

    it("shows personal best badge when current equals longest streak", () => {
        render(
            <PersonalProgressView
                stats={{
                    total_steps_lifetime: 100000,
                    best_day_steps: 15000,
                    best_day_date: null,
                    current_streak: 5,
                    longest_streak: 5,
                }}
                isLoading={false}
            />
        );

        expect(screen.getByText(/Personal best/)).toBeInTheDocument();
    });
});
