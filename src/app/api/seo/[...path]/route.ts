import { withApiHandler } from "@/lib/api/handler";

/**
 * GET /api/seo/:path
 * Fetch SEO metadata for a given page path from menu items
 * This enables bidirectional sync - pages can read their SEO from menu config
 *
 * @example
 * GET /api/seo/dashboard → Returns SEO for /dashboard
 * GET /api/seo/league/create → Returns SEO for /league/create
 */
export const GET = withApiHandler({
  auth: 'none', // Public endpoint - needed for SSR metadata
}, async ({ adminClient, params }) => {
  const pathSegments = params?.path as string[];

  if (!pathSegments || pathSegments.length === 0) {
    throw new Error('Path is required');
  }

  // Reconstruct the full path
  const fullPath = '/' + pathSegments.join('/');

  // Look up menu item by href
  const { data: menuItem, error } = await adminClient
    .from('menu_items')
    .select('seo_title, seo_description, seo_keywords, og_title, og_description, og_image, og_type, label')
    .eq('href', fullPath)
    .single();

  if (error || !menuItem) {
    // No SEO data found - return null (page will use defaults)
    return {
      found: false,
      path: fullPath,
      seo: null
    };
  }

  return {
    found: true,
    path: fullPath,
    seo: {
      title: menuItem.seo_title || menuItem.label,
      description: menuItem.seo_description || null,
      keywords: menuItem.seo_keywords || [],
      og: {
        title: menuItem.og_title || menuItem.seo_title || menuItem.label,
        description: menuItem.og_description || menuItem.seo_description || null,
        image: menuItem.og_image || null,
        type: menuItem.og_type || 'website',
      },
    },
  };
});

/**
 * PUT /api/seo/:path
 * Update SEO metadata for a page (called when editing page metadata directly)
 * This enables bidirectional sync - pages can update menu item SEO
 */
export const PUT = withApiHandler({
  auth: 'superadmin', // Only superadmins can update SEO
}, async ({ body, adminClient, params }) => {
  const pathSegments = params?.path as string[];

  if (!pathSegments || pathSegments.length === 0) {
    throw new Error('Path is required');
  }

  const fullPath = '/' + pathSegments.join('/');

  // Update menu item SEO fields
  const { data, error } = await adminClient
    .from('menu_items')
    .update({
      seo_title: body.seo_title || null,
      seo_description: body.seo_description || null,
      seo_keywords: body.seo_keywords || [],
      og_title: body.og_title || null,
      og_description: body.og_description || null,
      og_image: body.og_image || null,
      og_type: body.og_type || 'website',
    })
    .eq('href', fullPath)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update SEO: ${error.message}`);
  }

  return {
    success: true,
    path: fullPath,
    updated: data,
  };
});
