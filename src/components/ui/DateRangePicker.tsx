"use client";

import React, { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";

// Custom style overrides using our semantic variables
// We map the react-day-picker Custom Properties to our global variables
const css = `
  .rdp {
    --rdp-cell-size: 40px;
    --rdp-accent-color: rgb(var(--date-picker-accent));
    --rdp-background-color: rgb(var(--date-picker-bg));
    --rdp-accent-color-dark: rgb(var(--date-picker-accent));
    --rdp-background-color-dark: rgb(var(--date-picker-bg));
    --rdp-outline: 2px solid rgb(var(--date-picker-accent));
    --rdp-outline-selected: 2px solid rgb(var(--date-picker-border));
    margin: 0;
  }
  .rdp-day {
    color: rgb(var(--date-picker-text)) !important;
    font-weight: 500;
  }
  .rdp-day_outside {
    color: rgb(var(--muted-foreground)) !important;
    opacity: 0.5;
  }
  .rdp-head_cell {
    color: rgb(var(--muted-foreground));
    font-weight: 500;
    font-size: 0.75rem;
  }
  .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
    background-color: rgb(var(--accent));
    border-radius: 6px;
    color: rgb(var(--accent-foreground));
  }
  .rdp-day_selected {
    background-color: var(--rdp-accent-color) !important;
    color: rgb(var(--primary-foreground)) !important;
    font-weight: 600;
  }
  .rdp-range_middle {
    background-color: rgba(var(--date-picker-accent), 0.2) !important;
    color: rgb(var(--date-picker-text)) !important;
    border-radius: 0;
  }
  .rdp-day_range_start {
    border-radius: 6px 0 0 6px !important;
  }
  .rdp-day_range_end {
    border-radius: 0 6px 6px 0 !important;
  }
  .rdp-caption_label {
    font-size: 0.875rem;
    font-weight: 600;
    color: rgb(var(--date-picker-text));
  }
  .rdp-nav_button {
    color: rgb(var(--muted-foreground));
  }
  .rdp-nav_button:hover {
    color: rgb(var(--date-picker-text));
    background-color: rgb(var(--accent));
  }
  .rdp-day_today:not(.rdp-day_selected) {
    border: 1px solid rgb(var(--date-picker-accent));
    border-radius: 6px;
  }
`;

interface DateRangePickerProps {
  date: DateRange | undefined;
  onSelect: (range: DateRange | undefined) => void;
  className?: string;
}

export function DateRangePicker({ date, onSelect, className = "" }: DateRangePickerProps) {
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

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <style>{css}</style>

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
          {/* Selection indicator */}
          <div className="px-3 py-2 border-b border-slate-700 text-sm">
            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${selectingEnd
              ? "bg-purple-500/20 text-purple-400"
              : "bg-sky-500/20 text-sky-400"
              }`}>
              {selectingEnd ? "📅 Select end date" : "📅 Select start date"}
            </span>
          </div>

          <div className="p-3">
            <DayPicker
              mode="range"
              defaultMonth={date?.from || new Date()}
              selected={date}
              onDayClick={handleDayClick}
              numberOfMonths={2}
            />
          </div>

          {/* Helper text */}
          <div className="px-3 pb-2 text-xs text-muted-foreground">
            {selectingEnd
              ? "Click a date to set end • Click before start to reset"
              : "Click a date to set start"}
          </div>
        </div>
      )}
    </div>
  );
}
