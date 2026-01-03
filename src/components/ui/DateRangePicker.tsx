"use client";

import React, { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/style.css";

/**
 * DateRangePicker - Uses react-day-picker v9
 * 
 * Styling is handled via CSS variables in globals.css (.rdp-root)
 * Supports dark/light mode automatically through CSS variables.
 * 
 * @see AGENTS.md for version info
 * @see globals.css for theme customization
 */

interface DateRangePickerProps {
  date: DateRange | undefined;
  onSelect: (range: DateRange | undefined) => void;
  className?: string;
  /** Number of months to display side-by-side */
  numberOfMonths?: number;
}

export function DateRangePicker({
  date,
  onSelect,
  className = "",
  numberOfMonths = 2
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
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

  const handleSelect = (range: DateRange | undefined) => {
    onSelect(range);
    // Only close when BOTH from and to are selected
    if (range?.from && range?.to) {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md border transition-colors ${isOpen
            ? "border-sky-500 bg-slate-900 text-sky-400"
            : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600 hover:bg-slate-800"
          }`}
      >
        <span className="opacity-70">📅</span>
        <span>{display}</span>
      </button>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-2 rounded-lg border border-slate-700 bg-slate-900 shadow-xl">
          <DayPicker
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={numberOfMonths}
          />
        </div>
      )}
    </div>
  );
}
