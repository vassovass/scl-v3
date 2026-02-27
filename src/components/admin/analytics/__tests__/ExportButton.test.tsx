import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ExportButton } from "../ExportButton";

describe("ExportButton", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders with export text", () => {
    render(<ExportButton period="30d" />);
    expect(screen.getByText("Export CSV")).toBeInTheDocument();
  });

  it("shows exporting state during download", async () => {
    let resolveBlob: (value: Blob) => void;
    const blobPromise = new Promise<Blob>((resolve) => { resolveBlob = resolve; });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => blobPromise,
      headers: new Headers({
        "Content-Disposition": 'attachment; filename="analytics.csv"',
      }),
    });

    render(<ExportButton period="30d" />);
    fireEvent.click(screen.getByText("Export CSV"));

    await waitFor(() => {
      expect(screen.getByText("Exporting...")).toBeInTheDocument();
    });

    // Resolve the blob to let it finish
    resolveBlob!(new Blob(["test"], { type: "text/csv" }));
  });

  it("calls fetch with correct period", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(["test"])),
      headers: new Headers({}),
    });

    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = vi.fn().mockReturnValue("blob:test");
    global.URL.revokeObjectURL = vi.fn();

    render(<ExportButton period="7d" />);
    fireEvent.click(screen.getByText("Export CSV"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/admin/analytics/export?period=7d");
    });
  });
});
