/**
 * Logo Component
 *
 * Modular logo that reads from database branding settings.
 * Supports custom images or emoji/text logo with theme-aware colors.
 *
 * @example
 * // Full logo in header
 * <Logo size="md" />
 *
 * // Small logo in footer
 * <Logo size="sm" />
 *
 * // Icon only (no text)
 * <Logo size="lg" showText={false} />
 *
 * // Without link
 * <Logo size="md" href="" />
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useBranding } from '@/hooks/useBranding';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

interface LogoProps {
  /** Logo size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Link href (empty string for no link) */
  href?: string;
  /** Show text alongside icon/image */
  showText?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/** Size configuration for different variants */
const SIZE_CONFIG = {
  sm: {
    icon: 'text-base', // Emoji size
    text: 'text-sm',
    image: { width: 24, height: 24 },
  },
  md: {
    icon: 'text-xl',
    text: 'text-lg',
    image: { width: 32, height: 32 },
  },
  lg: {
    icon: 'text-2xl',
    text: 'text-xl',
    image: { width: 40, height: 40 },
  },
} as const;

export function Logo({
  size = 'md',
  href = '/dashboard',
  showText = true,
  className = '',
}: LogoProps) {
  const { branding } = useBranding();
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Wait for theme to be mounted (prevents hydration mismatch)
  useEffect(() => {
    setMounted(true);
  }, []);

  const { logo } = branding;
  const config = SIZE_CONFIG[size];

  // Determine current theme (light/dark)
  const currentTheme = mounted
    ? theme === 'system'
      ? systemTheme
      : theme
    : 'dark'; // Default to dark during SSR

  // Select appropriate logo image based on theme
  const logoImageUrl =
    currentTheme === 'dark' && logo.imageUrlDark
      ? logo.imageUrlDark
      : logo.imageUrl;

  // Logo content (icon/image + text)
  const content = (
    <div className={`group flex items-center gap-2 ${className}`}>
      {/* Logo Icon/Image */}
      {logoImageUrl ? (
        // Custom logo image
        <Image
          src={logoImageUrl}
          alt={`${logo.textPrimary}${logo.textSecondary}`}
          width={config.image.width}
          height={config.image.height}
          className="transition-transform duration-300 group-hover:scale-110"
          priority={size === 'md'} // Preload medium logo (header)
        />
      ) : (
        // Emoji logo with hover effects
        <span
          className={`${config.icon} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-10deg]`}
        >
          <span className="inline-block transition-all duration-300 group-hover:drop-shadow-[0_0_8px_hsl(var(--primary))]">
            {logo.emoji}
          </span>
        </span>
      )}

      {/* Logo Text (if enabled) */}
      {showText && (
        <span className={`${config.text} font-bold`}>
          <span className="text-foreground transition-colors duration-300 group-hover:text-primary">
            {logo.textPrimary}
          </span>
          <span className="text-primary transition-colors duration-300 group-hover:text-foreground">
            {logo.textSecondary}
          </span>
        </span>
      )}
    </div>
  );

  // If no href, return content without link
  if (!href) return content;

  // Wrap in link
  return <Link href={href}>{content}</Link>;
}
