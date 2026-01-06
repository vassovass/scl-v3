import { withApiHandler } from "@/lib/api/handler";
import { z } from "zod";
import { AppError, ErrorCode } from "@/lib/errors";

/**
 * POST /api/admin/menus/:menuId/items
 * Add a new menu item
 */
const createItemSchema = z.object({
  parent_id: z.string().uuid().optional().nullable(),
  item_key: z.string().min(1).max(100),
  label: z.string().min(1).max(100),
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

export const POST = withApiHandler({
  auth: 'superadmin',
  schema: createItemSchema,
}, async ({ body, adminClient, params }) => {
  const menuId = params?.menuId as string;

  if (!menuId) {
    throw new AppError({
      code: ErrorCode.REQUIRED_FIELD_MISSING,
      message: 'Menu ID is required',
      recoverable: false,
    });
  }

  // If no sort_order provided, get max + 1
  let sortOrder = body.sort_order;
  if (sortOrder === undefined) {
    const { data: items } = await adminClient
      .from('menu_items')
      .select('sort_order')
      .eq('menu_id', menuId)
      .eq('parent_id', body.parent_id || null)
      .order('sort_order', { ascending: false })
      .limit(1);

    sortOrder = items && items.length > 0 ? items[0].sort_order + 1 : 0;
  }

  const { data, error } = await adminClient
    .from('menu_items')
    .insert({
      menu_id: menuId,
      parent_id: body.parent_id || null,
      item_key: body.item_key,
      label: body.label,
      href: body.href || null,
      icon: body.icon || null,
      description: body.description || null,
      visible_to: body.visible_to || [],
      hidden_from: body.hidden_from || [],
      requires_league: body.requires_league || false,
      // SEO fields
      seo_title: body.seo_title || null,
      seo_description: body.seo_description || null,
      seo_keywords: body.seo_keywords || [],
      // Open Graph fields
      og_title: body.og_title || null,
      og_description: body.og_description || null,
      og_image: body.og_image || null,
      og_type: body.og_type || 'website',
      on_click: body.on_click || null,
      external: body.external || false,
      divider_before: body.divider_before || false,
      sort_order: sortOrder,
    })
    .select()
    .single();

  if (error) {
    throw new AppError({
      code: ErrorCode.MENU_ITEM_CREATE_FAILED,
      message: 'Failed to create menu item',
      context: { menuId, itemKey: body.item_key, error: error.message, hint: error.hint },
      recoverable: true,
    });
  }

  console.log(`[Menu API] Created item "${body.label}" in menu "${menuId}"`);

  return { item: data };
});

/**
 * PUT /api/admin/menus/:menuId/items
 * Batch update items (for drag-drop reordering)
 */
const batchUpdateSchema = z.object({
  items: z.array(z.object({
    id: z.string().uuid(),
    parent_id: z.string().uuid().optional().nullable(),
    sort_order: z.number().int(),
  })),
});

export const PUT = withApiHandler({
  auth: 'superadmin',
  schema: batchUpdateSchema,
}, async ({ body, adminClient, params }) => {
  const menuId = params?.menuId as string;

  if (!menuId) {
    throw new AppError({
      code: ErrorCode.REQUIRED_FIELD_MISSING,
      message: 'Menu ID is required',
      recoverable: false,
    });
  }

  // Update each item in a transaction-like manner
  // Note: Supabase doesn't support true transactions via REST API
  // So we do sequential updates
  try {
    const updates = body.items.map(async (item) => {
      const { error } = await adminClient
        .from('menu_items')
        .update({
          parent_id: item.parent_id || null,
          sort_order: item.sort_order,
        })
        .eq('id', item.id)
        .eq('menu_id', menuId); // Ensure item belongs to this menu

      if (error) {
        throw new AppError({
          code: ErrorCode.MENU_ITEM_UPDATE_FAILED,
          message: `Failed to update item ${item.id}`,
          context: { itemId: item.id, menuId, error: error.message, hint: error.hint },
          recoverable: true,
        });
      }
    });

    await Promise.all(updates);

    console.log(`[Menu API] Batch updated ${body.items.length} items in menu "${menuId}"`);

    return { success: true, updated: body.items.length };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError({
      code: ErrorCode.MENU_BATCH_UPDATE_FAILED,
      message: 'Failed to update menu items',
      context: { menuId, itemCount: body.items.length },
      cause: error instanceof Error ? error : undefined,
      recoverable: true,
    });
  }
});
