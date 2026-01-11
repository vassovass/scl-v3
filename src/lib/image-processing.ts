/**
 * Image processing utilities for favicon/logo uploads.
 *
 * Provides:
 * - Client-side image compression and resizing
 * - Security validation (magic bytes, file signatures)
 * - Multi-size favicon generation
 * - Supabase Storage integration
 */

import imageCompression from 'browser-image-compression';
import { fileTypeFromBuffer } from 'file-type';
import { ALLOWED_IMAGE_FORMATS, MAX_IMAGE_SIZE, ICON_SIZES } from './branding';
import { AppError, ErrorCode } from './errors';

/**
 * Validate image file using multiple security layers.
 * Throws AppError if validation fails.
 *
 * Security layers:
 * 1. File extension whitelist
 * 2. MIME type validation
 * 3. Magic bytes verification (file signature)
 * 4. File size check
 */
export async function validateImageSecurity(file: File): Promise<void> {
  // 1. File size check
  if (file.size > MAX_IMAGE_SIZE) {
    throw new AppError({
      code: ErrorCode.UPLOAD_TOO_LARGE,
      message: `File exceeds ${MAX_IMAGE_SIZE / 1024 / 1024}MB limit`,
      context: { size: file.size, maxSize: MAX_IMAGE_SIZE },
      recoverable: true,
    });
  }

  // 2. Extension check
  const ext = ('.' + file.name.split('.').pop()?.toLowerCase()) as string;
  if (!ALLOWED_IMAGE_FORMATS.extensions.includes(ext as any)) {
    throw new AppError({
      code: ErrorCode.UPLOAD_INVALID_FORMAT,
      message: `Invalid file extension. Allowed: ${ALLOWED_IMAGE_FORMATS.extensions.join(', ')}`,
      context: { extension: ext },
      recoverable: true,
    });
  }

  // 3. MIME type check
  if (!ALLOWED_IMAGE_FORMATS.mimeTypes.includes(file.type as any)) {
    throw new AppError({
      code: ErrorCode.UPLOAD_INVALID_FORMAT,
      message: `Invalid MIME type. Allowed: ${ALLOWED_IMAGE_FORMATS.mimeTypes.join(', ')}`,
      context: { mimeType: file.type },
      recoverable: true,
    });
  }

  // 4. Magic bytes verification (CRITICAL for security)
  const buffer = await file.arrayBuffer();
  const fileType = await fileTypeFromBuffer(new Uint8Array(buffer));

  if (!fileType || !ALLOWED_IMAGE_FORMATS.mimeTypes.includes(fileType.mime as any)) {
    throw new AppError({
      code: ErrorCode.UPLOAD_INVALID_FORMAT,
      message: 'File signature does not match expected image type. This may be a malicious file.',
      context: { detectedType: fileType?.mime },
      recoverable: false,
    });
  }
}

/**
 * Compress and resize image for web usage.
 * Uses Web Worker for better performance (non-blocking).
 *
 * @param file - Original image file
 * @param options - Compression options
 * @returns Compressed image file
 */
export async function compressImage(
  file: File,
  options: {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    format?: 'webp' | 'png' | 'jpeg';
    quality?: number;
  } = {}
): Promise<File> {
  const {
    maxSizeMB = 1,
    maxWidthOrHeight = 1920,
    format = 'webp',
    quality = 0.8,
  } = options;

  try {
    const compressed = await imageCompression(file, {
      maxSizeMB,
      maxWidthOrHeight,
      useWebWorker: true, // Use Web Worker for better performance
      fileType: `image/${format}`,
      initialQuality: quality,
    });

    return compressed;
  } catch (error) {
    throw new AppError({
      code: ErrorCode.UPLOAD_PROCESSING_FAILED,
      message: 'Failed to compress image',
      context: { error },
      recoverable: false,
    });
  }
}

/**
 * Generate multiple sizes of an image for favicon/PWA icons.
 * Produces square images at specified dimensions.
 *
 * @param file - Source image (should be square, 512x512 or larger)
 * @param sizes - Array of target sizes (e.g., [16, 32, 192, 512])
 * @returns Map of size to compressed image file
 */
export async function generateIconSizes(
  file: File,
  sizes: readonly number[]
): Promise<Map<number, File>> {
  const results = new Map<number, File>();

  // Process all sizes in parallel for performance
  await Promise.all(
    sizes.map(async (size) => {
      try {
        const resized = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: size,
          useWebWorker: true,
          fileType: 'image/png', // PNG for icons (transparency support)
          initialQuality: 1.0, // Max quality for icons (they're small files)
        });

        results.set(size, resized);
      } catch (error) {
        console.error(`Failed to generate ${size}x${size} icon:`, error);
        throw new AppError({
          code: ErrorCode.UPLOAD_PROCESSING_FAILED,
          message: `Failed to generate ${size}x${size} icon`,
          context: { size, error },
          recoverable: false,
        });
      }
    })
  );

  return results;
}

/**
 * Upload image to Supabase Storage.
 *
 * @param file - Image file to upload
 * @param bucket - Supabase Storage bucket name
 * @param path - File path within bucket
 * @returns Public CDN URL
 */
export async function uploadToStorage(
  file: File,
  bucket: string,
  path: string
): Promise<string> {
  const { createClient } = await import('@/lib/supabase/client');
  const supabase = createClient();

  // Upload file
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '31536000', // Cache for 1 year (immutable)
      upsert: true, // Overwrite if exists
    });

  if (error) {
    throw new AppError({
      code: ErrorCode.UPLOAD_FAILED,
      message: 'Failed to upload image to storage',
      context: { error, bucket, path },
      recoverable: false,
    });
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

/**
 * Delete image from Supabase Storage.
 *
 * @param bucket - Supabase Storage bucket name
 * @param path - File path within bucket
 */
export async function deleteFromStorage(
  bucket: string,
  path: string
): Promise<void> {
  const { createClient } = await import('@/lib/supabase/client');
  const supabase = createClient();

  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    console.error('Failed to delete image from storage:', error);
    // Don't throw - deletion failures are non-critical
  }
}

/**
 * Generate optimized image URL with Supabase transformations.
 *
 * @param url - Original image URL
 * @param options - Transformation options
 * @returns Optimized image URL with query parameters
 */
export function getOptimizedImageUrl(
  url: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'png' | 'jpeg';
  } = {}
): string {
  const { width, height, quality = 80, format = 'webp' } = options;

  const urlObj = new URL(url);

  if (width) urlObj.searchParams.set('width', width.toString());
  if (height) urlObj.searchParams.set('height', height.toString());
  urlObj.searchParams.set('quality', quality.toString());
  urlObj.searchParams.set('format', format);

  return urlObj.toString();
}

/**
 * Extract filename from URL.
 */
export function getFilenameFromUrl(url: string): string {
  return url.split('/').pop() || 'unknown';
}

/**
 * Generate unique filename for uploaded image.
 *
 * @param prefix - Filename prefix (e.g., 'logo', 'favicon')
 * @param extension - File extension (e.g., '.png', '.webp')
 * @returns Unique filename
 */
export function generateUniqueFilename(prefix: string, extension: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}${extension}`;
}
