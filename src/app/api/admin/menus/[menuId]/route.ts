import { withApiHandler } from "@/lib/api/handler";
import { z } from "zod";

/**
 * GET /api/admin/menus/:menuId
 * Returns a single menu with nested items
 */
export const GET = withApiHandler({
  auth: 'superadmin',
}, async ({ adminClient, params }) => {
  const menuId = params?.menuId as string;

  if (!menuId) {
    throw new Error('Menu ID is required');
  }

  // Fetch menu definition
  const { data: menu, error: menuError } = await adminClient
    .from('menu_definitions')
    .select('*')
    .eq('id', menuId)
    .single();

  if (menuError || !menu) {
    throw new Error(`Menu not found: ${menuId}`);
  }

  // Fetch all items for this menu
  const { data: items, error: itemsError } = await adminClient
    .from('menu_items')
    .select('*')
    .eq('menu_id', menuId)
    .order('sort_order');

  if (itemsError) {
    throw new Error(`Failed to fetch menu items: ${itemsError.message}`);
  }

  // Build tree structure
  const itemsMap = new Map();
  items.forEach((item: any) => {
    itemsMap.set(item.id, { ...item, children: [] });
  });

  // Nest children under parents
  const rootItems: any[] = [];
  itemsMap.forEach((item) => {
    if (item.parent_id) {
      const parent = itemsMap.get(item.parent_id);
      if (parent) {
        parent.children.push(item);
      }
    } else {
      rootItems.push(item);
    }
  });

  return {
    menu: {
      id: menu.id,
      label: menu.label,
      description: menu.description,
      items: rootItems,
      created_at: menu.created_at,
      updated_at: menu.updated_at,
    }
  };
});

/**
 * PATCH /api/admin/menus/:menuId
 * Update menu definition
 */
const updateMenuSchema = z.object({
  label: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
});

export const PATCH = withApiHandler({
  auth: 'superadmin',
  schema: updateMenuSchema,
}, async ({ body, adminClient, params }) => {
  const menuId = params?.menuId as string;

  if (!menuId) {
    throw new Error('Menu ID is required');
  }

  const { data, error } = await adminClient
    .from('menu_definitions')
    .update(body)
    .eq('id', menuId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update menu: ${error.message}`);
  }

  return { menu: data };
});

/**
 * DELETE /api/admin/menus/:menuId
 * Delete menu definition (cascades to items)
 */
export const DELETE = withApiHandler({
  auth: 'superadmin',
}, async ({ adminClient, params }) => {
  const menuId = params?.menuId as string;

  if (!menuId) {
    throw new Error('Menu ID is required');
  }

  const { error } = await adminClient
    .from('menu_definitions')
    .delete()
    .eq('id', menuId);

  if (error) {
    throw new Error(`Failed to delete menu: ${error.message}`);
  }

  return { success: true };
});
