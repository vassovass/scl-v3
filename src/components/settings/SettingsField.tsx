"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SettingsFieldProps {
    label: string;
    description?: string;
    type?: "text" | "email" | "number" | "date" | "textarea";
    value: string | number;
    onChange: (value: string | number) => void;
    disabled?: boolean;
    placeholder?: string;
    maxLength?: number;
    required?: boolean;
    id?: string;
}

/**
 * Reusable text/textarea input field for settings
 * Wraps shadcn Input/Textarea with consistent styling
 */
export function SettingsField({
    label,
    description,
    type = "text",
    value,
    onChange,
    disabled,
    placeholder,
    maxLength,
    required,
    id,
}: SettingsFieldProps) {
    const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");

    return (
        <div className="space-y-2">
            <Label htmlFor={fieldId}>
                {label}
                {required && <span className="text-destructive ml-1">*</span>}
            </Label>

            {type === "textarea" ? (
                <Textarea
                    id={fieldId}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    rows={3}
                    className="resize-none"
                />
            ) : (
                <Input
                    id={fieldId}
                    type={type}
                    value={value}
                    onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
                    disabled={disabled}
                    placeholder={placeholder}
                    maxLength={maxLength}
                />
            )}

            {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
            )}

            {maxLength && typeof value === "string" && (
                <p className="text-xs text-muted-foreground text-right">
                    {value.length}/{maxLength}
                </p>
            )}
        </div>
    );
}
