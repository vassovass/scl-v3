import { withApiHandler } from "@/lib/api/handler";
import { resumeSchema } from "@/lib/subscriptions/types";
import { transition } from "@/lib/subscriptions/stateMachine";
import type { LeagueSubscription } from "@/lib/subscriptions/types";
import { forbidden, badRequest } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * POST /api/subscriptions/resume
 * Resume a paused subscription. Restores active status.
 * PRD 76: Subscription Management & Grandfathering
 */
export const POST = withApiHandler(
  {
    auth: "required",
    schema: resumeSchema,
    rateLimit: { maxRequests: 5, windowMs: 60_000 },
  },
  async ({ user, body, adminClient }) => {
    const { league_id } = body;

    // 1. Verify ownership
    const { data: membership } = await adminClient
      .from("memberships")
      .select("role")
      .eq("user_id", user!.id)
      .eq("league_id", league_id)
      .single();

    if (!membership || membership.role !== "owner") {
      return forbidden("Only the league owner can resume the subscription");
    }

    // 2. Get paused subscription
    const { data: sub } = await adminClient
      .from("league_subscriptions")
      .select("*")
      .eq("league_id", league_id)
      .eq("status", "paused")
      .maybeSingle();

    if (!sub) {
      return badRequest("No paused subscription found to resume");
    }

    const subscription = sub as unknown as LeagueSubscription;

    // 3. Validate via state machine
    const result = transition({
      subscription,
      to: "active",
      reason: "User resumed from pause",
      triggered_by: `user:${user!.id}`,
    });

    if (!result.success) {
      return badRequest(result.error || "Cannot resume this subscription");
    }

    // 4. Restore the remaining period from before pause
    const periodEnd = subscription.metadata?.period_remaining_at_pause as string | undefined;

    const { error: updateError } = await adminClient
      .from("league_subscriptions")
      .update({
        status: "active",
        current_period_end: periodEnd || subscription.current_period_end,
        metadata: {
          ...subscription.metadata,
          paused_at: undefined,
          pause_ends_at: undefined,
          pause_days: undefined,
          period_remaining_at_pause: undefined,
          resumed_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscription.id);

    if (updateError) {
      return badRequest("Failed to resume subscription");
    }

    // 5. Log event
    if (result.event) {
      await adminClient.from("subscription_events").insert(result.event);
    }

    return {
      success: true,
      subscription_id: subscription.id,
      status: "active",
      message: "Your subscription has been resumed.",
    };
  }
);
