/**
 * @deprecated PRD 41 - This endpoint is DEPRECATED and NON-FUNCTIONAL
 * 
 * The proxy_members table has been dropped. Use the claim flow instead:
 * - Share the proxy's invite code with the target user
 * - They claim via GET/POST /api/proxy-claim/[code]
 * 
 * This endpoint now returns a 410 Gone status.
 */

import { json } from "@/lib/api";

// POST /api/leagues/[id]/proxy-members/[proxyId]/link - Link proxy to real user
// @deprecated This endpoint no longer works. Use /api/proxy-claim/[code] flow.
export async function POST(
    request: Request,
    context: { params: Promise<{ id: string; proxyId: string }> }
) {
    const { proxyId } = await context.params;
    
    console.warn(`[DEPRECATED] POST /api/leagues/.../proxy-members/${proxyId}/link called. This endpoint is deprecated.`);
    
    return json({
        error: "This endpoint has been deprecated",
        message: "The proxy linking flow has changed. Share the proxy's invite code with the target user and they can claim it via /claim/[code].",
        migration: {
            old_flow: "POST /api/leagues/[id]/proxy-members/[proxyId]/link",
            new_flow: "User visits /claim/[invite_code] and claims the profile",
            docs: "See PRD 41 for the unified proxy model"
        }
    }, { status: 410 }); // 410 Gone
}
