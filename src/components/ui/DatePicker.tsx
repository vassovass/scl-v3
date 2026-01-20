"use client";

import React, { useState, useRef, useEffect } from "react";

interface DatePickerProps {
    value: string;
    onChange: (date: string) => void;
    max?: string;
    min?: string;
    label?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
    presets?: { label: string; date: Date }[];
}

/**
 * Universal DatePicker component with improved UX.
 * Shows a styled date input with quick-select buttons for common dates.
 */
export function DatePicker({
    value,
    onChange,
    max = new Date().toISOString().slice(0, 10),
    min,
    label,
    required = false,
    disabled = false,
    className = "",
    presets,
}: DatePickerProps) {
    const [showQuickSelect, setShowQuickSelect] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowQuickSelect(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const formatDateLabel = (date: Date): string => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diff === 0) return "Today";
        if (diff === 1) return "Yesterday";
        if (diff <= 7 && diff > 0) return `${diff} days ago`;

        return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    };

    const defaultPresets = [
        { label: "Today", date: new Date() },
        { label: "Yesterday", date: new Date(Date.now() - 86400000) },
        { label: "2 days ago", date: new Date(Date.now() - 2 * 86400000) },
        { label: "3 days ago", date: new Date(Date.now() - 3 * 86400000) },
        { label: "1 week ago", date: new Date(Date.now() - 7 * 86400000) },
    ];

    const activePresets = (presets || defaultPresets).filter(({ date }) => {
        const dateStr = date.toISOString().slice(0, 10);
        if (max && dateStr > max) return false;
        if (min && dateStr < min) return false;
        return true;
    });

    const handleQuickSelect = (date: Date) => {
        onChange(date.toISOString().slice(0, 10));
        setShowQuickSelect(false);
    };

    const selectedDate = value ? new Date(value + "T00:00:00") : null;
    const displayLabel = selectedDate ? formatDateLabel(selectedDate) : "Select date";

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-slate-300 mb-1">
                    {label}
                </label>
            )}

            <div className="flex gap-2">
                {/* Native date input (styled for dark mode) */}
                <input
                    type="date"
                    value={value}
                    max={max}
                    min={min}
                    onChange={(e) => onChange(e.target.value)}
                    required={required}
                    disabled={disabled}
                    className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-50 focus:border-primary focus:outline-none disabled:opacity-50"
                    style={{
                        colorScheme: "dark",
                    }}
                />

                {/* Quick select button */}
                <button
                    type="button"
                    onClick={() => setShowQuickSelect(!showQuickSelect)}
                    disabled={disabled}
                    className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:border-slate-600 transition disabled:opacity-50"
                    title="Quick select"
                >
                    📅
                </button>
            </div>

            {/* Quick select dropdown */}
            {showQuickSelect && (
                <div className="absolute right-0 top-full mt-1 z-20 rounded-md border border-slate-700 bg-slate-800 shadow-lg overflow-hidden min-w-[150px]">
                    {activePresets.map(({ label, date }) => (
                        <button
                            key={label}
                            type="button"
                            onClick={() => handleQuickSelect(date)}
                            className={`w-full px-3 py-2 text-left text-sm transition hover:bg-slate-700 ${value === date.toISOString().slice(0, 10)
                                ? "bg-primary/20 text-primary"
                                : "text-slate-300"
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}

            {/* Display relative date label */}
            {selectedDate && (
                <p className="mt-1 text-xs text-slate-500">
                    {displayLabel} • {selectedDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </p>
            )}
        </div>
    );
}

