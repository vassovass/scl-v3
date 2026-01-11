"use client";

import { useState, useEffect, useRef } from "react";
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

const DEBOUNCE_MS = 500;

/**
 * Reusable text/textarea input field for settings
 * Wraps shadcn Input/Textarea with consistent styling
 * Includes debounce to prevent excessive API calls while typing
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

    // Local state for immediate UI feedback
    const [localValue, setLocalValue] = useState<string>(String(value));
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Sync local value when prop changes
    useEffect(() => {
        setLocalValue(String(value));
    }, [value]);

    const handleChange = (newValue: string) => {
        setLocalValue(newValue);

        // Clear existing debounce timer
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        // Debounce the onChange callback
        debounceRef.current = setTimeout(() => {
            onChange(type === "number" ? Number(newValue) : newValue);
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
            <Label htmlFor={fieldId}>
                {label}
                {required && <span className="text-destructive ml-1">*</span>}
            </Label>

            {type === "textarea" ? (
                <Textarea
                    id={fieldId}
                    value={localValue}
                    onChange={(e) => handleChange(e.target.value)}
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
                    value={localValue}
                    onChange={(e) => handleChange(e.target.value)}
                    disabled={disabled}
                    placeholder={placeholder}
                    maxLength={maxLength}
                />
            )}

            {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
            )}

            {maxLength && typeof localValue === "string" && (
                <p className="text-xs text-muted-foreground text-right">
                    {localValue.length}/{maxLength}
                </p>
            )}
        </div>
    );
}
