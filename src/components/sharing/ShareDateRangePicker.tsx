"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { DateRangePicker, SubmissionDateInfo } from "@/components/ui/DateRangePicker";
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
  /** Submission data for heatmap indicators */
  submissionData?: SubmissionDateInfo[];
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
  submissionData,
}: ShareDateRangePickerProps) {
  // Track which preset is selected (for highlighting)
  const [selectedPreset, setSelectedPreset] = useState<PeriodPreset | null>(null);
  // Track if custom picker is shown
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  // Track partial selection (start date only) for display
  const [partialFrom, setPartialFrom] = useState<Date | null>(null);
  // Track previous value to detect NEW complete selections
  const prevValueRef = useRef(value);

  // Close picker when a complete NEW selection is made (Fix 1: decouple from onClose callback)
  useEffect(() => {
    const hadCompleteRange = prevValueRef.current?.start && prevValueRef.current?.end;
    const hasCompleteRange = value?.start && value?.end;
    const isNewSelection = hasCompleteRange && (
      !hadCompleteRange ||
      value.start !== prevValueRef.current?.start ||
      value.end !== prevValueRef.current?.end
    );

    if (showCustomPicker && isNewSelection) {
      // Use a brief delay to ensure state updates propagate before closing
      const timer = setTimeout(() => {
        setShowCustomPicker(false);
        setPartialFrom(null);
      }, 50);
      return () => clearTimeout(timer);
    }

    prevValueRef.current = value;
  }, [value?.start, value?.end, showCustomPicker]);

  // Convert value to DateRange format for the picker
  const dateRangeValue: DateRange | undefined = value
    ? {
        from: new Date(value.start + "T00:00:00"),
        to: new Date(value.end + "T00:00:00"),
      }
    : partialFrom
    ? { from: partialFrom, to: undefined }
    : undefined;

  // Handle preset selection
  const handlePresetClick = useCallback(
    (preset: PeriodPreset) => {
      console.log('[ShareDateRangePicker] handlePresetClick:', preset);

      if (preset === "custom") {
        setShowCustomPicker(true);
        setSelectedPreset("custom");
        return;
      }

      const range = presetToDateRange(preset);
      if (range) {
        console.log('[ShareDateRangePicker] Preset range calculated:', range);
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
      console.log('[ShareDateRangePicker] handleCustomRangeSelect called:', {
        from: range?.from ? range.from.toISOString().slice(0, 10) : null,
        to: range?.to ? range.to.toISOString().slice(0, 10) : null,
        hasComplete: !!(range?.from && range?.to),
      });

      if (range?.from && range?.to) {
        // Complete range - call onChange and clear partial state
        const startStr = range.from.toISOString().slice(0, 10);
        const endStr = range.to.toISOString().slice(0, 10);
        console.log('[ShareDateRangePicker] Complete range, calling onChange:', { start: startStr, end: endStr });
        setPartialFrom(null);
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
        // Partial selection - track for display but don't call onChange
        console.log('[ShareDateRangePicker] Partial selection (start only), waiting for end');
        setPartialFrom(range.from);
      } else {
        // Selection cleared
        setPartialFrom(null);
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

  // Get label for partial selection (while picking end date)
  const getPartialLabel = (): string | null => {
    if (!partialFrom || value) return null;
    return `${format(partialFrom, "MMM d")} - ...`;
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

      {/* Current Selection Display - Shows complete selection or partial selection */}
      {(value || partialFrom) && (
        <div className="flex items-center gap-2 text-sm bg-primary/5 rounded-lg px-3 py-2 border border-primary/20">
          <span className="text-muted-foreground">📅</span>
          <span className="font-medium text-foreground">
            {value ? getDisplayLabel() : getPartialLabel()}
          </span>
          {partialFrom && !value && (
            <span className="text-xs text-muted-foreground italic ml-1">(selecting end date)</span>
          )}
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setSelectedPreset(null);
              setShowCustomPicker(false);
              setPartialFrom(null);
            }}
            className="text-muted-foreground hover:text-foreground text-xs ml-auto"
            title="Clear selection"
          >
            ✕
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
            submissionData={submissionData}
            disabledAfter={maxDate}
            // Don't use onClose here - we handle closing via useEffect when value becomes complete
            // This prevents the picker from closing before state propagates back to parent
            alwaysOpen={true}
          />
        </div>
      )}
    </div>
  );
}

export default ShareDateRangePicker;
