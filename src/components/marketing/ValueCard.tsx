/**
 * ValueCard Component
 *
 * Reusable marketing section card with icon, tag, title, description, and bullet points.
 * Used across public marketing pages (why-upload, how-to-share, etc.)
 *
 * @module components/marketing/ValueCard
 */

import React from "react";

export interface ValueCardProps {
    /** Lucide icon component */
    icon: React.ComponentType<{ className?: string }>;
    /** Tag text displayed in the badge */
    tagText: string;
    /** Tag text color (Tailwind class, e.g., "text-sky-400") */
    tagColor: string;
    /** Tag background color (Tailwind class, e.g., "bg-sky-500/10") */
    tagBg: string;
    /** Section title */
    title: string;
    /** Section description */
    description: string;
    /** Bullet points list */
    bullets: string[];
    /** Reverse layout (icon on left instead of right) */
    reverse?: boolean;
    /** Optional custom icon display content */
    iconContent?: React.ReactNode;
}

export function ValueCard({
    icon: Icon,
    tagText,
    tagColor,
    tagBg,
    title,
    description,
    bullets,
    reverse,
    iconContent,
}: ValueCardProps) {
    return (
        <div
            className={`bg-card border border-border rounded-3xl p-8 lg:p-12 flex flex-col ${
                reverse ? "md:flex-row-reverse" : "md:flex-row"
            } items-center gap-12`}
        >
            <div className="flex-1">
                <div
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${tagBg} ${tagColor} text-sm font-semibold mb-6`}
                >
                    <Icon className="w-4 h-4" />
                    <span>{tagText}</span>
                </div>
                <h2 className="text-3xl font-bold mb-4">{title}</h2>
                <p className="text-lg text-muted-foreground mb-6">{description}</p>
                <ul className="space-y-3">
                    {bullets.map((bullet, i) => (
                        <li key={i} className="flex items-start gap-3 text-muted-foreground">
                            <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                            <span>{bullet}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="flex-shrink-0 w-full md:w-64 aspect-square bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center border border-border">
                {iconContent ?? <Icon className="w-24 h-24 text-primary/50" />}
            </div>
        </div>
    );
}
