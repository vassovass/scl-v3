/**
 * Logo Upload API
 *
 * POST: Upload and compress logo image (light + optional dark variant)
 * Validates, compresses, uploads to Supabase Storage, updates brand_settings
 */

import { withApiHandler } from '@/lib/api/handler';
import { z } from 'zod';
import {
  validateImageSecurity,
  compressImage,
  uploadToStorage,
  deleteFromStorage,
  generateUniqueFilename
} from '@/lib/image-processing';
import { invalidateCache } from '@/lib/cache/serverCache';


const uploadLogoSchema = z.object({
  imageLight: z.string(), // Base64 data URL
  imageDark: z.string().optional(), // Base64 data URL (optional)
});

/**
 * POST /api/admin/branding/upload-logo
 * Upload logo image (light + optional dark mode variant).
 * Returns public CDN URLs.
 */
export const POST = withApiHandler({
  auth: 'superadmin',
  schema: uploadLogoSchema,
}, async ({ body, user, adminClient }) => {
  const { imageLight, imageDark } = body;

  // Convert base64 to File objects
  const lightFile = await base64ToFile(imageLight, 'logo-light');
  const darkFile = imageDark ? await base64ToFile(imageDark, 'logo-dark') : null;

  // Validate both images
  await validateImageSecurity(lightFile);
  if (darkFile) {
    await validateImageSecurity(darkFile);
  }

  // Compress images (optimize for web usage)
  const compressedLight = await compressImage(lightFile, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 512,
    format: 'webp',
    quality: 0.9,
  });

  const compressedDark = darkFile
    ? await compressImage(darkFile, {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 512,
      format: 'webp',
      quality: 0.9,
    })
    : null;

  // Generate unique filenames
  const lightFilename = generateUniqueFilename('logo-light', '.webp');
  const darkFilename = compressedDark ? generateUniqueFilename('logo-dark', '.webp') : null;

  // Upload to Supabase Storage (brand-assets bucket)
  const lightUrl = await uploadToStorage(compressedLight, 'brand-assets', `logos/${lightFilename}`);
  const darkUrl = compressedDark && darkFilename
    ? await uploadToStorage(compressedDark, 'brand-assets', `logos/${darkFilename}`)
    : null;

  // Update brand_settings in database
  const { data, error } = await adminClient
    .from('brand_settings')
    .update({
      logo_image_url: lightUrl,
      logo_image_url_dark: darkUrl,
      updated_by: user?.id || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .select()
    .single();

  if (error) {
    // Cleanup uploaded images if database update fails
    await deleteFromStorage('brand-assets', `logos/${lightFilename}`);
    if (darkFilename) {
      await deleteFromStorage('brand-assets', `logos/${darkFilename}`);
    }
    throw new Error(`Failed to update brand settings: ${error.message}`);
  }

  // Invalidate cache so new logo appears immediately
  invalidateCache('branding');

  return {
    success: true,
    data: {
      logoImageUrl: data.logo_image_url,
      logoImageUrlDark: data.logo_image_url_dark,
    },
  };
});

/**
 * Helper: Convert base64 data URL to File object
 */
async function base64ToFile(dataUrl: string, filename: string): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type });
}
