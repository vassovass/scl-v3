"use client";

import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";

/**
 * Logo Component - Single source of truth for StepLeague branding
 * 
 * Update this component to change the logo everywhere in the app.
 * Used in: NavHeader, GlobalFooter, and any future locations.
 * 
 * Features:
 * - Theme-aware icon (light/dark variants)
 * - Hover animations (scale, rotate, glow, color swap)
 * - Configurable size variants
 */

export interface LogoProps {
    /** Size variant - affects icon and text size */
    size?: 'sm' | 'md' | 'lg';
    /** Whether to show the text alongside the icon */
    showText?: boolean;
    /** Custom link href (defaults to /dashboard) */
    href?: string;
    /** Additional CSS classes */
    className?: string;
}

const sizeConfig = {
    sm: { icon: 20, text: 'text-sm', gap: 'gap-1.5' },
    md: { icon: 28, text: 'text-lg', gap: 'gap-2' },
    lg: { icon: 36, text: 'text-xl', gap: 'gap-2.5' },
};

export function Logo({
    size = 'md',
    showText = true,
    href = '/dashboard',
    className = ''
}: LogoProps) {
    const { resolvedTheme } = useTheme();
    const config = sizeConfig[size];

    // Theme-aware icon selection
    // Light theme: use dark icon (for contrast)
    // Dark theme: use light icon (for visibility)
    const iconSrc = resolvedTheme === 'light'
        ? '/favicon-32x32.png'
        : '/favicon-32x32-light.png';

    return (
        <Link
            href={href}
            className={`group flex items-center ${config.gap} ${className}`}
        >
            {/* Icon with hover animations */}
            <span className="relative transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-10deg]"
                style={{ width: config.icon, height: config.icon }}
            >
                <Image
                    src={iconSrc}
                    alt="StepLeague"
                    width={config.icon}
                    height={config.icon}
                    className="transition-all duration-300 group-hover:drop-shadow-[0_0_8px_hsl(var(--primary))]"
                    priority
                />
            </span>

            {/* Text with color-swap hover effect */}
            {showText && (
                <span className={`font-bold ${config.text}`}>
                    <span className="text-foreground transition-colors duration-300 group-hover:text-primary">
                        Step
                    </span>
                    <span className="text-primary transition-colors duration-300 group-hover:text-foreground">
                        League
                    </span>
                </span>
            )}
        </Link>
    );
}

/**
 * LogoIcon - Just the icon without text
 * Useful for favicons, app icons, mobile contexts
 */
export function LogoIcon({ size = 'md', className = '' }: Omit<LogoProps, 'showText'>) {
    return <Logo size={size} showText={false} href="#" className={className} />;
}
