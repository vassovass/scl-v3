"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

// =============================================================================
// Shared Types
// =============================================================================

interface BaseFormFieldProps {
    /** Unique field name - used to auto-generate id and name attributes */
    fieldName: string;
    /** Optional label text */
    label?: string;
    /** Optional error message */
    error?: string;
    /** Optional hint text below the input */
    hint?: string;
    /** Additional container className */
    containerClassName?: string;
}

// =============================================================================
// FormInput - Text, Number, Date, Email, etc.
// =============================================================================

interface FormInputProps extends BaseFormFieldProps,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id' | 'name'> { }

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
    ({ fieldName, label, error, hint, containerClassName, className, ...props }, ref) => {
        const inputId = `form-${fieldName}`;

        return (
            <div className={cn("flex flex-col gap-1.5", containerClassName)}>
                {label && (
                    <label
                        htmlFor={inputId}
                        className="text-sm font-medium text-foreground"
                    >
                        {label}
                        {props.required && <span className="text-destructive ml-1">*</span>}
                    </label>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    name={fieldName}
                    aria-describedby={hint ? `${inputId}-hint` : undefined}
                    aria-invalid={error ? "true" : undefined}
                    className={cn(
                        "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground",
                        "placeholder:text-muted-foreground",
                        "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        error && "border-destructive focus:border-destructive focus:ring-destructive",
                        className
                    )}
                    {...props}
                />
                {hint && !error && (
                    <p id={`${inputId}-hint`} className="text-xs text-muted-foreground">
                        {hint}
                    </p>
                )}
                {error && (
                    <p className="text-xs text-destructive" role="alert">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);
FormInput.displayName = "FormInput";

// =============================================================================
// FormSelect - Dropdown select
// =============================================================================

interface FormSelectProps extends BaseFormFieldProps,
    Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'name'> {
    children: React.ReactNode;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
    ({ fieldName, label, error, hint, containerClassName, className, children, ...props }, ref) => {
        const selectId = `form-${fieldName}`;

        return (
            <div className={cn("flex flex-col gap-1.5", containerClassName)}>
                {label && (
                    <label
                        htmlFor={selectId}
                        className="text-sm font-medium text-foreground"
                    >
                        {label}
                        {props.required && <span className="text-destructive ml-1">*</span>}
                    </label>
                )}
                <select
                    ref={ref}
                    id={selectId}
                    name={fieldName}
                    aria-describedby={hint ? `${selectId}-hint` : undefined}
                    aria-invalid={error ? "true" : undefined}
                    className={cn(
                        "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground",
                        "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        error && "border-destructive focus:border-destructive focus:ring-destructive",
                        className
                    )}
                    {...props}
                >
                    {children}
                </select>
                {hint && !error && (
                    <p id={`${selectId}-hint`} className="text-xs text-muted-foreground">
                        {hint}
                    </p>
                )}
                {error && (
                    <p className="text-xs text-destructive" role="alert">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);
FormSelect.displayName = "FormSelect";

// =============================================================================
// FormCheckbox - Checkbox with label
// =============================================================================

interface FormCheckboxProps extends BaseFormFieldProps,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id' | 'name' | 'type'> {
    /** Checkbox position relative to label */
    checkboxPosition?: "left" | "right";
}

export const FormCheckbox = forwardRef<HTMLInputElement, FormCheckboxProps>(
    ({ fieldName, label, error, hint, containerClassName, className, checkboxPosition = "left", ...props }, ref) => {
        const checkboxId = `form-${fieldName}`;

        const checkbox = (
            <input
                ref={ref}
                type="checkbox"
                id={checkboxId}
                name={fieldName}
                aria-describedby={hint ? `${checkboxId}-hint` : undefined}
                aria-invalid={error ? "true" : undefined}
                className={cn(
                    "h-4 w-4 rounded border-input bg-background text-primary",
                    "focus:ring-primary focus:ring-offset-0",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    error && "border-destructive",
                    className
                )}
                {...props}
            />
        );

        return (
            <div className={cn("flex flex-col gap-1", containerClassName)}>
                <div className="flex items-center gap-2">
                    {checkboxPosition === "left" && checkbox}
                    {label && (
                        <label
                            htmlFor={checkboxId}
                            className="text-sm text-foreground cursor-pointer select-none"
                        >
                            {label}
                        </label>
                    )}
                    {checkboxPosition === "right" && checkbox}
                </div>
                {hint && !error && (
                    <p id={`${checkboxId}-hint`} className="text-xs text-muted-foreground ml-6">
                        {hint}
                    </p>
                )}
                {error && (
                    <p className="text-xs text-destructive ml-6" role="alert">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);
FormCheckbox.displayName = "FormCheckbox";

// =============================================================================
// FormTextarea - Multi-line text input
// =============================================================================

interface FormTextareaProps extends BaseFormFieldProps,
    Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'name'> { }

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
    ({ fieldName, label, error, hint, containerClassName, className, ...props }, ref) => {
        const textareaId = `form-${fieldName}`;

        return (
            <div className={cn("flex flex-col gap-1.5", containerClassName)}>
                {label && (
                    <label
                        htmlFor={textareaId}
                        className="text-sm font-medium text-foreground"
                    >
                        {label}
                        {props.required && <span className="text-destructive ml-1">*</span>}
                    </label>
                )}
                <textarea
                    ref={ref}
                    id={textareaId}
                    name={fieldName}
                    aria-describedby={hint ? `${textareaId}-hint` : undefined}
                    aria-invalid={error ? "true" : undefined}
                    className={cn(
                        "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground",
                        "placeholder:text-muted-foreground",
                        "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
                        "disabled:cursor-not-allowed disabled:opacity-50 resize-y min-h-[80px]",
                        error && "border-destructive focus:border-destructive focus:ring-destructive",
                        className
                    )}
                    {...props}
                />
                {hint && !error && (
                    <p id={`${textareaId}-hint`} className="text-xs text-muted-foreground">
                        {hint}
                    </p>
                )}
                {error && (
                    <p className="text-xs text-destructive" role="alert">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);
FormTextarea.displayName = "FormTextarea";

// =============================================================================
// FormFileInput - File upload input
// =============================================================================

interface FormFileInputProps extends BaseFormFieldProps,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id' | 'name' | 'type'> { }

export const FormFileInput = forwardRef<HTMLInputElement, FormFileInputProps>(
    ({ fieldName, label, error, hint, containerClassName, className, ...props }, ref) => {
        const inputId = `form-${fieldName}`;

        return (
            <div className={cn("flex flex-col gap-1.5", containerClassName)}>
                {label && (
                    <label
                        htmlFor={inputId}
                        className="text-sm font-medium text-foreground"
                    >
                        {label}
                        {props.required && <span className="text-destructive ml-1">*</span>}
                    </label>
                )}
                <input
                    ref={ref}
                    type="file"
                    id={inputId}
                    name={fieldName}
                    aria-describedby={hint ? `${inputId}-hint` : undefined}
                    aria-invalid={error ? "true" : undefined}
                    className={cn(
                        "text-sm text-foreground",
                        "file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5",
                        "file:text-sm file:font-medium file:text-primary-foreground",
                        "hover:file:bg-primary/90",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        className
                    )}
                    {...props}
                />
                {hint && !error && (
                    <p id={`${inputId}-hint`} className="text-xs text-muted-foreground">
                        {hint}
                    </p>
                )}
                {error && (
                    <p className="text-xs text-destructive" role="alert">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);
FormFileInput.displayName = "FormFileInput";

