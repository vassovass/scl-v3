"use client";

import { cn } from "@/lib/utils";

/**
 * Period Filter Tabs
 *
 * Horizontal filter for selecting analytics time periods.
 * Uses shadcn-style button group pattern.
 *
 * PRD 32 — Admin Analytics Dashboard
 */

interface PeriodFilterProps {
  value: string;
  onChange: (period: string) => void;
}

const periods = [
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "all", label: "All Time" },
];

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-muted/30 p-1">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onChange(period.value)}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
            value === period.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}
