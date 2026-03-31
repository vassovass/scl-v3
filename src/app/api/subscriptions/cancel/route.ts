import { withApiHandler } from "@/lib/api/handler";
import { cancelSchema } from "@/lib/subscriptions/types";
import { transition } from "@/lib/subscriptions/stateMachine";
import type { LeagueSubscription } from "@/lib/subscriptions/types";
import { forbidden, badRequest } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * POST /api/subscriptions/cancel
 * End-of-period cancellation. Collects reason and exit survey.
 * PRD 76: Subscription Management & Grandfathering
 */
export const POST = withApiHandler(
  {
    auth: "required",
    schema: cancelSchema,
    rateLimit: { maxRequests: 3, windowMs: 60_000 },
  },
  async ({ user, body, adminClient }) => {
    const { league_id, reason, exit_survey } = body;

    // 1. Verify ownership
    const { data: membership } = await adminClient
      .from("memberships")
      .select("role")
      .eq("user_id", user!.id)
      .eq("league_id", league_id)
      .single();

    if (!membership || membership.role !== "owner") {
      return forbidden("Only the league owner can cancel the subscription");
    }

    // 2. Get subscription
    const { data: sub } = await adminClient
      .from("league_subscriptions")
      .select("*")
      .eq("league_id", league_id)
      .in("status", ["active", "past_due"])
      .maybeSingle();

    if (!sub) {
      return badRequest("No active subscription found to cancel");
    }

    const subscription = sub as unknown as LeagueSubscription;

    // 3. Validate transition via state machine
    const result = transition({
      subscription,
      to: "canceled",
      reason: reason || "User requested cancellation",
      triggered_by: `user:${user!.id}`,
      metadata: { exit_survey },
    });

    if (!result.success) {
      return badRequest(result.error || "Cannot cancel this subscription");
    }

    // 4. Apply cancellation (end-of-period — keep access until current_period_end)
    const { error: updateError } = await adminClient
      .from("league_subscriptions")
      .update({
        status: "canceled",
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscription.id);

    if (updateError) {
      return badRequest("Failed to cancel subscription");
    }

    // 5. Log event with exit survey data
    if (result.event) {
      await adminClient.from("subscription_events").insert(result.event);
    }

    return {
      success: true,
      subscription_id: subscription.id,
      access_until: subscription.current_period_end,
      message: subscription.current_period_end
        ? `Your subscription has been canceled. You will retain access until ${new Date(subscription.current_period_end).toLocaleDateString("en-GB")}.`
        : "Your subscription has been canceled.",
    };
  }
);
