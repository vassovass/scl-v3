import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PeriodFilter } from "../PeriodFilter";

describe("PeriodFilter", () => {
  it("renders all period options", () => {
    render(<PeriodFilter value="30d" onChange={vi.fn()} />);
    expect(screen.getByText("7 Days")).toBeInTheDocument();
    expect(screen.getByText("30 Days")).toBeInTheDocument();
    expect(screen.getByText("90 Days")).toBeInTheDocument();
    expect(screen.getByText("All Time")).toBeInTheDocument();
  });

  it("highlights the active period", () => {
    render(<PeriodFilter value="7d" onChange={vi.fn()} />);
    const activeBtn = screen.getByText("7 Days");
    expect(activeBtn.className).toContain("bg-card");
  });

  it("calls onChange when a period is clicked", () => {
    const onChange = vi.fn();
    render(<PeriodFilter value="30d" onChange={onChange} />);
    fireEvent.click(screen.getByText("90 Days"));
    expect(onChange).toHaveBeenCalledWith("90d");
  });
});
