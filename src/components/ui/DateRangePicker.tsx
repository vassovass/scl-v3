"use client";

import React, { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";

// Custom style overrides for dark mode
const css = `
  .rdp {
    --rdp-cell-size: 40px;
    --rdp-accent-color: #0ea5e9;
    --rdp-background-color: #0f172a;
    --rdp-accent-color-dark: #0284c7;
    --rdp-background-color-dark: #1e293b;
    --rdp-outline: 2px solid #0ea5e9;
    --rdp-outline-selected: 2px solid #e2e8f0;
    margin: 0;
  }
  .rdp-day {
    color: #f1f5f9 !important;
    font-weight: 500;
  }
  .rdp-day_outside {
    color: #475569 !important;
    opacity: 0.5;
  }
  .rdp-head_cell {
    color: #94a3b8;
    font-weight: 500;
    font-size: 0.75rem;
  }
  .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
    background-color: #334155;
    border-radius: 6px;
    color: #ffffff;
  }
  .rdp-day_selected {
    background-color: var(--rdp-accent-color) !important;
    color: white !important;
    font-weight: 600;
  }
  .rdp-range_middle {
    background-color: rgba(14, 165, 233, 0.35) !important;
    color: #ffffff !important;
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
    color: #f1f5f9;
  }
  .rdp-nav_button {
    color: #94a3b8;
  }
  .rdp-nav_button:hover {
    color: #f1f5f9;
    background-color: #334155;
  }
  .rdp-day_today:not(.rdp-day_selected) {
    border: 1px solid #0ea5e9;
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
            ? "border-sky-500 bg-slate-900 text-sky-400"
            : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600 hover:bg-slate-800"
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
        <div className="absolute top-full left-0 z-50 mt-2 rounded-lg border border-slate-700 bg-slate-900 shadow-xl">
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
          <div className="px-3 pb-2 text-xs text-slate-500">
            {selectingEnd
              ? "Click a date to set end • Click before start to reset"
              : "Click a date to set start"}
          </div>
        </div>
      )}
    </div>
  );
}
