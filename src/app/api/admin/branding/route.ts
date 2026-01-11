/**
 * Brand Settings API
 *
 * GET: Fetch current brand settings (public)
 * PATCH: Update brand settings (superadmin only)
 */

import { withApiHandler } from '@/lib/api/handler';
import { z } from 'zod';
import { DEFAULT_BRANDING } from '@/lib/branding';

// Validation schema for PATCH requests
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

/**
 * GET /api/admin/branding
 * Returns current brand settings (public endpoint).
 */
export const GET = withApiHandler({
  auth: 'none', // Public endpoint - anyone can view branding
}, async ({ adminClient }) => {
  const { data, error } = await adminClient
    .from('brand_settings')
    .select('*')
    .single();

  if (error || !data) {
    // Return defaults if no custom branding exists
    return { data: DEFAULT_BRANDING };
  }

  // Transform database format to BrandSettings format
  return {
    data: {
      logo: {
        emoji: data.logo_emoji,
        textPrimary: data.logo_text_primary,
        textSecondary: data.logo_text_secondary,
        imageUrl: data.logo_image_url,
        imageUrlDark: data.logo_image_url_dark,
      },
      favicon: {
        favicon32: data.favicon_32,
        favicon16: data.favicon_16,
        faviconSvg: data.favicon_svg,
        appleTouchIcon: data.apple_touch_icon,
        icon192: data.icon_192,
        icon512: data.icon_512,
        iconMaskable: data.icon_maskable,
      },
      themeColorLight: data.theme_color_light,
      themeColorDark: data.theme_color_dark,
      updatedAt: data.updated_at,
      updatedBy: data.updated_by,
    },
  };
});

/**
 * PATCH /api/admin/branding
 * Update brand settings (superadmin only).
 * Accepts partial updates.
 */
export const PATCH = withApiHandler({
  auth: 'superadmin',
  schema: brandSettingsSchema,
}, async ({ body, user, adminClient }) => {
  // Build update object (only include provided fields)
  const updateData: any = {
    updated_by: user?.id || null,
    updated_at: new Date().toISOString(),
  };

  if (body.logo) {
    if (body.logo.emoji !== undefined) updateData.logo_emoji = body.logo.emoji;
    if (body.logo.textPrimary !== undefined) updateData.logo_text_primary = body.logo.textPrimary;
    if (body.logo.textSecondary !== undefined) updateData.logo_text_secondary = body.logo.textSecondary;
    if (body.logo.imageUrl !== undefined) updateData.logo_image_url = body.logo.imageUrl;
    if (body.logo.imageUrlDark !== undefined) updateData.logo_image_url_dark = body.logo.imageUrlDark;
  }

  if (body.themeColorLight) updateData.theme_color_light = body.themeColorLight;
  if (body.themeColorDark) updateData.theme_color_dark = body.themeColorDark;

  // Update singleton row
  const { data, error } = await adminClient
    .from('brand_settings')
    .update(updateData)
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update brand settings: ${error.message}`);
  }

  // Transform response
  return {
    success: true,
    data: {
      logo: {
        emoji: data.logo_emoji,
        textPrimary: data.logo_text_primary,
        textSecondary: data.logo_text_secondary,
        imageUrl: data.logo_image_url,
        imageUrlDark: data.logo_image_url_dark,
      },
      favicon: {
        favicon32: data.favicon_32,
        favicon16: data.favicon_16,
        faviconSvg: data.favicon_svg,
        appleTouchIcon: data.apple_touch_icon,
        icon192: data.icon_192,
        icon512: data.icon_512,
        iconMaskable: data.icon_maskable,
      },
      themeColorLight: data.theme_color_light,
      themeColorDark: data.theme_color_dark,
      updatedAt: data.updated_at,
      updatedBy: data.updated_by,
    },
  };
});
