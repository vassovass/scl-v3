import { withApiHandler } from "@/lib/api/handler";

/**
 * GET /api/menus
 * Public endpoint - returns all menus with items for frontend consumption
 * Used by useMenuConfig hook with fallback to static config
 */
export const GET = withApiHandler({
  auth: 'none',
}, async ({ adminClient }) => {
  // Fetch all menu definitions
  const { data: definitions, error: defError } = await adminClient
    .from('menu_definitions')
    .select('*')
    .order('id');

  if (defError) {
    // Return empty to trigger fallback to static config
    return { menus: null, error: defError.message };
  }

  // Fetch all menu items
  const { data: items, error: itemsError } = await adminClient
    .from('menu_items')
    .select('*')
    .order('sort_order');

  if (itemsError) {
    // Return empty to trigger fallback to static config
    return { menus: null, error: itemsError.message };
  }

  // Build nested structure matching MENUS format from menuConfig.ts
  const menusObj: Record<string, any> = {};

  definitions.forEach((def: any) => {
    const menuItems = items.filter((item: any) => item.menu_id === def.id);

    // Build tree structure
    const itemsMap = new Map();
    menuItems.forEach((item: any) => {
      // Convert database format to MenuItem interface format
      itemsMap.set(item.id, {
        id: item.item_key,
        label: item.label,
        href: item.href || undefined,
        icon: item.icon || undefined,
        description: item.description || undefined,
        visibleTo: item.visible_to?.length > 0 ? item.visible_to : undefined,
        hiddenFrom: item.hidden_from?.length > 0 ? item.hidden_from : undefined,
        requiresLeague: item.requires_league || undefined,
        onClick: item.on_click || undefined,
        external: item.external || undefined,
        dividerBefore: item.divider_before || undefined,
        children: [],
      });
    });

    // Nest children under parents
    const rootItems: any[] = [];
    menuItems.forEach((item: any) => {
      const menuItem = itemsMap.get(item.id);
      if (item.parent_id) {
        const parent = itemsMap.get(item.parent_id);
        if (parent) {
          parent.children.push(menuItem);
        }
      } else {
        rootItems.push(menuItem);
      }
    });

    // Clean up empty children arrays
    const cleanItems = (items: any[]): any[] => {
      return items.map(item => {
        const cleaned = { ...item };
        if (cleaned.children && cleaned.children.length === 0) {
          delete cleaned.children;
        } else if (cleaned.children) {
          cleaned.children = cleanItems(cleaned.children);
        }
        return cleaned;
      });
    };

    menusObj[def.id] = {
      id: def.id,
      label: def.label,
      items: cleanItems(rootItems),
    };
  });

  // Fetch menu locations
  const { data: locations, error: locError } = await adminClient
    .from('menu_locations')
    .select('*');

  if (locError) {
    // Return menus without locations
    return { menus: menusObj, locations: null };
  }

  // Convert locations to MENU_LOCATIONS format
  const locationsObj: Record<string, any> = {};
  locations.forEach((loc: any) => {
    locationsObj[loc.location] = {
      menus: loc.menu_ids,
      showLogo: loc.show_logo,
      showSignIn: loc.show_sign_in,
      showUserMenu: loc.show_user_menu,
      showAdminMenu: loc.show_admin_menu,
      className: loc.class_name || undefined,
    };
  });

  return {
    menus: menusObj,
    locations: locationsObj,
  };
});
