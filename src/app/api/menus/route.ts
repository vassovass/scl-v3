import { withApiHandler } from "@/lib/api/handler";
import { AppError, ErrorCode } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * GET /api/menus
 * Public endpoint - returns all menus with items for frontend consumption
 * Filters items based on user's role (visible_to/hidden_from)
 * Used by useMenuConfig hook with fallback to static config
 */
export const GET = withApiHandler({
  auth: 'none',
}, async ({ adminClient, user }) => {
  // Fetch all menu definitions
  const { data: definitions, error: defError } = await adminClient
    .from('menu_definitions')
    .select('*')
    .order('id');

  if (defError) {
    console.error('[Menu API] Error fetching definitions:', defError);
    throw new AppError({
      code: ErrorCode.DB_QUERY_FAILED,
      message: 'Failed to fetch menu definitions',
      context: { error: defError.message },
      recoverable: true,
    });
  }

  // Fetch all menu items
  const { data: items, error: itemsError } = await adminClient
    .from('menu_items')
    .select('*')
    .order('menu_id, sort_order');

  if (itemsError) {
    console.error('[Menu API] Error fetching items:', itemsError);
    throw new AppError({
      code: ErrorCode.DB_QUERY_FAILED,
      message: 'Failed to fetch menu items',
      context: { error: itemsError.message },
      recoverable: true,
    });
  }

  // Determine user's role for filtering
  let isSuperadmin = false;
  if (user) {
    const { data: userData } = await adminClient
      .from('users')
      .select('is_superadmin')
      .eq('id', user.id)
      .single();

    isSuperadmin = userData?.is_superadmin ?? false;
  }

  // Build role array for filtering
  const userRoles: string[] = [];
  if (!user) {
    userRoles.push('guest');
  } else {
    userRoles.push('member'); // All authenticated users are members
    if (isSuperadmin) {
      userRoles.push('superadmin');
    }
  }

  console.log('[Menu API /api/menus] User roles for filtering:', userRoles);

  // Build nested structure matching MENUS format from menuConfig.ts
  const menusObj: Record<string, any> = {};

  definitions.forEach((def: any) => {
    const menuItems = items.filter((item: any) => item.menu_id === def.id);

    // Filter items based on visibility rules
    const visibleItems = menuItems.filter((item: any) => {
      // Check visible_to (if specified, user must have one of these roles)
      if (item.visible_to && Array.isArray(item.visible_to) && item.visible_to.length > 0) {
        const hasVisibleRole = item.visible_to.some((role: string) => userRoles.includes(role));
        if (!hasVisibleRole) {
          console.log(`[Menu API] Filtering out item "${item.label}" - user lacks visible_to role. Required: ${item.visible_to.join(', ')} User has: ${userRoles.join(', ')}`);
          return false; // User doesn't have required role
        }
      }

      // Check hidden_from (if specified, user must NOT have any of these roles)
      if (item.hidden_from && Array.isArray(item.hidden_from) && item.hidden_from.length > 0) {
        const hasHiddenRole = item.hidden_from.some((role: string) => userRoles.includes(role));
        if (hasHiddenRole) {
          console.log(`[Menu API] Filtering out item "${item.label}" - user has hidden_from role: ${item.hidden_from.join(', ')}`);
          return false; // User has a role that hides this item
        }
      }

      return true; // Item is visible
    });

    console.log(`[Menu API] Menu "${def.id}": ${menuItems.length} total items, ${visibleItems.length} visible to user`);

    // Build tree structure from visible items
    const itemsMap = new Map();
    visibleItems.forEach((item: any) => {
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

    // Nest children under parents (only visible items)
    const rootItems: any[] = [];
    visibleItems.forEach((item: any) => {
      const menuItem = itemsMap.get(item.id);
      if (item.parent_id !== null && item.parent_id !== undefined) {
        const parent = itemsMap.get(item.parent_id);
        if (parent) {
          parent.children.push(menuItem);
        } else {
          // Parent was filtered out or doesn't exist, add as root
          console.warn(`[Menu API] Orphaned item: ${item.label} (parent_id: ${item.parent_id} not found in visible items)`);
          rootItems.push(menuItem);
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
    console.warn('[Menu API] Error fetching locations, using defaults:', locError);
    // Return menus without locations - frontend will fall back to static config
    return { menus: menusObj, locations: null };
  }

  // Convert locations to MENU_LOCATIONS format and filter based on user role
  const locationsObj: Record<string, any> = {};
  locations?.forEach((loc: any) => {
    // Filter menu_ids based on whether user should see admin menu
    let menuIds = loc.menu_ids || [];

    // Remove 'admin' menu if user is not superadmin
    if (!isSuperadmin) {
      menuIds = menuIds.filter((id: string) => id !== 'admin');
    }

    locationsObj[loc.location] = {
      menus: menuIds,
      showLogo: loc.show_logo,
      showSignIn: loc.show_sign_in,
      showUserMenu: loc.show_user_menu,
      showAdminMenu: loc.show_admin_menu && isSuperadmin, // Only show if user is superadmin
      className: loc.class_name || undefined,
    };
  });

  // Get the latest update timestamp for cache versioning
  // This allows frontend to detect stale cache and auto-invalidate
  const { data: versionData } = await adminClient
    .from('menu_items')
    .select('updated_at')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  const cacheVersion = versionData?.updated_at || new Date().toISOString();

  console.log(`[Menu API /api/menus] Returning ${Object.keys(menusObj).length} menus and ${Object.keys(locationsObj).length} locations (version: ${cacheVersion})`);

  // Return with cache headers
  // Cache for 60 seconds, but allow stale content for 5 minutes while revalidating
  const response = Response.json({
    menus: menusObj,
    locations: locationsObj,
    cacheVersion, // Version for frontend cache invalidation
    _timestamp: Date.now(), // Cache-busting timestamp
  });

  response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  response.headers.set('CDN-Cache-Control', 'public, s-maxage=60');
  response.headers.set('Vercel-CDN-Cache-Control', 'public, s-maxage=60');

  return response;
});

