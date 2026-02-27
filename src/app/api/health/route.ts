/**
 * Health Check Endpoint
 *
 * Returns service status for monitoring and alerting.
 * No authentication required — designed for uptime monitors.
 *
 * @see PRD 65: Structured Logging & Health Check
 */

import { withApiHandler } from "@/lib/api/handler";

export const GET = withApiHandler({
    auth: "none",
}, async ({ adminClient }) => {
    const start = Date.now();

    // Check database connectivity with a lightweight query
    const { error: dbError } = await adminClient
        .from("users")
        .select("id")
        .limit(1);

    const response_time_ms = Date.now() - start;
    const dbUp = !dbError;

    return {
        status: dbUp ? "healthy" : "degraded",
        database: dbUp ? "up" : "down",
        auth_service: "up", // Supabase Auth shares same host as DB
        response_time_ms,
        timestamp: new Date().toISOString(),
    };
});
