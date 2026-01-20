"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface SettingsToggleProps {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    id?: string;
}

/**
 * Reusable toggle/switch field for boolean settings
 * Wraps shadcn Switch with consistent styling
 */
export function SettingsToggle({
    label,
    description,
    checked,
    onChange,
    disabled,
    id,
}: SettingsToggleProps) {
    const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");

    return (
        <div className="flex items-center justify-between space-x-4">
            <div className="flex-1 space-y-1">
                <Label htmlFor={fieldId} className="cursor-pointer">
                    {label}
                </Label>
                {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                )}
            </div>
            <Switch
                id={fieldId}
                checked={checked}
                onCheckedChange={onChange}
                disabled={disabled}
            />
        </div>
    );
}

