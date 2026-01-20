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

interface SettingsSelectProps {
    label: string;
    description?: string;
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    disabled?: boolean;
    placeholder?: string;
    id?: string;
}

/**
 * Reusable select dropdown field for settings
 * Wraps shadcn Select with consistent styling
 */
export function SettingsSelect({
    label,
    description,
    value,
    onChange,
    options,
    disabled,
    placeholder,
    id,
}: SettingsSelectProps) {
    const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");

    return (
        <div className="space-y-2">
            <Label htmlFor={fieldId}>{label}</Label>

            <Select value={value} onValueChange={onChange} disabled={disabled}>
                <SelectTrigger id={fieldId}>
                    <SelectValue placeholder={placeholder || "Select an option..."} />
                </SelectTrigger>
                <SelectContent>
                    {options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
            )}
        </div>
    );
}

