import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { json, unauthorized, forbidden } from "@/lib/api";
import { isSuperAdmin } from "@/lib/server/superadmin";
import { getRecentLogs } from "@/lib/server/logger";

/**
 * GET /api/debug/logs - Get recent server logs (SuperAdmin only)
 */
export async function GET(request: NextRequest) {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return unauthorized();
    }

    if (!isSuperAdmin(user.email)) {
        return forbidden("SuperAdmin access required");
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);

    const logs = getRecentLogs(limit);

    return json({
        logs,
        meta: {
            count: logs.length,
            user_email: user.email,
            timestamp: new Date().toISOString(),
        },
    });
}
