import { withApiHandler } from "@/lib/api/handler";
import { z } from "zod";

/**
 * PATCH /api/admin/menus/:menuId/items/:itemId
 * Update a single menu item
 */
const updateItemSchema = z.object({
  parent_id: z.string().uuid().optional().nullable(),
  item_key: z.string().min(1).max(100).optional(),
  label: z.string().min(1).max(100).optional(),
  href: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  visible_to: z.array(z.string()).optional().nullable(),
  hidden_from: z.array(z.string()).optional().nullable(),
  requires_league: z.boolean().optional(),
  on_click: z.string().optional().nullable(),
  external: z.boolean().optional(),
  divider_before: z.boolean().optional(),
  sort_order: z.number().int().optional(),
  // SEO fields
  seo_title: z.string().max(60).optional().nullable(),
  seo_description: z.string().max(160).optional().nullable(),
  seo_keywords: z.array(z.string()).optional().nullable(),
  // Open Graph fields
  og_title: z.string().max(60).optional().nullable(),
  og_description: z.string().max(160).optional().nullable(),
  og_image: z.string().url().optional().nullable(),
  og_type: z.string().optional().nullable(),
});

export const PATCH = withApiHandler({
  auth: 'superadmin',
  schema: updateItemSchema,
}, async ({ body, adminClient, params }) => {
  const menuId = params?.menuId as string;
  const itemId = params?.itemId as string;

  if (!menuId || !itemId) {
    throw new Error('Menu ID and Item ID are required');
  }

  const { data, error } = await adminClient
    .from('menu_items')
    .update(body)
    .eq('id', itemId)
    .eq('menu_id', menuId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update menu item: ${error.message}`);
  }

  return { item: data };
});

/**
 * DELETE /api/admin/menus/:menuId/items/:itemId
 * Delete a menu item (cascades to children via ON DELETE CASCADE)
 */
export const DELETE = withApiHandler({
  auth: 'superadmin',
}, async ({ adminClient, params }) => {
  const menuId = params?.menuId as string;
  const itemId = params?.itemId as string;

  if (!menuId || !itemId) {
    throw new Error('Menu ID and Item ID are required');
  }

  const { error } = await adminClient
    .from('menu_items')
    .delete()
    .eq('id', itemId)
    .eq('menu_id', menuId);

  if (error) {
    throw new Error(`Failed to delete menu item: ${error.message}`);
  }

  return { success: true };
});
