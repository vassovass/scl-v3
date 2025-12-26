/**
 * Unified API Handler
 * 
 * A reusable wrapper that eliminates boilerplate from API routes.
 * Handles auth, validation, and error handling consistently.
 * 
 * @example
 * // Simple authenticated route
 * export const POST = withApiHandler({
 *   auth: 'required',
 *   schema: mySchema,
 * }, async ({ user, body, adminClient }) => {
 *   return { success: true };
 * });
 * 
 * @example
 * // League admin route
 * export const PUT = withApiHandler({
 *   auth: 'league_admin',
 *   schema: updateSchema,
 * }, async ({ user, body, adminClient, membership }) => {
 *   // membership.role is guaranteed to be 'admin' or 'owner'
 *   return { updated: true };
 * });
 */

import { z } from "zod";
import { User } from "@supabase/supabase-js";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { json, badRequest, unauthorized, forbidden, serverError } from "@/lib/api";

// =============================================================================
// Types
// =============================================================================

/** Site-level auth - no additional context needed */
type SiteAuth = 'none' | 'required' | 'superadmin';

/** League-level auth - requires leagueId from body or URL params */
type LeagueAuth = 'league_member' | 'league_admin' | 'league_owner';

type AuthLevel = SiteAuth | LeagueAuth;

/** Membership role within a league */
type MembershipRole = 'owner' | 'admin' | 'member';

interface Membership {
    role: MembershipRole;
}

export interface HandlerConfig<T extends z.ZodType = z.ZodType> {
    /** Authentication level required */
    auth: AuthLevel;
    /** Optional Zod schema for request body validation */
    schema?: T;
}

export interface HandlerContext<T = unknown> {
    /** Authenticated user (null if auth: 'none') */
    user: User | null;
    /** Parsed and validated request body */
    body: T;
    /** Admin Supabase client (bypasses RLS) */
    adminClient: ReturnType<typeof createAdminClient>;
    /** Original request object */
    request: Request;
    /** URL params (e.g., { id: 'xxx' } for /api/leagues/[id]) */
    params: Record<string, string>;
    /** League membership (only for league_* auth levels) */
    membership: Membership | null;
}

type HandlerFn<T> = (ctx: HandlerContext<T>) => Promise<object | Response>;

type NextRouteContext = { params: Promise<Record<string, string>> };

// =============================================================================
// Helper Functions
// =============================================================================

function isLeagueAuth(auth: AuthLevel): auth is LeagueAuth {
    return auth.startsWith('league_');
}

async function checkSuperAdmin(
    adminClient: ReturnType<typeof createAdminClient>,
    userId: string
): Promise<boolean> {
    const { data } = await adminClient
        .from("users")
        .select("is_superadmin")
        .eq("id", userId)
        .single();
    return data?.is_superadmin ?? false;
}

async function getMembership(
    adminClient: ReturnType<typeof createAdminClient>,
    userId: string,
    leagueId: string
): Promise<Membership | null> {
    const { data } = await adminClient
        .from("memberships")
        .select("role")
        .eq("user_id", userId)
        .eq("league_id", leagueId)
        .single();

    if (!data) return null;
    return { role: data.role as MembershipRole };
}

function roleHasAccess(role: MembershipRole, requiredAuth: LeagueAuth): boolean {
    switch (requiredAuth) {
        case 'league_member':
            return true; // Any role is a member
        case 'league_admin':
            return role === 'admin' || role === 'owner';
        case 'league_owner':
            return role === 'owner';
        default:
            return false;
    }
}

// =============================================================================
// Main Handler
// =============================================================================

/**
 * Wrap an API route handler with consistent auth, validation, and error handling.
 */
export function withApiHandler<T extends z.ZodType>(
    config: HandlerConfig<T>,
    handler: HandlerFn<z.infer<T>>
) {
    return async (
        request: Request,
        context?: NextRouteContext
    ): Promise<Response> => {
        try {
            // Resolve params if provided (Next.js 15 style)
            const params = context?.params ? await context.params : {};

            // Create clients
            const supabase = await createServerSupabaseClient();
            const adminClient = createAdminClient();

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();

            // ======================
            // Auth Checks
            // ======================

            // Site-level auth
            if (config.auth === 'required' && !user) {
                return unauthorized();
            }

            if (config.auth === 'superadmin') {
                if (!user) return unauthorized();
                const isSuperAdmin = await checkSuperAdmin(adminClient, user.id);
                if (!isSuperAdmin) return forbidden("Superadmin access required");
            }

            // League-level auth
            let membership: Membership | null = null;

            if (isLeagueAuth(config.auth)) {
                if (!user) return unauthorized();

                // Try to get leagueId from body first, then params
                let leagueId: string | undefined;

                // Peek at body for league_id (we'll parse fully later)
                if (request.method !== 'GET') {
                    try {
                        const clonedRequest = request.clone();
                        const bodyPeek = await clonedRequest.json();
                        leagueId = bodyPeek.league_id;
                    } catch {
                        // Body parsing failed, try params
                    }
                }

                // Fallback to URL params
                if (!leagueId) {
                    leagueId = params.id;
                }

                if (!leagueId) {
                    return badRequest("league_id is required for this endpoint");
                }

                // Check membership
                membership = await getMembership(adminClient, user.id, leagueId);

                // SuperAdmins bypass league membership checks
                const isSuperAdmin = await checkSuperAdmin(adminClient, user.id);

                if (!membership && !isSuperAdmin) {
                    return forbidden("You are not a member of this league");
                }

                // If superadmin without membership, give them owner-level access
                if (!membership && isSuperAdmin) {
                    membership = { role: 'owner' };
                }

                // Check role level
                if (membership && !roleHasAccess(membership.role, config.auth)) {
                    const requiredRole = config.auth.replace('league_', '');
                    return forbidden(`${requiredRole} access required`);
                }
            }

            // ======================
            // Body Parsing & Validation
            // ======================

            let body: z.infer<T> = {} as z.infer<T>;

            if (config.schema && request.method !== 'GET') {
                try {
                    const rawBody = await request.json();
                    const parsed = config.schema.safeParse(rawBody);

                    if (!parsed.success) {
                        const errors = parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
                        return badRequest(`Validation failed: ${errors.join(', ')}`);
                    }

                    body = parsed.data;
                } catch {
                    return badRequest("Invalid JSON body");
                }
            }

            // ======================
            // Execute Handler
            // ======================

            const result = await handler({
                user,
                body,
                adminClient,
                request,
                params,
                membership,
            });

            // If handler returned a Response, use it directly
            if (result instanceof Response) {
                return result;
            }

            // Otherwise wrap in json()
            return json(result);

        } catch (error) {
            console.error("[API Handler Error]", error);
            return serverError(
                error instanceof Error ? error.message : "An unexpected error occurred"
            );
        }
    };
}
