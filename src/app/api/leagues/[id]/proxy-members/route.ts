/**
 * @deprecated PRD 41 - This endpoint is DEPRECATED
 * 
 * Use the unified /api/proxies endpoint instead.
 * The proxy_members table has been DROPPED - these endpoints now return
 * deprecation notices only.
 * 
 * Migration guide:
 * - GET /api/leagues/[id]/proxy-members → GET /api/proxies?league_id=[id]
 * - POST /api/leagues/[id]/proxy-members → POST /api/proxies { league_id: [id] }
 * - DELETE → DELETE /api/proxies?proxy_id=[id]
 */

import { json } from "@/lib/api";

/**
 * Helper to create deprecation response
 */
function deprecatedResponse(method: string, leagueId: string, newEndpoint: string) {
    console.warn(`[DEPRECATED] ${method} /api/leagues/${leagueId}/proxy-members called. This endpoint no longer works.`);
    
    const response = json({
        error: "This endpoint has been deprecated",
        message: `The proxy_members table has been removed. Use ${newEndpoint} instead.`,
        migration: {
            old_endpoint: `/api/leagues/${leagueId}/proxy-members`,
            new_endpoint: newEndpoint,
            docs: "See PRD 41 for the unified proxy model"
        },
        _deprecation_notice: `Use ${newEndpoint} instead.`
    }, { status: 410 }); // 410 Gone
    
    response.headers.set("Deprecation", "true");
    response.headers.set("Sunset", "2026-04-01");
    response.headers.set("Link", '</api/proxies>; rel="successor-version"');
    
    return response;
}

// GET /api/leagues/[id]/proxy-members - List all proxy members
// @deprecated Table dropped. Use GET /api/proxies?league_id=[id] instead
export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const { id: leagueId } = await context.params;
    return deprecatedResponse("GET", leagueId, `GET /api/proxies?league_id=${leagueId}`);
}

// POST /api/leagues/[id]/proxy-members - Create a new proxy member
// @deprecated Table dropped. Use POST /api/proxies instead
export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const { id: leagueId } = await context.params;
    return deprecatedResponse("POST", leagueId, "POST /api/proxies with { league_id } in body");
}

// DELETE /api/leagues/[id]/proxy-members?proxy_id=xxx - Delete a proxy member
// @deprecated Table dropped. Use DELETE /api/proxies?proxy_id=[id] instead
export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const { id: leagueId } = await context.params;
    return deprecatedResponse("DELETE", leagueId, "DELETE /api/proxies?proxy_id=[id]");
}
