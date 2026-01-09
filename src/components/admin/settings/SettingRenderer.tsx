"use client";

import { NumberSetting } from "./NumberSetting";
import { BooleanSetting } from "./BooleanSetting";
import { SelectSetting } from "./SelectSetting";

interface SelectOption {
  value: string;
  label: string;
}

interface SettingRendererProps {
  settingKey: string;
  label: string;
  description?: string;
  type: string;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  options?: SelectOption[];
  constraints?: {
    min?: number;
    max?: number;
  };
}

/**
 * Dynamic setting renderer that picks the correct component based on type
 * PRD-26: SuperAdmin Settings & Feature Flags
 */
export function SettingRenderer({
  settingKey,
  label,
  description,
  type,
  value,
  onChange,
  disabled,
  options,
  constraints,
}: SettingRendererProps) {
  switch (type) {
    case "number":
      return (
        <NumberSetting
          label={label}
          description={description}
          value={typeof value === "number" ? value : parseInt(String(value), 10) || 0}
          onChange={onChange}
          disabled={disabled}
          min={constraints?.min}
          max={constraints?.max}
        />
      );

    case "boolean":
    case "toggle":
      return (
        <BooleanSetting
          label={label}
          description={description}
          checked={value === true || value === "true"}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case "select":
      // Handle select - value might be a string or an object
      let selectValue = "";
      if (typeof value === "string") {
        // Remove quotes if JSON string
        selectValue = value.replace(/^"|"$/g, "");
      } else if (typeof value === "object" && value !== null) {
        // For complex values like development_stage, extract the key property
        selectValue = (value as Record<string, unknown>).stage as string || "";
      }
      return (
        <SelectSetting
          label={label}
          description={description}
          value={selectValue}
          options={options || []}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case "json":
    case "textarea":
      // For JSON settings, show read-only display (complex editing not needed for most cases)
      return (
        <div className="space-y-2">
          <div className="flex-1 space-y-1">
            <label className="text-sm font-medium text-foreground">{label}</label>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="p-3 bg-muted/50 rounded-md border border-border">
            <pre className="text-xs text-muted-foreground overflow-auto max-h-32">
              {typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}
            </pre>
          </div>
        </div>
      );

    default:
      // Text input for unknown types
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium text-foreground">{label}</label>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
            <input
              type="text"
              value={String(value || "")}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              className="w-48 px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm"
            />
          </div>
        </div>
      );
  }
}
