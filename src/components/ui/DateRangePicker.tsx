"use client";

import React, { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";

// Custom style overrides using our semantic variables
// Inject custom variables for react-day-picker that map to our global theme
const style = {
  "--rdp-accent-color": "hsl(var(--date-picker-accent))",
  "--rdp-background-color": "hsl(var(--date-picker-bg))",
  "--rdp-accent-color-dark": "hsl(var(--date-picker-accent))",
  "--rdp-background-color-dark": "hsl(var(--date-picker-bg))",
  "--rdp-outline": "2px solid hsl(var(--date-picker-accent))",
  "--rdp-outline-selected": "2px solid hsl(var(--date-picker-border))",
} as React.CSSProperties;

// We use a style tag to override internal day-picker classes that don't use variables
const customStyles = `
    .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
        color: hsl(var(--date-picker-text)) !important;
        background-color: hsl(var(--accent));
    }
    .rdp-nav_button {
        color: hsl(var(--muted-foreground)) !important;
    }
    .rdp-caption_label {
        color: hsl(var(--date-picker-text));
        font-weight: 600;
    }
    .rdp-head_cell {
        color: hsl(var(--muted-foreground));
    }
    .rdp-day_selected, .rdp-day_selected:focus-visible, .rdp-day_selected:hover {
        background-color: hsl(var(--date-picker-accent));
        opacity: 1;
        color: hsl(var(--primary-foreground)) !important;
    }
    .rdp-day_today {
        font-weight: bold;
        color: hsl(var(--date-picker-text)) !important;
    }
    .rdp-day_today:not(.rdp-day_selected) {
        background-color: transparent;
        border: 1px solid hsl(var(--date-picker-accent));
    }
    .rdp-day_disabled {
        opacity: 0.5;
    }
    .rdp-day_range_middle {
        background-color: hsl(var(--accent));
        color: hsl(var(--date-picker-text));
    }
    .rdp-day_range_start, .rdp-day_range_end {
        color: hsl(var(--primary-foreground)) !important;
    }
    .rdp-day {
        color: hsl(var(--date-picker-text));
    }
    .rdp-day:hover:not(.rdp-day_selected):not(.rdp-day_range_middle) {
        color: hsl(var(--date-picker-text));
        background-color: hsl(var(--accent));
        cursor: pointer;
    }
    .rdp-button {
        border: 1px solid hsl(var(--date-picker-accent));
    }
  `;

/**
 * Submission data for heatmap indicators
 */
export interface SubmissionDateInfo {
  date: string;  // ISO date YYYY-MM-DD
  steps: number;
}

interface DateRangePickerProps {
  date: DateRange | undefined;
  onSelect: (range: DateRange | undefined) => void;
  className?: string;
  /** Submission data for heatmap indicators */
  submissionData?: SubmissionDateInfo[];
  /** Disable dates after this date (default: none) */
  disabledAfter?: Date;
  /** Show close button (useful for mobile) */
  onClose?: () => void;
}

/**
 * Get intensity level based on step count
 * Thresholds can be adjusted based on user behavior data
 */
function getIntensityLevel(steps: number): "high" | "medium" | "low" | "minimal" {
  if (steps >= 15000) return "high";
  if (steps >= 10000) return "medium";
  if (steps >= 5000) return "low";
  return "minimal";
}

export function DateRangePicker({
  date,
  onSelect,
  className = "",
  submissionData,
  disabledAfter,
  onClose,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  // Track whether user is selecting start or end date
  const [selectingEnd, setSelectingEnd] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectingEnd(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Format display string
  let display = "Select date range";
  if (date?.from) {
    if (date.to) {
      display = `${format(date.from, "LLL dd, y")} - ${format(date.to, "LLL dd, y")}`;
    } else {
      display = `${format(date.from, "LLL dd, y")} - Select end date`;
    }
  }

  // Handle day click with proper start/end logic
  const handleDayClick = (day: Date) => {
    if (!selectingEnd) {
      // First click: set start date, clear end date
      onSelect({ from: day, to: undefined });
      setSelectingEnd(true);
    } else {
      // Second click: set end date
      if (date?.from && day >= date.from) {
        // Valid end date (on or after start)
        onSelect({ from: date.from, to: day });
        setSelectingEnd(false);
        setIsOpen(false);
      } else if (date?.from && day < date.from) {
        // Clicked before start date - reset and use as new start
        onSelect({ from: day, to: undefined });
        // Stay in selectingEnd mode to pick end date
      }
    }
  };

  // Handle opening the picker
  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Reset selection state when opening
      // If both dates exist, user wants to pick new range
      if (date?.from && date?.to) {
        setSelectingEnd(false);
      } else if (date?.from && !date?.to) {
        // Resume picking end date
        setSelectingEnd(true);
      } else {
        setSelectingEnd(false);
      }
    }
  };

  // Reset selection
  const handleReset = () => {
    onSelect(undefined);
    setSelectingEnd(false);
  };

  // Build modifiers for submission data heatmap
  const buildModifiers = () => {
    if (!submissionData || submissionData.length === 0) {
      return {};
    }

    // Create a map for quick lookup
    const dataMap = new Map(submissionData.map((d) => [d.date, d.steps]));

    const formatDateKey = (d: Date) => format(d, "yyyy-MM-dd");

    return {
      hasSubmission: (d: Date) => dataMap.has(formatDateKey(d)),
      intensityHigh: (d: Date) => {
        const steps = dataMap.get(formatDateKey(d));
        return steps !== undefined && getIntensityLevel(steps) === "high";
      },
      intensityMedium: (d: Date) => {
        const steps = dataMap.get(formatDateKey(d));
        return steps !== undefined && getIntensityLevel(steps) === "medium";
      },
      intensityLow: (d: Date) => {
        const steps = dataMap.get(formatDateKey(d));
        return steps !== undefined && getIntensityLevel(steps) === "low";
      },
      intensityMinimal: (d: Date) => {
        const steps = dataMap.get(formatDateKey(d));
        return steps !== undefined && getIntensityLevel(steps) === "minimal";
      },
    };
  };

  // Build modifiers class names mapping
  const modifiersClassNames = {
    hasSubmission: "rdp-day_has-submission",
    intensityHigh: "rdp-day_intensity-high",
    intensityMedium: "rdp-day_intensity-medium",
    intensityLow: "rdp-day_intensity-low",
    intensityMinimal: "rdp-day_intensity-minimal",
  };

  // Build disabled matcher
  const disabledMatcher = disabledAfter ? { after: disabledAfter } : undefined;

  return (
    <div className={`relative ${className}`} ref={containerRef} style={style}>
      <style>{customStyles}</style>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleOpen}
          className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md border transition-colors ${isOpen
            ? "border-primary bg-popover text-primary"
            : "border-border bg-popover text-muted-foreground hover:border-foreground/20 hover:bg-accent hover:text-accent-foreground"
            }`}
        >
          <span className="opacity-70">📅</span>
          <span>{display}</span>
        </button>

        {date?.from && (
          <button
            type="button"
            onClick={handleReset}
            className="text-slate-500 hover:text-slate-300 text-sm px-2"
            title="Clear dates"
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-2 rounded-lg border border-border bg-popover shadow-xl">
          {/* Header with selection indicator and close button */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${selectingEnd
              ? "bg-accent text-accent-foreground"
              : "bg-primary/20 text-primary"
              }`}>
              {selectingEnd ? "📅 Select end date" : "📅 Select start date"}
            </span>
            {onClose && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onClose();
                }}
                className="text-muted-foreground hover:text-foreground p-1 rounded-sm hover:bg-accent"
                aria-label="Close date picker"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="p-3">
            <DayPicker
              mode="range"
              defaultMonth={date?.from || new Date()}
              selected={date}
              onDayClick={handleDayClick}
              numberOfMonths={2}
              modifiers={buildModifiers()}
              modifiersClassNames={modifiersClassNames}
              disabled={disabledMatcher}
            />
          </div>

          {/* Helper text with legend */}
          <div className="px-3 pb-2 space-y-1">
            <div className="text-xs text-muted-foreground">
              {selectingEnd
                ? "Click a date to set end • Click before start to reset"
                : "Click a date to set start"}
            </div>
            {submissionData && submissionData.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[hsl(var(--success)/0.4)]" />
                  High
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[hsl(var(--success)/0.25)]" />
                  Med
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[hsl(var(--success)/0.15)]" />
                  Low
                </span>
                <span className="text-muted-foreground/60">• = submitted</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

