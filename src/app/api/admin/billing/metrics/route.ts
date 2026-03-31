import { withApiHandler } from "@/lib/api/handler";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/billing/metrics
 * SuperAdmin: MRR, churn rate, grandfathering impact.
 * PRD 76: Subscription Management & Grandfathering
 */
export const GET = withApiHandler(
  {
    auth: "superadmin",
    rateLimit: { maxRequests: 30, windowMs: 60_000 },
  },
  async ({ adminClient }) => {
    // 1. Active subscriptions with their tier info
    const { data: activeSubs } = await adminClient
      .from("league_subscriptions")
      .select("id, tier_id, billing_interval, price_locked_at_cents, status, subscription_tiers(monthly_price_cents, annual_price_cents)")
      .in("status", ["active", "trialing", "past_due"]);

    const subs = (activeSubs || []) as unknown as Array<{
      id: string;
      tier_id: string;
      billing_interval: string;
      price_locked_at_cents: number | null;
      status: string;
      subscription_tiers: { monthly_price_cents: number; annual_price_cents: number } | null;
    }>;

    // 2. Calculate MRR (Monthly Recurring Revenue)
    let mrr = 0;
    let mrrAtCurrentPrices = 0;
    let grandfatheredCount = 0;
    let grandfatheredRevenueLoss = 0;

    for (const sub of subs) {
      const tier = sub.subscription_tiers;
      if (!tier) continue;

      const currentPrice = sub.billing_interval === "annual"
        ? Math.round(tier.annual_price_cents / 12)
        : tier.monthly_price_cents;

      const lockedPrice = sub.price_locked_at_cents != null
        ? (sub.billing_interval === "annual" ? Math.round(sub.price_locked_at_cents / 12) : sub.price_locked_at_cents)
        : currentPrice;

      mrr += lockedPrice;
      mrrAtCurrentPrices += currentPrice;

      if (sub.price_locked_at_cents != null && lockedPrice < currentPrice) {
        grandfatheredCount++;
        grandfatheredRevenueLoss += currentPrice - lockedPrice;
      }
    }

    // 3. Churn: canceled in last 30 days / active at start of period
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: canceledCount } = await adminClient
      .from("league_subscriptions")
      .select("*", { count: "exact", head: true })
      .in("status", ["canceled", "expired"])
      .gte("canceled_at", thirtyDaysAgo.toISOString());

    const totalActive = subs.length;
    const churned = canceledCount || 0;
    const churnRate = totalActive > 0 ? (churned / (totalActive + churned)) * 100 : 0;

    // 4. Status breakdown
    const statusCounts: Record<string, number> = {};
    for (const sub of subs) {
      statusCounts[sub.status] = (statusCounts[sub.status] || 0) + 1;
    }

    // 5. Tier breakdown
    const { data: allSubs } = await adminClient
      .from("league_subscriptions")
      .select("tier_id, status, subscription_tiers(slug, name)")
      .in("status", ["active", "trialing", "past_due"]);

    const tierBreakdown: Record<string, number> = {};
    for (const sub of (allSubs || []) as unknown as Array<{ subscription_tiers: { slug: string; name: string } | null }>) {
      const tierName = sub.subscription_tiers?.name || "Unknown";
      tierBreakdown[tierName] = (tierBreakdown[tierName] || 0) + 1;
    }

    // 6. Total revenue (all time)
    const { data: revenueData } = await adminClient
      .from("payment_history")
      .select("amount_cents")
      .eq("status", "succeeded");

    const totalRevenue = (revenueData || []).reduce(
      (sum: number, p: { amount_cents: number }) => sum + p.amount_cents,
      0
    );

    return {
      mrr,
      mrr_at_current_prices: mrrAtCurrentPrices,
      total_active_subscriptions: totalActive,
      churn_rate_30d: Math.round(churnRate * 100) / 100,
      churned_30d: churned,
      grandfathering: {
        count: grandfatheredCount,
        monthly_revenue_loss_cents: grandfatheredRevenueLoss,
      },
      status_breakdown: statusCounts,
      tier_breakdown: tierBreakdown,
      total_revenue_cents: totalRevenue,
    };
  }
);
