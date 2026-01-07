"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface RadioOption {
    value: string;
    label: string;
    description?: string;
}

interface SettingsRadioGroupProps {
    label: string;
    description?: string;
    value: string;
    onChange: (value: string) => void;
    options: RadioOption[];
    disabled?: boolean;
    id?: string;
}

/**
 * Reusable radio button group for settings
 * Wraps shadcn RadioGroup with consistent styling and support for option descriptions
 */
export function SettingsRadioGroup({
    label,
    description,
    value,
    onChange,
    options,
    disabled,
    id,
}: SettingsRadioGroupProps) {
    const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");

    return (
        <div className="space-y-3">
            <div>
                <Label htmlFor={fieldId}>{label}</Label>
                {description && (
                    <p className="text-sm text-muted-foreground mt-1">{description}</p>
                )}
            </div>

            <RadioGroup
                value={value}
                onValueChange={onChange}
                disabled={disabled}
                className="space-y-3"
            >
                {options.map((option) => (
                    <div key={option.value} className="flex items-start space-x-3">
                        <RadioGroupItem value={option.value} id={`${fieldId}-${option.value}`} />
                        <div className="flex-1 space-y-1">
                            <Label
                                htmlFor={`${fieldId}-${option.value}`}
                                className="font-normal cursor-pointer"
                            >
                                {option.label}
                            </Label>
                            {option.description && (
                                <p className="text-sm text-muted-foreground">
                                    {option.description}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </RadioGroup>
        </div>
    );
}
