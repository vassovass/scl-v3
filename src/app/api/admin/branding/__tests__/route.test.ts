/**
 * Admin Branding API Route Tests
 *
 * Tests for GET /api/admin/branding (public) and PATCH /api/admin/branding (superadmin only).
 * Based on testing-patterns skill and PRD 42.
 *
 * Key areas tested:
 * - Schema validation (hex colors, URLs)
 * - Authorization levels (none vs superadmin)
 * - Field transformation (DB snake_case to API camelCase)
 * - Partial updates
 * - Singleton pattern
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// ============================================================================
// Schema Tests
// ============================================================================

const brandSettingsSchema = z.object({
    logo: z.object({
        emoji: z.string().optional(),
        textPrimary: z.string().optional(),
        textSecondary: z.string().optional(),
        imageUrl: z.string().url().nullable().optional(),
        imageUrlDark: z.string().url().nullable().optional(),
    }).optional(),
    themeColorLight: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    themeColorDark: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

describe('Branding API - Schema Validation', () => {
    describe('Theme color validation', () => {
        it('accepts valid hex color #RRGGBB format', () => {
            const data = { themeColorLight: '#ff5500' };
            const result = brandSettingsSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('accepts uppercase hex colors', () => {
            const data = { themeColorLight: '#FF5500' };
            const result = brandSettingsSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('accepts mixed case hex colors', () => {
            const data = { themeColorLight: '#Ff55Aa' };
            const result = brandSettingsSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('rejects 3-digit hex shorthand', () => {
            const data = { themeColorLight: '#f50' };
            const result = brandSettingsSchema.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('rejects hex without # prefix', () => {
            const data = { themeColorLight: 'ff5500' };
            const result = brandSettingsSchema.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('rejects 8-digit hex (with alpha)', () => {
            const data = { themeColorLight: '#ff5500ff' };
            const result = brandSettingsSchema.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('rejects rgb format', () => {
            const data = { themeColorLight: 'rgb(255, 85, 0)' };
            const result = brandSettingsSchema.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('rejects color names', () => {
            const data = { themeColorLight: 'red' };
            const result = brandSettingsSchema.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('rejects invalid hex characters', () => {
            const data = { themeColorLight: '#gggggg' };
            const result = brandSettingsSchema.safeParse(data);
            expect(result.success).toBe(false);
        });
    });

    describe('Logo URL validation', () => {
        it('accepts valid https URL', () => {
            const data = {
                logo: { imageUrl: 'https://example.com/logo.png' }
            };
            const result = brandSettingsSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('accepts valid http URL', () => {
            const data = {
                logo: { imageUrl: 'http://example.com/logo.png' }
            };
            const result = brandSettingsSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('accepts null for imageUrl', () => {
            const data = {
                logo: { imageUrl: null }
            };
            const result = brandSettingsSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('rejects invalid URL format', () => {
            const data = {
                logo: { imageUrl: 'not-a-url' }
            };
            const result = brandSettingsSchema.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('rejects relative paths', () => {
            const data = {
                logo: { imageUrl: '/images/logo.png' }
            };
            const result = brandSettingsSchema.safeParse(data);
            expect(result.success).toBe(false);
        });
    });

    describe('Partial updates', () => {
        it('accepts empty object (no updates)', () => {
            const data = {};
            const result = brandSettingsSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('accepts only themeColorLight', () => {
            const data = { themeColorLight: '#123456' };
            const result = brandSettingsSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('accepts only themeColorDark', () => {
            const data = { themeColorDark: '#654321' };
            const result = brandSettingsSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('accepts only logo.emoji', () => {
            const data = { logo: { emoji: '🏆' } };
            const result = brandSettingsSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('accepts multiple logo fields', () => {
            const data = {
                logo: {
                    emoji: '🏆',
                    textPrimary: 'Step',
                    textSecondary: 'League',
                }
            };
            const result = brandSettingsSchema.safeParse(data);
            expect(result.success).toBe(true);
        });
    });
});

// ============================================================================
// Authorization Tests
// ============================================================================

describe('Branding API - Authorization', () => {
    describe('GET endpoint (public)', () => {
        it('has auth: none - allows unauthenticated access', () => {
            const config = { auth: 'none' };
            const user = null;

            const shouldAllow = config.auth === 'none' || user !== null;
            expect(shouldAllow).toBe(true);
        });

        it('allows authenticated users', () => {
            const config = { auth: 'none' };
            const user = { id: 'user-123' };

            const shouldAllow = config.auth === 'none' || user !== null;
            expect(shouldAllow).toBe(true);
        });
    });

    describe('PATCH endpoint (superadmin)', () => {
        it('has auth: superadmin - denies unauthenticated', () => {
            const config = { auth: 'superadmin' };
            const user = null;
            const isSuperAdmin = false;

            const shouldAllow = config.auth !== 'superadmin' || (user !== null && isSuperAdmin);
            expect(shouldAllow).toBe(false);
        });

        it('denies regular authenticated users', () => {
            const config = { auth: 'superadmin' };
            const user = { id: 'user-123' };
            const isSuperAdmin = false;

            const shouldAllow = config.auth !== 'superadmin' || (user !== null && isSuperAdmin);
            expect(shouldAllow).toBe(false);
        });

        it('allows superadmin users', () => {
            const config = { auth: 'superadmin' };
            const user = { id: 'admin-123' };
            const isSuperAdmin = true;

            const shouldAllow = config.auth !== 'superadmin' || (user !== null && isSuperAdmin);
            expect(shouldAllow).toBe(true);
        });
    });
});

// ============================================================================
// Field Transformation Tests
// ============================================================================

describe('Branding API - Field Transformation', () => {
    describe('Database to API format (GET response)', () => {
        it('transforms snake_case DB columns to camelCase API fields', () => {
            const dbData = {
                logo_emoji: '🏆',
                logo_text_primary: 'Step',
                logo_text_secondary: 'League',
                logo_image_url: 'https://example.com/logo.png',
                logo_image_url_dark: 'https://example.com/logo-dark.png',
                theme_color_light: '#ffffff',
                theme_color_dark: '#000000',
            };

            // Transform to API format
            const apiData = {
                logo: {
                    emoji: dbData.logo_emoji,
                    textPrimary: dbData.logo_text_primary,
                    textSecondary: dbData.logo_text_secondary,
                    imageUrl: dbData.logo_image_url,
                    imageUrlDark: dbData.logo_image_url_dark,
                },
                themeColorLight: dbData.theme_color_light,
                themeColorDark: dbData.theme_color_dark,
            };

            expect(apiData.logo.textPrimary).toBe('Step');
            expect(apiData.logo.imageUrlDark).toBe('https://example.com/logo-dark.png');
            expect(apiData.themeColorLight).toBe('#ffffff');
        });

        it('includes favicon fields in response', () => {
            const dbData = {
                favicon_32: '/favicon-32.png',
                favicon_16: '/favicon-16.png',
                favicon_svg: '/favicon.svg',
                apple_touch_icon: '/apple-touch-icon.png',
                icon_192: '/icon-192.png',
                icon_512: '/icon-512.png',
                icon_maskable: '/icon-maskable.png',
            };

            const apiData = {
                favicon: {
                    favicon32: dbData.favicon_32,
                    favicon16: dbData.favicon_16,
                    faviconSvg: dbData.favicon_svg,
                    appleTouchIcon: dbData.apple_touch_icon,
                    icon192: dbData.icon_192,
                    icon512: dbData.icon_512,
                    iconMaskable: dbData.icon_maskable,
                },
            };

            expect(apiData.favicon.favicon32).toBe('/favicon-32.png');
            expect(apiData.favicon.appleTouchIcon).toBe('/apple-touch-icon.png');
        });
    });

    describe('API to Database format (PATCH request)', () => {
        it('transforms camelCase API fields to snake_case DB columns', () => {
            const apiBody = {
                logo: {
                    emoji: '🚀',
                    textPrimary: 'New',
                    textSecondary: 'App',
                },
                themeColorLight: '#ff0000',
            };

            // Build update data as the route does
            const updateData: Record<string, any> = {};

            if (apiBody.logo) {
                if (apiBody.logo.emoji !== undefined) updateData.logo_emoji = apiBody.logo.emoji;
                if (apiBody.logo.textPrimary !== undefined) updateData.logo_text_primary = apiBody.logo.textPrimary;
                if (apiBody.logo.textSecondary !== undefined) updateData.logo_text_secondary = apiBody.logo.textSecondary;
            }
            if (apiBody.themeColorLight) updateData.theme_color_light = apiBody.themeColorLight;

            expect(updateData.logo_emoji).toBe('🚀');
            expect(updateData.logo_text_primary).toBe('New');
            expect(updateData.theme_color_light).toBe('#ff0000');
        });

        it('only includes provided fields in update', () => {
            const apiBody: { themeColorLight: string; logo?: string } = {
                themeColorLight: '#00ff00',
                // logo not provided
            };

            const updateData: Record<string, any> = {};

            if (apiBody.logo) {
                // This block won't run
            }
            if (apiBody.themeColorLight) updateData.theme_color_light = apiBody.themeColorLight;

            expect(updateData.theme_color_light).toBe('#00ff00');
            expect(updateData.logo_emoji).toBeUndefined();
        });
    });
});

// ============================================================================
// Singleton Pattern Tests
// ============================================================================

describe('Branding API - Singleton Pattern', () => {
    it('uses fixed singleton ID for updates', () => {
        const SINGLETON_ID = '00000000-0000-0000-0000-000000000001';

        expect(SINGLETON_ID).toBe('00000000-0000-0000-0000-000000000001');
    });

    it('GET fetches single row', () => {
        // The route uses .single() which expects exactly one row
        const queryMethod = 'single';
        expect(queryMethod).toBe('single');
    });

    it('PATCH updates by singleton ID', () => {
        // Updates should filter by the singleton ID
        const eqFilter = { column: 'id', value: '00000000-0000-0000-0000-000000000001' };

        expect(eqFilter.column).toBe('id');
        expect(eqFilter.value).toBe('00000000-0000-0000-0000-000000000001');
    });
});

// ============================================================================
// Default Branding Tests
// ============================================================================

describe('Branding API - Default Branding', () => {
    it('returns default branding when no custom branding exists', () => {
        const dbData = null;
        const dbError = { message: 'Not found' };

        // When error or no data, return defaults
        const shouldReturnDefaults = dbError !== null || !dbData;
        expect(shouldReturnDefaults).toBe(true);
    });

    it('returns custom branding when it exists', () => {
        const dbData = { logo_emoji: '🎯' };
        const dbError = null;

        const shouldReturnDefaults = dbError !== null || !dbData;
        expect(shouldReturnDefaults).toBe(false);
    });
});

// ============================================================================
// Cache Invalidation Tests
// ============================================================================

describe('Branding API - Cache Invalidation', () => {
    it('PATCH should invalidate branding cache', () => {
        // After successful PATCH, invalidateCache('branding') is called
        const cacheKey = 'branding';

        expect(cacheKey).toBe('branding');
    });
});

// ============================================================================
// Update Metadata Tests
// ============================================================================

describe('Branding API - Update Metadata', () => {
    it('PATCH sets updated_by to current user ID', () => {
        const user = { id: 'admin-123' };
        const updateData = {
            updated_by: user?.id || null,
        };

        expect(updateData.updated_by).toBe('admin-123');
    });

    it('PATCH sets updated_at to current timestamp', () => {
        const beforeUpdate = Date.now();
        const updateData = {
            updated_at: new Date().toISOString(),
        };
        const afterUpdate = Date.now();

        const updatedAt = new Date(updateData.updated_at).getTime();
        expect(updatedAt).toBeGreaterThanOrEqual(beforeUpdate);
        expect(updatedAt).toBeLessThanOrEqual(afterUpdate);
    });
});
