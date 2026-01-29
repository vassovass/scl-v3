/**
 * League Members API Route (PRD-54)
 *
 * GET: List all members from user's leagues for friend selector
 */

import { withApiHandler } from "@/lib/api/handler";
import { badRequest } from "@/lib/api";

export const GET = withApiHandler(
    { auth: "required" },
    async ({ user, adminClient }) => {
        // Get user's leagues
        const { data: memberships, error: membershipError } = await adminClient
            .from("league_members")
            .select("league_id, leagues(id, name)")
            .eq("user_id", user!.id)
            .is("left_at", null);

        if (membershipError) {
            console.error("[League Members GET] Membership error:", membershipError);
            return badRequest("Failed to fetch leagues");
        }

        if (!memberships || memberships.length === 0) {
            return { members: [] };
        }

        // Get all league IDs
        const leagueIds = memberships.map((m) => m.league_id);

        // Get all members from those leagues
        const { data: members, error: membersError } = await adminClient
            .from("league_members")
            .select(`
                user_id,
                league_id,
                users!league_members_user_id_fkey(id, display_name),
                leagues!league_members_league_id_fkey(id, name)
            `)
            .in("league_id", leagueIds)
            .is("left_at", null)
            .neq("user_id", user!.id); // Exclude current user

        if (membersError) {
            console.error("[League Members GET] Members error:", membersError);
            return badRequest("Failed to fetch members");
        }

        // Format response with unique members (avoid duplicates if in multiple leagues)
        const seenUserIds = new Set<string>();
        const formattedMembers = [];

        for (const m of members || []) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const member = m as any;
            const userId = member.user_id;
            const userInfo = member.users;
            const leagueInfo = member.leagues;

            if (!userInfo || seenUserIds.has(userId)) continue;
            seenUserIds.add(userId);

            formattedMembers.push({
                id: userInfo.id,
                display_name: userInfo.display_name,
                league_id: leagueInfo?.id,
                league_name: leagueInfo?.name,
            });
        }

        // Sort by display name
        formattedMembers.sort((a, b) => a.display_name.localeCompare(b.display_name));

        return { members: formattedMembers };
    }
);
