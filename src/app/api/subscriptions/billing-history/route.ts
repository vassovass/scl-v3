import { withApiHandler } from "@/lib/api/handler";
import { badRequest } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * GET /api/subscriptions/billing-history?league_id=xxx&page=1&per_page=20
 * Paginated billing history for a league owner.
 * PRD 76: Subscription Management & Grandfathering
 */
export const GET = withApiHandler(
  {
    auth: "required",
    rateLimit: { maxRequests: 30, windowMs: 60_000 },
  },
  async ({ user, adminClient, request }) => {
    const url = new URL(request.url);
    const leagueId = url.searchParams.get("league_id");
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const perPage = Math.min(50, Math.max(1, parseInt(url.searchParams.get("per_page") || "20", 10)));

    if (!leagueId) {
      return badRequest("league_id query parameter is required");
    }

    // Verify ownership
    const { data: membership } = await adminClient
      .from("memberships")
      .select("role")
      .eq("user_id", user!.id)
      .eq("league_id", leagueId)
      .single();

    if (!membership || membership.role !== "owner") {
      return badRequest("Only the league owner can view billing history");
    }

    // Get subscription IDs for this league
    const { data: subs } = await adminClient
      .from("league_subscriptions")
      .select("id")
      .eq("league_id", leagueId);

    if (!subs || subs.length === 0) {
      return { payments: [], total: 0, page, per_page: perPage };
    }

    const subIds = subs.map((s: { id: string }) => s.id);

    // Get total count
    const { count } = await adminClient
      .from("payment_history")
      .select("*", { count: "exact", head: true })
      .in("league_subscription_id", subIds);

    // Get paginated results
    const offset = (page - 1) * perPage;
    const { data: payments } = await adminClient
      .from("payment_history")
      .select("*")
      .in("league_subscription_id", subIds)
      .order("created_at", { ascending: false })
      .range(offset, offset + perPage - 1);

    return {
      payments: payments || [],
      total: count || 0,
      page,
      per_page: perPage,
    };
  }
);
