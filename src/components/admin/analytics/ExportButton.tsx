"use client";

import { useState } from "react";
import { Download } from "lucide-react";

/**
 * Analytics Export Button
 *
 * Triggers CSV download of analytics data via the export API.
 *
 * PRD 32 — Admin Analytics Dashboard
 */

interface ExportButtonProps {
  period: string;
}

export function ExportButton({ period }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch(`/api/admin/analytics/export?period=${period}`);
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = response.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "") || `analytics-${period}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Silently fail — structured logging handles server-side errors
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border border-border bg-card hover:bg-muted transition-colors disabled:opacity-50"
    >
      <Download className="h-4 w-4" />
      {exporting ? "Exporting..." : "Export CSV"}
    </button>
  );
}
