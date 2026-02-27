import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KPICard } from "../KPICard";

describe("KPICard", () => {
  it("renders label and value", () => {
    render(<KPICard label="Total Users" value="150" />);
    expect(screen.getByText("Total Users")).toBeInTheDocument();
    expect(screen.getByText("150")).toBeInTheDocument();
  });

  it("shows loading skeleton when loading", () => {
    const { container } = render(<KPICard label="Test" value="0" loading={true} />);
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("displays positive trend with up arrow", () => {
    render(<KPICard label="Active Rate" value="45%" trend={12.3} />);
    expect(screen.getByText("+12.3%")).toBeInTheDocument();
    expect(screen.getByText("vs last period")).toBeInTheDocument();
  });

  it("displays negative trend with down arrow", () => {
    render(<KPICard label="Steps" value="8000" trend={-5.2} />);
    expect(screen.getByText("-5.2%")).toBeInTheDocument();
  });

  it("displays zero trend with neutral indicator", () => {
    render(<KPICard label="Steps" value="8000" trend={0} />);
    // Zero trend renders without + prefix
    expect(screen.getByText("0.0%")).toBeInTheDocument();
  });

  it("does not show trend when undefined", () => {
    render(<KPICard label="Total" value="100" />);
    expect(screen.queryByText("vs last period")).not.toBeInTheDocument();
  });

  it("uses custom trendLabel", () => {
    render(<KPICard label="Test" value="50" trend={10} trendLabel="vs last week" />);
    expect(screen.getByText("vs last week")).toBeInTheDocument();
  });

  it("renders icon when provided", () => {
    render(
      <KPICard
        label="Test"
        value="42"
        icon={<span data-testid="test-icon">icon</span>}
      />
    );
    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
  });

  it("applies variant styles", () => {
    const { container } = render(
      <KPICard label="Test" value="42" variant="success" />
    );
    const card = container.firstElementChild;
    expect(card?.className).toContain("border-l-4");
  });
});
