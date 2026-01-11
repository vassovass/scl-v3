"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NumberSettingProps {
  label: string;
  description?: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
}

const DEBOUNCE_MS = 500;

/**
 * Number input setting with optional min/max constraints
 * Includes debounce to prevent API calls on every keystroke
 * PRD-26: SuperAdmin Settings & Feature Flags
 */
export function NumberSetting({
  label,
  description,
  value,
  onChange,
  disabled,
  min,
  max,
}: NumberSettingProps) {
  const fieldId = label.toLowerCase().replace(/\s+/g, "-");

  // Local state for immediate UI feedback
  const [localValue, setLocalValue] = useState<string>(String(value));
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local value when prop changes (e.g., from server)
  useEffect(() => {
    setLocalValue(String(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setLocalValue(inputValue);

    // Clear existing debounce timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce the onChange callback
    debounceRef.current = setTimeout(() => {
      const newValue = parseInt(inputValue, 10);
      if (isNaN(newValue)) return;

      // Apply constraints
      let constrainedValue = newValue;
      if (min !== undefined && newValue < min) constrainedValue = min;
      if (max !== undefined && newValue > max) constrainedValue = max;

      onChange(constrainedValue);
    }, DEBOUNCE_MS);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-1">
          <Label htmlFor={fieldId} className="text-sm font-medium text-foreground">
            {label}
          </Label>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Input
            id={fieldId}
            type="number"
            value={localValue}
            onChange={handleChange}
            disabled={disabled}
            min={min}
            max={max}
            className="w-24 text-right"
          />
          {(min !== undefined || max !== undefined) && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {min !== undefined && max !== undefined
                ? `${min}-${max}`
                : min !== undefined
                  ? `min: ${min}`
                  : `max: ${max}`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
