import { withApiHandler } from "@/lib/api/handler";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/billing?status=active&tier=standard&grandfathered=true&page=1
 * SuperAdmin: all subscriptions with filters.
 * PRD 76: Subscription Management & Grandfathering
 */
export const GET = withApiHandler(
  {
    auth: "superadmin",
    rateLimit: { maxRequests: 30, windowMs: 60_000 },
  },
  async ({ adminClient, request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const tierSlug = url.searchParams.get("tier");
    const grandfathered = url.searchParams.get("grandfathered");
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const perPage = Math.min(100, Math.max(1, parseInt(url.searchParams.get("per_page") || "25", 10)));

    // Build query
    let query = adminClient
      .from("league_subscriptions")
      .select("*, subscription_tiers(id, slug, name, monthly_price_cents, annual_price_cents, member_limit), leagues(id, name)", { count: "exact" });

    if (status) {
      query = query.eq("status", status);
    }

    if (tierSlug) {
      // Need to filter by tier slug via join
      const { data: tier } = await adminClient
        .from("subscription_tiers")
        .select("id")
        .eq("slug", tierSlug)
        .single();
      if (tier) {
        query = query.eq("tier_id", tier.id);
      }
    }

    // Pagination
    const offset = (page - 1) * perPage;
    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + perPage - 1);

    const { data: subscriptions, count, error } = await query;

    if (error) {
      return { subscriptions: [], total: 0, page, per_page: perPage };
    }

    // Post-filter for grandfathered (where price_locked_at_cents < current tier price)
    let results = subscriptions || [];
    if (grandfathered === "true") {
      results = results.filter((sub: Record<string, unknown>) => {
        const tier = sub.subscription_tiers as Record<string, unknown> | null;
        if (!tier || !sub.price_locked_at_cents) return false;
        const currentPrice = sub.billing_interval === "annual"
          ? (tier.annual_price_cents as number)
          : (tier.monthly_price_cents as number);
        return (sub.price_locked_at_cents as number) < currentPrice;
      });
    }

    return {
      subscriptions: results,
      total: count || 0,
      page,
      per_page: perPage,
    };
  }
);
