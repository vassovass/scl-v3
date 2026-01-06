import { withApiHandler } from "@/lib/api/handler";
import { z } from "zod";

/**
 * GET /api/admin/menus
 * Returns all menu definitions with their items (nested)
 */
export const GET = withApiHandler({
  auth: 'superadmin',
}, async ({ adminClient }) => {
  // Fetch all menu definitions
  const { data: definitions, error: defError } = await adminClient
    .from('menu_definitions')
    .select('*')
    .order('id');

  if (defError) {
    throw new Error(`Failed to fetch menu definitions: ${defError.message}`);
  }

  // Fetch all menu items
  const { data: items, error: itemsError } = await adminClient
    .from('menu_items')
    .select('*')
    .order('sort_order');

  if (itemsError) {
    throw new Error(`Failed to fetch menu items: ${itemsError.message}`);
  }

  // Build nested structure
  const menus = definitions.map((def: any) => {
    const menuItems = items.filter((item: any) => item.menu_id === def.id);

    // Build tree structure
    const itemsMap = new Map();
    menuItems.forEach((item: any) => {
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
      id: def.id,
      label: def.label,
      description: def.description,
      items: rootItems,
      created_at: def.created_at,
      updated_at: def.updated_at,
    };
  });

  return { menus };
});

/**
 * POST /api/admin/menus
 * Create a new menu definition
 */
const createMenuSchema = z.object({
  id: z.string().min(1).max(50),
  label: z.string().min(1).max(100),
  description: z.string().optional(),
});

export const POST = withApiHandler({
  auth: 'superadmin',
  schema: createMenuSchema,
}, async ({ body, adminClient }) => {
  const { data, error } = await adminClient
    .from('menu_definitions')
    .insert({
      id: body.id,
      label: body.label,
      description: body.description,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create menu: ${error.message}`);
  }

  return { menu: data };
});
