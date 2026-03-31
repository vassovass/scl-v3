import { withApiHandler } from "@/lib/api/handler";
import { pauseSchema } from "@/lib/subscriptions/types";
import { transition } from "@/lib/subscriptions/stateMachine";
import type { LeagueSubscription } from "@/lib/subscriptions/types";
import { forbidden, badRequest } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * POST /api/subscriptions/pause
 * Pause subscription for up to 90 days. League becomes read-only.
 * PRD 76: Subscription Management & Grandfathering
 */
export const POST = withApiHandler(
  {
    auth: "required",
    schema: pauseSchema,
    rateLimit: { maxRequests: 3, windowMs: 60_000 },
  },
  async ({ user, body, adminClient }) => {
    const { league_id, pause_days } = body;

    // 1. Verify ownership
    const { data: membership } = await adminClient
      .from("memberships")
      .select("role")
      .eq("user_id", user!.id)
      .eq("league_id", league_id)
      .single();

    if (!membership || membership.role !== "owner") {
      return forbidden("Only the league owner can pause the subscription");
    }

    // 2. Get subscription
    const { data: sub } = await adminClient
      .from("league_subscriptions")
      .select("*")
      .eq("league_id", league_id)
      .eq("status", "active")
      .maybeSingle();

    if (!sub) {
      return badRequest("No active subscription found to pause");
    }

    const subscription = sub as unknown as LeagueSubscription;

    // 3. Validate via state machine
    const result = transition({
      subscription,
      to: "paused",
      reason: `User paused for ${pause_days} days`,
      triggered_by: `user:${user!.id}`,
      metadata: { pause_days },
    });

    if (!result.success) {
      return badRequest(result.error || "Cannot pause this subscription");
    }

    // 4. Calculate pause end date
    const pauseEnd = new Date();
    pauseEnd.setDate(pauseEnd.getDate() + pause_days);

    // 5. Apply pause
    const { error: updateError } = await adminClient
      .from("league_subscriptions")
      .update({
        status: "paused",
        metadata: {
          ...subscription.metadata,
          paused_at: new Date().toISOString(),
          pause_ends_at: pauseEnd.toISOString(),
          pause_days,
          period_remaining_at_pause: subscription.current_period_end,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscription.id);

    if (updateError) {
      return badRequest("Failed to pause subscription");
    }

    // 6. Log event
    if (result.event) {
      await adminClient.from("subscription_events").insert(result.event);
    }

    return {
      success: true,
      subscription_id: subscription.id,
      status: "paused",
      pause_ends_at: pauseEnd.toISOString(),
      message: `Your subscription has been paused until ${pauseEnd.toLocaleDateString("en-GB")}. Your league will be read-only during this time.`,
    };
  }
);
