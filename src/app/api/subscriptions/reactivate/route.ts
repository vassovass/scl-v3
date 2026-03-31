import { withApiHandler } from "@/lib/api/handler";
import { reactivateSchema } from "@/lib/subscriptions/types";
import { transition } from "@/lib/subscriptions/stateMachine";
import type { LeagueSubscription } from "@/lib/subscriptions/types";
import { forbidden, badRequest } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * POST /api/subscriptions/reactivate
 * Restore a canceled subscription before period end.
 * PRD 76: Subscription Management & Grandfathering
 */
export const POST = withApiHandler(
  {
    auth: "required",
    schema: reactivateSchema,
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
      return forbidden("Only the league owner can reactivate the subscription");
    }

    // 2. Get canceled subscription
    const { data: sub } = await adminClient
      .from("league_subscriptions")
      .select("*")
      .eq("league_id", league_id)
      .eq("status", "canceled")
      .maybeSingle();

    if (!sub) {
      return badRequest("No canceled subscription found to reactivate");
    }

    const subscription = sub as unknown as LeagueSubscription;

    // 3. Validate via state machine (checks period_end hasn't passed)
    const result = transition({
      subscription,
      to: "active",
      reason: "User reactivated subscription",
      triggered_by: `user:${user!.id}`,
    });

    if (!result.success) {
      return badRequest(result.error || "Cannot reactivate this subscription");
    }

    // 4. Restore active status
    const { error: updateError } = await adminClient
      .from("league_subscriptions")
      .update({
        status: "active",
        canceled_at: null,
        metadata: {
          ...subscription.metadata,
          pending_downgrade: undefined, // Clear any pending downgrade
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscription.id);

    if (updateError) {
      return badRequest("Failed to reactivate subscription");
    }

    // 5. Log event
    if (result.event) {
      await adminClient.from("subscription_events").insert(result.event);
    }

    return {
      success: true,
      subscription_id: subscription.id,
      status: "active",
      message: "Your subscription has been reactivated.",
    };
  }
);
