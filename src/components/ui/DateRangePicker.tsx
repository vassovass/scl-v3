"use client";

import React, { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { Button } from "@/components/ui/button";

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
  /** When true, calendar is always visible (for inline/embedded use) */
  alwaysOpen?: boolean;
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
  alwaysOpen = false,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(alwaysOpen);
  // Track whether user is selecting start or end date
  // Use a ref to persist across re-renders when parent updates date prop
  const [selectingEnd, setSelectingEnd] = useState(false);
  const selectingEndRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync ref with state for persistence across re-renders
  useEffect(() => {
    selectingEndRef.current = selectingEnd;
  }, [selectingEnd]);

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
    const dayStr = format(day, 'yyyy-MM-dd');
    // Use ref to get current value (persists across re-renders)
    const isSelectingEnd = selectingEndRef.current;
    console.log('[DateRangePicker] handleDayClick:', {
      day: dayStr,
      selectingEnd: isSelectingEnd,
      currentFrom: date?.from ? format(date.from, 'yyyy-MM-dd') : null,
      currentTo: date?.to ? format(date.to, 'yyyy-MM-dd') : null
    });

    if (!isSelectingEnd) {
      // First click: set start date, clear end date
      console.log('[DateRangePicker] Setting START date, calling onSelect');
      onSelect({ from: day, to: undefined });
      setSelectingEnd(true);
      selectingEndRef.current = true;
    } else {
      // Second click: set end date
      if (date?.from && day >= date.from) {
        // Valid end date (on or after start)
        console.log('[DateRangePicker] Setting END date, calling onSelect with COMPLETE range');
        onSelect({ from: date.from, to: day });
        setSelectingEnd(false);
        selectingEndRef.current = false;
        if (!alwaysOpen) {
          setIsOpen(false);
        }
        // Call onClose to notify parent (closes the picker in ShareDateRangePicker)
        onClose?.();
      } else if (date?.from && day < date.from) {
        // Clicked before start date - reset and use as new start
        console.log('[DateRangePicker] Day before start, resetting to new START');
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

  // Determine if calendar should be shown
  const showCalendar = alwaysOpen || isOpen;

  return (
    <div className={`relative ${className}`} ref={containerRef} style={style}>
      <style>{customStyles}</style>

      {/* Only show trigger button when not in alwaysOpen mode */}
      {!alwaysOpen && (
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
      )}

      {/* Mobile: Full-screen overlay | Desktop: Dropdown (or inline when alwaysOpen) */}
      {showCalendar && (
        <>
          {/* Mobile overlay backdrop - only when not alwaysOpen */}
          {!alwaysOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => {
                setIsOpen(false);
                onClose?.();
              }}
            />
          )}

          {/* Date picker container */}
          <div className={alwaysOpen
            ? "rounded-lg border border-border bg-popover shadow-lg"
            : `z-50 rounded-lg border border-border bg-popover shadow-xl
               fixed inset-x-4 top-1/2 -translate-y-1/2 max-h-[90vh] overflow-y-auto
               md:absolute md:inset-auto md:top-full md:left-0 md:mt-2 md:translate-y-0 md:max-h-none md:overflow-visible`
          }>
            {/* Sticky header with close button - ALWAYS visible */}
            <div className="sticky top-0 flex items-center justify-between px-3 py-2 border-b border-border bg-popover z-10">
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${selectingEnd
                ? "bg-accent text-accent-foreground"
                : "bg-primary/20 text-primary"
                }`}>
                {selectingEnd ? "📅 Select end date" : "📅 Select start date"}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onClose?.();
                }}
                className="text-muted-foreground hover:text-foreground p-2 rounded-md hover:bg-accent"
                aria-label="Close date picker"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
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
            </div>

            {/* Calendar - 1 month on mobile, 2 on desktop */}
            <div className="p-3 flex justify-center">
              {/* Mobile: single month */}
              <div className="md:hidden">
                <DayPicker
                  mode="range"
                  defaultMonth={date?.from || new Date()}
                  selected={date}
                  onDayClick={handleDayClick}
                  numberOfMonths={1}
                  modifiers={buildModifiers()}
                  modifiersClassNames={modifiersClassNames}
                  disabled={disabledMatcher}
                />
              </div>
              {/* Desktop: two months */}
              <div className="hidden md:block">
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
            </div>

            {/* Helper text with legend */}
            <div className="px-3 pb-2 space-y-1">
              <div className="text-xs text-muted-foreground text-center md:text-left">
                {selectingEnd
                  ? "Tap a date to set end • Tap before start to reset"
                  : "Tap a date to set start"}
              </div>
              {submissionData && submissionData.length > 0 && (
                <div className="flex items-center justify-center md:justify-start gap-2 text-xs text-muted-foreground">
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

            {/* Sticky footer with Done button - mobile only */}
            <div className="sticky bottom-0 p-3 border-t border-border bg-popover md:hidden">
              <Button
                variant="default"
                className="w-full"
                onClick={() => {
                  setIsOpen(false);
                  onClose?.();
                }}
              >
                {date?.from && date?.to ? "Done" : "Close"}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

