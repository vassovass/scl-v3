/**
 * HeroSection Component
 *
 * Reusable hero section for public marketing pages.
 * Features a badge, headline, subtitle, and flexible CTA slot.
 *
 * @module components/marketing/HeroSection
 */

import React from "react";

export interface HeroSectionProps {
    /** Lucide icon component for the badge */
    badgeIcon: React.ComponentType<{ className?: string }>;
    /** Badge text */
    badgeText: string;
    /** Main headline (h1) */
    headline: string;
    /** Primary subtitle text */
    subtitle: string;
    /** Optional secondary subtitle text */
    secondarySubtitle?: string;
    /** CTA content (buttons, links, etc.) */
    children?: React.ReactNode;
    /** Additional className for the section */
    className?: string;
}

export function HeroSection({
    badgeIcon: BadgeIcon,
    badgeText,
    headline,
    subtitle,
    secondarySubtitle,
    children,
    className = "",
}: HeroSectionProps) {
    return (
        <section className={`px-6 lg:px-8 max-w-6xl mx-auto mb-24 ${className}`}>
            <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
                    <BadgeIcon className="w-4 h-4" />
                    <span>{badgeText}</span>
                </div>
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6">
                    {headline}
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
                    {subtitle}
                </p>
                {secondarySubtitle && (
                    <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                        {secondarySubtitle}
                    </p>
                )}
            </div>

            {/* CTA Slot */}
            {children}
        </section>
    );
}
