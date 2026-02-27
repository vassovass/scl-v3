import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { WaitlistForm } from "../WaitlistForm";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe("WaitlistForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPush.mockClear();
  });

  it("renders all form fields", () => {
    render(<WaitlistForm />);
    expect(screen.getByLabelText(/Work Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Company Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Team Size/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Your Role/)).toBeInTheDocument();
    expect(screen.getByText("Join the Waitlist")).toBeInTheDocument();
  });

  it("validates email before submission", async () => {
    const { container } = render(<WaitlistForm />);

    // Submit form directly (bypasses HTML5 constraint validation in jsdom)
    // to test our JS-level email validation
    fireEvent.submit(container.querySelector("form")!);

    await waitFor(() => {
      expect(screen.getByText("Please enter a valid email address")).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("submits form and redirects on success", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<WaitlistForm source="test-source" />);

    fireEvent.change(screen.getByLabelText(/Work Email/), {
      target: { value: "test@company.com" },
    });
    fireEvent.click(screen.getByText("Join the Waitlist"));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/teams/waitlist");
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/teams/waitlist", expect.objectContaining({
      method: "POST",
    }));
  });

  it("shows rate limit error on 429", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: () => Promise.resolve({ error: "Too many requests" }),
    });

    render(<WaitlistForm />);

    fireEvent.change(screen.getByLabelText(/Work Email/), {
      target: { value: "test@company.com" },
    });
    fireEvent.click(screen.getByText("Join the Waitlist"));

    await waitFor(() => {
      expect(screen.getByText("Too many requests. Please try again in a minute.")).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("shows error on API failure", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "Server error" }),
    });

    render(<WaitlistForm />);

    fireEvent.change(screen.getByLabelText(/Work Email/), {
      target: { value: "test@company.com" },
    });
    fireEvent.click(screen.getByText("Join the Waitlist"));

    await waitFor(() => {
      expect(screen.getByText("Server error")).toBeInTheDocument();
    });
  });

  it("shows loading state during submission", async () => {
    let resolveRequest: () => void;
    const requestPromise = new Promise<void>((resolve) => { resolveRequest = resolve; });

    global.fetch = vi.fn().mockReturnValue(
      requestPromise.then(() => ({ ok: true, json: () => Promise.resolve({}) }))
    );

    render(<WaitlistForm />);

    fireEvent.change(screen.getByLabelText(/Work Email/), {
      target: { value: "test@company.com" },
    });
    fireEvent.click(screen.getByText("Join the Waitlist"));

    await waitFor(() => {
      expect(screen.getByText("Joining...")).toBeInTheDocument();
    });

    resolveRequest!();
  });

  it("passes source prop in API request", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<WaitlistForm source="linkedin-ad" />);

    fireEvent.change(screen.getByLabelText(/Work Email/), {
      target: { value: "test@company.com" },
    });
    fireEvent.click(screen.getByText("Join the Waitlist"));

    await waitFor(() => {
      const call = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.source).toBe("linkedin-ad");
    });
  });
});
