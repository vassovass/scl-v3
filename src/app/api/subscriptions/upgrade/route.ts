import { withApiHandler } from "@/lib/api/handler";
import { AppError, ErrorCode } from "@/lib/errors";
import { upgradeSchema } from "@/lib/subscriptions/types";
import { transition } from "@/lib/subscriptions/stateMachine";
import { calculateProration, getTierPrice, calculateNewPeriodEnd } from "@/lib/subscriptions/proration";
import type { LeagueSubscription } from "@/lib/subscriptions/types";
import { forbidden, badRequest } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * POST /api/subscriptions/upgrade
 * Immediate upgrade with pro-rated charge. New price_locked_at_cents.
 * PRD 76: Subscription Management & Grandfathering
 */
export const POST = withApiHandler(
  {
    auth: "required",
    schema: upgradeSchema,
    rateLimit: { maxRequests: 5, windowMs: 60_000 },
  },
  async ({ user, body, adminClient }) => {
    const { league_id, new_tier_id } = body;

    // 1. Verify user owns the league
    const { data: membership } = await adminClient
      .from("memberships")
      .select("role")
      .eq("user_id", user!.id)
      .eq("league_id", league_id)
      .single();

    if (!membership || membership.role !== "owner") {
      return forbidden("Only the league owner can upgrade the subscription");
    }

    // 2. Get current subscription
    const { data: sub } = await adminClient
      .from("league_subscriptions")
      .select("*")
      .eq("league_id", league_id)
      .in("status", ["active", "trialing", "past_due"])
      .maybeSingle();

    if (!sub) {
      return badRequest("No active subscription found for this league");
    }

    const subscription = sub as unknown as LeagueSubscription;

    // 3. Get current and new tier info
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

    // 4. Verify it's actually an upgrade
    const currentPrice = getTierPrice(currentTier, subscription.billing_interval);
    const newPrice = getTierPrice(newTier, subscription.billing_interval);

    if (newPrice <= currentPrice) {
      return badRequest("New tier must be higher priced for an upgrade. Use downgrade instead.");
    }

    // 5. Calculate proration
    let proration = null;
    if (subscription.current_period_start && subscription.current_period_end) {
      proration = calculateProration(
        currentPrice,
        newPrice,
        subscription.current_period_start,
        subscription.current_period_end
      );
    }

    // 6. Validate transition via state machine (active -> active is a tier change, not a state change)
    // Tier changes on active subscriptions don't change status, but we log the event

    // 7. Apply the upgrade immediately
    const newLockedPrice = newPrice;
    const { error: updateError } = await adminClient
      .from("league_subscriptions")
      .update({
        tier_id: new_tier_id,
        price_locked_at_cents: newLockedPrice,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscription.id);

    if (updateError) {
      throw new AppError({
        code: ErrorCode.DB_UPDATE_FAILED,
        message: "Failed to upgrade subscription",
        context: { error: updateError.message },
      });
    }

    // 8. Log the tier change event
    await adminClient.from("subscription_events").insert({
      league_subscription_id: subscription.id,
      from_status: subscription.status,
      to_status: subscription.status,
      reason: "Tier upgrade",
      metadata: {
        old_tier_id: subscription.tier_id,
        new_tier_id,
        old_price_cents: currentPrice,
        new_price_cents: newPrice,
        new_locked_price_cents: newLockedPrice,
        proration: proration ? {
          amount_cents: proration.amount_cents,
          days_remaining: proration.days_remaining,
          total_days: proration.total_days,
        } : null,
      },
      triggered_by: `user:${user!.id}`,
    });

    return {
      success: true,
      subscription_id: subscription.id,
      old_tier_id: subscription.tier_id,
      new_tier_id,
      price_locked_at_cents: newLockedPrice,
      proration,
    };
  }
);
