/**
 * Centralized branding configuration for logos and favicons.
 *
 * This file provides:
 * - Default branding values (fallback when database is unavailable)
 * - Type definitions for brand settings
 * - Helper functions for branding operations
 * - Cached server-side fetcher for SSR metadata (fixes GTmetrix/PageSpeed timeouts)
 *
 * SuperAdmins can customize branding via /admin/branding settings page.
 * Database values override these defaults.
 */

export interface LogoBranding {
  /** Logo emoji/icon (e.g., "👟") */
  emoji: string;
  /** First part of logo text (e.g., "Step") */
  textPrimary: string;
  /** Second part of logo text (e.g., "League") */
  textSecondary: string;
  /** Custom logo image URL (optional, overrides emoji if set) */
  imageUrl?: string;
  /** Custom logo image URL for dark mode (optional) */
  imageUrlDark?: string;
}

export interface FaviconBranding {
  /** Primary favicon (32x32 PNG or ICO) */
  favicon32: string;
  /** Small favicon (16x16 PNG) */
  favicon16: string;
  /** SVG favicon with theme support (recommended) */
  faviconSvg?: string;
  /** Apple touch icon (180x180 PNG) */
  appleTouchIcon: string;
  /** PWA icon 192x192 */
  icon192: string;
  /** PWA icon 512x512 */
  icon512: string;
  /** Maskable icon for Android adaptive icons (512x512) */
  iconMaskable?: string;
}

export interface BrandSettings {
  logo: LogoBranding;
  favicon: FaviconBranding;
  /** Theme color for light mode */
  themeColorLight: string;
  /** Theme color for dark mode */
  themeColorDark: string;
  /** Last updated timestamp */
  updatedAt?: string;
  /** User who last updated */
  updatedBy?: string;
}

/**
 * Default branding configuration.
 * These values are used as fallback when database is unavailable.
 */
export const DEFAULT_BRANDING: BrandSettings = {
  logo: {
    emoji: '👟',
    textPrimary: 'Step',
    textSecondary: 'League',
  },
  favicon: {
    favicon32: '/favicon.ico',           // Multi-size ICO (16x16, 32x32)
    favicon16: '/favicon.ico',           // Multi-size ICO
    faviconSvg: undefined,               // No SVG file exists
    appleTouchIcon: '/apple-icon.png',   // 180x180 PNG
    icon192: '/icon.png',                // 512x512 PNG (browser will resize)
    icon512: '/icon.png',                // 512x512 PNG (native size)
  },
  themeColorLight: '#ffffff',
  themeColorDark: '#020617',
};

/**
 * Required icon sizes for favicons and PWA icons.
 * Used for image generation and validation.
 */
export const ICON_SIZES = {
  favicon: [16, 32, 48],
  apple: [180],
  pwa: [192, 512],
  maskable: [512],
} as const;

/**
 * Allowed image formats for uploaded icons/logos.
 */
export const ALLOWED_IMAGE_FORMATS = {
  mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
  extensions: ['.png', '.jpg', '.jpeg', '.webp', '.svg'],
} as const;

/**
 * Max file size for image uploads (5MB).
 */
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/**
 * Get the full logo text (combines primary + secondary).
 */
export function getFullLogoText(branding: BrandSettings): string {
  return `${branding.logo.textPrimary}${branding.logo.textSecondary}`;
}

/**
 * Check if custom logo images are being used (vs emoji).
 */
export function hasCustomLogoImage(branding: BrandSettings): boolean {
  return Boolean(branding.logo.imageUrl);
}

/**
 * Get the appropriate logo image URL based on theme.
 */
export function getLogoImageUrl(branding: BrandSettings, theme: 'light' | 'dark'): string | undefined {
  if (theme === 'dark' && branding.logo.imageUrlDark) {
    return branding.logo.imageUrlDark;
  }
  return branding.logo.imageUrl;
}

/**
 * Validate image file before upload.
 * Throws error if validation fails.
 */
export function validateImageFile(file: File): void {
  // Check file size
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(`File exceeds ${MAX_IMAGE_SIZE / 1024 / 1024}MB limit`);
  }

  // Check file extension
  const ext = ('.' + file.name.split('.').pop()?.toLowerCase()) as string;
  if (!ALLOWED_IMAGE_FORMATS.extensions.includes(ext as any)) {
    throw new Error(`Invalid file extension. Allowed: ${ALLOWED_IMAGE_FORMATS.extensions.join(', ')}`);
  }

  // Check MIME type
  if (!ALLOWED_IMAGE_FORMATS.mimeTypes.includes(file.type as any)) {
    throw new Error(`Invalid file type. Allowed: ${ALLOWED_IMAGE_FORMATS.mimeTypes.join(', ')}`);
  }
}

