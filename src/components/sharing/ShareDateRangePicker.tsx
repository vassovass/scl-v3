"use client";

import React, { useState, useCallback } from "react";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import {
  PeriodPreset,
  presetToDateRange,
  RELATIVE_DATE_SHORTCUTS,
  formatCustomPeriodLabel,
} from "@/lib/utils/periods";
import { trackEvent } from "@/lib/analytics";

interface ShareDateRangePickerProps {
  /** Currently selected date range */
  value: { start: string; end: string } | null;
  /** Callback when date range changes */
  onChange: (range: { start: string; end: string } | null, preset?: PeriodPreset) => void;
  /** Optional CSS class */
  className?: string;
  /** Whether to show preset shortcuts */
  showShortcuts?: boolean;
  /** Maximum selectable date (defaults to today) */
  maxDate?: Date;
  /** Compact mode for mobile */
  compact?: boolean;
}

/**
 * ShareDateRangePicker - A date range picker optimized for sharing flows.
 * Includes quick preset shortcuts (Last 3 days, This Week, etc.) and
 * a full calendar picker for custom ranges.
 */
export function ShareDateRangePicker({
  value,
  onChange,
  className = "",
  showShortcuts = true,
  maxDate = new Date(),
  compact = false,
}: ShareDateRangePickerProps) {
  // Track which preset is selected (for highlighting)
  const [selectedPreset, setSelectedPreset] = useState<PeriodPreset | null>(null);
  // Track if custom picker is shown
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  // Convert value to DateRange format for the picker
  const dateRangeValue: DateRange | undefined = value
    ? {
        from: new Date(value.start + "T00:00:00"),
        to: new Date(value.end + "T00:00:00"),
      }
    : undefined;

  // Handle preset selection
  const handlePresetClick = useCallback(
    (preset: PeriodPreset) => {
      if (preset === "custom") {
        setShowCustomPicker(true);
        setSelectedPreset("custom");
        return;
      }

      const range = presetToDateRange(preset);
      if (range) {
        setSelectedPreset(preset);
        setShowCustomPicker(false);
        onChange(range, preset);

        // Track analytics
        trackEvent("share_date_preset_selected", {
          preset,
          category: "sharing",
          action: "select_preset",
        });
      }
    },
    [onChange]
  );

  // Handle custom date range selection
  const handleCustomRangeSelect = useCallback(
    (range: DateRange | undefined) => {
      if (range?.from && range?.to) {
        const startStr = range.from.toISOString().slice(0, 10);
        const endStr = range.to.toISOString().slice(0, 10);
        setSelectedPreset("custom");
        onChange({ start: startStr, end: endStr }, "custom");

        // Track analytics
        trackEvent("share_date_custom_selected", {
          start: startStr,
          end: endStr,
          days: Math.ceil((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24)) + 1,
          category: "sharing",
          action: "select_custom",
        });
      } else if (range?.from) {
        // Partial selection - update UI but don't call onChange yet
      }
    },
    [onChange]
  );

  // Get display label for current selection
  const getDisplayLabel = (): string => {
    if (!value) return "Select period";
    if (selectedPreset && selectedPreset !== "custom") {
      const shortcut = RELATIVE_DATE_SHORTCUTS.find((s) => s.preset === selectedPreset);
      return shortcut?.label || formatCustomPeriodLabel(value.start, value.end);
    }
    return formatCustomPeriodLabel(value.start, value.end);
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Preset Shortcuts */}
      {showShortcuts && (
        <div className="flex flex-wrap gap-2">
          {RELATIVE_DATE_SHORTCUTS.map(({ label, preset }) => (
            <button
              key={preset}
              type="button"
              onClick={() => handlePresetClick(preset)}
              className={`
                px-3 py-1.5 text-xs font-medium rounded-full border transition-colors
                ${
                  selectedPreset === preset
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                }
              `}
            >
              {label}
            </button>
          ))}
          {/* Custom button */}
          <button
            type="button"
            onClick={() => handlePresetClick("custom")}
            className={`
              px-3 py-1.5 text-xs font-medium rounded-full border transition-colors
              ${
                selectedPreset === "custom" || showCustomPicker
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
              }
            `}
          >
            Custom...
          </button>
        </div>
      )}

      {/* Custom Date Picker */}
      {showCustomPicker && (
        <div className="mt-2">
          <DateRangePicker
            date={dateRangeValue}
            onSelect={handleCustomRangeSelect}
            className={compact ? "scale-90 origin-top-left" : ""}
          />
        </div>
      )}

      {/* Current Selection Display */}
      {value && !showCustomPicker && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Selected:</span>
          <span className="font-medium text-foreground">{getDisplayLabel()}</span>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setSelectedPreset(null);
              setShowCustomPicker(false);
            }}
            className="text-muted-foreground hover:text-foreground text-xs ml-2"
            title="Clear selection"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

export default ShareDateRangePicker;
