import { withApiHandler } from "@/lib/api/handler";
import { getRecentLogs } from "@/lib/server/logger";

/**
 * GET /api/debug/logs - Get recent server logs (SuperAdmin only)
 */
export const GET = withApiHandler({
  auth: 'superadmin',
}, async ({ user, request }) => {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") || "50", 10);

  const logs = getRecentLogs(limit);

  return {
    logs,
    meta: {
      count: logs.length,
      user_email: user?.email,
      timestamp: new Date().toISOString(),
    },
  };
});
