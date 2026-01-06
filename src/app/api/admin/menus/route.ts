import { withApiHandler } from "@/lib/api/handler";
import { z } from "zod";
import { AppError, ErrorCode } from "@/lib/errors";

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
    throw new AppError({
      code: ErrorCode.DB_QUERY_FAILED,
      message: 'Failed to fetch menu definitions',
      context: { error: defError.message, hint: defError.hint },
      recoverable: true,
    });
  }

  // Fetch all menu items
  const { data: items, error: itemsError } = await adminClient
    .from('menu_items')
    .select('*')
    .order('sort_order');

  if (itemsError) {
    throw new AppError({
      code: ErrorCode.DB_QUERY_FAILED,
      message: 'Failed to fetch menu items',
      context: { error: itemsError.message, hint: itemsError.hint },
      recoverable: true,
    });
  }

  // Build nested structure
  const menus = definitions.map((def: any) => {
    const menuItems = items?.filter((item: any) => item.menu_id === def.id) || [];

    // Debug logging
    console.log(`[Menu API] Building menu "${def.id}" with ${menuItems.length} items`);

    // Build tree structure
    const itemsMap = new Map();
    menuItems.forEach((item: any) => {
      itemsMap.set(item.id, { ...item, children: [] });
    });

    // Nest children under parents
    const rootItems: any[] = [];
    itemsMap.forEach((item) => {
      // Check for both null and undefined parent_id
      if (item.parent_id !== null && item.parent_id !== undefined) {
        const parent = itemsMap.get(item.parent_id);
        if (parent) {
          parent.children.push(item);
        } else {
          // Orphaned item - log warning but add to root
          console.warn(`[Menu API] Orphaned item: ${item.label} (parent_id: ${item.parent_id} not found)`);
          rootItems.push(item);
        }
      } else {
        rootItems.push(item);
      }
    });

    console.log(`[Menu API] Menu "${def.id}" has ${rootItems.length} root items`);

    return {
      id: def.id,
      label: def.label,
      description: def.description,
      items: rootItems,
      created_at: def.created_at,
      updated_at: def.updated_at,
    };
  });

  console.log(`[Menu API] Returning ${menus.length} menus total`);
  console.log(`[Menu API] Sample menu structure:`, JSON.stringify(menus[0], null, 2));

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
    throw new AppError({
      code: ErrorCode.MENU_CREATE_FAILED,
      message: 'Failed to create menu',
      context: { menuId: body.id, error: error.message, hint: error.hint },
      recoverable: true,
    });
  }

  return { menu: data };
});
