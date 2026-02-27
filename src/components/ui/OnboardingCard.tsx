"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type CardVariant = "welcome" | "action" | "warning" | "info";

interface OnboardingCardProps {
    /** Visual variant controlling accent colors */
    variant: CardVariant;
    /** Emoji or icon string shown before the title */
    icon?: string;
    /** Card title */
    title: string;
    /** Card description text or React node */
    description: React.ReactNode;
    /** Optional call to action */
    cta?: {
        label: string;
        href: string;
        onClick?: () => void;
    };
    /** Optional dismiss handler */
    onDismiss?: () => void;
    /** Additional className */
    className?: string;
    /** Children rendered below description */
    children?: React.ReactNode;
    /** data-tour attribute for tour system targeting */
    dataTour?: string;
}

const variantStyles: Record<CardVariant, string> = {
    welcome: "border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--primary)/0.05)]",
    action: "border-[hsl(var(--success)/0.3)] bg-[hsl(var(--success)/0.05)]",
    warning: "border-[hsl(var(--warning)/0.3)] bg-[hsl(var(--warning)/0.05)]",
    info: "border-[hsl(var(--info)/0.3)] bg-[hsl(var(--info)/0.05)]",
};

const ctaStyles: Record<CardVariant, string> = {
    welcome: "bg-primary text-primary-foreground hover:bg-primary/90",
    action: "bg-[hsl(var(--success))] text-white hover:bg-[hsl(var(--success)/0.9)]",
    warning: "bg-[hsl(var(--warning))] text-white hover:bg-[hsl(var(--warning)/0.9)]",
    info: "bg-[hsl(var(--info))] text-white hover:bg-[hsl(var(--info)/0.9)]",
};

/**
 * Reusable card for onboarding, engagement prompts, and informational content.
 *
 * Built on shadcn Card with variant-based accent colors using CSS variables.
 * Used by PRD 60 (onboarding), PRD 28 (engagement prompts).
 */
export function OnboardingCard({
    variant,
    icon,
    title,
    description,
    cta,
    onDismiss,
    className,
    children,
    dataTour,
}: OnboardingCardProps) {
    return (
        <Card
            className={cn(variantStyles[variant], "relative", className)}
            data-tour={dataTour}
        >
            <CardContent className="p-4 sm:p-6">
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Dismiss"
                    >
                        <span className="text-lg">&times;</span>
                    </button>
                )}

                <div className="flex items-start gap-3 sm:gap-4">
                    {icon && (
                        <span className="flex-shrink-0 text-2xl" aria-hidden="true">
                            {icon}
                        </span>
                    )}

                    <div className="min-w-0 flex-1 space-y-2">
                        <h3 className="text-sm font-semibold text-foreground sm:text-base">
                            {title}
                        </h3>

                        <div className="text-sm text-muted-foreground">
                            {description}
                        </div>

                        {children}

                        {cta && (
                            <div className="pt-2">
                                <Link
                                    href={cta.href}
                                    onClick={cta.onClick}
                                    className={cn(
                                        "inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium transition",
                                        ctaStyles[variant]
                                    )}
                                >
                                    {cta.label}
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
