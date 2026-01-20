import { createCachedFetcher } from '@/lib/cache/serverCache';
import { createAdminClient } from '@/lib/supabase/server';
import { DEFAULT_BRANDING, BrandSettings } from '@/lib/branding';

/**
 * Transform DB row to strict BrandSettings object
 */
function transformToBrandSettings(data: any): BrandSettings {
    return {
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
    };
}

/**
 * Cached branding fetcher for SSR metadata.
 * Uses lib/cache/serverCache to prevent timeouts (GTmetrix/PageSpeed).
 * 
 * - Tag: 'branding'
 * - Timeout: 3000ms (fails fast to default)
 * - Invalidation: On Admin Branding Update
 */
export const getCachedBranding = createCachedFetcher({
    tag: 'branding',
    fetcher: async () => {
        const adminClient = createAdminClient();
        const { data } = await adminClient
            .from('brand_settings')
            .select('*')
            .single();

        if (!data) return DEFAULT_BRANDING;
        return transformToBrandSettings(data);
    },
    fallback: DEFAULT_BRANDING,
    timeoutMs: 3000,
    revalidateSeconds: 3600,
});

