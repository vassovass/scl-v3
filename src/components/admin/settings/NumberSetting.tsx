"use client";

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

/**
 * Number input setting with optional min/max constraints
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    if (isNaN(newValue)) return;

    // Apply constraints
    let constrainedValue = newValue;
    if (min !== undefined && newValue < min) constrainedValue = min;
    if (max !== undefined && newValue > max) constrainedValue = max;

    onChange(constrainedValue);
  };

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
            value={value}
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
