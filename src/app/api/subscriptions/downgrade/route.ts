import { withApiHandler } from "@/lib/api/handler";
import { downgradeSchema } from "@/lib/subscriptions/types";
import { getTierPrice } from "@/lib/subscriptions/proration";
import type { LeagueSubscription } from "@/lib/subscriptions/types";
import { forbidden, badRequest } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * POST /api/subscriptions/downgrade
 * Deferred to period end. Warns if over member limit.
 * PRD 76: Subscription Management & Grandfathering
 */
export const POST = withApiHandler(
  {
    auth: "required",
    schema: downgradeSchema,
    rateLimit: { maxRequests: 5, windowMs: 60_000 },
  },
  async ({ user, body, adminClient }) => {
    const { league_id, new_tier_id } = body;

    // 1. Verify ownership
    const { data: membership } = await adminClient
      .from("memberships")
      .select("role")
      .eq("user_id", user!.id)
      .eq("league_id", league_id)
      .single();

    if (!membership || membership.role !== "owner") {
      return forbidden("Only the league owner can downgrade the subscription");
    }

    // 2. Get current subscription
    const { data: sub } = await adminClient
      .from("league_subscriptions")
      .select("*")
      .eq("league_id", league_id)
      .in("status", ["active", "trialing"])
      .maybeSingle();

    if (!sub) {
      return badRequest("No active subscription found");
    }

    const subscription = sub as unknown as LeagueSubscription;

    // 3. Validate tiers
    const { data: currentTier } = await adminClient
      .from("subscription_tiers")
      .select("*")
      .eq("id", subscription.tier_id)
      .single();

    const { data: newTier } = await adminClient
      .from("subscription_tiers")
      .select("*")
      .eq("id", new_tier_id)
      .eq("is_active", true)
      .single();

    if (!currentTier || !newTier) {
      return badRequest("Invalid tier selection");
    }

    const currentPrice = getTierPrice(currentTier, subscription.billing_interval);
    const newPrice = getTierPrice(newTier, subscription.billing_interval);

    if (newPrice >= currentPrice) {
      return badRequest("New tier must be lower priced for a downgrade. Use upgrade instead.");
    }

    // 4. Check member limit
    const { count: memberCount } = await adminClient
      .from("memberships")
      .select("*", { count: "exact", head: true })
      .eq("league_id", league_id);

    const currentMembers = memberCount ?? 0;
    const newMemberLimit = newTier.member_limit;
    const overLimit = newMemberLimit !== null && currentMembers > newMemberLimit;

    // 5. Schedule downgrade at period end (store in metadata)
    const { error: updateError } = await adminClient
      .from("league_subscriptions")
      .update({
        metadata: {
          ...subscription.metadata,
          pending_downgrade: {
            new_tier_id,
            new_tier_slug: newTier.slug,
            new_price_cents: newPrice,
            scheduled_at: subscription.current_period_end,
            over_member_limit: overLimit,
            current_members: currentMembers,
            new_member_limit: newMemberLimit,
          },
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscription.id);

    if (updateError) {
      return badRequest("Failed to schedule downgrade");
    }

    // 6. Log event
    await adminClient.from("subscription_events").insert({
      league_subscription_id: subscription.id,
      from_status: subscription.status,
      to_status: subscription.status,
      reason: "Downgrade scheduled for end of period",
      metadata: {
        old_tier_id: subscription.tier_id,
        new_tier_id,
        old_price_cents: currentPrice,
        new_price_cents: newPrice,
        scheduled_for: subscription.current_period_end,
        over_member_limit: overLimit,
      },
      triggered_by: `user:${user!.id}`,
    });

    return {
      success: true,
      subscription_id: subscription.id,
      scheduled_for: subscription.current_period_end,
      new_tier_id,
      new_price_cents: newPrice,
      member_warning: overLimit
        ? {
            current_members: currentMembers,
            new_limit: newMemberLimit,
            message: `Your league has ${currentMembers} members but the new tier allows ${newMemberLimit}. Please reduce membership before the downgrade takes effect.`,
          }
        : null,
    };
  }
);
