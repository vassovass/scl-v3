import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OnboardingCard } from "@/components/ui/OnboardingCard";

describe("OnboardingCard", () => {
    it("renders title, description, and icon", () => {
        render(
            <OnboardingCard
                variant="welcome"
                icon="👋"
                title="Hello World"
                description="Test description"
            />
        );

        expect(screen.getByText("Hello World")).toBeInTheDocument();
        expect(screen.getByText("Test description")).toBeInTheDocument();
        expect(screen.getByText("👋")).toBeInTheDocument();
    });

    it("renders CTA link when provided", () => {
        render(
            <OnboardingCard
                variant="action"
                title="Test"
                description="Test desc"
                cta={{ label: "Click Me", href: "/test" }}
            />
        );

        const link = screen.getByText("Click Me");
        expect(link).toBeInTheDocument();
        expect(link.closest("a")).toHaveAttribute("href", "/test");
    });

    it("does not render CTA when not provided", () => {
        render(
            <OnboardingCard
                variant="info"
                title="Info"
                description="No CTA here"
            />
        );

        expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    it("renders dismiss button when onDismiss is provided", () => {
        const handleDismiss = vi.fn();
        render(
            <OnboardingCard
                variant="warning"
                title="Warning"
                description="Dismissible"
                onDismiss={handleDismiss}
            />
        );

        const dismissBtn = screen.getByLabelText("Dismiss");
        expect(dismissBtn).toBeInTheDocument();
        fireEvent.click(dismissBtn);
        expect(handleDismiss).toHaveBeenCalledOnce();
    });

    it("does not render dismiss button when onDismiss is not provided", () => {
        render(
            <OnboardingCard
                variant="welcome"
                title="No dismiss"
                description="Not dismissible"
            />
        );

        expect(screen.queryByLabelText("Dismiss")).not.toBeInTheDocument();
    });

    it("applies data-tour attribute", () => {
        render(
            <OnboardingCard
                variant="welcome"
                title="Touring"
                description="With tour"
                dataTour="test-card"
            />
        );

        expect(document.querySelector('[data-tour="test-card"]')).toBeInTheDocument();
    });

    it("renders children content", () => {
        render(
            <OnboardingCard
                variant="info"
                title="With children"
                description="Parent"
            >
                <div data-testid="child">Child content</div>
            </OnboardingCard>
        );

        expect(screen.getByTestId("child")).toBeInTheDocument();
    });
});
