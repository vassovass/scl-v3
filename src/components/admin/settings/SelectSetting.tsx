"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectSettingProps {
  label: string;
  description?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Dropdown select setting for predefined options
 * PRD-26: SuperAdmin Settings & Feature Flags
 */
export function SelectSetting({
  label,
  description,
  value,
  options,
  onChange,
  disabled,
  placeholder = "Select an option",
}: SelectSettingProps) {
  const fieldId = label.toLowerCase().replace(/\s+/g, "-");

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
        <Select value={value} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger id={fieldId} className="w-40">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
