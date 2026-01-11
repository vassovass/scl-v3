/**
 * Dynamic PWA manifest for StepLeague.
 * Reads branding settings from database and generates manifest.json.
 */

import { MetadataRoute } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import { DEFAULT_BRANDING, getFullLogoText } from '@/lib/branding';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let branding = DEFAULT_BRANDING;

  try {
    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from('brand_settings')
      .select('*')
      .single();

    if (data) {
      branding = {
        logo: {
          emoji: data.logo_emoji,
          textPrimary: data.logo_text_primary,
          textSecondary: data.logo_text_secondary,
          imageUrl: data.logo_image_url || undefined,
          imageUrlDark: data.logo_image_url_dark || undefined,
        },
        favicon: {
          favicon32: data.favicon_32,
          favicon16: data.favicon_16,
          faviconSvg: data.favicon_svg || undefined,
          appleTouchIcon: data.apple_touch_icon,
          icon192: data.icon_192,
          icon512: data.icon_512,
          iconMaskable: data.icon_maskable || undefined,
        },
        themeColorLight: data.theme_color_light,
        themeColorDark: data.theme_color_dark,
      };
    }
  } catch (error) {
    console.warn('Failed to fetch branding for manifest, using defaults:', error);
  }

  const appName = getFullLogoText(branding);

  return {
    name: appName,
    short_name: appName,
    description: 'Step competition with friends',
    start_url: '/',
    display: 'standalone',
    background_color: branding.themeColorDark,
    theme_color: branding.themeColorDark,
    icons: [
      {
        src: branding.favicon.icon192,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: branding.favicon.icon512,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      ...(branding.favicon.iconMaskable
        ? [
            {
              src: branding.favicon.iconMaskable,
              sizes: '512x512',
              type: 'image/png' as const,
              purpose: 'maskable' as const,
            },
          ]
        : []),
    ],
  };
}
