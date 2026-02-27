import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { OnboardingSection } from "@/components/onboarding/OnboardingSection";

// Mock analytics
vi.mock("@/lib/analytics", () => ({
    trackEvent: vi.fn(),
}));

describe("OnboardingSection", () => {
    it("renders all onboarding cards when submissionCount is 0", () => {
        render(<OnboardingSection submissionCount={0} displayName="Alice" />);

        expect(screen.getByText(/Welcome, Alice/)).toBeInTheDocument();
        expect(screen.getByText(/Submit Your First Steps/)).toBeInTheDocument();
        expect(screen.getByText(/You're in the World League/)).toBeInTheDocument();
        expect(screen.getByText(/How to Take a Screenshot/)).toBeInTheDocument();
    });

    it("renders nothing when submissionCount > 0", () => {
        const { container } = render(
            <OnboardingSection submissionCount={5} displayName="Alice" />
        );
        expect(container.innerHTML).toBe("");
    });

    it("uses fallback name when displayName is not provided", () => {
        render(<OnboardingSection submissionCount={0} />);
        expect(screen.getByText(/Welcome, there/)).toBeInTheDocument();
    });

    it("includes data-tour attributes for tour system targeting", () => {
        render(<OnboardingSection submissionCount={0} />);
        expect(document.querySelector('[data-tour="onboarding-section"]')).toBeInTheDocument();
        expect(document.querySelector('[data-tour="onboarding-welcome"]')).toBeInTheDocument();
        expect(document.querySelector('[data-tour="onboarding-submit-cta"]')).toBeInTheDocument();
    });
});
