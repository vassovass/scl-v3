import { withApiHandler } from "@/lib/api/handler";
import { AppError, ErrorCode } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * GET /api/leagues/[id]/subscription
 * Returns the league's subscription state: tier info, member count, capacity.
 * When no subscription row exists, returns free tier defaults.
 * PRD 75: Pay Gate UI & Enforcement
 */
export const GET = withApiHandler(
  { auth: "league_member" },
  async ({ adminClient, params }) => {
    const leagueId = params.id;

    // Fetch subscription with tier data
    const { data: subscription, error: subError } = await adminClient
      .from("league_subscriptions")
      .select("*, subscription_tiers(*)")
      .eq("league_id", leagueId)
      .in("status", ["active", "trialing", "past_due"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError) {
      throw new AppError({
        code: ErrorCode.DB_QUERY_FAILED,
        message: "Failed to fetch league subscription",
        context: { error: subError.message, leagueId },
      });
    }

    // Fetch member count
    const { count, error: countError } = await adminClient
      .from("memberships")
      .select("*", { count: "exact", head: true })
      .eq("league_id", leagueId);

    if (countError) {
      throw new AppError({
        code: ErrorCode.DB_QUERY_FAILED,
        message: "Failed to fetch member count",
        context: { error: countError.message, leagueId },
      });
    }

    const currentMembers = count ?? 0;

    // No subscription row = free tier
    if (!subscription) {
      // Fetch the free tier for member limit info
      const { data: freeTier } = await adminClient
        .from("subscription_tiers")
        .select("id, slug, name, monthly_price_cents, annual_price_cents, member_limit, features, grace_period_days")
        .eq("slug", "free")
        .eq("is_active", true)
        .single();

      const memberLimit = freeTier?.member_limit ?? 3;

      return {
        tier: freeTier || null,
        status: "free",
        member_limit: memberLimit,
        current_members: currentMembers,
        capacity_remaining: Math.max(0, memberLimit - currentMembers),
        is_at_capacity: currentMembers >= memberLimit,
        pay_gate_override: null,
        billing_interval: null,
      };
    }

    // Has subscription
    const tier = subscription.subscription_tiers;
    const memberLimit = tier?.member_limit ?? Infinity;

    return {
      tier: tier
        ? {
            id: tier.id,
            slug: tier.slug,
            name: tier.name,
            monthly_price_cents: tier.monthly_price_cents,
            annual_price_cents: tier.annual_price_cents,
            member_limit: tier.member_limit,
            features: tier.features,
            grace_period_days: tier.grace_period_days,
          }
        : null,
      status: subscription.status,
      member_limit: memberLimit === Infinity ? null : memberLimit,
      current_members: currentMembers,
      capacity_remaining:
        memberLimit === Infinity
          ? null
          : Math.max(0, memberLimit - currentMembers),
      is_at_capacity:
        memberLimit === Infinity ? false : currentMembers >= memberLimit,
      pay_gate_override: subscription.pay_gate_override ?? null,
      billing_interval: subscription.billing_interval,
    };
  }
);
