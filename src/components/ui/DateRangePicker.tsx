"use client";

import React, { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css"; // Basic styles - we'll override heavily

// Custom style overrides for dark mode to match our theme
const css = `
  .rdp {
    --rdp-cell-size: 40px;
    --rdp-accent-color: #0ea5e9; /* sky-500 */
    --rdp-background-color: #0f172a; /* slate-900 */
    --rdp-accent-color-dark: #0284c7; /* sky-600 */
    --rdp-background-color-dark: #1e293b; /* slate-800 */
    --rdp-outline: 2px solid #0ea5e9;
    --rdp-outline-selected: 2px solid #e2e8f0;
    margin: 0;
  }
  .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
    background-color: #1e293b;
    border-radius: 6px;
  }
  .rdp-day_selected {
    background-color: var(--rdp-accent-color);
  }
  .rdp-day_selected:not(.rdp-day_range_middle) {
    color: white;
  }
  .rdp-day_range_middle {
    background-color: rgba(14, 165, 233, 0.2) !important;
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
    color: #e2e8f0;
  }
  .rdp-nav_button {
    color: #94a3b8;
  }
  .rdp-nav_button:hover {
    color: #e2e8f0;
    background-color: #1e293b;
  }
`;

interface DateRangePickerProps {
    date: DateRange | undefined;
    onSelect: (range: DateRange | undefined) => void;
    className?: string;
}

export function DateRangePicker({ date, onSelect, className = "" }: DateRangePickerProps) {
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
            display = format(date.from, "LLL dd, y");
        }
    }

    const handleSelect = (range: DateRange | undefined) => {
        onSelect(range);
        // Do not auto-close if selecting range start
        if (range?.from && range?.to) {
            setIsOpen(false);
        }
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <style>{css}</style>

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

            {isOpen && (
                <div className="absolute top-full left-0 z-50 mt-2 p-3 rounded-lg border border-slate-700 bg-slate-900 shadow-xl">
                    <DayPicker
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={handleSelect}
                        numberOfMonths={2}
                    />
                </div>
            )}
        </div>
    );
}
