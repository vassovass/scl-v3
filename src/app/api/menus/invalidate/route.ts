import { withApiHandler } from "@/lib/api/handler";

/**
 * POST /api/menus/invalidate
 * Invalidates menu cache for all clients
 * Called automatically when menu items are created/updated/deleted
 * SuperAdmin only
 */
export const POST = withApiHandler({
  auth: 'superadmin',
}, async () => {
  // Return a cache-bust timestamp
  // The frontend will use this to invalidate its cache
  const timestamp = Date.now();

  console.log('[Menu Cache] Cache invalidation requested at', new Date(timestamp).toISOString());

  return {
    success: true,
    timestamp,
    message: 'Menu cache invalidated for all clients',
  };
});
